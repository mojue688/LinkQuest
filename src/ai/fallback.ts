/**
 * AI 回退策略
 *
 * 当 AI 不可用（断网 / 无密钥 / 调用失败）时，
 * 提供纯本地的模板生成与规则评审，保证创作流程不中断。
 * 明确标注为「本地模板」，不冒充真实 AI 生成。
 */
import type {
  GenerateBranchRequest,
  GenerateBranchResponse,
  GenerateSceneRequest,
  GenerateSceneResponse,
  ReviewRequest,
  ReviewResponse,
} from '@/ai/types'
import { NodeType, EndingKind, PuzzleKind, InteractAction, type Adventure } from '@/types/adventure'
import { createNode, createChoice, genId } from '@/utils/factory'

/* ---------- 模板定义 ---------- */

export interface AdventureTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  /** 简短的氛围语，用于首页卡片 */
  mood: string
  /** 节点数（展示用） */
  scale: string
  build(): Adventure
}

function meta(title: string, description: string, tags: string[], author = '谜境示例') {
  const now = Date.now()
  return {
    id: genId('adv'),
    title,
    author,
    description,
    tags,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  }
}

/** 模板一：古墓探秘（含线索 + 密码谜题 + 双结局） */
function buildTomb(): Adventure {
  const start = createNode(NodeType.Start, { x: 60, y: 240 })
  start.content = {
    title: '古墓入口',
    text: '夜色中，你站在一座被遗忘的古墓前。石门半掩，冷风从中吹出。你深吸一口气，走了进去。',
    background: 'bg:tomb',
    atmosphere: '夜色 · 冷风',
  }
  const scene = createNode(NodeType.Scene, { x: 300, y: 240 })
  scene.content = {
    title: '幽暗墓道',
    text: '墓道狭长，墙壁上刻着古老符文。前方有一扇刻有数字密码的石门，墙壁凹槽里隐约可见一行刻字。',
    speaker: '旁白',
    background: 'bg:tomb',
    atmosphere: '幽暗 · 符文闪烁',
  }
  const clue = createNode(NodeType.Clue, { x: 540, y: 80 })
  clue.content = {
    title: '刻字墙壁',
    text: '你凑近观察，墙上刻着：「四二四二，轮回之数。」似乎是一组密码。',
  }
  clue.clueItemKey = 'tomb_code'
  const puzzle = createNode(NodeType.Puzzle, { x: 540, y: 400 })
  puzzle.content = {
    title: '密码石门',
    text: '石门上有一个四位数密码盘。输入正确的密码才能打开。',
  }
  puzzle.puzzle = {
    kind: PuzzleKind.NumberLock,
    answer: '4242',
    prompt: '请输入四位密码：',
    hint: '密码不正确。回想一下墙上的刻字……',
    maxAttempts: 0,
    digits: 4,
    title: '密码石门',
  }
  const good = createNode(NodeType.Ending, { x: 800, y: 400 })
  good.endingKind = EndingKind.Good
  good.content = {
    title: '宝藏之室',
    text: '石门缓缓打开，金光涌出。你找到失落的宝藏，平安离开古墓。',
  }
  const bad = createNode(NodeType.Ending, { x: 800, y: 80 })
  bad.endingKind = EndingKind.Bad
  bad.content = {
    title: '陷阱触发',
    text: '你贸然乱按密码，触发机关。墓道坍塌，你被困其中……',
  }
  return {
    meta: meta('古墓探秘', '一座古墓，一道密码，一段冒险。', ['示例', '谜题']),
    nodes: [start, scene, clue, puzzle, good, bad],
    choices: [
      createChoice(start.id, scene.id, '进入墓道'),
      createChoice(scene.id, clue.id, '查看墙壁刻字'),
      createChoice(scene.id, puzzle.id, '走向密码石门'),
      createChoice(clue.id, puzzle.id, '回到石门前'),
      createChoice(puzzle.id, good.id, '推门而入'),
      createChoice(scene.id, bad.id, '乱按密码盘'),
    ],
    variables: [],
    items: [{ id: genId('item'), key: 'tomb_code', name: '墙上刻字（4242）', icon: 'item:note' }],
    characters: [],
    startNodeId: start.id,
  }
}

