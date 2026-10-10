/**
 * AI 适配层 —— 类型定义
 *
 * 定义 AI 能力的统一请求/响应接口。
 * 优先兼容 OpenAI 风格 Chat Completions API，同时允许通过配置指定任意兼容端点。
 */
import type { AICapability } from '@/types/adventure'

/** AI 提供方配置 */
export interface AIProviderConfig {
  enabled: boolean
  apiKey: string
  endpoint: string
  model: string
  capabilities: AICapability[]
  /** 请求超时（毫秒） */
  timeout?: number
  /** 最大重试次数 */
  maxRetries?: number
}

/* ---------- Chat Completions 原始接口 ---------- */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' | 'text' }
  stream?: false
}

export interface ChatCompletionResponse {
  id: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/* ---------- 场景/分支生成（细粒度） ---------- */

export interface GenerateSceneRequest {
  prompt: string
  context?: string
  tone?: string
}

export interface GenerateSceneResponse {
  title: string
  text: string
  speaker?: string
}

export interface GenerateBranchRequest {
  sceneText: string
  count?: number
}

export interface GenerateBranchResponse {
  choices: Array<{ label: string; description?: string }>
}

/* ---------- 完整故事生成 ---------- */

/** AI 返回的可交互物品（与 Interactable 解耦） */
export interface AIInteractable {
  id: string
  name: string
  icon?: string
  position?: { x: number; y: number }
  description?: string
  action?: string
  target?: string
  revealText?: string
  once?: boolean
}

/** AI 返回的中间故事结构（与 Adventure 解耦，便于校验/转换） */
export interface AIStoryNode {
  id: string
  type: 'start' | 'scene' | 'clue' | 'puzzle' | 'ending'
  title: string
  text: string
  speaker?: string
  /** 场景背景素材 ID */
  background?: string
  /** 氛围描述 */
  atmosphere?: string
  /** 角色立绘素材 ID */
  characterId?: string
  /** 角色对白 */
  dialogue?: string
  clueKey?: string
  clueName?: string
  puzzleKind?: string
  puzzleAnswer?: string
  puzzlePrompt?: string
  puzzleHint?: string
  puzzleTitle?: string
  puzzleDigits?: number
  puzzleSymbols?: string[]
  /** 可交互物品 */
  interactables?: AIInteractable[]
  endingKind?: 'good' | 'neutral' | 'bad' | 'secret'
}

export interface AIStoryChoice {
  from: string
  to: string
  label: string
}

export interface AIStoryItem {
  key: string
  name: string
}

export interface AIStory {
  title: string
  description: string
  tags?: string[]
  startNodeId: string
  nodes: AIStoryNode[]
  choices: AIStoryChoice[]
  items?: AIStoryItem[]
}

export interface GenerateStoryRequest {
  prompt: string
  /** 期望的结局数量 */
  endingCount?: number
}

export interface GenerateStoryResult {
  story: AIStory
  /** 生成来源：真实 AI 或本地模板 */
  source: 'ai' | 'template'
  /** 原始模型返回（调试用，不含密钥） */
  raw?: string
}

/* ---------- 评审 ---------- */

export interface ReviewRequest {
  content: string
}

export interface ReviewResponse {
  score: number
  suggestions: string[]
}

/** 结构化剧情审查问题 */
export interface PlotIssue {
  level: 'error' | 'warning' | 'info'
  category: string
  message: string
  nodeId?: string
  suggestion?: string
}

export interface PlotReviewResult {
  issues: PlotIssue[]
  /** AI 给出的整体建议（仅当 AI 可用时） */
  aiSuggestions?: string[]
  source: 'local' | 'ai'
}

/* ---------- 统一 AI 能力接口 ---------- */

export interface AIClient {
  isAvailable(): boolean
  /** 底层 Chat Completions 调用 */
  chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>
  generateScene(req: GenerateSceneRequest): Promise<GenerateSceneResponse>
  generateBranch(req: GenerateBranchRequest): Promise<GenerateBranchResponse>
  generateStory(req: GenerateStoryRequest): Promise<GenerateStoryResult>
  review(req: ReviewRequest): Promise<ReviewResponse>
}

/** AI 调用错误类型 */
export class AIError extends Error {
  kind: 'auth' | 'network' | 'timeout' | 'rate_limit' | 'parse' | 'invalid' | 'unknown'
  status?: number
  constructor(
    kind: AIError['kind'],
    message: string,
    status?: number
  ) {
    super(message)
    this.name = 'AIError'
    this.kind = kind
    this.status = status
  }
}
