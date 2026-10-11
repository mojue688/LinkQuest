import { describe, it, expect } from 'vitest'
import { normalizeAIStory, convertToAdventure } from './generator'
import { NodeType, PuzzleKind, InteractAction } from '@/types/adventure'
import type { AIStory } from './types'

describe('normalizeAIStory', () => {
  it('应在结局不足时补足到请求数量', () => {
    const raw = {
      title: '测试',
      description: '描述',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
      ],
      choices: [{ from: 'n1', to: 'n2', label: '去' }],
    }
    const story = normalizeAIStory(raw, 3)
    const endings = story.nodes.filter((n) => n.type === 'ending')
    expect(endings.length).toBe(3)
  })

  it('应在无结局时补足到请求数量', () => {
    const raw = {
      title: '测试',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
      ],
      choices: [{ from: 'n1', to: 'n2', label: '去' }],
    }
    const story = normalizeAIStory(raw, 2)
    const endings = story.nodes.filter((n) => n.type === 'ending')
    expect(endings.length).toBe(2)
  })

  it('应确保起始节点唯一', () => {
    const raw = {
      title: '测试',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始1', text: '开始1' },
        { id: 'n2', type: 'start', title: '开始2', text: '开始2' },
        { id: 'n3', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n1', to: 'n3', label: '去' },
        { from: 'n2', to: 'n3', label: '去' },
      ],
    }
    const story = normalizeAIStory(raw, 1)
    const starts = story.nodes.filter((n) => n.type === 'start')
    expect(starts.length).toBe(1)
    expect(starts[0].id).toBe('n1')
    // n2 应被改为 scene
    const n2 = story.nodes.find((n) => n.id === 'n2')
    expect(n2?.type).toBe('scene')
  })

  it('应确保所有结局从 start 可达', () => {
    const raw = {
      title: '测试',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
        { id: 'n3', type: 'ending', title: '结局1', text: '结局1', endingKind: 'good' },
        { id: 'n4', type: 'ending', title: '结局2', text: '结局2', endingKind: 'bad' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '去' },
        { from: 'n2', to: 'n3', label: '好结局' },
        // n4 不可达：没有连接
      ],
    }
    const story = normalizeAIStory(raw, 2)
    // n4 应被连接到某个可达节点
    const hasPathToN4 = story.choices.some((c) => c.to === 'n4')
    expect(hasPathToN4).toBe(true)
  })

  it('应过滤指向不存在节点的分支', () => {
    const raw = {
      title: '测试',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        { id: 'n2', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '有效' },
        { from: 'n1', to: 'nonexistent', label: '无效' },
        { from: 'nonexistent', to: 'n2', label: '无效2' },
      ],
    }
    const story = normalizeAIStory(raw, 1)
    expect(story.choices.length).toBe(1)
    expect(story.choices[0].to).toBe('n2')
  })

  it('应读取 puzzlePatterns 字段', () => {
    const raw = {
      title: '测试',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        {
          id: 'n2',
          type: 'puzzle',
          title: '图案谜题',
          text: '选择正确图案',
          puzzleKind: 'pattern',
          puzzleAnswer: 'sun',
          puzzlePatterns: ['sun', 'moon', 'star'],
        },
        { id: 'n3', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '去' },
        { from: 'n2', to: 'n3', label: '解谜后' },
      ],
    }
    const story = normalizeAIStory(raw, 1)
    const puzzle = story.nodes.find((n) => n.id === 'n2')
    expect(puzzle?.puzzlePatterns).toEqual(['sun', 'moon', 'star'])
  })

  it('空对象应抛出异常', () => {
    expect(() => normalizeAIStory(null, 3)).toThrow()
    expect(() => normalizeAIStory({}, 3)).toThrow()
  })

  it('无节点应抛出异常', () => {
    expect(() => normalizeAIStory({ title: 'x', nodes: [] }, 3)).toThrow()
  })
})

describe('convertToAdventure', () => {
  it('应将 puzzlePatterns 映射到 PuzzleConfig.patterns', () => {
    const story: AIStory = {
      title: '测试',
      description: '描述',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        {
          id: 'n2',
          type: 'puzzle',
          title: '图案谜题',
          text: '选择图案',
          puzzleKind: 'pattern',
          puzzleAnswer: 'sun',
          puzzlePatterns: ['sun', 'moon'],
        },
        { id: 'n3', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '去' },
        { from: 'n2', to: 'n3', label: '完成' },
      ],
    }
    const adv = convertToAdventure(story)
    const puzzleNode = adv.nodes.find((n) => n.type === NodeType.Puzzle)
    expect(puzzleNode?.puzzle?.kind).toBe(PuzzleKind.Pattern)
    expect(puzzleNode?.puzzle?.patterns).toEqual(['sun', 'moon'])
  })

  it('BFS 分层布局应将 start 放在第一列', () => {
    const story: AIStory = {
      title: '测试',
      description: '描述',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
        { id: 'n3', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '去' },
        { from: 'n2', to: 'n3', label: '结束' },
      ],
    }
    const adv = convertToAdventure(story)
    const start = adv.nodes.find((n) => n.type === NodeType.Start)
    const scene = adv.nodes.find((n) => n.type === NodeType.Scene)
    const ending = adv.nodes.find((n) => n.type === NodeType.Ending)
    expect(start!.position.x).toBeLessThan(scene!.position.x)
    expect(scene!.position.x).toBeLessThan(ending!.position.x)
  })
})

