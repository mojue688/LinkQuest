/**
 * AI 评审器
 *
 * - 本地结构检查：不依赖 AI，检查剧情图结构、无效分支、不可达结局等。
 * - 可选 AI 审查：对剧情连贯性、角色动机、悬念铺垫提出建议。
 * - AI 审查失败不影响作品保存和游玩。
 */
import type { AIClient, ReviewRequest, ReviewResponse, PlotReviewResult, PlotIssue } from './types'
import { NodeType, type Adventure, type ID } from '@/types/adventure'
import { analyzeReachability } from '@/engine/validation'
import { fallbackReview } from './fallback'

/* ---------- 本地结构审查 ---------- */

/** 对整部作品执行本地结构审查 */
export function reviewAdventureLocal(adventure: Adventure): PlotReviewResult {
  const issues: PlotIssue[] = []
  const titleOf = (id: ID) =>
    adventure.nodes.find((n) => n.id === id)?.content.title ?? id

  // 起始节点
  const startNode = adventure.nodes.find((n) => n.id === adventure.startNodeId)
  if (!startNode) {
    issues.push({
      level: 'error',
      category: 'structure',
      message: '起始节点不存在，作品无法开始。',
      suggestion: '在画布上设置一个起始节点。',
    })
  } else if (startNode.type !== NodeType.Start) {
    issues.push({
      level: 'warning',
      category: 'structure',
      message: `起始节点「${startNode.content.title}」的类型不是「起始」。`,
      nodeId: startNode.id,
      suggestion: '将其类型改为起始，或另设起始节点。',
    })
  }

  // 节点内容
  for (const n of adventure.nodes) {
    if (!n.content.title && !n.content.text) {
      issues.push({
        level: 'warning',
        category: 'content',
        message: `节点「${n.content.title || n.id}」缺少标题和正文。`,
        nodeId: n.id,
        suggestion: '补充场景描述。',
      })
    }
    if (n.type === NodeType.Puzzle) {
      if (!n.puzzle?.answer) {
        issues.push({
          level: 'warning',
          category: 'puzzle',
          message: `谜题节点「${n.content.title}」未设置正确答案。`,
          nodeId: n.id,
          suggestion: '设置一个明确的答案。',
        })
      }
      // 谜题节点应有出边
      const hasOut = adventure.choices.some((c) => c.fromNodeId === n.id)
      if (!hasOut) {
        issues.push({
          level: 'warning',
          category: 'puzzle',
          message: `谜题节点「${n.content.title}」没有后续分支，玩家解谜后无法继续。`,
          nodeId: n.id,
          suggestion: '连接一个后续节点（通常是结局或新场景）。',
        })
      }
    }
    if (n.type === NodeType.Clue && !n.clueItemKey) {
      issues.push({
        level: 'warning',
        category: 'clue',
        message: `线索节点「${n.content.title}」未绑定线索物品。`,
        nodeId: n.id,
        suggestion: '设置线索物品标识和名称。',
      })
    }
  }

  // 分支连接
  const ids = new Set(adventure.nodes.map((n) => n.id))
  for (const c of adventure.choices) {
    if (!ids.has(c.toNodeId)) {
      issues.push({
        level: 'error',
        category: 'branch',
        message: `分支「${c.label}」指向不存在的节点。`,
        suggestion: '删除该分支或重新连接到有效节点。',
      })
    }
    if (!c.label.trim()) {
      issues.push({
        level: 'warning',
        category: 'branch',
        message: `存在没有文字的分支。`,
        suggestion: '为分支填写选项文字。',
      })
    }
  }

  // 可达性
  const { unreachable, orphans, deadEnds, noPathToEnd } = analyzeReachability(adventure)
  for (const id of orphans) {
    issues.push({
      level: 'warning',
      category: 'reachability',
      message: `节点「${titleOf(id)}」是孤立的，没有任何连接。`,
      nodeId: id,
      suggestion: '将其连接到剧情中，或删除。',
    })
  }
  for (const id of unreachable) {
    if (id === adventure.startNodeId) continue
    issues.push({
      level: 'warning',
      category: 'reachability',
      message: `节点「${titleOf(id)}」从起始节点无法到达。`,
      nodeId: id,
      suggestion: '增加从可达节点到这里的分支。',
    })
  }
  for (const id of deadEnds) {
    issues.push({
      level: 'info',
      category: 'reachability',
      message: `节点「${titleOf(id)}」没有后续分支，玩家会在此卡住。`,
      nodeId: id,
      suggestion: '若非结局节点，应连接后续分支。',
    })
  }
  for (const id of noPathToEnd) {
    issues.push({
      level: 'warning',
      category: 'ending',
      message: `从节点「${titleOf(id)}」出发无法到达任何结局。`,
      nodeId: id,
      suggestion: '补充通往结局的分支。',
    })
  }

  // 结局
  const endings = adventure.nodes.filter((n) => n.type === NodeType.Ending)
  if (endings.length === 0) {
    issues.push({
      level: 'warning',
      category: 'ending',
      message: '作品没有任何结局节点。',
      suggestion: '至少添加一个结局节点。',
    })
  }

  return { issues, source: 'local' }
}

/* ---------- AI 文本评审 ---------- */

export async function review(
  client: AIClient | null,
  req: ReviewRequest
): Promise<ReviewResponse> {
  if (client && client.isAvailable()) {
    try {
      return await client.review(req)
    } catch {
      // AI 审查失败，回退本地
      return fallbackReview(req)
    }
  }
  return fallbackReview(req)
}

/** 综合审查：本地结构 + 可选 AI 建议 */
export async function reviewAdventure(
  client: AIClient | null,
  adventure: Adventure
): Promise<PlotReviewResult> {
  const local = reviewAdventureLocal(adventure)

  if (!client || !client.isAvailable()) {
    return local
  }

  // 构造剧情摘要供 AI 评审
  const summary = buildPlotSummary(adventure)
  try {
    const res = await client.review({ content: summary })
    return {
      ...local,
      aiSuggestions: res.suggestions,
      source: 'ai',
    }
  } catch {
    // AI 失败不影响本地审查
    return local
  }
}

/** 构造剧情摘要（用于 AI 评审，不含敏感信息） */
function buildPlotSummary(adventure: Adventure): string {
  const lines: string[] = []
  lines.push(`标题：${adventure.meta.title}`)
  lines.push(`简介：${adventure.meta.description || '无'}`)
  lines.push(`节点数：${adventure.nodes.length}，分支数：${adventure.choices.length}`)
  lines.push('---')
  for (const n of adventure.nodes) {
    const typeLabel = { start: '起始', scene: '场景', clue: '线索', puzzle: '谜题', ending: '结局' }[n.type]
    lines.push(`[${typeLabel}] ${n.content.title}`)
    lines.push(n.content.text)
    if (n.content.speaker) lines.push(`说话人：${n.content.speaker}`)
  }
  lines.push('---')
  lines.push('分支：')
  for (const c of adventure.choices) {
    const from = adventure.nodes.find((n) => n.id === c.fromNodeId)?.content.title ?? c.fromNodeId
    const to = adventure.nodes.find((n) => n.id === c.toNodeId)?.content.title ?? c.toNodeId
    lines.push(`「${from}」--${c.label}-->「${to}」`)
  }
  return lines.join('\n')
}
