/**
 * 谜境 LinkQuest —— 冒险作品核心类型定义
 */

/* ===================== 基础枚举 ===================== */

/** 节点类型：决定一个场景节点在流程图中的语义 */
export enum NodeType {
  Start = 'start',
  Scene = 'scene',
  Clue = 'clue',
  Puzzle = 'puzzle',
  Ending = 'ending',
}

/** 结局类型 */
export enum EndingKind {
  Good = 'good',
  Neutral = 'neutral',
  Bad = 'bad',
  Secret = 'secret',
}

/** 变量值类型 */
export enum VariableType {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
}

/** 条件比较运算符 */
export enum CompareOp {
  Eq = '==',
  NotEq = '!=',
  Gt = '>',
  Gte = '>=',
  Lt = '<',
  Lte = '<=',
}

/** 效果动作类型：选项触发后修改游戏状态 */
export enum EffectKind {
  SetVariable = 'set_variable',
  AddNumber = 'add_number',
  GiveItem = 'give_item',
  RemoveItem = 'remove_item',
  SetFlag = 'set_flag',
}

/** 场景内可交互物品的交互动作类型 */
export enum InteractAction {
  Inspect = 'inspect',
  CollectClue = 'collect',
  GiveItem = 'give',
  OpenPuzzle = 'puzzle',
  GoToNode = 'goto',
  RevealText = 'reveal',
}

/** 谜题类型 */
export enum PuzzleKind {
  Text = 'text',
  NumberLock = 'number_lock',
  SymbolSequence = 'symbol_sequence',
  Pattern = 'pattern',
}

/** AI 能力类型 */
export enum AICapability {
  GenerateScene = 'generate_scene',
  GenerateBranch = 'generate_branch',
  ReviewPlot = 'review_plot',
  SuggestEnding = 'suggest_ending',
}

/* ===================== 基础结构 ===================== */

export type ID = string

/** 变量定义 */
export interface Variable {
  id: ID
  key: string
  name: string
  type: VariableType
  defaultValue: number | string | boolean
  description?: string
}

/** 物品 / 线索 */
export interface Item {
  id: ID
  key: string
  name: string
  description?: string
  icon?: string
  /** 详细调查文本（物品栏中点击查看时显示） */
  examineText?: string
  /** 特写图素材 ID 或 URL（详情面板中显示） */
  closeup?: string
}

/** 角色 */
export interface Character {
  id: ID
  name: string
  avatar?: string
  description?: string
  traits?: string[]
}

/** 条件表达式 */
export interface Condition {
  id: ID
  variableKey: string
  op: CompareOp
  value: number | string | boolean
}

/** 复合条件 */
export interface ConditionGroup {
  id: ID
  logic: 'and' | 'or'
  items: Array<Condition | ConditionGroup>
}

/** 效果 */
export interface Effect {
  kind: EffectKind
  target?: string
  value?: number | string | boolean
}

/** 选项 / 分支：连接两个节点的边 */
export interface Choice {
  id: ID
  fromNodeId: ID
  toNodeId: ID
  label: string
  description?: string
  condition?: ConditionGroup
  effects: Effect[]
}

/** 场景节点内容 */
export interface SceneContent {
  title: string
  text: string
  speaker?: string
  image?: string
  /** 场景背景素材 ID（如 'bg:corridor'）或外部 URL */
  background?: string
  /** 场景氛围描述（如"阴冷"、"寂静"），用于 UI 氛围提示 */
  atmosphere?: string
  /** 角色立绘素材 ID（如 'char:student'）或外部 URL */
  characterId?: string
  /** 角色对白（有立绘时显示在对话框中） */
  dialogue?: string
}

/** 场景内可交互物品（门、抽屉、黑板、时钟等） */
export interface Interactable {
  id: ID
  /** 显示名称 */
  name: string
  /** 物品图标素材 ID（如 'item:door'）或外部 URL */
  icon?: string
  /** 在场景中的位置（百分比 0-100，相对场景背景区域） */
  position: { x: number; y: number }
  /** 热点尺寸（像素），默认 48 */
  size?: number
  /** 查看详情时的描述文本 */
  description?: string
  /** 交互动作 */
  action: InteractAction
  /** 动作目标：collect/give 时为物品 key；puzzle 时为节点上的谜题标识；goto 时为目标节点 ID */
  target?: string
  /** 显示条件（满足时才在场景中显示该物品） */
  condition?: ConditionGroup
  /** 交互后显示的文本（reveal 动作或 inspect 附加文本） */
  revealText?: string
  /** 一次性交互：交互后该物品不再可点击 */
  once?: boolean
  /** 特写图素材 ID 或外部 URL（调查详情面板中显示大图） */
  closeup?: string
}

/** 密码谜题配置（仅 Puzzle 节点） */
export interface PuzzleConfig {
  /** 谜题类型，默认 text */
  kind?: PuzzleKind
  answer: string
  prompt: string
  hint: string
  maxAttempts: number
  /** 数字锁：位数（如 3 表示三位数密码） */
  digits?: number
  /** 符号序列：可选符号集 */
  symbols?: string[]
  /** 图案选择：可选图案 ID 列表 */
  patterns?: string[]
  /** 谜题标题（显示在谜题面板顶部） */
  title?: string
  /** 需要持有的物品 key 列表（持有所有物品才能尝试解谜） */
  requiredItems?: string[]
  /** 谜题描述/背景故事（显示在谜题输入上方） */
  story?: string
}

/** 节点：流程图中的一个场景/逻辑节点（对应 Vue Flow 节点） */
export interface SceneNode {
  id: ID
  type: NodeType
  content: SceneContent
  endingKind?: EndingKind
  position: { x: number; y: number }
  note?: string
  puzzle?: PuzzleConfig
  /** 线索节点授予的物品 key（仅 Clue 节点） */
  clueItemKey?: string
  /** 场景内可交互物品列表 */
  interactables?: Interactable[]
}

/* ===================== 作品 ===================== */

/** 冒险作品元信息 */
export interface AdventureMeta {
  id: ID
  title: string
  author: string
  description: string
  cover?: string
  tags: string[]
  version: string
  createdAt: number
  updatedAt: number
}

/** 冒险作品完整结构 */
export interface Adventure {
  meta: AdventureMeta
  nodes: SceneNode[]
  choices: Choice[]
  variables: Variable[]
  items: Item[]
  characters: Character[]
  startNodeId: ID
}

/* ===================== 运行时状态 ===================== */

/** 游戏运行时状态 */
export interface GameState {
  adventureId: ID
  currentNodeId: ID
  variables: Record<string, number | string | boolean>
  inventory: string[]
  visitedNodes: ID[]
  history: Array<{ nodeId: ID; choiceId: ID; at: number }>
  ended: boolean
  endingNodeId?: ID
  /** 已交互的物品 key 集合（格式：`${nodeId}:${interactableId}`），用于 once 物品消失和状态追踪 */
  interactedItems: string[]
  /** 谜题状态：key = nodeId，value = { solved, attempts } */
  puzzleStates: Record<string, { solved: boolean; attempts: number }>
}

/** 试玩会话 */
export interface PlaySession {
  id: ID
  adventureId: ID
  state: GameState
  startedAt: number
  updatedAt: number
}

/* ===================== 校验结果 ===================== */

export type ValidationLevel = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  level: ValidationLevel
  code: string
  message: string
  nodeId?: ID
  choiceId?: ID
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

/* ===================== 导出 ===================== */

export type ExportFormat = 'json' | 'html' | 'linkquest'

export interface ExportResult {
  format: ExportFormat
  filename: string
  blob: Blob
}
