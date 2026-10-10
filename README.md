# 谜境 LinkQuest — 完整项目文档

> 每个人都能创造自己的谜境。

一个让普通用户也能创作互动剧情、解谜冒险、分支故事和多结局游戏的纯前端网页创作平台。基于可视化节点画布编织剧情，在浏览器中即可试玩、导出你的互动故事。

---

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈与依赖](#2-技术栈与依赖)
- [3. 项目目录结构](#3-项目目录结构)
- [4. 核心架构设计](#4-核心架构设计)
- [5. 数据模型详解](#5-数据模型详解)
- [6. 运行时引擎](#6-运行时引擎)
- [7. 素材系统](#7-素材系统)
- [8. 编辑器系统](#8-编辑器系统)
- [9. 游戏体验系统](#9-游戏体验系统)
- [10. AI 集成](#10-ai-集成)
- [11. 存储与存档](#11-存储与存档)
- [12. 设计系统](#12-设计系统)
- [13. 示例故事](#13-示例故事)
- [14. 开发指南](#14-开发指南)
- [15. 部署说明](#15-部署说明)
- [16. 已知限制与未来规划](#16-已知限制与未来规划)

---

## 1. 项目概述

### 定位

LinkQuest 是一个 **纯前端** 互动叙事创作平台，核心目标是让没有编程经验的用户也能创作具有场景探索、线索收集、谜题解谜和多结局分支的互动冒险游戏。

### 核心特性

| 特性 | 说明 |
|------|------|
| 纯前端架构 | 无需后端服务器，所有数据基于浏览器 IndexedDB 本地存储 |
| AI 可选 | AI 为增强能力而非必需，断网/无密钥时仍可完整创作 |
| 离线可用 | 构建产物为静态资源，可直接部署到任意静态托管 |
| 可视化编辑 | 节点画布 + 可视化场景编辑器，拖拽即可编排剧情 |
| 沉浸式游玩 | 精致场景素材、调查详情面板、线索发现动画、多结局触发 |

### 应用页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 叙事式入口，AI 生成、模板选择、作品管理 |
| `/editor/:id?` | 编辑器 | 节点画布 + 属性面板 + AI 助手 + 校验面板 |
| `/play/:id` | 试玩 | 沉浸式游戏页，存档恢复、历史记录 |
| `/settings` | 设置 | AI 配置、音效开关、安全说明 |

---

## 2. 技术栈与依赖

### 核心依赖

| 能力 | 选型 | 版本 | 用途 |
|------|------|------|------|
| 构建工具 | Vite | ^5.2.0 | 开发服务器与生产构建 |
| 框架 | Vue 3 | ^3.4.21 | `<script setup>` + TypeScript |
| 路由 | Vue Router | ^4.3.0 | SPA 页面路由 |
| 状态管理 | Pinia | ^2.1.7 | 作品/游戏/设置/UI 状态仓库 |
| 节点编辑器 | @vue-flow/core | ^1.33.5 | 编辑器节点画布 |
| 本地存储 | Dexie | ^4.0.4 | IndexedDB 封装，作品与存档持久化 |
| 类型检查 | TypeScript | ^5.4.0 | 全量类型安全 |
| Vue 类型检查 | vue-tsc | ^2.0.6 | Vue SFC 类型检查 |
| 单元测试 | Vitest | ^2.1.9 | 测试框架 |

### 无运行时后端

项目不依赖任何后端服务。AI 功能通过浏览器直接请求用户配置的 OpenAI 兼容 API，所有作品数据存储在浏览器 IndexedDB 中。

---

## 3. 项目目录结构

```
LinkQuest/
├── public/                          # 静态资源（favicon 等）
├── src/
│   ├── main.ts                      # 应用入口，挂载 Pinia + Router
│   ├── App.vue                      # 根组件，全局 UI 挂载
│   ├── env.d.ts                     # 环境类型声明
│   │
│   ├── types/
│   │   └── adventure.ts             # 全局核心类型定义（节点/选项/谜题/状态等）
│   │
│   ├── assets/
│   │   └── registry.ts              # 内置素材注册表（SVG 场景背景/角色立绘/物品图标）
│   │
│   ├── styles/
│   │   └── main.css                 # 全局设计系统（设计令牌/组件样式/深浅主题）
│   │
│   ├── router/
│   │   └── index.ts                 # Vue Router 路由配置
│   │
│   ├── views/                       # 页面视图
│   │   ├── HomeView.vue             # 首页（AI 入口/模板/作品列表）
│   │   ├── EditorView.vue           # 编辑器页（画布/面板/工具栏/AI）
│   │   ├── PlayView.vue             # 试玩页（场景/选项/谜题/存档）
│   │   └── SettingsView.vue         # 设置页（AI 配置/音效/安全）
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppIcon.vue          # SVG 图标系统（100+ 图标）
│   │   │   └── SiteHeader.vue       # 站点头部导航 + 主题切换
│   │   ├── editor/
│   │   │   ├── NodeCanvas.vue       # Vue Flow 节点画布
│   │   │   ├── SceneNodeCard.vue    # 节点卡片组件
│   │   │   ├── NodeInspector.vue    # 属性面板（内容/视觉/谜题/结局编辑）
│   │   │   ├── SceneEditorCanvas.vue # 可视化场景编辑器（拖拽定位物品）
│   │   │   ├── EditorToolbar.vue    # 编辑器工具栏（撤销/重做/保存/校验）
│   │   │   └── AIPanel.vue          # AI 助手面板
│   │   └── game/
│   │       ├── SceneView.vue        # 场景视图（背景/热点/角色/对白/调查面板）
│   │       ├── ChoiceList.vue       # 选项列表
│   │       ├── PuzzleInput.vue      # 谜题输入（文本/数字锁/符号/图案分发）
│   │       ├── NumberLockPuzzle.vue # 数字密码锁（拨盘交互）
│   │       ├── SymbolSequencePuzzle.vue # 符号序列谜题
│   │       ├── PatternPuzzle.vue    # 图案选择谜题
│   │       ├── InventoryBar.vue     # 物品栏（可点击查看线索详情）
│   │       └── EndingScreen.vue     # 结局画面
│   │
│   ├── engine/                      # 运行时引擎
│   │   ├── runtime.ts               # 游戏流程推进（选择/谜题/交互/跳转）
│   │   ├── conditions.ts            # 条件表达式求值
│   │   ├── validation.ts            # 作品结构校验
│   │   └── save.ts                  # 存档与读档
│   │
│   ├── ai/                          # AI 适配层
│   │   ├── types.ts                 # AI 类型定义
│   │   ├── provider.ts              # OpenAI 兼容客户端
│   │   ├── generator.ts             # 故事生成与转换
│   │   ├── reviewer.ts              # 剧情审查
│   │   └── fallback.ts              # 本地模板（4 个示例故事）
│   │
│   ├── storage/                     # 存储层
│   │   ├── database.ts              # IndexedDB CRUD（Dexie 封装）
│   │   └── export.ts                # JSON 导入/导出
│   │
│   ├── stores/                      # Pinia 状态仓库
│   │   ├── adventure.ts             # 作品仓库（编辑状态/历史栈/校验）
│   │   ├── play.ts                  # 游戏仓库（运行时状态/存档）
│   │   ├── settings.ts              # 设置仓库（AI/音效/动画）
│   │   └── ui.ts                    # UI 仓库（Toast/确认框）
│   │
│   └── utils/
│       └── factory.ts               # 工厂函数（ID 生成/节点创建/深拷贝）
│
├── index.html                       # HTML 入口
├── package.json                     # 依赖与脚本
├── tsconfig.json                    # TypeScript 配置
├── tsconfig.node.json               # Node 环境 TS 配置
└── vite.config.ts                   # Vite 构建配置
```

---

## 4. 核心架构设计

### 架构总览

```
┌──────────────────────────────────────────────────────────┐
│                        浏览器                             │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Views      │  │  Components  │  │    Stores     │  │
│  │ (页面视图)    │→ │ (UI 组件)    │→ │ (Pinia 状态)  │  │
│  └─────────────┘  └──────────────┘  └───────┬───────┘  │
│                                             │           │
│                    ┌────────────────────────┼─────┐     │
│                    │          Engine         │     │     │
│                    │  (运行时引擎/校验/存档)  │     │     │
│                    └────────────┬───────────┘     │     │
│                                 │                 │     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┴───┐  │
│  │    AI 层     │  │   Storage    │  │    Assets     │  │
│  │ (生成/审查)  │  │ (IndexedDB)  │  │ (SVG 素材)    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 数据流

```
用户操作 → View → Store Action → Engine 函数 → 更新 State → 响应式 UI 更新
                                          ↓
                                    Storage 持久化 (IndexedDB)
```

### 分层职责

| 层 | 职责 | 依赖 |
|----|------|------|
| **Views** | 页面路由、生命周期、组合子组件 | Components, Stores |
| **Components** | 纯 UI 渲染与用户交互 | Stores, Assets |
| **Stores** | 状态管理、业务编排 | Engine, Storage |
| **Engine** | 纯逻辑：流程推进、条件求值、校验 | Types |
| **Storage** | 数据持久化 CRUD | Dexie (IndexedDB) |
| **AI** | 外部 AI 调用、本地回退 | Types |
| **Assets** | 素材注册与解析 | 无 |

---

## 5. 数据模型详解

> 全局类型定义于 `src/types/adventure.ts`

### 枚举类型

```typescript
NodeType = 'start' | 'scene' | 'clue' | 'puzzle' | 'ending'
EndingKind = 'good' | 'neutral' | 'bad' | 'secret'
VariableType = 'number' | 'string' | 'boolean'
CompareOp = '==' | '!=' | '>' | '>=' | '<' | '<='
EffectKind = 'set_variable' | 'add_number' | 'give_item' | 'remove_item' | 'set_flag'
InteractAction = 'inspect' | 'collect' | 'give' | 'puzzle' | 'goto' | 'reveal'
PuzzleKind = 'text' | 'number_lock' | 'symbol_sequence' | 'pattern'
```

### 核心接口

#### Adventure（作品完整结构）

```typescript
interface Adventure {
  meta: AdventureMeta        // 元信息
  nodes: SceneNode[]         // 所有节点
  choices: Choice[]          // 所有分支选项
  variables: Variable[]      // 变量定义
  items: Item[]              // 物品/线索定义
  characters: Character[]    // 角色定义
  startNodeId: ID            // 起始节点 ID
}
```

#### SceneNode（场景节点）

```typescript
interface SceneNode {
  id: ID
  type: NodeType
  content: SceneContent      // 场景内容
  endingKind?: EndingKind    // 结局类型（仅 Ending 节点）
  position: { x: number; y: number }  // 画布位置
  note?: string              // 创作者备注
  puzzle?: PuzzleConfig      // 谜题配置（仅 Puzzle 节点）
  clueItemKey?: string       // 线索物品 key（仅 Clue 节点）
  interactables?: Interactable[]  // 场景内可交互物品
}
```

#### SceneContent（场景内容）

```typescript
interface SceneContent {
  title: string              // 场景标题
  text: string               // 场景正文
  speaker?: string           // 说话人
  image?: string             // 图片 URL
  background?: string        // 背景素材 ID（如 'bg:corridor'）
  atmosphere?: string        // 氛围描述（如"阴冷·寂静"）
  characterId?: string       // 角色立绘素材 ID
  dialogue?: string          // 角色对白
}
```

#### Interactable（可交互物品）

```typescript
interface Interactable {
  id: ID
  name: string               // 显示名称
  icon?: string              // 图标素材 ID
  position: { x: number; y: number }  // 位置（百分比 0-100）
  size?: number              // 热点尺寸（像素），默认 48
  description?: string       // 查看详情描述
  action: InteractAction     // 交互动作类型
  target?: string            // 动作目标
  condition?: ConditionGroup // 显示条件
  revealText?: string        // 交互后显示文本
  once?: boolean             // 一次性交互
  closeup?: string           // 特写图素材 ID
}
```

#### PuzzleConfig（谜题配置）

```typescript
interface PuzzleConfig {
  kind?: PuzzleKind          // 谜题类型
  answer: string             // 正确答案
  prompt: string             // 输入提示
  hint: string               // 错误提示
  maxAttempts: number        // 最大尝试次数（0=无限）
  digits?: number            // 数字锁位数
  symbols?: string[]         // 符号序列可选符号集
  patterns?: string[]        // 图案选择 ID 列表
  title?: string             // 谜题标题
  requiredItems?: string[]  // 需要持有的物品 key 列表
  story?: string             // 谜题背景故事
}
```

#### Item（物品/线索）

```typescript
interface Item {
  id: ID
  key: string                // 唯一标识
  name: string               // 显示名称
  description?: string       // 描述
  icon?: string              // 图标素材 ID
  examineText?: string       // 详细调查文本
  closeup?: string           // 特写图素材 ID
}
```

#### GameState（运行时状态）

```typescript
interface GameState {
  adventureId: ID
  currentNodeId: ID          // 当前节点
  variables: Record<string, number | string | boolean>
  inventory: string[]        // 已收集物品 key
  visitedNodes: ID[]         // 已访问节点
  history: Array<{ nodeId: ID; choiceId: ID; at: number }>
  ended: boolean             // 是否结束
  endingNodeId?: ID          // 结局节点
  interactedItems: string[]  // 已交互物品记录（格式：`${nodeId}:${interactableId}`）
  puzzleStates: Record<string, { solved: boolean; attempts: number }>
}
```

#### Choice（分支选项）

```typescript
interface Choice {
  id: ID
  fromNodeId: ID             // 起始节点
  toNodeId: ID               // 目标节点
  label: string              // 选项文字
  description?: string       // 选项描述
  condition?: ConditionGroup // 显示条件
  effects: Effect[]          // 触发效果
}
```

### 条件与效果

```typescript
// 条件表达式
interface Condition {
  id: ID
  variableKey: string
  op: CompareOp
  value: number | string | boolean
}

// 复合条件（支持 and/or 递归嵌套）
interface ConditionGroup {
  id: ID
  logic: 'and' | 'or'
  items: Array<Condition | ConditionGroup>
}

// 效果（选项触发后修改游戏状态）
interface Effect {
  kind: EffectKind
  target?: string
  value?: number | string | boolean
}
```

---

## 6. 运行时引擎

> `src/engine/runtime.ts`

### 核心函数

| 函数 | 签名 | 说明 |
|------|------|------|
| `createInitialState` | `(adv: Adventure) => GameState` | 初始化运行时状态 |
| `choose` | `(ctx, choiceId) => StepResult` | 选择选项，执行效果并推进 |
| `goTo` | `(ctx, nodeId) => StepResult` | 跳转到指定节点 |
| `solvePuzzle` | `(ctx, answer) => PuzzleResult` | 提交谜题答案 |
| `interactItem` | `(ctx, interactableId) => InteractResult` | 与场景物品交互 |
| `getVisibleInteractables` | `(ctx) => Interactable[]` | 获取当前可见的可交互物品 |
| `getAvailableChoices` | `(ctx) => Choice[]` | 获取当前可选项（已过滤条件） |
| `isPuzzleUnlocked` | `(ctx, nodeId) => boolean` | 检查谜题是否已解锁 |
| `getMissingPuzzleItems` | `(ctx, nodeId) => string[]` | 获取谜题缺少的物品 |
| `applyEffects` | `(state, effects) => void` | 执行效果列表 |
| `applyEnterEffects` | `(adv, state, nodeId) => void` | 进入节点副作用 |

### 交互动作处理

`interactItem` 函数根据 `InteractAction` 类型执行不同逻辑：

| 动作 | 行为 |
|------|------|
| `Inspect` | 显示描述/revealText，标记已调查 |
| `CollectClue` | 将物品加入 inventory，标记已收集 |
| `GiveItem` | 同 CollectClue |
| `OpenPuzzle` | 跳转到 target 指向的谜题节点 |
| `GoToNode` | 跳转到 target 指定的节点 |
| `RevealText` | 显示 revealText |

### 谜题解锁机制

`solvePuzzle` 在判定答案前会检查 `requiredItems`：

```typescript
if (node.puzzle.requiredItems?.length > 0) {
  const missing = node.puzzle.requiredItems.filter(
    (key) => !ctx.state.inventory.includes(key)
  )
  if (missing.length > 0) {
    return { correct: false, message: '你还需要更多线索才能解开这个谜题。' }
  }
}
```

### 条件求值

> `src/engine/conditions.ts`

支持 `and`/`or` 递归嵌套的复合条件组求值，空条件视为恒真。

---

## 7. 素材系统

> `src/assets/registry.ts`

### 设计理念

所有素材以 **SVG data URI** 形式内联，不依赖外部网络资源，可完全离线使用。素材分为三类：场景背景（bg）、角色立绘（char）、物品图标（item）。

### 素材 ID 命名规范

```
bg:corridor       → 场景背景：午夜走廊
bg:classroom      → 场景背景：413教室
char:student      → 角色立绘：学生
item:door         → 物品图标：门
```

### API

```typescript
// 解析素材 ID 为可显示 URL
resolveAsset(id?: string, fallback?: string): string

// 获取某类别素材列表（编辑器选择用）
listAssets(category: 'bg' | 'char' | 'item'): AssetDef[]

// 获取素材名称
assetName(id: string): string
```

### 内置素材清单

#### 场景背景（12 个）

| ID | 名称 | 特征 |
|----|------|------|
| `bg:corridor` | 午夜走廊 | 透视走廊、两侧门、天花板灯、远处雾气 |
| `bg:classroom` | 413教室 | 桌椅透视、黑板公式、窗户浓雾、挂钟 |
| `bg:corridor_door` | 走廊门牌 | 413 门牌特写、虚掩的门 |
| `bg:guardroom` | 值班室 | 值班表、台灯、文件柜 |
| `bg:lock_closeup` | 密码锁特写 | 四位拨盘密码锁近景 |
| `bg:hall` | 古堡大厅 | 透视大厅、吊灯、壁画 |
| `bg:tomb` | 古墓 | 石门、符文、轮回之数 |
| `bg:ending_dawn` | 破晓结局 | 温暖光线、破晓氛围 |
| `bg:ending_dark` | 黑暗结局 | 压迫感、黑暗 |
| `bg:ending_loop` | 循环结局 | 迷雾、嵌套空间 |
| `bg:ending` | 通用结局 | 通用结局背景 |
| `bg:default` | 默认背景 | 网格占位 |

#### 角色立绘（4 个）

| ID | 名称 | 特征 |
|----|------|------|
| `char:student` | 学生 | 半身像、校服、表情 |
| `char:narrator` | 旁白者 | 半身像、深色服装 |
| `char:watchman` | 值班大爷 | 半身像、制服、手电筒 |
| `char:silhouette` | 剪影 | 纯黑轮廓 |

#### 物品图标（14 个）

`door` `drawer` `board` `clock` `book` `lock` `key` `note` `window` `switch` `poster` `flashlight` `footprint` `default`

### 回退策略

`resolveAsset` 按类别提供回退：
- `bg:*` 找不到 → `bg:default`
- `char:*` 找不到 → `char:silhouette`
- `item:*` 找不到 → `item:default`
- 直接是 `http:`/`data:` URI → 原样返回

---

## 8. 编辑器系统

### 节点画布

> `src/components/editor/NodeCanvas.vue`

基于 `@vue-flow/core` 实现可视化节点编辑：
- 拖拽移动节点、缩放画布、适应画布
- 节点间连线创建分支
- 右键菜单快速添加节点
- 节点类型颜色区分

### 属性面板

> `src/components/editor/NodeInspector.vue`

根据节点类型显示不同编辑区域：

| 节点类型 | 可编辑内容 |
|----------|-----------|
| Start/Scene | 标题、正文、说话人、背景素材、氛围、角色立绘、对白 |
| Clue | 同上 + 线索物品 key/名称 |
| Puzzle | 同上 + 谜题类型/答案/提示/位数/符号/必需物品/故事 |
| Ending | 同上 + 结局类型 |

### 可视化场景编辑器

> `src/components/editor/SceneEditorCanvas.vue`

在真实背景图上直接编辑可交互物品：

| 功能 | 操作方式 |
|------|---------|
| 添加物品 | 点击"添加物品"按钮 |
| 选中物品 | 点击物品标记 |
| 移动物品 | 鼠标/触摸拖拽 |
| 微调位置 | 方向键（Shift 加速） |
| 删除物品 | Delete 键或删除按钮 |
| 调整大小 | 滑块（24-96px） |
| 编辑属性 | 选中后下方属性面板 |

**双向同步**：属性面板修改 → 画布实时更新；画布拖拽 → 数据实时保存。

**撤销/重做**：拖拽结束时提交历史快照，支持 Ctrl+Z / Ctrl+Shift+Z。

### 工具栏

> `src/components/editor/EditorToolbar.vue`

- 撤销 / 重做（最多 60 步历史栈）
- 自动保存（防抖 2.5s）+ 手动保存（Ctrl+S）
- JSON 导入 / 导出
- 剧情校验面板

### 剧情校验

> `src/engine/validation.ts`

纯本地结构检查，不依赖 AI：

| 检查项 | 级别 | 说明 |
|--------|------|------|
| 起始节点合法性 | error | 必须存在且唯一 |
| 节点 ID 唯一 | error | 不允许重复 ID |
| 分支目标存在 | error | 选项的 toNodeId 必须存在 |
| 孤立节点 | warning | 无入边也无出边 |
| 不可达节点 | warning | 从起始节点无法到达 |
| 死胡同节点 | warning | 非结局节点但无出边 |
| 无结局路径 | warning | 存在无法到达任何结局的路径 |
| 谜题答案 | info | 建议设置答案 |
| 谜题类型配置 | warning | 数字锁缺位数/符号序列缺符号集/图案谜题缺图案列表 |
| 线索绑定 | info | 建议绑定物品 |
| 交互物品目标 | warning | 跳转目标节点不存在/引用未定义物品 |

---

## 9. 游戏体验系统

### 场景视图

> `src/components/game/SceneView.vue`

#### 图层结构

```
┌─────────────────────────────┐
│     背景图层 (bg-wrap)       │  ← 背景图 + 暗角 + 氛围标签
├─────────────────────────────┤
│     可交互物品层 (hotspots)  │  ← 热点（默认微弱，悬停突出）
├─────────────────────────────┤
│     角色立绘层 (char)        │  ← 角色半身像
├─────────────────────────────┤
│     文本/对白层 (overlay)    │  ← 标题/对白/正文/徽章
├─────────────────────────────┤
│     调查详情面板 (investigate) │  ← 点击物品后弹出
└─────────────────────────────┘
```

#### 热点交互机制

| 状态 | 视觉表现 | 触发条件 |
|------|---------|---------|
| 默认 | 微弱光点（opacity 0.45） | 未交互 |
| 悬停/聚焦 | 放大 1.2x、金光环、显示标签 | mouse hover / keyboard focus |
| 已调查 | 暗淡 + 灰色勾选徽章 | Inspect/RevealText 动作已完成 |
| 已收集 | 暗淡 + 金色勾选徽章 | CollectClue/GiveItem 动作已完成 |
| 已使用 | 暗淡 + 红色箭头徽章 | GoToNode 动作已完成 |

#### 调查详情面板

点击物品后从底部滑入：
- 物品图标 + 名称
- 状态标签（已收集/前往中/已调查）
- 物品描述（italic 灰色）
- 交互结果文本
- 关闭按钮
- 线索收集时：金色边框 + 粒子动画

#### 图片加载失败处理

- 背景图加载失败 → 显示"场景背景加载失败"占位
- 角色立绘加载失败 → 隐藏立绘层
- 物品图标加载失败 → resolveAsset 回退到默认图标

#### 移动端适配

- 触摸设备（`hover: none`）：热点默认更明显（opacity 0.65）
- 调查面板全宽显示
- 文本区域间距缩小

### 谜题系统

> `src/components/game/PuzzleInput.vue`

根据 `PuzzleKind` 分发到不同组件：

| 类型 | 组件 | 交互方式 |
|------|------|---------|
| `text` | PuzzleInput 内联 | 文本输入框 + 提交按钮 |
| `number_lock` | NumberLockPuzzle | 拨盘上下按钮旋转数字 |
| `symbol_sequence` | SymbolSequencePuzzle | 点击符号填入序列槽位 |
| `pattern` | PatternPuzzle | 图案网格点击选择 |

所有谜题组件共享：
- 谜题标题/提示
- 谜题故事背景（`story` 字段）
- 必需物品提示（`requiredItems` 字段）
- 错误反馈 + 尝试次数
- 正确答案自动沿第一条可用选项推进

### 物品栏

> `src/components/game/InventoryBar.vue`

- 显示已收集线索（图标 + 名称）
- **点击物品弹出详情面板**：显示 `description`、`examineText`、`closeup` 特写图
- 金色主题区分线索区域

### 结局画面

> `src/components/game/EndingScreen.vue`

- 结局类型标签（圆满/普通/悲剧/隐藏）
- 结局标题 + 正文
- 统计信息（场景数/线索数/行动数）
- 重新游玩 / 返回首页按钮

---

## 10. AI 集成

> `src/ai/`

### 架构

```
用户提示 → generator.ts → provider.ts → OpenAI API
                ↓ (失败/无AI)
            fallback.ts → 本地模板生成
```

### AI 能力

| 能力 | 枚举值 | 说明 |
|------|--------|------|
| 生成场景 | `generate_scene` | 根据提示生成场景内容 |
| 生成分支 | `generate_branch` | 为场景生成多个选项 |
| 剧情审查 | `review_plot` | 审查剧情连贯性 |
| 建议结局 | `suggest_ending` | 建议结局设计 |

### 兼容性

兼容任意 OpenAI 风格 Chat Completions API（`/v1/chat/completions`），内置预设：
- OpenAI
- DeepSeek
- 智谱 GLM
- Moonshot

### 生成流程

1. 用户输入一句话描述
2. 构造 system prompt + user prompt
3. 调用 Chat Completions API（JSON 模式）
4. 解析返回的 AIStory 结构
5. 校验与修复（重复 ID、断开连接、缺失结局）
6. 转换为 Adventure 结构
7. 预览结果，用户确认后导入

### 本地回退

> `src/ai/fallback.ts`

无 AI 时回退到本地模板，内置 4 个示例故事：

| 模板 ID | 名称 | 特征 |
|---------|------|------|
| `midnight` | 午夜教学楼 | 悬疑解谜 + 值班室探索 + 线索矛盾 + 三结局 |
| `manor` | 暗夜古堡 | 多分支探索 + 隐藏结局 |
| `tomb` | 古墓探秘 | 线索 + 密码谜题 + 双结局 |
| `escape` | 密室逃脱 | 线性流程 + 入门 |

### 安全说明

- API Key 仅存于浏览器 localStorage，不上传任何后端
- 直接从浏览器请求第三方 API，密钥可能被开发者工具查看
- 面向公众部署应使用后端代理，不要将公共密钥打包进前端

---

## 11. 存储与存档

### IndexedDB 数据库

> `src/storage/database.ts`

基于 Dexie 封装，数据库名 `linkquest`，两张表：

| 表名 | 主键 | 索引 | 存储内容 |
|------|------|------|---------|
| `adventures` | `meta.id` | `meta.updatedAt` | 完整作品结构 |
| `sessions` | `id` | `adventureId`, `updatedAt` | 游戏存档 |

### CRUD API

```typescript
// 作品
putAdventure(adv: Adventure): Promise<void>
getAdventure(id: string): Promise<Adventure | null>
listAdventures(): Promise<Adventure[]>
deleteAdventure(id: string): Promise<void>

// 存档
putSession(session: PlaySession): Promise<void>
getSession(id: string): Promise<PlaySession | null>
listSessionsByAdventure(adventureId: string): Promise<PlaySession[]>
deleteSession(id: string): Promise<void>
```

### 存档恢复

> `src/engine/save.ts`

```typescript
// 保存当前状态
saveCurrentState(adventureId, state, existingId?): Promise<ID>

// 从存档恢复（兼容旧存档）
resumeFromSession(id: ID): Promise<GameState | null>
```

**兼容性处理**：`resumeFromSession` 自动补全旧存档缺失的字段：
```typescript
if (!state.interactedItems) state.interactedItems = []
if (!state.puzzleStates) state.puzzleStates = {}
```

### 导入导出

> `src/storage/export.ts`

- JSON 格式导出完整作品结构
- 导入时校验数据结构，格式错误抛出明确异常
- 导入失败不破坏现有作品

---

## 12. 设计系统

> `src/styles/main.css`

### 设计令牌

#### 色系

```
纸张暖白  --lq-paper: #f4efe6     深墨    --lq-ink: #2b2620
暗酒红    --lq-wine: #7a2e2e      旧金    --lq-gold: #b08438
苔藓青    --lq-moss: #4a6b52      赭石    --lq-rust: #b5532f
石板蓝    --lq-slate: #5b6b7a
```

#### 字体

```
正文衬线  --lq-font-sans: 'Source Han Serif SC', 'Noto Serif SC', serif
UI 无衬线 --lq-font-ui: 'Inter', system-ui, sans-serif
等宽      --lq-font-mono: 'JetBrains Mono', 'Fira Code', monospace
```

#### 间距系统

```
4px → 8px → 12px → 16px → 20px → 24px → 32px → 40px → 48px → 64px
```

### 深色主题

通过 `data-theme="dark"` 属性切换，编辑器与游戏页自动使用深色沉浸主题。

### 组件样式

全局 CSS 包含通用组件类：
- 按钮：`.lq-btn` / `.lq-btn--ghost` / `.lq-btn--danger` / `.lq-btn--sm`
- 输入：`.lq-input` / `.lq-textarea` / `.lq-select`
- 表单：`.lq-field` / `.lq-label`
- 徽章：`.lq-badge` / `.lq-badge--gold` / `.lq-badge--rust`
- 提示：`.lq-alert` / `.lq-help`
- 分隔：`.lq-divider`
- 动画：`.lq-fade` / `.lq-spin` / `.lq-transition-fade`

---

## 13. 示例故事

### 午夜教学楼

> `src/ai/fallback.ts` → `buildMidnight()`

#### 故事流程

```
走廊 (start)
  ├── 调查: 门牌413、走廊灯
  ├── 前往: 值班室
  │     ├── 收集: 值班表记录 (duty_log)
  │     ├── 收集: 值班大爷便条 (guard_note) — "别信黑板"
  │     ├── 调查: 文件柜、茶杯
  │     └── 返回走廊
  └── 推门进入413 → 教室 (scene)
        ├── 收集: 黑板留言 (blackboard_note) — "密码是门牌倒写314"
        ├── 收集: 抽屉纸条 (desk_note) — "密码是0413"
        ├── 调查: 挂钟、窗户
        └── 后门 → 数字锁谜题 (puzzle)
              ├── requiredItems: [blackboard_note, desk_note]
              ├── answer: 0413
              ├── 第三声钟响 → 圆满结局 (破晓)
              ├── 第四声钟响 → 普通结局 (循环)
              └── 输入314    → 悲剧结局 (绝望)
```

#### 设计要点

- **线索矛盾**：黑板说密码是 314，抽屉纸条说密码是 0413
- **推理判断**：值班大爷便条提示"别信黑板"，玩家需综合判断
- **解锁条件**：数字锁需要同时持有两条线索才能尝试
- **多结局**：根据输入密码和选择时机触发三种不同结局
- **实际探索**：玩家需要调查值班室、收集线索、判断矛盾，而非仅阅读文本

### 其他模板

| 模板 | 节点数 | 结局数 | 特征 |
|------|--------|--------|------|
| 暗夜古堡 | 8 | 2 | 多分支探索，隐藏结局 |
| 古墓探秘 | 6 | 2 | 线索 + 密码谜题，入门 |
| 密室逃脱 | 4 | 1 | 线性流程，入门 |

---

## 14. 开发指南

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 生产构建（含类型检查）
npm run build

# 预览生产构建
npm run preview

# 运行单元测试
npm run test

# 测试监听模式
npm run test:watch
```

### 代码规范

- 使用 `<script setup lang="ts">` 组合式 API
- 不使用 Emoji，统一使用 `AppIcon` SVG 图标
- CSS 使用全局设计令牌变量（`var(--lq-*)`）
- 组件内样式使用 `<style scoped>`
- 不添加注释除非特别必要

### 状态管理

| Store | 文件 | 职责 |
|-------|------|------|
| `useAdventureStore` | `stores/adventure.ts` | 作品编辑状态、历史栈、校验 |
| `usePlayStore` | `stores/play.ts` | 游戏运行时状态、存档 |
| `useSettingsStore` | `stores/settings.ts` | AI 配置、音效、动画设置 |
| `useUI` | `stores/ui.ts` | Toast 通知、编程式确认框 |

### 添加新素材

1. 在 `src/assets/registry.ts` 中创建 SVG 内容
2. 添加到 `BG` / `CHAR` / `ITEM_ICONS` 对象
3. 在 `ASSET_REGISTRY` 数组中注册
4. 自动通过 `resolveAsset` 可用

### 添加新谜题类型

1. 在 `types/adventure.ts` 的 `PuzzleKind` 枚举添加类型
2. 在 `PuzzleConfig` 添加类型专属字段
3. 创建 `components/game/YourPuzzle.vue` 组件
4. 在 `PuzzleInput.vue` 中添加分发逻辑
5. 在 `runtime.ts` 的 `solvePuzzle` 中添加判定逻辑

---

## 15. 部署说明

### 静态部署

```bash
npm run build
# 将 dist/ 目录部署到任意静态托管
```

兼容的托管服务：
- Vercel / Netlify / GitHub Pages
- Nginx / Apache 静态文件服务
- 对象存储（S3 / OSS / OBS）

### SPA 路由配置

需配置所有路由回退到 `index.html`：

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Vercel:** 自动配置 SPA 路由。

### AI 功能配置

部署后用户需自行配置 AI：
1. 进入 `/settings` 页面
2. 选择服务商预设或手动填写 Endpoint / Model / API Key
3. 点击"测试连接"验证
4. 启用 AI 增强开关

### 公共部署安全建议

- 不要将公共 API Key 打包进前端
- 使用后端代理或云函数转发 AI 请求
- 代码已预留此方案，仅需添加代理层

---

## 16. 已知限制与未来规划

### 当前限制

| 限制 | 说明 |
|------|------|
| SVG 素材 | 场景背景为矢量图形，无法达到真实位图的细节水平 |
| 音效系统 | 仅实现设置开关，未集成实际音频文件播放 |
| 物品组合 | 仅实现 `requiredItems` 数据结构，未实现"合并两物品为新物品"逻辑 |
| 线索特写图 | `closeup` 字段已支持，但示例故事中未填充实际特写图素材 |
| 条件编辑器 | `ConditionGroup` 数据结构已定义，编辑器 UI 暂未提供可视化条件编辑 |
| 账号系统 | 纯前端本地架构，未引入账号与云端同步 |
| 复杂转场 | 转场动画较为基础，未实现复杂场景过渡效果 |

### 未来规划方向

- **素材上传**：支持用户上传自定义背景图/角色立绘
- **音频系统**：集成背景音乐和音效播放
- **条件编辑器**：可视化 ConditionGroup 编辑 UI
- **物品组合**：实现物品合并、使用道具等复杂交互
- **云端同步**：引入账号系统，支持跨设备同步
- **多语言**：国际化支持
- **导出格式**：支持 HTML 独立包导出，可离线分发

---

## 附录：Pinia Store API 速查

### useAdventureStore

```typescript
// 状态
current: Adventure | null          // 当前编辑作品
selectedNodeId: ID | null          // 选中节点
dirty: boolean                     // 未保存标记
canUndo / canRedo: boolean         // 撤销/重做可用
validation: ValidationResult       // 校验结果

// 作品操作
open(id): Promise<boolean>
create(title): Promise<ID>
saveCurrent(): Promise<boolean>
remove(id): Promise<void>

// 节点操作
addNode(type, position): SceneNode
updateNode(id, patch): void
updateNodeTracked(id, patch): void  // 带历史记录
removeNode(id): void
selectNode(id): void
setStartNode(id): void

// 选项操作
addChoice(fromId, toId, label): Choice
updateChoice(id, patch): void
removeChoice(id): void

// 历史
undo(): void
redo(): void
snapshot(): void

// 物品
ensureItem(key, name): void
```

### usePlayStore

```typescript
// 状态
adventure: Adventure | null
state: GameState | null
interactMessage: string
interactCollected: boolean
puzzleError: string

// Getter
currentNode: SceneNode
availableChoices: Choice[]
inventory: string[]
visibleInteractables: Interactable[]
isEnded: boolean

// 操作
start(adventure): void
resume(adventure, state, sessionId): void
choose(choiceId): void
interact(interactableId): void
solvePuzzle(answer): boolean
saveProgress(): Promise<void>
reset(): void
isInteracted(nodeId, interactableId): boolean
puzzleState(nodeId): { solved, attempts }
```

### useSettingsStore

```typescript
// 状态
enabled: boolean                  // AI 开关
apiKey: string
endpoint: string
model: string
soundEnabled: boolean             // 音效开关（默认 false）
skipAnimations: boolean           // 跳过动画

// 操作
toggle(on): void
setKey(key): void
toggleSound(on): void
toggleSkipAnimations(on): void
clearKey(): void
persist(): void
```

---

