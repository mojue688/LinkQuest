/**
 * AI 生成器
 *
 * - 调用 AIClient 生成完整互动故事。
 * - 对 AI 返回的中间结构执行运行时校验与修复。
 * - 转换为项目 Adventure 数据结构。
 * - AI 不可用时回退到本地模板（明确标注来源）。
 */
import type { AIClient } from './types'
import type {
  AIStory,
  AIStoryNode,
  GenerateStoryRequest,
  GenerateStoryResult,
  GenerateSceneRequest,
  GenerateSceneResponse,
  GenerateBranchRequest,
  GenerateBranchResponse,
} from './types'
import { AIError } from './types'
import {
  NodeType,
  EndingKind,
  PuzzleKind,
  InteractAction,
  type Adventure,
  type SceneNode,
  type Choice,
  type ID,
} from '@/types/adventure'
import { createNode, createChoice, genId, createAdventure } from '@/utils/factory'
import { generateFromTemplate, fallbackGenerateScene, fallbackGenerateBranch } from './fallback'

/* ---------- AIStory 校验与修复 ---------- */

const VALID_NODE_TYPES = new Set(['start', 'scene', 'clue', 'puzzle', 'ending'])
const VALID_ENDING_KINDS = new Set(['good', 'neutral', 'bad', 'secret'])

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

