/**
 * 作品导出与导入
 * JSON 格式包含完整剧情节点、连接关系、谜题配置和结局。
 * 导入时校验数据结构，格式错误抛出明确异常。
 */
import type {
  Adventure,
  AdventureMeta,
  ExportFormat,
  ExportResult,
  SceneNode,
  Choice,
} from '@/types/adventure'
import { NodeType, InteractAction } from '@/types/adventure'

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 安全文件名 */
function safeName(title: string): string {
  return (title || 'adventure').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)
}

/** 导出为 JSON */
export function exportJSON(adventure: Adventure): ExportResult {
  const payload = JSON.stringify(adventure, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  return {
    format: 'json',
    filename: `${safeName(adventure.meta.title)}.linkquest.json`,
    blob,
  }
}

/** HTML 实体转义，防止 XSS */
function escapeHTML(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 导出为单文件 HTML（嵌入 JSON 数据预览，非可独立运行的游戏） */
export function exportHTML(adventure: Adventure): ExportResult {
  const json = JSON.stringify(adventure)
  const title = escapeHTML(adventure.meta.title)
  const desc = escapeHTML(adventure.meta.description || '')
  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<title>${title} - 谜境 LinkQuest</title>
<style>body{font-family:system-ui;background:#0f1115;color:#e5e7eb;padding:40px;text-align:center}
h1{color:#a78bfa}pre{text-align:left;max-width:720px;margin:24px auto;background:#1a1d24;padding:20px;border-radius:12px;overflow:auto}</style>
</head><body><h1>${title}</h1>
<p>${desc}</p>
<p>该文件为谜境 LinkQuest 导出的剧情数据预览（JSON），非可独立运行的游戏文件。请在 LinkQuest 中导入后试玩。</p>
<pre>${escapeHTML(json)}</pre>
</body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  return {
    format: 'html',
    filename: `${safeName(adventure.meta.title)}.html`,
    blob,
  }
}

/** 导出为指定格式 */
export function exportAdventure(
  adventure: Adventure,
  format: ExportFormat
): ExportResult {
  if (format === 'html') return exportHTML(adventure)
  return exportJSON(adventure)
}

/* ---------- 导入校验 ---------- */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function fail(msg: string): never {
  throw new Error('导入失败：' + msg)
}

/** 校验导入数据结构，返回规整后的 Adventure */
export function validateImported(data: unknown): Adventure {
  if (!isObj(data)) fail('文件内容不是有效对象。')
  const meta = data.meta
  if (!isObj(meta)) fail('缺少作品元信息 meta。')
  if (typeof meta.id !== 'string' || !meta.id) fail('meta.id 不合法。')
  if (typeof meta.title !== 'string') fail('meta.title 不合法。')
  if (!Array.isArray(data.nodes)) fail('nodes 必须是数组。')
  if (!Array.isArray(data.choices)) fail('choices 必须是数组。')
  if (typeof data.startNodeId !== 'string' || !data.startNodeId)
    fail('startNodeId 不合法。')

  // 确保可选数组字段存在
  if (!Array.isArray(data.variables)) (data as Record<string, unknown>).variables = []
  if (!Array.isArray(data.items)) (data as Record<string, unknown>).items = []
  if (!Array.isArray(data.characters)) (data as Record<string, unknown>).characters = []

  const nodeIds = new Set<string>()
  const choiceIds = new Set<string>()
  const itemKeys = new Set<string>()

  // 校验物品
  for (const it of data.items as unknown[]) {
    if (!isObj(it)) fail('物品结构不合法。')
    const item = it as Record<string, unknown>
    if (typeof item.key !== 'string' || !item.key) fail('物品 key 不合法。')
    if (itemKeys.has(item.key as string)) fail(`物品 key 重复：${item.key}`)
    itemKeys.add(item.key as string)
  }

  // 校验节点
  for (const n of data.nodes as unknown[]) {
    if (!isObj(n)) fail('节点结构不合法。')
    const node = n as Record<string, unknown>
    if (typeof node.id !== 'string' || !node.id) fail('节点 id 不合法。')
    if (nodeIds.has(node.id as string)) fail(`节点 id 重复：${node.id}`)
    nodeIds.add(node.id as string)
    if (typeof node.type !== 'string' || !isValidNodeType(node.type))
      fail(`节点 ${node.id} 类型不合法。`)
    if (!isObj(node.content)) fail(`节点 ${node.id} 缺少 content。`)
    if (typeof node.content.title !== 'string' || typeof node.content.text !== 'string')
      fail(`节点 ${node.id} content 字段不完整。`)
    if (!isObj(node.position) || typeof node.position.x !== 'number' || typeof node.position.y !== 'number')
      fail(`节点 ${node.id} 坐标不合法。`)
    // �4a. 谜题配置校验
    if (node.type === NodeType.Puzzle) {
      if (!isObj(node.puzzle)) fail(`谜题节点 ${node.id} 缺少 puzzle 配置。`)
      const p = node.puzzle as Record<string, unknown>
      if (typeof p.answer !== 'string') fail(`谜题节点 ${node.id} 缺少 answer。`)
      if (typeof p.prompt !== 'string') fail(`谜题节点 ${node.id} 缺少 prompt。`)
    }
    // 4b. 线索引用校验
    if (node.type === NodeType.Clue) {
      if (typeof node.clueItemKey !== 'string' || !node.clueItemKey)
        fail(`线索节点 ${node.id} 缺少 clueItemKey。`)
    }
    // 4c. 交互物品目标校验
    if (Array.isArray(node.interactables)) {
      for (const ri of node.interactables) {
        if (!isObj(ri)) fail(`节点 ${node.id} 交互物品结构不合法。`)
        const it = ri as Record<string, unknown>
        if (typeof it.action !== 'string') fail(`节点 ${node.id} 交互物品缺少 action。`)
        const action = it.action as string
        const target = it.target as string | undefined
        if ((action === InteractAction.GoToNode || action === InteractAction.OpenPuzzle) && target) {
          if (!nodeIds.has(target)) fail(`节点 ${node.id} 交互物品跳转目标 ${target} 不存在。`)
        }
        if ((action === InteractAction.CollectClue || action === InteractAction.GiveItem) && target) {
          if (!itemKeys.has(target)) fail(`节点 ${node.id} 交互物品引用物品 ${target} 未定义。`)
        }
      }
    }
  }

  if (!nodeIds.has(data.startNodeId as string))
    fail('起始节点不存在于节点列表中。')

  // 校验选项
  for (const c of data.choices as unknown[]) {
    if (!isObj(c)) fail('选项结构不合法。')
    const choice = c as Record<string, unknown>
    if (typeof choice.id !== 'string') fail('选项 id 不合法。')
    if (choiceIds.has(choice.id as string)) fail(`选项 id 重复：${choice.id}`)
    choiceIds.add(choice.id as string)
    if (typeof choice.fromNodeId !== 'string' || typeof choice.toNodeId !== 'string')
      fail(`选项 ${choice.id} 连接节点不合法。`)
    if (!nodeIds.has(choice.fromNodeId as string))
      fail(`选项 ${choice.id} 起点节点不存在。`)
    if (!nodeIds.has(choice.toNodeId as string))
      fail(`选项 ${choice.id} 目标节点不存在。`)
    if (typeof choice.label !== 'string') fail(`选项 ${choice.id} label 不合法。`)
    if (!Array.isArray(choice.effects)) (choice as Record<string, unknown>).effects = []
  }

  return data as unknown as Adventure
}

function isValidNodeType(t: string): boolean {
  return Object.values(NodeType).includes(t as NodeType)
}

/** 从 JSON 字符串导入作品 */
export function importAdventure(json: string): Adventure {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    fail('文件不是合法的 JSON，无法解析。')
  }
  return validateImported(data)
}

/** 从文件对象导入 */
export function importFromFile(file: File): Promise<Adventure> {
  return file.text().then((text) => importAdventure(text))
}

/** 导出元信息摘要（用于列表展示） */
export function metaOf(adventure: Adventure): AdventureMeta {
  return adventure.meta
}

/** 节点/选项数量摘要 */
export function summary(adventure: Adventure): {
  nodes: number
  choices: number
  endings: number
} {
  const nodes = adventure.nodes as SceneNode[]
  const choices = adventure.choices as Choice[]
  return {
    nodes: nodes.length,
    choices: choices.length,
    endings: nodes.filter((n) => n.type === NodeType.Ending).length,
  }
}
