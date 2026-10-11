import { describe, it, expect } from 'vitest'
import {
  createRuntime,
  getAvailableChoices,
  choose,
  solvePuzzle,
  interactItem,
} from './runtime'
import { createAdventure, createNode, createChoice, genId } from '@/utils/factory'
import {
  NodeType,
  PuzzleKind,
  InteractAction,
  CompareOp,
  VariableType,
  EffectKind,
  type Adventure,
  type ConditionGroup,
  type Condition,
} from '@/types/adventure'

function makeCondition(
  variableKey: string,
  op: CompareOp,
  value: number | string | boolean
): ConditionGroup {
  const cond: Condition = {
    id: genId('cond'),
    variableKey,
    op,
    value,
  }
  return {
    id: genId('cg'),
    logic: 'and',
    items: [cond],
  }
}

function makeAdventureWithConditions(): Adventure {
  const adv = createAdventure('条件测试')
  // 添加变量
  adv.variables.push({
    id: genId('var'),
    key: 'trust',
    name: '信任度',
    type: VariableType.Number,
    defaultValue: 0,
  })
  adv.variables.push({
    id: genId('var'),
    key: 'has_key',
    name: '有钥匙',
    type: VariableType.Boolean,
    defaultValue: false,
  })

  const start = adv.nodes.find((n) => n.type === NodeType.Start)!
  const ending = adv.nodes.find((n) => n.type === NodeType.Ending)!

  // 创建两个分支节点
  const sceneA = createNode(NodeType.Scene, { x: 300, y: 100 })
  sceneA.content = { title: '路径A', text: '信任路线' }
  const sceneB = createNode(NodeType.Scene, { x: 300, y: 300 })
  sceneB.content = { title: '路径B', text: '钥匙路线' }
  adv.nodes.push(sceneA, sceneB)

  // 移除默认选项
  adv.choices = []

  // 选择A：需要 trust >= 1
  const choiceA = createChoice(start.id, sceneA.id, '走信任路线')
  choiceA.condition = makeCondition('trust', CompareOp.Gte, 1)
  adv.choices.push(choiceA)

  // 选择B：需要 has_key == true
  const choiceB = createChoice(start.id, sceneB.id, '用钥匙开门')
  choiceB.condition = makeCondition('has_key', CompareOp.Eq, true)
  adv.choices.push(choiceB)

  // 两条路径都通向结局
  adv.choices.push(createChoice(sceneA.id, ending.id, '继续'))
  adv.choices.push(createChoice(sceneB.id, ending.id, '继续'))

  return adv
}

describe('getAvailableChoices 条件过滤', () => {
  it('变量未满足时不应显示对应选项', () => {
    const adv = makeAdventureWithConditions()
    const ctx = createRuntime(adv)
    // 初始状态：trust=0, has_key=false，两个选项都不满足
    const choices = getAvailableChoices(ctx)
    expect(choices.length).toBe(0)
  })

  it('变量满足后应显示对应选项', () => {
    const adv = makeAdventureWithConditions()
    const ctx = createRuntime(adv)
    // 设置 trust >= 1
    ctx.state.variables['trust'] = 2
    const choices = getAvailableChoices(ctx)
    expect(choices.length).toBe(1)
    expect(choices[0].label).toBe('走信任路线')
  })

  it('多个条件同时满足时应显示多个选项', () => {
    const adv = makeAdventureWithConditions()
    const ctx = createRuntime(adv)
    ctx.state.variables['trust'] = 5
    ctx.state.variables['has_key'] = true
    const choices = getAvailableChoices(ctx)
    expect(choices.length).toBe(2)
  })

  it('物品条件应基于 inventory 判断', () => {
    const adv = createAdventure('物品条件测试')
    const start = adv.nodes.find((n) => n.type === NodeType.Start)!
    const ending = adv.nodes.find((n) => n.type === NodeType.Ending)!
    const scene = createNode(NodeType.Scene, { x: 300, y: 200 })
    adv.nodes.push(scene)
    adv.choices = []
    // 添加变量表示物品
    adv.variables.push({
      id: genId('var'),
      key: 'has_map',
      name: '有地图',
      type: VariableType.Boolean,
      defaultValue: false,
    })
    const choice = createChoice(start.id, scene.id, '使用地图')
    choice.condition = makeCondition('has_map', CompareOp.Eq, true)
    choice.effects = [{ kind: EffectKind.SetFlag, target: 'explored' }]
    adv.choices.push(choice)
    adv.choices.push(createChoice(scene.id, ending.id, '继续'))

    const ctx = createRuntime(adv)
    // 无地图时不可选
    expect(getAvailableChoices(ctx).length).toBe(0)
    // 有地图时可选
    ctx.state.variables['has_map'] = true
    expect(getAvailableChoices(ctx).length).toBe(1)
  })
})

