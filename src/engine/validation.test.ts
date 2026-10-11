import { describe, it, expect } from 'vitest'
import {
  validatePuzzleConfig,
  validateInteractables,
  validateAdventure,
} from './validation'
import { createAdventure, createNode } from '@/utils/factory'
import {
  NodeType,
  PuzzleKind,
  InteractAction,
  type Adventure,
} from '@/types/adventure'

function makeBaseAdventure(): Adventure {
  return createAdventure('测试作品')
}

describe('validatePuzzleConfig', () => {
  it('数字锁谜题缺少位数应产生警告', () => {
    const adv = makeBaseAdventure()
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.NumberLock,
      answer: '123',
      prompt: '请输入密码',
      hint: '错误',
      maxAttempts: 0,
    }
    adv.nodes.push(puzzle)
    const result = validatePuzzleConfig(adv)
    expect(result.issues.some((i) => i.code === 'PUZZLE_NO_DIGITS')).toBe(true)
  })

  it('符号序列谜题缺少符号集应产生警告', () => {
    const adv = makeBaseAdventure()
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.SymbolSequence,
      answer: 'abc',
      prompt: '请输入序列',
      hint: '错误',
      maxAttempts: 0,
    }
    adv.nodes.push(puzzle)
    const result = validatePuzzleConfig(adv)
    expect(result.issues.some((i) => i.code === 'PUZZLE_NO_SYMBOLS')).toBe(true)
  })

  it('图案谜题缺少图案列表应产生警告', () => {
    const adv = makeBaseAdventure()
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.Pattern,
      answer: 'sun',
      prompt: '选择图案',
      hint: '错误',
      maxAttempts: 0,
    }
    adv.nodes.push(puzzle)
    const result = validatePuzzleConfig(adv)
    expect(result.issues.some((i) => i.code === 'PUZZLE_NO_PATTERNS')).toBe(true)
  })

  it('配置完整的谜题不应产生警告', () => {
    const adv = makeBaseAdventure()
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.NumberLock,
      answer: '123',
      prompt: '请输入密码',
      hint: '错误',
      maxAttempts: 0,
      digits: 3,
    }
    adv.nodes.push(puzzle)
    const result = validatePuzzleConfig(adv)
    expect(result.issues.length).toBe(0)
  })
})

describe('validateInteractables', () => {
  it('跳转目标节点不存在应产生警告', () => {
    const adv = makeBaseAdventure()
    const scene = adv.nodes[0]
    scene.interactables = [
      {
        id: 'it1',
        name: '门',
        action: InteractAction.GoToNode,
        target: 'nonexistent_node',
        position: { x: 50, y: 50 },
      },
    ]
    const result = validateInteractables(adv)
    expect(result.issues.some((i) => i.code === 'INTERACT_GOTO')).toBe(true)
  })

  it('收集物品引用未定义的物品应产生警告', () => {
    const adv = makeBaseAdventure()
    const scene = adv.nodes[0]
    scene.interactables = [
      {
        id: 'it1',
        name: '抽屉',
        action: InteractAction.CollectClue,
        target: 'undefined_key',
        position: { x: 50, y: 50 },
      },
    ]
    const result = validateInteractables(adv)
    expect(result.issues.some((i) => i.code === 'INTERACT_ITEM')).toBe(true)
  })

  it('有效的交互物品不应产生警告', () => {
    const adv = makeBaseAdventure()
    const scene = adv.nodes[0]
    const ending = adv.nodes[1]
    adv.items.push({ id: 'item1', key: 'key1', name: '钥匙' })
    scene.interactables = [
      {
        id: 'it1',
        name: '门',
        action: InteractAction.GoToNode,
        target: ending.id,
        position: { x: 50, y: 50 },
      },
      {
        id: 'it2',
        name: '抽屉',
        action: InteractAction.CollectClue,
        target: 'key1',
        position: { x: 30, y: 70 },
      },
    ]
    const result = validateInteractables(adv)
    expect(result.issues.length).toBe(0)
  })
})

describe('validateAdventure (集成)', () => {
  it('合法作品应通过校验', () => {
    const adv = makeBaseAdventure()
    const result = validateAdventure(adv)
    const errors = result.issues.filter((i) => i.level === 'error')
    expect(errors.length).toBe(0)
  })

  it('起始节点不存在应报错', () => {
    const adv = makeBaseAdventure()
    adv.startNodeId = 'nonexistent'
    const result = validateAdventure(adv)
    expect(result.issues.some((i) => i.code === 'NO_START')).toBe(true)
  })

  it('分支指向不存在节点应报错', () => {
    const adv = makeBaseAdventure()
    adv.choices[0].toNodeId = 'nonexistent'
    const result = validateAdventure(adv)
    expect(result.issues.some((i) => i.code === 'CHOICE_TO')).toBe(true)
  })
})