/** 模板二：密室逃脱（线性流程） */
function buildEscape(): Adventure {
  const start = createNode(NodeType.Start, { x: 80, y: 240 })
  start.content = {
    title: '醒来',
    text: '你在一间陌生的密室中醒来，头痛欲裂。房间里只有一张桌子和一扇锁着的门。',
    background: 'bg:default',
    atmosphere: '迷茫 · 头痛',
  }
  const clue = createNode(NodeType.Clue, { x: 320, y: 240 })
  clue.content = {
    title: '桌上纸条',
    text: '桌上有一张泛黄的纸条，写着：「出口的密码是 1234。」',
  }
  clue.clueItemKey = 'paper_note'
  const puzzle = createNode(NodeType.Puzzle, { x: 560, y: 240 })
  puzzle.content = {
    title: '门锁',
    text: '门上有一个电子密码锁。输入密码即可打开。',
  }
  puzzle.puzzle = {
    kind: PuzzleKind.NumberLock,
    answer: '1234',
    prompt: '请输入密码：',
    hint: '密码错误。看看桌上有没有线索。',
    maxAttempts: 0,
    digits: 4,
    title: '门锁',
  }
  const good = createNode(NodeType.Ending, { x: 800, y: 240 })
  good.endingKind = EndingKind.Good
  good.content = { title: '逃出生天', text: '门锁「咔嗒」一声打开。你推门而出，重见天日。' }
  return {
    meta: meta('密室逃脱', '一张纸条，一把锁，一次逃脱。', ['示例', '线性']),
    nodes: [start, clue, puzzle, good],
    choices: [
      createChoice(start.id, clue.id, '查看桌子'),
      createChoice(clue.id, puzzle.id, '走向门锁'),
      createChoice(puzzle.id, good.id, '开门逃离'),
    ],
    variables: [],
    items: [{ id: genId('item'), key: 'paper_note', name: '纸条（密码1234）', icon: 'item:note' }],
    characters: [],
    startNodeId: start.id,
  }
}

