/**
 * 作品校验：在编辑/导出前对 Adventure 结构进行静态检查。
 * 纯本地结构检查，不依赖 AI。
 */
import {
  type Adventure,
  type ID,
  type ValidationIssue,
  type ValidationResult,
  NodeType,
  PuzzleKind,
  InteractAction,
} from '@/types/adventure'

function issue(
  level: ValidationIssue['level'],
  code: string,
  message: string,
  extra?: { nodeId?: ID; choiceId?: ID }
): ValidationIssue {
  return { level, code, message, ...extra }
}

function combine(results: ValidationResult[]): ValidationResult {
  const issues = results.flatMap((r) => r.issues)
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 校验起始节点是否合法 */
export function validateStartNode(adventure: Adventure): ValidationResult {
  const issues: ValidationIssue[] = []
  const start = adventure.nodes.find((n) => n.id === adventure.startNodeId)
  if (!start) {
    issues.push(issue('error', 'NO_START', '起始节点不存在，作品无法开始。'))
  } else if (start.type !== NodeType.Start) {
    issues.push(
      issue('warning', 'START_TYPE', '起始节点的类型不是「起始」，建议改为起始类型。', {
        nodeId: start.id,
      })
    )
  }
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 校验所有选项的连接节点是否存在 */
export function validateChoiceTargets(adventure: Adventure): ValidationResult {
  const issues: ValidationIssue[] = []
  const ids = new Set(adventure.nodes.map((n) => n.id))
  for (const c of adventure.choices) {
    if (!ids.has(c.fromNodeId))
      issues.push(
        issue('error', 'CHOICE_FROM', `分支「${c.label}」的起点节点不存在。`, {
          choiceId: c.id,
        })
      )
    if (!ids.has(c.toNodeId))
      issues.push(
        issue('error', 'CHOICE_TO', `分支「${c.label}」指向的目标节点不存在。`, {
          choiceId: c.id,
        })
      )
  }
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 校验节点 id 唯一、结局存在、谜题配置 */
export function validateNodes(adventure: Adventure): ValidationResult {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()
  for (const n of adventure.nodes) {
    if (seen.has(n.id))
      issues.push(issue('error', 'DUP_NODE', `节点 id 重复：${n.id}`, { nodeId: n.id }))
    seen.add(n.id)
    if (!n.content?.title && !n.content?.text)
      issues.push(issue('warning', 'EMPTY_CONTENT', '节点缺少标题和正文。', { nodeId: n.id }))
    if (n.type === NodeType.Puzzle) {
      if (!n.puzzle)
        issues.push(
          issue('warning', 'NO_PUZZLE', '谜题节点缺少密码配置。', {
            nodeId: n.id,
          })
        )
      else if (!n.puzzle.answer)
        issues.push(
          issue('warning', 'EMPTY_ANSWER', '谜题节点未设置正确答案。', {
            nodeId: n.id,
          })
        )
    }
    if (n.type === NodeType.Clue && !n.clueItemKey)
      issues.push(
        issue('warning', 'NO_CLUE_KEY', '线索节点未绑定线索物品。', { nodeId: n.id })
      )
  }
  const hasEnding = adventure.nodes.some((n) => n.type === NodeType.Ending)
  if (!hasEnding) issues.push(issue('warning', 'NO_ENDING', '作品没有任何结局节点，玩家无法到达终点。'))
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 校验变量/物品引用是否都已声明 */
export function validateReferences(adventure: Adventure): ValidationResult {
  const issues: ValidationIssue[] = []
  const itemKeys = new Set(adventure.items.map((i) => i.key))
  for (const n of adventure.nodes) {
    if (n.type === NodeType.Clue && n.clueItemKey && !itemKeys.has(n.clueItemKey))
      issues.push(
        issue('warning', 'CLUE_ITEM', `线索节点引用了未定义的物品：${n.clueItemKey}`, {
          nodeId: n.id,
        })
      )
  }
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 校验谜题类型特定配置 */
export function validatePuzzleConfig(adventure: Adventure): ValidationResult {
  const issues: ValidationIssue[] = []
  for (const n of adventure.nodes) {
    if (n.type !== NodeType.Puzzle || !n.puzzle) continue
    const p = n.puzzle
    const kind = p.kind ?? PuzzleKind.Text
    if (kind === PuzzleKind.NumberLock && (!p.digits || p.digits < 1)) {
      issues.push(
        issue('warning', 'PUZZLE_NO_DIGITS', '数字锁谜题未设置位数。', { nodeId: n.id })
      )
    }
    if (kind === PuzzleKind.SymbolSequence && (!p.symbols || p.symbols.length === 0)) {
      issues.push(
        issue('warning', 'PUZZLE_NO_SYMBOLS', '符号序列谜题未设置符号集。', { nodeId: n.id })
      )
    }
    if (kind === PuzzleKind.Pattern && (!p.patterns || p.patterns.length === 0)) {
      issues.push(
        issue('warning', 'PUZZLE_NO_PATTERNS', '图案谜题未设置图案列表。', { nodeId: n.id })
      )
    }
  }
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 校验可交互物品的目标引用 */
export function validateInteractables(adventure: Adventure): ValidationResult {
  const issues: ValidationIssue[] = []
  const nodeIds = new Set(adventure.nodes.map((n) => n.id))
  const itemKeys = new Set(adventure.items.map((i) => i.key))
  for (const n of adventure.nodes) {
    if (!n.interactables) continue
    for (const it of n.interactables) {
      if (it.action === InteractAction.GoToNode && it.target && !nodeIds.has(it.target)) {
        issues.push(
          issue('warning', 'INTERACT_GOTO', `可交互物品「${it.name}」的跳转目标节点不存在。`, {
            nodeId: n.id,
          })
        )
      }
      if (
        (it.action === InteractAction.CollectClue || it.action === InteractAction.GiveItem) &&
        it.target && !itemKeys.has(it.target)
      ) {
        issues.push(
          issue('warning', 'INTERACT_ITEM', `可交互物品「${it.name}」引用了未定义的物品：${it.target}`, {
            nodeId: n.id,
          })
        )
      }
    }
  }
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 从起始节点出发的可达性分析 */
export function analyzeReachability(adventure: Adventure): {
  reachable: Set<ID>
  unreachable: ID[]
  orphans: ID[]
  deadEnds: ID[]
  noPathToEnd: ID[]
} {
  const ids = new Set(adventure.nodes.map((n) => n.id))
  const outgoing = new Map<ID, ID[]>()
  const incoming = new Map<ID, ID[]>()
  for (const n of adventure.nodes) {
    outgoing.set(n.id, [])
    incoming.set(n.id, [])
  }
  for (const c of adventure.choices) {
    if (ids.has(c.fromNodeId) && ids.has(c.toNodeId)) {
      outgoing.get(c.fromNodeId)!.push(c.toNodeId)
      incoming.get(c.toNodeId)!.push(c.fromNodeId)
    }
  }

  // BFS from start
  const reachable = new Set<ID>()
  const queue: ID[] = []
  if (ids.has(adventure.startNodeId)) {
    queue.push(adventure.startNodeId)
    reachable.add(adventure.startNodeId)
  }
  while (queue.length) {
    const cur = queue.shift()!
    for (const next of outgoing.get(cur) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next)
        queue.push(next)
      }
    }
  }

  const unreachable = adventure.nodes
    .filter((n) => !reachable.has(n.id))
    .map((n) => n.id)

  // 孤立节点：无入边也无出边，且非 start
  const orphans = adventure.nodes
    .filter(
      (n) =>
        n.id !== adventure.startNodeId &&
        (incoming.get(n.id)?.length ?? 0) === 0 &&
        (outgoing.get(n.id)?.length ?? 0) === 0
    )
    .map((n) => n.id)

  // 死胡同：非结局但无出边（且可达）
  const deadEnds = adventure.nodes
    .filter(
      (n) =>
        n.type !== NodeType.Ending &&
        (outgoing.get(n.id)?.length ?? 0) === 0 &&
        reachable.has(n.id)
    )
    .map((n) => n.id)

  // 从某节点出发能否到达任意结局
  const endingIds = new Set(
    adventure.nodes.filter((n) => n.type === NodeType.Ending).map((n) => n.id)
  )
  const noPathToEnd: ID[] = []
  for (const n of adventure.nodes) {
    if (n.type === NodeType.Ending) continue
    if (!reachable.has(n.id)) continue
    // BFS from n to any ending
    const visited = new Set<ID>([n.id])
    const q: ID[] = [n.id]
    let canReachEnd = false
    while (q.length) {
      const cur = q.shift()!
      if (endingIds.has(cur)) {
        canReachEnd = true
        break
      }
      for (const next of outgoing.get(cur) ?? []) {
        if (!visited.has(next)) {
          visited.add(next)
          q.push(next)
        }
      }
    }
    if (!canReachEnd) noPathToEnd.push(n.id)
  }

  return { reachable, unreachable, orphans, deadEnds, noPathToEnd }
}

/** 校验图结构与可达性 */
export function validateGraph(adventure: Adventure): ValidationResult {
  const issues: ValidationIssue[] = []
  const { unreachable, orphans, deadEnds, noPathToEnd } = analyzeReachability(adventure)
  const nodeMap = new Map(adventure.nodes.map((n) => [n.id, n]))

  for (const id of orphans) {
    const n = nodeMap.get(id)
    issues.push(
      issue('warning', 'ORPHAN', `节点「${n?.content.title ?? id}」没有任何连接，玩家无法到达。`, {
        nodeId: id,
      })
    )
  }
  for (const id of unreachable) {
    const n = nodeMap.get(id)
    if (n?.id === adventure.startNodeId) continue
    issues.push(
      issue('warning', 'UNREACHABLE', `节点「${n?.content.title ?? id}」从起始节点无法到达。`, {
        nodeId: id,
      })
    )
  }
  for (const id of deadEnds) {
    const n = nodeMap.get(id)
    issues.push(
      issue('info', 'DEAD_END', `节点「${n?.content.title ?? id}」没有后续分支，玩家会在此卡住。`, {
        nodeId: id,
      })
    )
  }
  for (const id of noPathToEnd) {
    const n = nodeMap.get(id)
    issues.push(
      issue('warning', 'NO_PATH_TO_END', `从节点「${n?.content.title ?? id}」出发无法到达任何结局。`, {
        nodeId: id,
      })
    )
  }
  return { ok: issues.every((i) => i.level !== 'error'), issues }
}

/** 校验整部作品 */
export function validateAdventure(adventure: Adventure): ValidationResult {
  return combine([
    validateStartNode(adventure),
    validateNodes(adventure),
    validateChoiceTargets(adventure),
    validateReferences(adventure),
    validatePuzzleConfig(adventure),
    validateInteractables(adventure),
    validateGraph(adventure),
  ])
}
