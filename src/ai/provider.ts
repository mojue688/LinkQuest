/**
 * AI 提供方实现
 *
 * 兼容 OpenAI 风格 Chat Completions API（/v1/chat/completions）。
 * 不绑定具体服务商，可通过 endpoint 配置任意兼容端点。
 *
 * 安全说明：
 * - API Key 仅存在浏览器 localStorage，由用户自行配置。
 * - 直接从浏览器请求第三方 API，密钥可能被开发者工具/网络请求查看，仅适合个人本地体验。
 * - 不将密钥打印到控制台或错误日志。
 * - 未来面向公众应使用后端代理，不将公共密钥打包进前端。
 */
import type {
  AIClient,
  AIProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  GenerateBranchRequest,
  GenerateBranchResponse,
  GenerateSceneRequest,
  GenerateSceneResponse,
  GenerateStoryRequest,
  GenerateStoryResult,
  ReviewRequest,
  ReviewResponse,
} from './types'
import { AIError } from './types'

/** 规范化 endpoint，确保以 /v1/chat/completions 结尾 */
function normalizeChatUrl(endpoint: string): string {
  let base = endpoint.trim().replace(/\/+$/, '')
  // 若已包含 chat/completions 则直接用
  if (/\/chat\/completions$/.test(base)) return base
  // 若以 /v1 结尾，补全
  if (/\/v1$/.test(base)) return `${base}/chat/completions`
  // 若不含 /v1，补全
  if (!/\/v1/.test(base)) return `${base}/v1/chat/completions`
  return `${base}/chat/completions`
}

/** 带超时的 fetch，支持外部取消信号 */
function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeout: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
      reject(new AIError('timeout', `请求超时（${timeout}ms）`))
    }, timeout)

    // 外部取消时立即 abort
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timer)
        controller.abort()
        reject(new AIError('timeout', '请求已取消。'))
        return
      }
      externalSignal.addEventListener('abort', () => {
        clearTimeout(timer)
        controller.abort()
        reject(new AIError('timeout', '请求已取消。'))
      }, { once: true })
    }

    fetch(url, { ...init, signal: controller.signal })
      .then((res) => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timer)
        if (err.name === 'AbortError') {
          if (externalSignal?.aborted) {
            reject(new AIError('timeout', '请求已取消。'))
          } else {
            reject(new AIError('timeout', `请求超时（${timeout}ms）`))
          }
        } else {
          reject(new AIError('network', `网络请求失败：${err.message}`))
        }
      })
  })
}

/** 解析响应并分类错误 */
async function parseResponse(res: Response): Promise<ChatCompletionResponse> {
  if (res.status === 401 || res.status === 403) {
    throw new AIError('auth', '鉴权失败：API Key 无效或无权限。', res.status)
  }
  if (res.status === 429) {
    throw new AIError('rate_limit', '请求过于频繁，已被限流，请稍后重试。', res.status)
  }
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.error?.message ?? body?.message ?? ''
    } catch {
      /* 忽略解析失败 */
    }
    throw new AIError(
      'unknown',
      `服务返回错误 ${res.status}${detail ? '：' + detail : ''}`,
      res.status
    )
  }
  try {
    return (await res.json()) as ChatCompletionResponse
  } catch {
    throw new AIError('parse', '响应不是合法的 JSON。', res.status)
  }
}

/** 提取助手消息文本 */
function extractContent(res: ChatCompletionResponse): string {
  const choice = res.choices?.[0]
  return choice?.message?.content ?? ''
}

/** 从可能包含 Markdown 代码围栏的文本中提取 JSON 字符串 */
export function extractJSON(text: string): string {
  let t = text.trim()
  // 去除 ```json ... ``` 或 ``` ... ```
  const fenceMatch = t.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) {
    t = fenceMatch[1].trim()
  }
  // 若仍包含围栏开头但无结尾，截取
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*\n?/, '').trim()
  }
  return t
}

/** OpenAI 兼容客户端实现 */
class OpenAICompatibleClient implements AIClient {
  private config: AIProviderConfig
  private chatUrl: string