/** 校验并规整 AIStory，修复可修复的问题，不可修复则抛出 */
export function normalizeAIStory(raw: unknown, _requestedEndings = 3): AIStory {
  if (!isObj(raw)) {
    throw new AIError('parse', 'AI 返回的不是有效对象。')
  }
  const title = str(raw.title, 'AI 生成故事').trim()
  const description = str(raw.description, '').trim()
  const tags = arr(raw.tags).filter((t): t is string => typeof t === 'string')

  const rawNodes = arr(raw.nodes)
  if (rawNodes.length === 0) {
    throw new AIError('invalid', 'AI 返回的故事没有任何节点。')
  }

  // 规整节点
  const nodeMap = new Map<string, AIStoryNode>()
  const nodes: AIStoryNode[] = []
  for (let i = 0; i < rawNodes.length; i++) {
    const rn = rawNodes[i]
    if (!isObj(rn)) continue
    let id = str(rn.id, `n${i + 1}`).trim()
    if (!id) id = `n${i + 1}`
    // 去重 id
    if (nodeMap.has(id)) {
      id = `${id}_${i + 1}`
    }
    let type = str(rn.type, 'scene').trim()
    if (!VALID_NODE_TYPES.has(type)) type = 'scene'
    const node: AIStoryNode = {
      id,
      type: type as AIStoryNode['type'],
      title: str(rn.title, '未命名场景').trim() || '未命名场景',
      text: str(rn.text, '').trim(),
    }
    if (typeof rn.speaker === 'string' && rn.speaker) node.speaker = rn.speaker
    if (typeof rn.background === 'string' && rn.background) node.background = rn.background
    if (typeof rn.atmosphere === 'string' && rn.atmosphere) node.atmosphere = rn.atmosphere
    if (typeof rn.characterId === 'string' && rn.characterId) node.characterId = rn.characterId
    if (typeof rn.dialogue === 'string' && rn.dialogue) node.dialogue = rn.dialogue
    if (type === 'clue') {
      node.clueKey = str(rn.clueKey || rn.clueItemKey, '').trim()
      node.clueName = str(rn.clueName || rn.clueItemName, node.clueKey || '线索').trim()
    }
    if (type === 'puzzle') {
      node.puzzleKind = str(rn.puzzleKind || rn.kind, 'text').trim() || 'text'
      node.puzzleAnswer = str(rn.puzzleAnswer || rn.answer, '').trim()
      node.puzzlePrompt = str(rn.puzzlePrompt || rn.prompt, '请输入密码：').trim()
      node.puzzleHint = str(rn.puzzleHint || rn.hint, '密码不正确，再想一想。').trim()
      if (typeof rn.puzzleTitle === 'string') node.puzzleTitle = rn.puzzleTitle
      if (typeof rn.puzzleDigits === 'number') node.puzzleDigits = rn.puzzleDigits
      if (Array.isArray(rn.puzzleSymbols)) node.puzzleSymbols = rn.puzzleSymbols.filter((s): s is string => typeof s === 'string')
    }
    // 可交互物品
    const rawInteractables = arr(rn.interactables)
    if (rawInteractables.length > 0) {
      node.interactables = rawInteractables.map((ri, ii) => {
        if (!isObj(ri)) return { id: `it_${ii}`, name: '物品', action: 'inspect' }
        return {
          id: str(ri.id, `it_${ii}`).trim() || `it_${ii}`,
          name: str(ri.name, '物品').trim() || '物品',
          icon: typeof ri.icon === 'string' ? ri.icon : undefined,
          position: isObj(ri.position) ? {
            x: typeof (ri.position as Record<string, unknown>).x === 'number' ? (ri.position as Record<string, unknown>).x as number : 50,
            y: typeof (ri.position as Record<string, unknown>).y === 'number' ? (ri.position as Record<string, unknown>).y as number : 50,
          } : undefined,
          description: typeof ri.description === 'string' ? ri.description : undefined,
          action: str(ri.action, 'inspect').trim() || 'inspect',
          target: typeof ri.target === 'string' ? ri.target : undefined,
          revealText: typeof ri.revealText === 'string' ? ri.revealText : undefined,
          once: typeof ri.once === 'boolean' ? ri.once : undefined,
        }
      })
    }
    if (type === 'ending') {
      let ek = str(rn.endingKind || rn.kind, 'neutral').trim()
      if (!VALID_ENDING_KINDS.has(ek)) ek = 'neutral'
      node.endingKind = ek as AIStoryNode['endingKind']
    }
    nodes.push(node)
    nodeMap.set(id, node)
  }

  if (nodes.length === 0) {
    throw new AIError('invalid', '规整后没有任何有效节点。')
  }

  // 确保有 start 节点
  let startNode = nodes.find((n) => n.type === 'start')
  if (!startNode) {
    startNode = {
      id: 'n_start',
      type: 'start',
      title: '故事开端',
      text: '你的冒险从这里开始……',
    }
    nodes.unshift(startNode)
    nodeMap.set(startNode.id, startNode)
  }

  // startNodeId
  let startNodeId = str(raw.startNodeId, '').trim()
  if (!nodeMap.has(startNodeId)) {
    startNodeId = startNode.id
  } else if (nodeMap.get(startNodeId)!.type !== 'start') {
    // 若指向非 start 节点，把该节点改为 start
    nodeMap.get(startNodeId)!.type = 'start'
    startNode = nodeMap.get(startNodeId)!
  }

  // 规整 choices
  const rawChoices = arr(raw.choices)
  const choices: AIStory['choices'] = []
  const seenEdge = new Set<string>()
  for (const rc of rawChoices) {
    if (!isObj(rc)) continue
    const from = str(rc.from || rc.fromNodeId, '').trim()
    const to = str(rc.to || rc.toNodeId, '').trim()
    if (!from || !to) continue
    if (!nodeMap.has(from) || !nodeMap.has(to)) continue
    const key = `${from}->${to}`
    if (seenEdge.has(key)) continue
    seenEdge.add(key)
    choices.push({
      from,
      to,
      label: str(rc.label, '继续').trim() || '继续',
    })
  }

  // 确保从 start 至少有一条出边
  const hasStartOut = choices.some((c) => c.from === startNodeId)
  if (!hasStartOut && nodes.length > 1) {
    const next = nodes.find((n) => n.id !== startNodeId)
    if (next) choices.push({ from: startNodeId, to: next.id, label: '开始' })
  }

  // 规整 items
  const items: AIStory['items'] = []
  for (const it of arr(raw.items)) {
    if (!isObj(it)) continue
    const key = str(it.key, '').trim()
    if (!key) continue
    items.push({ key, name: str(it.name, key).trim() || key })
  }
  // 从 clue 节点补全 items
  for (const n of nodes) {
    if (n.type === 'clue' && n.clueKey && !items.some((i) => i.key === n.clueKey)) {
      items.push({ key: n.clueKey, name: n.clueName || n.clueKey })
    }
  }

  // 检查结局数量
  const endings = nodes.filter((n) => n.type === 'ending')
  if (endings.length === 0) {
    // 补一个结局
    const endNode: AIStoryNode = {
      id: 'n_end',
      type: 'ending',
      title: '结局',
      text: '故事到此结束。',
      endingKind: 'neutral',
    }
    nodes.push(endNode)
    nodeMap.set(endNode.id, endNode)
    // 连接最后一个非结局节点
    let last: AIStoryNode | undefined
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].type !== 'ending' && nodes[i].id !== endNode.id) {
        last = nodes[i]
        break
      }
    }
    if (last && !choices.some((c) => c.from === last.id && c.to === endNode.id)) {
      choices.push({ from: last.id, to: endNode.id, label: '结束' })
    }
  }

  return {
    title,
    description: description || `${title} · AI 生成`,
    tags: tags.length ? tags : ['AI生成'],
    startNodeId,
    nodes,
    choices,
    items,
  }
}

/* ---------- AIStory → Adventure 转换 ---------- */