describe('normalizeAIStory ID 碰撞防护', () => {
  it('AI 返回 n_start 节点时补充起始节点不应碰撞', () => {
    const raw = {
      title: '测试',
      startNodeId: 'n_start',
      nodes: [
        { id: 'n_start', type: 'start', title: '开始', text: '开始' },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
        { id: 'n_end_1', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n_start', to: 'n2', label: '去' },
        { from: 'n2', to: 'n_end_1', label: '结束' },
      ],
    }
    const story = normalizeAIStory(raw, 1)
    const ids = story.nodes.map((n) => n.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
  })

  it('AI 返回 n_end_1 节点时补充结局不应碰撞', () => {
    const raw = {
      title: '测试',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
        { id: 'n_end_1', type: 'scene', title: '已有节点', text: '已有' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '去' },
        { from: 'n2', to: 'n_end_1', label: '去' },
      ],
    }
    const story = normalizeAIStory(raw, 2)
    const ids = story.nodes.map((n) => n.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
    const endings = story.nodes.filter((n) => n.type === 'ending')
    expect(endings.length).toBeGreaterThanOrEqual(2)
  })

  it('所有节点 ID 应唯一', () => {
    const raw = {
      title: '测试',
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', type: 'start', title: '开始', text: '开始' },
        { id: 'n1', type: 'scene', title: '重复ID', text: '重复' },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
      ],
      choices: [{ from: 'n1', to: 'n2', label: '去' }],
    }
    const story = normalizeAIStory(raw, 1)
    const ids = story.nodes.map((n) => n.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
  })
})

describe('convertToAdventure 交互目标映射', () => {
  it('goto 动作的 target 应转换为真实节点 ID', () => {
    const story: AIStory = {
      title: '测试',
      description: '描述',
      startNodeId: 'n1',
      nodes: [
        {
          id: 'n1',
          type: 'start',
          title: '开始',
          text: '开始',
          interactables: [
            {
              id: 'door1',
              name: '门',
              action: 'goto',
              target: 'n3',
              position: { x: 50, y: 50 },
            },
          ],
        },
        { id: 'n2', type: 'scene', title: '场景', text: '场景' },
        { id: 'n3', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '去' },
        { from: 'n2', to: 'n3', label: '结束' },
      ],
    }
    const adv = convertToAdventure(story)
    const startNode = adv.nodes.find((n) => n.type === NodeType.Start)
    const endingNode = adv.nodes.find((n) => n.type === NodeType.Ending)
    const interactable = startNode?.interactables?.[0]
    expect(interactable?.action).toBe(InteractAction.GoToNode)
    expect(interactable?.target).toBe(endingNode?.id)
    expect(interactable?.target).not.toBe('n3')
  })

  it('puzzle 动作的 target 应转换为真实节点 ID', () => {
    const story: AIStory = {
      title: '测试',
      description: '描述',
      startNodeId: 'n1',
      nodes: [
        {
          id: 'n1',
          type: 'start',
          title: '开始',
          text: '开始',
          interactables: [
            {
              id: 'lock1',
              name: '锁',
              action: 'puzzle',
              target: 'n2',
              position: { x: 50, y: 50 },
            },
          ],
        },
        {
          id: 'n2',
          type: 'puzzle',
          title: '谜题',
          text: '输入密码',
          puzzleAnswer: '1234',
        },
        { id: 'n3', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [
        { from: 'n1', to: 'n2', label: '去' },
        { from: 'n2', to: 'n3', label: '完成' },
      ],
    }
    const adv = convertToAdventure(story)
    const startNode = adv.nodes.find((n) => n.type === NodeType.Start)
    const puzzleNode = adv.nodes.find((n) => n.type === NodeType.Puzzle)
    const interactable = startNode?.interactables?.[0]
    expect(interactable?.action).toBe(InteractAction.OpenPuzzle)
    expect(interactable?.target).toBe(puzzleNode?.id)
    expect(interactable?.target).not.toBe('n2')
  })

  it('collect 动作的 target 应保持为物品 key', () => {
    const story: AIStory = {
      title: '测试',
      description: '描述',
      startNodeId: 'n1',
      nodes: [
        {
          id: 'n1',
          type: 'start',
          title: '开始',
          text: '开始',
          interactables: [
            {
              id: 'drawer1',
              name: '抽屉',
              action: 'collect',
              target: 'rusty_key',
              position: { x: 30, y: 70 },
            },
          ],
        },
        { id: 'n2', type: 'ending', title: '结局', text: '结局', endingKind: 'good' },
      ],
      choices: [{ from: 'n1', to: 'n2', label: '去' }],
      items: [{ key: 'rusty_key', name: '生锈的钥匙' }],
    }
    const adv = convertToAdventure(story)
    const startNode = adv.nodes.find((n) => n.type === NodeType.Start)
    const interactable = startNode?.interactables?.[0]
    expect(interactable?.action).toBe(InteractAction.CollectClue)
    expect(interactable?.target).toBe('rusty_key')
  })
})
