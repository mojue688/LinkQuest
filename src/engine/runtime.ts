/**
 * 游戏运行时引擎
 * 根据当前 GameState 与作品结构推进游戏流程：
 * 解析节点、求值条件、执行效果、跳转节点、判定结局。
 */
import {
  type Adventure,
  type Choice,
  type Effect,
  type GameState,
  type ID,
  type Interactable,
  type SceneNode,
  InteractAction,
  NodeType,
  PuzzleKind,
} from '@/types/adventure'
import { evalOptionalCondition } from './conditions'

/** 运行时上下文 */
export interface RuntimeContext {
  adventure: Adventure
  state: GameState
}

/** 单步推进结果 */
export interface StepResult {
  state: GameState
  node: SceneNode
  availableChoices: Choice[]
  ended: boolean
}

/** 谜题提交结果 */
export interface PuzzleResult {
  correct: boolean
  message: string
  result?: StepResult
}

/** 物品交互结果 */
export interface InteractResult {
  message: string
  collected: boolean
  navigated: boolean
  result?: StepResult
}

/** 取得节点 */
export function getNode(adventure: Adventure, id: ID): SceneNode {
  const node = adventure.nodes.find((n) => n.id === id)
  if (!node) throw new Error(`节点 ${id} 不存在`)
  return node
}

/** 执行效果列表 */
export function applyEffects(state: GameState, effects: Effect[]): void {
  for (const eff of effects) {
    switch (eff.kind) {
      case 'set_variable':
        if (eff.target && eff.value !== undefined)
          state.variables[eff.target] = eff.value
        break
      case 'add_number':
        if (eff.target && typeof eff.value === 'number') {
          const cur = (state.variables[eff.target] as number) ?? 0
          state.variables[eff.target] = cur + eff.value
        }
        break
      case 'give_item':
        if (eff.target && !state.inventory.includes(eff.target))
          state.inventory.push(eff.target)
        break
      case 'remove_item':
        if (eff.target)
          state.inventory = state.inventory.filter((k) => k !== eff.target)
        break
      case 'set_flag':
        if (eff.target) state.variables[eff.target] = true
        break
    }
  }
}

/** 进入节点时的副作用：线索授予物品、结局判定、访问记录 */
export function applyEnterEffects(
  adventure: Adventure,
  state: GameState,
  nodeId: ID
): void {
  if (!state.visitedNodes.includes(nodeId)) state.visitedNodes.push(nodeId)
  const node = getNode(adventure, nodeId)
  if (node.type === NodeType.Clue && node.clueItemKey) {
    if (!state.inventory.includes(node.clueItemKey))
      state.inventory.push(node.clueItemKey)
  }
  if (node.type === NodeType.Ending) {
    state.ended = true
    state.endingNodeId = node.id
  }
}

/** 初始化一个作品的运行时状态 */
export function createInitialState(adventure: Adventure): GameState {
  const variables: Record<string, number | string | boolean> = {}
  for (const v of adventure.variables) {
    variables[v.key] = v.defaultValue
  }
  const state: GameState = {
    adventureId: adventure.meta.id,
    currentNodeId: adventure.startNodeId,
    variables,
    inventory: [],
    visitedNodes: [],
    history: [],
    ended: false,
    interactedItems: [],
    puzzleStates: {},
  }
  applyEnterEffects(adventure, state, adventure.startNodeId)
  return state
}

/** 获取当前节点可选项（已过滤不满足条件的选项） */
export function getAvailableChoices(ctx: RuntimeContext): Choice[] {
  return ctx.adventure.choices
    .filter((c) => c.fromNodeId === ctx.state.currentNodeId)
    .filter((c) => evalOptionalCondition(ctx.state, c.condition))
}

/** 构建单步结果 */
function buildStep(ctx: RuntimeContext): StepResult {
  const node = getNode(ctx.adventure, ctx.state.currentNodeId)
  return {
    state: ctx.state,
    node,
    availableChoices: getAvailableChoices(ctx),
    ended: ctx.state.ended,
  }
}