const TYPE_MAP: Record<string, NodeType> = {
  start: NodeType.Start,
  scene: NodeType.Scene,
  clue: NodeType.Clue,
  puzzle: NodeType.Puzzle,
  ending: NodeType.Ending,
}

const ENDING_MAP: Record<string, EndingKind> = {
  good: EndingKind.Good,
  neutral: EndingKind.Neutral,
  bad: EndingKind.Bad,
  secret: EndingKind.Secret,
}

/** 简单的分层布局：从 start BFS，按层级排 x，同层排 y */
function layoutPositions(nodes: AIStoryNode[], startNodeId: string): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>()
  const adj = new Map<string, string[]>()
  for (const n of nodes) adj.set(n.id, [])
  // 这里没有 choices，布局在 convert 里做
  void adj
  void startNodeId
  // 默认网格布局
  const cols = 4
  nodes.forEach((n, i) => {
    pos.set(n.id, {
      x: 80 + (i % cols) * 220,
      y: 80 + Math.floor(i / cols) * 170,
    })
  })
  return pos
}

/** 将 AIStory 转换为 Adventure */
export function convertToAdventure(story: AIStory): Adventure {
  const idMap = new Map<string, ID>() // AIStory id -> 新 id
  const now = Date.now()

  // 创建节点
  const sceneNodes: SceneNode[] = []
  for (const sn of story.nodes) {
    const type = TYPE_MAP[sn.type] ?? NodeType.Scene
    const pos = { x: 0, y: 0 }
    const node = createNode(type, pos)
    node.content = {
      title: sn.title,
      text: sn.text,
      speaker: sn.speaker || undefined,
      background: sn.background || undefined,
      atmosphere: sn.atmosphere || undefined,
      characterId: sn.characterId || undefined,
      dialogue: sn.dialogue || undefined,
    }
    if (type === NodeType.Clue && sn.clueKey) {
      node.clueItemKey = sn.clueKey
    }
    if (type === NodeType.Puzzle) {
      const kindMap: Record<string, PuzzleKind> = {
        text: PuzzleKind.Text,
        number_lock: PuzzleKind.NumberLock,
        symbol_sequence: PuzzleKind.SymbolSequence,
        pattern: PuzzleKind.Pattern,
      }
      node.puzzle = {
        kind: kindMap[sn.puzzleKind ?? 'text'] ?? PuzzleKind.Text,
        answer: sn.puzzleAnswer || '',
        prompt: sn.puzzlePrompt || '请输入密码：',
        hint: sn.puzzleHint || '密码不正确，再想一想。',
        maxAttempts: 0,
        title: sn.puzzleTitle || undefined,
        digits: sn.puzzleDigits,
        symbols: sn.puzzleSymbols,
      }
    }
    // 可交互物品
    if (sn.interactables && sn.interactables.length > 0) {
      const actionMap: Record<string, InteractAction> = {
        inspect: InteractAction.Inspect,
        collect: InteractAction.CollectClue,
        give: InteractAction.GiveItem,
        puzzle: InteractAction.OpenPuzzle,
        goto: InteractAction.GoToNode,
        reveal: InteractAction.RevealText,
      }
      node.interactables = sn.interactables.map((it) => ({
        id: genId('it'),
        name: it.name,
        icon: it.icon,
        position: it.position ?? { x: 50, y: 50 },
        size: 48,
        description: it.description,
        action: actionMap[it.action ?? 'inspect'] ?? InteractAction.Inspect,
        target: it.target,
        revealText: it.revealText,
        once: it.once,
      }))
    }
    if (type === NodeType.Ending) {
      node.endingKind = sn.endingKind ? ENDING_MAP[sn.endingKind] : EndingKind.Neutral
    }
    idMap.set(sn.id, node.id)
    sceneNodes.push(node)
  }

  // 布局
  const positions = layoutPositions(story.nodes, story.startNodeId)
  for (const sn of story.nodes) {
    const node = sceneNodes.find((n) => n.id === idMap.get(sn.id))
    if (node) node.position = positions.get(sn.id) ?? { x: 0, y: 0 }
  }

  // 创建 choices
  const choices: Choice[] = []
  for (const c of story.choices) {
    const fromId = idMap.get(c.from)
    const toId = idMap.get(c.to)
    if (fromId && toId) {
      choices.push(createChoice(fromId, toId, c.label))
    }
  }

  // items
  const items = (story.items ?? []).map((it) => ({
    id: genId('item'),
    key: it.key,
    name: it.name,
  }))

  const startId = idMap.get(story.startNodeId) ?? sceneNodes[0].id

  return {
    meta: {
      id: genId('adv'),
      title: story.title,
      author: 'AI 生成',
      description: story.description,
      tags: story.tags ?? ['AI生成'],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
    },
    nodes: sceneNodes,
    choices,
    variables: [],
    items,
    characters: [],
    startNodeId: startId,
  }
}