describe('choose 条件二次校验', () => {
  it('条件不满足时应抛出错误', () => {
    const adv = makeAdventureWithConditions()
    const ctx = createRuntime(adv)
    const choices = adv.choices.filter((c) => c.fromNodeId === ctx.state.currentNodeId)
    // 尝试选择条件不满足的选项
    expect(() => choose(ctx, choices[0].id)).toThrow('条件不满足')
  })

  it('条件满足时应正常执行', () => {
    const adv = makeAdventureWithConditions()
    const ctx = createRuntime(adv)
    ctx.state.variables['trust'] = 3
    const choices = getAvailableChoices(ctx)
    const result = choose(ctx, choices[0].id)
    expect(result.node.content.title).toBe('路径A')
  })

  it('不属于当前节点的选项应抛出错误', () => {
    const adv = makeAdventureWithConditions()
    const ctx = createRuntime(adv)
    const wrongChoice = adv.choices.find((c) => c.fromNodeId !== ctx.state.currentNodeId)
    if (wrongChoice) {
      expect(() => choose(ctx, wrongChoice.id)).toThrow('不属于当前节点')
    }
  })
})

describe('solvePuzzle 谜题解答', () => {
  it('文本谜题正确答案应推进剧情', () => {
    const adv = createAdventure('谜题测试')
    const start = adv.nodes.find((n) => n.type === NodeType.Start)!
    const ending = adv.nodes.find((n) => n.type === NodeType.Ending)!
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.Text,
      answer: 'open sesame',
      prompt: '请输入密码',
      hint: '密码错误',
      maxAttempts: 0,
    }
    adv.nodes.push(puzzle)
    adv.choices = []
    adv.choices.push(createChoice(start.id, puzzle.id, '去谜题'))
    adv.choices.push(createChoice(puzzle.id, ending.id, '解谜后'))

    const ctx = createRuntime(adv)
    // 前进到谜题节点
    const firstChoice = getAvailableChoices(ctx)[0]
    choose(ctx, firstChoice.id)
    // 提交正确答案
    const result = solvePuzzle(ctx, 'open sesame')
    expect(result.correct).toBe(true)
    expect(result.result?.node.type).toBe(NodeType.Ending)
  })

  it('图案谜题单选应按图案 ID 判断', () => {
    const adv = createAdventure('图案谜题测试')
    const start = adv.nodes.find((n) => n.type === NodeType.Start)!
    const ending = adv.nodes.find((n) => n.type === NodeType.Ending)!
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.Pattern,
      answer: 'sun',
      prompt: '选择正确的图案',
      hint: '不对',
      maxAttempts: 0,
      patterns: ['sun', 'moon', 'star'],
    }
    adv.nodes.push(puzzle)
    adv.choices = []
    adv.choices.push(createChoice(start.id, puzzle.id, '去谜题'))
    adv.choices.push(createChoice(puzzle.id, ending.id, '完成'))

    const ctx = createRuntime(adv)
    choose(ctx, getAvailableChoices(ctx)[0].id)
    // 单选：提交 "sun"（逗号格式，单个无逗号）
    const result = solvePuzzle(ctx, 'sun')
    expect(result.correct).toBe(true)
  })

  it('图案谜题多选顺序应按逗号分隔判断', () => {
    const adv = createAdventure('图案序列测试')
    const start = adv.nodes.find((n) => n.type === NodeType.Start)!
    const ending = adv.nodes.find((n) => n.type === NodeType.Ending)!
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.Pattern,
      answer: 'sun,moon,star',
      prompt: '按正确顺序选择图案',
      hint: '顺序不对',
      maxAttempts: 0,
      patterns: ['sun', 'moon', 'star', 'cloud'],
    }
    adv.nodes.push(puzzle)
    adv.choices = []
    adv.choices.push(createChoice(start.id, puzzle.id, '去谜题'))
    adv.choices.push(createChoice(puzzle.id, ending.id, '完成'))

    const ctx = createRuntime(adv)
    choose(ctx, getAvailableChoices(ctx)[0].id)
    // 正确顺序
    expect(solvePuzzle(ctx, 'sun,moon,star').correct).toBe(true)
    // 错误顺序
    expect(solvePuzzle(ctx, 'moon,sun,star').correct).toBe(false)
  })

  it('谜题必需物品缺失时应拒绝解答', () => {
    const adv = createAdventure('必需物品测试')
    const start = adv.nodes.find((n) => n.type === NodeType.Start)!
    const ending = adv.nodes.find((n) => n.type === NodeType.Ending)!
    const puzzle = createNode(NodeType.Puzzle, { x: 300, y: 200 })
    puzzle.puzzle = {
      kind: PuzzleKind.Text,
      answer: '4242',
      prompt: '输入密码',
      hint: '错误',
      maxAttempts: 0,
      requiredItems: ['rusty_key'],
    }
    adv.nodes.push(puzzle)
    adv.items.push({ id: genId('item'), key: 'rusty_key', name: '生锈的钥匙' })
    adv.choices = []
    adv.choices.push(createChoice(start.id, puzzle.id, '去谜题'))
    adv.choices.push(createChoice(puzzle.id, ending.id, '完成'))

    const ctx = createRuntime(adv)
    choose(ctx, getAvailableChoices(ctx)[0].id)
    // 没有钥匙时不能解谜
    const result = solvePuzzle(ctx, '4242')
    expect(result.correct).toBe(false)
    expect(result.message).toContain('线索')
    // 获得钥匙后可以解谜
    ctx.state.inventory.push('rusty_key')
    const result2 = solvePuzzle(ctx, '4242')
    expect(result2.correct).toBe(true)
  })
})