/** 选择一个选项，执行其效果并推进到下一节点 */
export function choose(ctx: RuntimeContext, choiceId: ID): StepResult {
  const choice = ctx.adventure.choices.find((c) => c.id === choiceId)
  if (!choice) throw new Error(`选项 ${choiceId} 不存在`)
  if (choice.fromNodeId !== ctx.state.currentNodeId)
    throw new Error('该选项不属于当前节点')
  if (!evalOptionalCondition(ctx.state, choice.condition))
    throw new Error('当前条件不满足，无法选择该选项。')

  applyEffects(ctx.state, choice.effects)
  ctx.state.history.push({
    nodeId: ctx.state.currentNodeId,
    choiceId,
    at: Date.now(),
  })
  ctx.state.currentNodeId = choice.toNodeId
  applyEnterEffects(ctx.adventure, ctx.state, choice.toNodeId)
  return buildStep(ctx)
}

/** 跳转到指定节点 */
export function goTo(ctx: RuntimeContext, nodeId: ID): StepResult {
  ctx.state.currentNodeId = nodeId
  applyEnterEffects(ctx.adventure, ctx.state, nodeId)
  return buildStep(ctx)
}

/** 提交谜题答案：正确则自动沿第一条可用选项推进 */
export function solvePuzzle(ctx: RuntimeContext, answer: string): PuzzleResult {
  const node = getNode(ctx.adventure, ctx.state.currentNodeId)
  if (node.type !== NodeType.Puzzle || !node.puzzle) {
    return { correct: false, message: '当前节点不是谜题节点。' }
  }

  // 检查必需物品（线索解锁机制）
  if (node.puzzle.requiredItems && node.puzzle.requiredItems.length > 0) {
    const missing = node.puzzle.requiredItems.filter(
      (key) => !ctx.state.inventory.includes(key)
    )
    if (missing.length > 0) {
      return {
        correct: false,
        message: '你还需要更多线索才能解开这个谜题。继续探索场景吧。',
      }
    }
  }

  const nodeId = node.id
  const pstate = ctx.state.puzzleStates[nodeId] ?? { solved: false, attempts: 0 }
  pstate.attempts++
  const expected = node.puzzle.answer.trim()
  let correct: boolean
  const kind = node.puzzle.kind ?? PuzzleKind.Text
  if (kind === PuzzleKind.NumberLock) {
    correct = answer.trim() === expected
  } else if (kind === PuzzleKind.SymbolSequence || kind === PuzzleKind.Pattern) {
    correct = answer.trim() === expected
  } else {
    correct = answer.trim() === expected
  }
  if (!correct) {
    ctx.state.puzzleStates[nodeId] = pstate
    return { correct: false, message: node.puzzle.hint || '答案不正确。' }
  }
  pstate.solved = true
  ctx.state.puzzleStates[nodeId] = pstate
  const next = getAvailableChoices(ctx)[0]
  if (!next) {
    return { correct: true, message: '密码正确，但该节点未连接后续剧情。', result: buildStep(ctx) }
  }
  const result = choose(ctx, next.id)
  return { correct: true, message: '密码正确！', result }
}

/** 获取某节点谜题状态 */
export function getPuzzleState(ctx: RuntimeContext, nodeId: ID): { solved: boolean; attempts: number } {
  return ctx.state.puzzleStates[nodeId] ?? { solved: false, attempts: 0 }
}

/** 生成物品交互记录 key */
function interactKey(nodeId: ID, interactableId: ID): string {
  return `${nodeId}:${interactableId}`
}

/** 判断某物品是否已交互过 */
export function isInteracted(state: GameState, nodeId: ID, interactableId: ID): boolean {
  return state.interactedItems.includes(interactKey(nodeId, interactableId))
}