/** 模板三：暗夜古堡（多分支） */
function buildManor(): Adventure {
  const start = createNode(NodeType.Start, { x: 80, y: 260 })
  start.content = {
    title: '古堡门前',
    text: '雷雨之夜，你来到传说中的暗夜古堡。大门敞开，大厅里左右各有一扇门。',
    background: 'bg:hall',
    atmosphere: '雷雨 · 古堡',
  }
  const hall = createNode(NodeType.Scene, { x: 320, y: 260 })
  hall.content = {
    title: '古堡大厅',
    text: '大厅中央吊灯摇曳。左边门通向书房，右边门通向地下室。',
    speaker: '旁白',
    background: 'bg:hall',
    atmosphere: '吊灯摇曳',
  }
  const study = createNode(NodeType.Scene, { x: 560, y: 120 })
  study.content = {
    title: '书房',
    text: '书房里有一幅画像，画像后面似乎有东西。书桌上有一本日记。',
  }
  const clue = createNode(NodeType.Clue, { x: 800, y: 60 })
  clue.content = {
    title: '画像后的暗格',
    text: '你移开画像，发现一个暗格，里面有一把刻着「7」的钥匙和一张纸条：「暗门密码是 1137」。',
  }
  clue.clueItemKey = 'manor_key'
  const puzzle = createNode(NodeType.Puzzle, { x: 800, y: 220 })
  puzzle.content = {
    title: '书房暗门',
    text: '书架后有一扇暗门，上面有一个密码锁。',
  }
  puzzle.puzzle = {
    kind: PuzzleKind.NumberLock,
    answer: '1137',
    prompt: '请输入暗门密码：',
    hint: '密码不对。再找找线索。',
    maxAttempts: 0,
    digits: 4,
    title: '书房暗门',
  }
  const secret = createNode(NodeType.Ending, { x: 1040, y: 220 })
  secret.endingKind = EndingKind.Secret
  secret.content = {
    title: '隐藏密室',
    text: '暗门打开，你发现了古堡主人留下的真相与一笔巨额财富。',
  }
  const cellar = createNode(NodeType.Scene, { x: 560, y: 420 })
  cellar.content = {
    title: '地下室',
    text: '地下室阴冷潮湿。你一脚踩空，掉进了陷阱……',
  }
  const bad = createNode(NodeType.Ending, { x: 800, y: 420 })
  bad.endingKind = EndingKind.Bad
  bad.content = { title: '困于地下', text: '你无法爬出陷阱，成为古堡又一个失踪者。' }
  return {
    meta: meta('暗夜古堡', '雷雨夜，古堡中藏着不为人知的秘密。', ['示例', '多分支']),
    nodes: [start, hall, study, clue, puzzle, secret, cellar, bad],
    choices: [
      createChoice(start.id, hall.id, '进入大厅'),
      createChoice(hall.id, study.id, '走左边去书房'),
      createChoice(hall.id, cellar.id, '走右边去地下室'),
      createChoice(study.id, clue.id, '查看画像'),
      createChoice(clue.id, puzzle.id, '检查书架暗门'),
      createChoice(puzzle.id, secret.id, '进入暗门'),
      createChoice(cellar.id, bad.id, '继续探索'),
    ],
    variables: [],
    items: [{ id: genId('item'), key: 'manor_key', name: '刻着7的钥匙', icon: 'item:key' }],
    characters: [],
    startNodeId: start.id,
  }
}