  constructor(config: AIProviderConfig) {
    this.config = config
    this.chatUrl = normalizeChatUrl(config.endpoint)
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && !!this.config.endpoint && !!this.config.model
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const timeout = this.config.timeout ?? 30000
    const maxRetries = this.config.maxRetries ?? 2
    let lastErr: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetchWithTimeout(
          this.chatUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify(req),
          },
          timeout,
          req.signal
        )
        return await parseResponse(res)
      } catch (err) {
        lastErr = err
        // 鉴权/解析错误不重试
        if (err instanceof AIError) {
          if (err.kind === 'auth' || err.kind === 'parse' || err.kind === 'invalid') {
            throw err
          }
        }
        // 限流：等待更久
        if (err instanceof AIError && err.kind === 'rate_limit') {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
          continue
        }
        // 网络错误：短暂退避后重试
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new AIError('unknown', '请求失败且重试耗尽。')
  }

  async generateScene(req: GenerateSceneRequest): Promise<GenerateSceneResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是互动叙事编剧。根据用户提示生成一个场景节点，返回 JSON：{"title":"场景标题","text":"场景正文","speaker":"说话人(可选)"}。text 应有氛围感和细节，80-200 字。',
      },
      { role: 'user', content: req.prompt + (req.context ? `\n上下文：${req.context}` : '') },
    ]
    const res = await this.chat({
      model: this.config.model,
      messages,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })
    const raw = extractContent(res)
    try {
      return JSON.parse(extractJSON(raw)) as GenerateSceneResponse
    } catch {
      throw new AIError('parse', '生成场景的返回无法解析为 JSON。')
    }
  }

  async generateBranch(req: GenerateBranchRequest): Promise<GenerateBranchResponse> {
    const count = req.count ?? 3
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是互动叙事编剧。为给定场景生成 ${count} 个可选行动分支，返回 JSON：{"choices":[{"label":"简短选项","description":"可选说明"}]}。label 控制在 12 字内。`,
      },
      { role: 'user', content: `场景：${req.sceneText}` },
    ]
    const res = await this.chat({
      model: this.config.model,
      messages,
      temperature: 0.85,
      response_format: { type: 'json_object' },
    })
    const raw = extractContent(res)
    try {
      return JSON.parse(extractJSON(raw)) as GenerateBranchResponse
    } catch {
      throw new AIError('parse', '生成分支的返回无法解析为 JSON。')
    }
  }

  async generateStory(req: GenerateStoryRequest): Promise<GenerateStoryResult> {
    const endingCount = req.endingCount ?? 3
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: STORY_GEN_SYSTEM(endingCount),
      },
      { role: 'user', content: req.prompt },
    ]
    const res = await this.chat({
      model: this.config.model,
      messages,
      temperature: 0.85,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      signal: req.signal,
    })
    const raw = extractContent(res)
    return {
      story: JSON.parse(extractJSON(raw)),
      source: 'ai',
      raw,
    }
  }

  async review(req: ReviewRequest): Promise<ReviewResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是剧情评审专家。对给定剧情给出评分(0-10)和改进建议，返回 JSON：{"score":7,"suggestions":["建议1","建议2"]}。',
      },
      { role: 'user', content: req.content },
    ]
    const res = await this.chat({
      model: this.config.model,
      messages,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    })
    const raw = extractContent(res)
    try {
      return JSON.parse(extractJSON(raw)) as ReviewResponse
    } catch {
      throw new AIError('parse', '评审返回无法解析为 JSON。')
    }
  }
}

/** 故事生成的系统提示词 */
function STORY_GEN_SYSTEM(endingCount: number): string {
  return `你是一位资深互动叙事编剧，擅长设计悬疑、解谜、分支选择与多结局的互动故事。

根据用户的一句话描述，生成一个完整的互动故事，返回严格的 JSON，结构如下：

{
  "title": "故事标题",
  "description": "一句话简介",
  "tags": ["题材1", "题材2"],
  "startNodeId": "n1",
  "nodes": [
    {
      "id": "n1",
      "type": "start",
      "title": "场景标题",
      "text": "场景正文，要有氛围感和细节，80-200字",
      "speaker": "旁白或角色名(可选)"
    },
    {
      "id": "n2",
      "type": "scene",
      "title": "...",
      "text": "...",
      "speaker": "..."
    },
    {
      "id": "n3",
      "type": "clue",
      "title": "线索标题",
      "text": "发现线索的描述",
      "clueKey": "线索英文标识如rusty_key",
      "clueName": "线索中文名如生锈的钥匙"
    },
    {
      "id": "n4",
      "type": "puzzle",
      "title": "谜题标题",
      "text": "谜题场景描述",
      "puzzleAnswer": "正确答案如4242",
      "puzzlePrompt": "输入提示如请输入密码",
      "puzzleHint": "错误提示"
    },
    {
      "id": "n5",
      "type": "ending",
      "title": "结局标题",
      "text": "结局正文",
      "endingKind": "good"
    }
  ],
  "choices": [
    { "from": "n1", "to": "n2", "label": "选项文字" }
  ],
  "items": [
    { "key": "rusty_key", "name": "生锈的钥匙" }
  ]
}

要求：
1. type 只能是 start / scene / clue / puzzle / ending 之一。
2. 必须有且仅有一个 start 节点，startNodeId 指向它。
3. 至少 ${endingCount} 个 ending 节点，endingKind 为 good / neutral / bad / secret 之一。
4. 节点 id 用 n1, n2, n3... 顺序命名，必须唯一。
5. choices 的 from 和 to 必须引用已存在的节点 id。
6. 从 start 出发必须能到达所有结局，不要有孤立的节点。
7. 谜题节点应配合线索节点：先有线索给出密码，再有谜题要求输入。
8. 选项 label 简短（12字内），有行动感。
9. 剧情要有逻辑、悬念和转折，不要空节点或重复套话。
10. 只返回 JSON，不要任何额外文字或解释。`
}

/** 根据配置创建 AI 客户端（未配置时返回 null，由 fallback 兜底） */
export function createProvider(config: AIProviderConfig): AIClient | null {
  if (!config.enabled) return null
  if (!config.apiKey || !config.endpoint || !config.model) return null
  return new OpenAICompatibleClient(config)
}

/** 探测当前配置是否可用（不发送真实请求，仅检查字段） */
export function probeProvider(config: AIProviderConfig): boolean {
  return !!config.apiKey && !!config.endpoint && !!config.model
}

/** 发送一个轻量测试请求，验证连接与鉴权 */
export async function testConnection(
  config: AIProviderConfig
): Promise<{ ok: boolean; message: string; latency?: number }> {
  if (!probeProvider(config)) {
    return { ok: false, message: '请填写 Endpoint、模型名称和 API Key。' }
  }
  const client = new OpenAICompatibleClient(config)
  const start = Date.now()
  try {
    await client.chat({
      model: config.model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    })
    return {
      ok: true,
      message: `连接成功，模型 ${config.model} 可用。`,
      latency: Date.now() - start,
    }
  } catch (err) {
    const msg =
      err instanceof AIError
        ? err.message
        : (err as Error).message || '未知错误'
    return { ok: false, message: msg }
  }
}