/** 获取当前节点可见的可交互物品（已过滤条件、已处理 once 消失） */
export function getVisibleInteractables(ctx: RuntimeContext): Interactable[] {
  const node = getNode(ctx.adventure, ctx.state.currentNodeId)
  if (!node.interactables) return []
  return node.interactables.filter((it) => {
    if (!evalOptionalCondition(ctx.state, it.condition)) return false
    if (it.once && isInteracted(ctx.state, node.id, it.id)) return false
    return true
  })
}

/** 与场景内物品交互 */
export function interactItem(ctx: RuntimeContext, interactableId: ID): InteractResult {
  const node = getNode(ctx.adventure, ctx.state.currentNodeId)
  const item = node.interactables?.find((i) => i.id === interactableId)
  if (!item) {
    return { message: '该物品不存在。', collected: false, navigated: false }
  }
  if (!evalOptionalCondition(ctx.state, item.condition)) {
    return { message: '现在无法与它交互。', collected: false, navigated: false }
  }
  if (item.once && isInteracted(ctx.state, node.id, item.id)) {
    return { message: '已经查看过了。', collected: false, navigated: false }
  }
  const key = interactKey(node.id, item.id)
  if (!ctx.state.interactedItems.includes(key)) {
    ctx.state.interactedItems.push(key)
  }
  switch (item.action) {
    case InteractAction.Inspect:
      return {
        message: item.revealText || item.description || `你仔细查看了${item.name}。`,
        collected: false,
        navigated: false,
      }
    case InteractAction.CollectClue:
    case InteractAction.GiveItem:
      if (item.target && !ctx.state.inventory.includes(item.target)) {
        ctx.state.inventory.push(item.target)
      }
      return {
        message: item.revealText || `获得了${item.name}。`,
        collected: true,
        navigated: false,
      }
    case InteractAction.RevealText:
      return {
        message: item.revealText || item.description || '',
        collected: false,
        navigated: false,
      }
    case InteractAction.OpenPuzzle:
      if (item.target) {
        const targetNode = ctx.adventure.nodes.find((n) => n.id === item.target)
        if (targetNode && targetNode.type === NodeType.Puzzle) {
          const result = goTo(ctx, item.target)
          return {
            message: item.revealText || `${item.name}上似乎有一个谜题……`,
            collected: false,
            navigated: true,
            result,
          }
        }
      }
      return {
        message: item.revealText || `${item.name}上似乎有一个谜题……`,
        collected: false,
        navigated: false,
      }
    case InteractAction.GoToNode:
      if (item.target) {
        const result = goTo(ctx, item.target)
        return {
          message: item.revealText || '',
          collected: false,
          navigated: true,
          result,
        }
      }
      return { message: '无法跳转。', collected: false, navigated: false }
    default:
      return { message: '什么也没有发生。', collected: false, navigated: false }
  }
}

/** 判定当前是否到达结局 */
export function checkEnding(ctx: RuntimeContext): boolean {
  return ctx.state.ended
}

/** 检查谜题是否已解锁（持有所有必需物品） */
export function isPuzzleUnlocked(ctx: RuntimeContext, nodeId: ID): boolean {
  const node = getNode(ctx.adventure, nodeId)
  if (node.type !== NodeType.Puzzle || !node.puzzle) return true
  if (!node.puzzle.requiredItems || node.puzzle.requiredItems.length === 0) return true
  return node.puzzle.requiredItems.every((key) => ctx.state.inventory.includes(key))
}

/** 获取谜题缺少的物品名称列表 */
export function getMissingPuzzleItems(ctx: RuntimeContext, nodeId: ID): string[] {
  const node = getNode(ctx.adventure, nodeId)
  if (node.type !== NodeType.Puzzle || !node.puzzle) return []
  if (!node.puzzle.requiredItems) return []
  return node.puzzle.requiredItems.filter((key) => !ctx.state.inventory.includes(key))
}

/** 创建运行时上下文 */
export function createRuntime(adventure: Adventure): RuntimeContext {
  return { adventure, state: createInitialState(adventure) }
}