/** 模板四：午夜教学楼（悬疑解谜 + 值班室探索 + 线索矛盾 + 三结局） */
function buildMidnight(): Adventure {
  const start = createNode(NodeType.Start, { x: 60, y: 280 })
  start.content = {
    title: '午夜的走廊',
    text: '凌晨两点，你因加班误入教学楼顶层。走廊尽头，一扇门牌写着「413」——可这栋楼只有四层，根本没有 413 教室。门却虚掩着，里面透出微弱的光。',
    background: 'bg:corridor',
    atmosphere: '阴冷 · 寂静',
    characterId: 'char:student',
    dialogue: '……413？这栋楼根本没有这一层。那边好像是值班室。',
  }
  start.interactables = [
    {
      id: genId('it'),
      name: '门牌 413',
      icon: 'item:door',
      position: { x: 50, y: 35 },
      size: 52,
      description: '门牌上刻着「413」，油漆斑驳。',
      action: InteractAction.Inspect,
      revealText: '门牌上刻着「413」，油漆斑驳。门虚掩着，从门缝里透出惨白的光。你隐约听到里面有钟摆的声音。',
    },
    {
      id: genId('it'),
      name: '走廊荧光灯',
      icon: 'item:switch',
      position: { x: 50, y: 8 },
      size: 40,
      description: '头顶的荧光灯闪烁不定。',
      action: InteractAction.Inspect,
      revealText: '惨白的荧光灯闪烁不定，发出细微的嗡嗡声。每次闪烁，走廊似乎都变了一个样子。',
    },
    {
      id: genId('it'),
      name: '值班室',
      icon: 'item:door',
      position: { x: 15, y: 50 },
      size: 48,
      description: '走廊另一侧的门上挂着「值班室」牌子。',
      action: InteractAction.GoToNode,
      revealText: '你推开值班室的门，里面空无一人，但台灯还亮着。',
    },
  ]

  const guardroom = createNode(NodeType.Scene, { x: 60, y: 100 })
  guardroom.content = {
    title: '值班室',
    text: '值班室里空无一人，桌上的台灯还亮着，茶杯里的茶还温热——值班的人离开不久。墙上贴着一张值班表。',
    speaker: '旁白',
    background: 'bg:guardroom',
    atmosphere: '不安 · 线索',
    characterId: 'char:student',
    dialogue: '人都去哪了？茶还温的……看看值班表。',
  }
  guardroom.interactables = [
    {
      id: genId('it'),
      name: '值班表',
      icon: 'item:poster',
      position: { x: 25, y: 40 },
      size: 52,
      description: '墙上贴着值班表。',
      action: InteractAction.CollectClue,
      target: 'duty_log',
      revealText: '值班表上，02:00 那栏写着「???  413?」，笔迹潦草，像是匆忙写下的。旁边的 01:00 和 03:00 都是「空岗」。',
      once: true,
    },
    {
      id: genId('it'),
      name: '台灯下的便条',
      icon: 'item:note',
      position: { x: 25, y: 68 },
      size: 48,
      description: '台灯下压着一张便条，墨迹未干。',
      action: InteractAction.CollectClue,
      target: 'guard_note',
      revealText: '「别去 413。那间教室不该存在。如果你已经进去了——记住，别信黑板。」便条下面署名是值班张师傅。',
      once: true,
    },
    {
      id: genId('it'),
      name: '文件柜',
      icon: 'item:drawer',
      position: { x: 75, y: 45 },
      size: 48,
      description: '一个铁皮文件柜。',
      action: InteractAction.Inspect,
      revealText: '文件柜上了锁，打不开。柜门上贴着「413 专用」的标签，字迹和值班表上的一样。',
    },
    {
      id: genId('it'),
      name: '茶杯',
      icon: 'item:book',
      position: { x: 25, y: 85 },
      size: 36,
      description: '桌上的茶杯。',
      action: InteractAction.Inspect,
      revealText: '茶还温热，值班的人离开不超过十分钟。可值班表上写着这个时段是空岗……',
    },
  ]

  const hall = createNode(NodeType.Scene, { x: 300, y: 280 })
  hall.content = {
    title: '不存在的教室',
    text: '推门而入，教室里桌椅整齐，黑板上写满公式。窗外应是操场，此刻却是一片浓雾。门在你身后无声合上。',
    speaker: '旁白',
    background: 'bg:classroom',
    atmosphere: '诡异 · 雾气弥漫',
    characterId: 'char:student',
    dialogue: '桌椅、黑板、挂钟……还有后门。得找找线索。',
  }
  hall.interactables = [
    {
      id: genId('it'),
      name: '黑板',
      icon: 'item:board',
      position: { x: 50, y: 18 },
      size: 56,
      description: '黑板上写满了公式，角落里有一行小字……',
      action: InteractAction.CollectClue,
      target: 'blackboard_note',
      revealText: '黑板角落有一行小字，像是用指甲刻下的：「出口在钟声里。四下钟响，方可离去。密码是这间教室的门牌倒写。」门牌倒写……413 倒过来是 314？',
      once: true,
    },
    {
      id: genId('it'),
      name: '讲台抽屉',
      icon: 'item:drawer',
      position: { x: 50, y: 72 },
      size: 48,
      description: '讲台下面的抽屉，似乎可以拉开。',
      action: InteractAction.CollectClue,
      target: 'desk_note',
      revealText: '你翻看讲台抽屉，找到一张皱巴巴的纸条：「别信黑板。真正的出口在第三声钟响时，从后门离开。密码是 0413。」',
      once: true,
    },
    {
      id: genId('it'),
      name: '挂钟',
      icon: 'item:clock',
      position: { x: 86, y: 15 },
      size: 44,
      description: '墙上的挂钟，指针缓缓走动。',
      action: InteractAction.RevealText,
      revealText: '挂钟指向凌晨两点四十分。钟声随时可能响起……你需要在正确的钟响时离开。',
    },
    {
      id: genId('it'),
      name: '窗户',
      icon: 'item:window',
      position: { x: 12, y: 35 },
      size: 44,
      description: '窗外浓雾翻涌。',
      action: InteractAction.Inspect,
      revealText: '窗外浓雾翻涌，隐约能看到操场上有什么东西在动……还是看花眼了？雾气中似乎有一个人影。',
    },
    {
      id: genId('it'),
      name: '后门',
      icon: 'item:door',
      position: { x: 88, y: 68 },
      size: 52,
      description: '后门上有一个四位密码锁。',
      action: InteractAction.GoToNode,
      revealText: '你走到后门前，密码锁上有四个拨盘。需要输入四位数字。',
    },
  ]

  const puzzle = createNode(NodeType.Puzzle, { x: 600, y: 280 })
  puzzle.content = {
    title: '后门的密码锁',
    text: '后门上有一个四位密码锁。墙上挂钟的指针缓缓走动，钟声即将响起。你必须在某次钟响时输入正确的密码。',
    background: 'bg:lock_closeup',
    atmosphere: '紧张 · 钟声将至',
    characterId: 'char:student',
    dialogue: '两条纸条说法矛盾……值班张师傅说别信黑板，那应该信抽屉纸条？',
  }
  puzzle.puzzle = {
    kind: PuzzleKind.NumberLock,
    answer: '0413',
    prompt: '旋转拨盘输入四位密码',
    hint: '密码不正确。两条线索说法矛盾——黑板说 314，抽屉纸条说 0413。值班大爷的便条说「别信黑板」。',
    maxAttempts: 0,
    digits: 4,
    title: '后门密码锁',
    requiredItems: ['blackboard_note', 'desk_note'],
    story: '黑板刻字说密码是门牌倒写（314），讲台纸条说密码是 0413。值班大爷的便条警告「别信黑板」。该信哪一个？',
  }
  if (hall.interactables && hall.interactables.length >= 5) {
    hall.interactables[4].target = puzzle.id
  }
  if (start.interactables && start.interactables.length >= 3) {
    start.interactables[2].target = guardroom.id
  }

  const good = createNode(NodeType.Ending, { x: 860, y: 180 })
  good.endingKind = EndingKind.Good
  good.content = {
    title: '第三声钟响',
    text: '你在第三声钟响时输入 0413，后门应声而开。浓雾散去，你回到了熟悉的走廊，天将破晓。值班室的灯灭了，茶杯已凉。',
    background: 'bg:ending_dawn',
    atmosphere: '破晓',
  }

  const neutral = createNode(NodeType.Ending, { x: 860, y: 340 })
  neutral.endingKind = EndingKind.Neutral
  neutral.content = {
    title: '第四声钟响',
    text: '你等到第四声钟响才离开。门开了，可你发现自己来到了另一个一模一样的 413 教室，循环开始了。黑板上又出现了那行小字……',
    background: 'bg:ending_loop',
    atmosphere: '循环',
  }

  const bad = createNode(NodeType.Ending, { x: 600, y: 480 })
  bad.endingKind = EndingKind.Bad
  bad.content = {
    title: '错误的密码',
    text: '你输入了黑板上的密码 314，门纹丝不动。钟声停了，教室里的桌椅开始缓缓转向你，黑板上的小字正在消失……',
    background: 'bg:ending_dark',
    atmosphere: '绝望',
  }

  return {
    meta: meta('午夜教学楼', '一间不存在的教室，两次矛盾的钟声，三个结局。', ['示例', '悬疑', '多结局']),
    nodes: [start, guardroom, hall, puzzle, good, neutral, bad],
    choices: [
      createChoice(start.id, hall.id, '推门进入 413'),
      createChoice(guardroom.id, start.id, '返回走廊'),
      createChoice(puzzle.id, good.id, '第三声钟响时输入'),
      createChoice(puzzle.id, neutral.id, '第四声钟响时输入'),
      createChoice(puzzle.id, bad.id, '输入黑板密码 314'),
    ],
    variables: [],
    items: [
      { id: genId('item'), key: 'blackboard_note', name: '黑板留言', icon: 'item:board', examineText: '黑板角落用指甲刻下的文字：「出口在钟声里。四下钟响，方可离去。密码是这间教室的门牌倒写。」门牌 413 倒写是 314。' },
      { id: genId('item'), key: 'desk_note', name: '抽屉纸条', icon: 'item:note', examineText: '皱巴巴的纸条：「别信黑板。真正的出口在第三声钟响时，从后门离开。密码是 0413。」' },
      { id: genId('item'), key: 'duty_log', name: '值班表记录', icon: 'item:poster', examineText: '02:00 那栏写着「???  413?」，笔迹潦草。01:00 和 03:00 都是空岗。值班张师傅似乎发现了什么。' },
      { id: genId('item'), key: 'guard_note', name: '值班大爷便条', icon: 'item:note', examineText: '「别去 413。那间教室不该存在。如果你已经进去了——记住，别信黑板。」署名：张师傅。' },
    ],
    characters: [],
    startNodeId: start.id,
  }
}

