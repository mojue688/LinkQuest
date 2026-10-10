/**
 * 工厂函数：生成 ID、默认节点、默认作品等。
 */
import {
  type Adventure,
  type Choice,
  type ID,
  type SceneContent,
  type SceneNode,
  EndingKind,
  NodeType,
} from '@/types/adventure'

/** 生成唯一 ID */
export function genId(prefix = 'id'): ID {
  const rnd =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}_${rnd}`
}

/** 默认节点内容 */
export function defaultContent(type: NodeType): SceneContent {
  const map: Record<NodeType, { title: string; text: string }> = {
    [NodeType.Start]: { title: '故事开端', text: '你的冒险从这里开始……' },
    [NodeType.Scene]: { title: '新场景', text: '在此描述场景内容。' },
    [NodeType.Clue]: { title: '发现线索', text: '你发现了一条重要线索。' },
    [NodeType.Puzzle]: { title: '密码谜题', text: '输入正确的密码以继续。' },
    [NodeType.Ending]: { title: '结局', text: '故事到此结束。' },
  }
  return { ...map[type] }
}

/** 创建一个节点 */
export function createNode(
  type: NodeType,
  position: { x: number; y: number },
  partial?: Partial<SceneNode>
): SceneNode {
  const node: SceneNode = {
    id: genId('node'),
    type,
    content: defaultContent(type),
    position,
  }
  if (type === NodeType.Ending) {
    node.endingKind = EndingKind.Neutral
  }
  if (type === NodeType.Puzzle) {
    node.puzzle = {
      answer: '',
      prompt: '请输入密码：',
      hint: '密码不正确，再想一想。',
      maxAttempts: 0,
    }
  }
  return { ...node, ...partial }
}

/** 创建一条选项/边 */
export function createChoice(
  fromNodeId: ID,
  toNodeId: ID,
  label = '继续',
  partial?: Partial<Choice>
): Choice {
  return {
    id: genId('choice'),
    fromNodeId,
    toNodeId,
    label,
    effects: [],
    ...partial,
  }
}

/** 创建一部空白作品（含起始节点与一个结局节点） */
export function createAdventure(title = '未命名冒险'): Adventure {
  const startNode = createNode(NodeType.Start, { x: 80, y: 200 })
  const endNode = createNode(NodeType.Ending, { x: 520, y: 200 })
  endNode.endingKind = EndingKind.Neutral
  endNode.content = { title: '结局', text: '冒险结束。' }
  const now = Date.now()
  return {
    meta: {
      id: genId('adv'),
      title,
      author: '匿名创作者',
      description: '',
      tags: [],
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
    },
    nodes: [startNode, endNode],
    choices: [createChoice(startNode.id, endNode.id, '开始冒险')],
    variables: [],
    items: [],
    characters: [],
    startNodeId: startNode.id,
  }
}

/** 深拷贝（用于避免响应式引用污染） */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