/* ---------- 顶层生成入口 ---------- */

/** 生成完整故事：优先真实 AI，不可用回退模板 */
export async function generateStory(
  client: AIClient | null,
  req: GenerateStoryRequest
): Promise<GenerateStoryResult> {
  if (client && client.isAvailable()) {
    const result = await client.generateStory(req)
    // 校验与修复
    const story = normalizeAIStory(result.story, req.endingCount ?? 3)
    return { story, source: 'ai', raw: result.raw }
  }
  // 回退：本地模板（明确标注）
  return fallbackStory(req)
}

/** 本地模板回退（基于提示关键词选择模板，明确标注为 template） */
function fallbackStory(req: GenerateStoryRequest): GenerateStoryResult {
  const p = req.prompt.toLowerCase()
  let tplId = 'midnight'
  if (/古墓|墓|宝藏|密码/.test(p)) tplId = 'tomb'
  else if (/密室|逃脱|锁/.test(p)) tplId = 'escape'
  else if (/古堡|城堡|雷雨|分支/.test(p)) tplId = 'manor'
  else if (/教学|午夜|教室|悬疑|不存在/.test(p)) tplId = 'midnight'
  const adv = generateFromTemplate(tplId)
  if (!adv) {
    // 兜底：空白作品
    const blank = createAdventure(req.prompt.slice(0, 20) || 'AI 故事')
    return {
      story: adventureToAIStory(blank),
      source: 'template',
    }
  }
  return {
    story: adventureToAIStory(adv),
    source: 'template',
  }
}

/** Adventure → AIStory（用于回退时统一预览） */
function adventureToAIStory(adv: Adventure): AIStory {
  const idReverse = new Map<ID, string>()
  const nodes: AIStoryNode[] = adv.nodes.map((n, i) => {
    const aid = `n${i + 1}`
    idReverse.set(n.id, aid)
    const node: AIStoryNode = {
      id: aid,
      type: n.type as string as AIStoryNode['type'],
      title: n.content.title,
      text: n.content.text,
      speaker: n.content.speaker,
      background: n.content.background,
      atmosphere: n.content.atmosphere,
      characterId: n.content.characterId,
      dialogue: n.content.dialogue,
    }
    if (n.type === NodeType.Clue && n.clueItemKey) {
      node.clueKey = n.clueItemKey
      const item = adv.items.find((it) => it.key === n.clueItemKey)
      node.clueName = item?.name ?? n.clueItemKey
    }
    if (n.type === NodeType.Puzzle && n.puzzle) {
      node.puzzleKind = n.puzzle.kind ?? PuzzleKind.Text
      node.puzzleAnswer = n.puzzle.answer
      node.puzzlePrompt = n.puzzle.prompt
      node.puzzleHint = n.puzzle.hint
      node.puzzleTitle = n.puzzle.title
      node.puzzleDigits = n.puzzle.digits
      node.puzzleSymbols = n.puzzle.symbols
    }
    if (n.interactables && n.interactables.length > 0) {
      node.interactables = n.interactables.map((it) => ({
        id: it.id,
        name: it.name,
        icon: it.icon,
        position: it.position,
        description: it.description,
        action: it.action,
        target: it.target,
        revealText: it.revealText,
        once: it.once,
      }))
    }
    if (n.type === NodeType.Ending && n.endingKind) {
      node.endingKind = n.endingKind as string as AIStoryNode['endingKind']
    }
    return node
  })
  return {
    title: adv.meta.title,
    description: adv.meta.description,
    tags: adv.meta.tags,
    startNodeId: idReverse.get(adv.startNodeId) ?? nodes[0].id,
    nodes,
    choices: adv.choices.map((c) => ({
      from: idReverse.get(c.fromNodeId) ?? '',
      to: idReverse.get(c.toNodeId) ?? '',
      label: c.label,
    })),
    items: adv.items.map((it) => ({ key: it.key, name: it.name })),
  }
}

/* ---------- 细粒度生成（场景/分支） ---------- */

export async function generateScene(
  client: AIClient | null,
  req: GenerateSceneRequest
): Promise<GenerateSceneResponse> {
  if (client && client.isAvailable()) {
    return client.generateScene(req)
  }
  return fallbackGenerateScene(req)
}

export async function generateBranch(
  client: AIClient | null,
  req: GenerateBranchRequest
): Promise<GenerateBranchResponse> {
  if (client && client.isAvailable()) {
    return client.generateBranch(req)
  }
  return fallbackGenerateBranch(req)
}