/** 内置模板列表 */
export const adventureTemplates: AdventureTemplate[] = [
  {
    id: 'midnight',
    name: '午夜教学楼',
    description: '一间不存在的教室，两次矛盾的线索，三个结局。',
    tags: ['悬疑', '多结局', '线索'],
    mood: '凌晨两点的走廊尽头，一扇不该存在的门。',
    scale: '8 节点 · 3 结局',
    build: buildMidnight,
  },
  {
    id: 'manor',
    name: '暗夜古堡',
    description: '雷雨夜的古堡，多分支探索，隐藏结局。',
    tags: ['冒险', '多分支', '隐藏结局'],
    mood: '吊灯摇曳，左书房，右地下室。',
    scale: '8 节点 · 2 结局',
    build: buildManor,
  },
  {
    id: 'tomb',
    name: '古墓探秘',
    description: '线索 + 密码谜题 + 双结局，适合入门。',
    tags: ['谜题', '密码', '入门'],
    mood: '夜色中的古墓，石门半掩。',
    scale: '6 节点 · 2 结局',
    build: buildTomb,
  },
  {
    id: 'escape',
    name: '密室逃脱',
    description: '线性流程，一张纸条一把锁。',
    tags: ['线性', '谜题', '入门'],
    mood: '陌生的密室，头痛欲裂。',
    scale: '4 节点 · 1 结局',
    build: buildEscape,
  },
]

/** 根据模板 id 生成草稿 */
export function generateFromTemplate(id: string): Adventure | null {
  const tpl = adventureTemplates.find((t) => t.id === id)
  return tpl ? tpl.build() : null
}

/* ---------- 本地回退生成（明确标注为模板，非真实 AI） ---------- */

export function fallbackGenerateScene(
  req: GenerateSceneRequest
): GenerateSceneResponse {
  return {
    title: '示例场景',
    text: `（本地模板生成）基于提示「${req.prompt}」生成的占位场景内容，可在此基础上继续编辑。此为离线回退，非真实 AI 产出。`,
  }
}

export function fallbackGenerateBranch(
  _req: GenerateBranchRequest
): GenerateBranchResponse {
  return {
    choices: [
      { label: '继续探索', description: '示例分支' },
      { label: '返回', description: '示例分支' },
    ],
  }
}

export function fallbackReview(req: ReviewRequest): ReviewResponse {
  const len = req.content.length
  return {
    score: len > 20 ? 7 : 4,
    suggestions:
      len < 20
        ? ['内容较短，建议补充场景描写。']
        : ['结构基本完整，可考虑增加分支。'],
  }
}