describe('interactItem 交互物品', () => {
  it('goto 动作应跳转到目标节点', () => {
    const adv = createAdventure('跳转测试')
    const start = adv.nodes.find((n) => n.type === NodeType.Start)!
    const ending = adv.nodes.find((n) => n.type === NodeType.Ending)!
    start.interactables = [
      {
        id: 'door1',
        name: '门',
        action: InteractAction.GoToNode,
        target: ending.id,
        position: { x: 50, y: 50 },
      },
    ]
    const ctx = createRuntime(adv)
    const result = interactItem(ctx, 'door1')
    expect(result.navigated).toBe(true)
    expect(ctx.state.currentNodeId).toBe(ending.id)
  })

  it('collect 动作应将物品加入背包', () => {
    const adv = createAdventure('收集测试')
    const start = adv.nodes.find((n) => n.type === NodeType.Start)!
    adv.items.push({ id: genId('item'), key: 'key1', name: '钥匙' })
    start.interactables = [
      {
        id: 'drawer1',
        name: '抽屉',
        action: InteractAction.CollectClue,
        target: 'key1',
        position: { x: 30, y: 70 },
      },
    ]
    const ctx = createRuntime(adv)
    const result = interactItem(ctx, 'drawer1')
    expect(result.collected).toBe(true)
    expect(ctx.state.inventory).toContain('key1')
  })
})
