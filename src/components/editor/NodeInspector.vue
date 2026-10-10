<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAdventureStore } from '@/stores/adventure'
import { useUI } from '@/stores/ui'
import {
  NodeType,
  EndingKind,
  PuzzleKind,
  type SceneNode,
  type ID,
} from '@/types/adventure'
import { listAssets, resolveAsset } from '@/assets/registry'
import AppIcon from '@/components/common/AppIcon.vue'
import SceneEditorCanvas from '@/components/editor/SceneEditorCanvas.vue'

const store = useAdventureStore()
const ui = useUI()
const node = computed<SceneNode | null>(() => store.selectedNode)

const bgAssets = listAssets('bg')
const charAssets = listAssets('char')

const form = ref({
  title: '',
  text: '',
  speaker: '',
  note: '',
  background: '',
  atmosphere: '',
  characterId: '',
  dialogue: '',
  clueItemKey: '',
  clueItemName: '',
  puzzleKind: PuzzleKind.Text,
  puzzleAnswer: '',
  puzzlePrompt: '请输入密码：',
  puzzleHint: '密码不正确，再想一想。',
  puzzleMaxAttempts: 0,
  puzzleTitle: '',
  puzzleDigits: 3,
  puzzleSymbols: '',
  endingKind: EndingKind.Neutral,
})

function syncForm(n: SceneNode | null) {
  if (!n) return
  form.value = {
    title: n.content.title,
    text: n.content.text,
    speaker: n.content.speaker ?? '',
    note: n.note ?? '',
    background: n.content.background ?? '',
    atmosphere: n.content.atmosphere ?? '',
    characterId: n.content.characterId ?? '',
    dialogue: n.content.dialogue ?? '',
    clueItemKey: n.clueItemKey ?? '',
    clueItemName:
      store.current?.items.find((i) => i.key === n.clueItemKey)?.name ?? '',
    puzzleKind: n.puzzle?.kind ?? PuzzleKind.Text,
    puzzleAnswer: n.puzzle?.answer ?? '',
    puzzlePrompt: n.puzzle?.prompt ?? '请输入密码：',
    puzzleHint: n.puzzle?.hint ?? '密码不正确，再想一想。',
    puzzleMaxAttempts: n.puzzle?.maxAttempts ?? 0,
    puzzleTitle: n.puzzle?.title ?? '',
    puzzleDigits: n.puzzle?.digits ?? 3,
    puzzleSymbols: n.puzzle?.symbols?.join(' ') ?? '',
    endingKind: n.endingKind ?? EndingKind.Neutral,
  }
}

watch(node, (n) => syncForm(n), { immediate: true, deep: true })

function saveContent() {
  if (!node.value) return
  store.updateNodeContent(node.value.id, {
    title: form.value.title,
    text: form.value.text,
    speaker: form.value.speaker || undefined,
    background: form.value.background || undefined,
    atmosphere: form.value.atmosphere || undefined,
    characterId: form.value.characterId || undefined,
    dialogue: form.value.dialogue || undefined,
  })
  if (form.value.note !== (node.value.note ?? '')) {
    store.updateNode(node.value.id, { note: form.value.note })
  }
}

function savePuzzle() {
  if (!node.value) return
  const symbols = form.value.puzzleSymbols
    .split(/\s+/)
    .filter((s) => s.length > 0)
  store.updateNode(node.value.id, {
    puzzle: {
      kind: form.value.puzzleKind,
      answer: form.value.puzzleAnswer,
      prompt: form.value.puzzlePrompt,
      hint: form.value.puzzleHint,
      maxAttempts: form.value.puzzleMaxAttempts,
      title: form.value.puzzleTitle || undefined,
      digits: form.value.puzzleKind === PuzzleKind.NumberLock ? form.value.puzzleDigits : undefined,
      symbols: form.value.puzzleKind === PuzzleKind.SymbolSequence && symbols.length > 0 ? symbols : undefined,
    },
  })
}

function saveClue() {
  if (!node.value) return
  const key = form.value.clueItemKey.trim()
  store.updateNode(node.value.id, { clueItemKey: key })
  if (key) store.ensureItem(key, form.value.clueItemName || key)
}

function saveEnding() {
  if (!node.value) return
  store.updateNode(node.value.id, { endingKind: form.value.endingKind })
}

const puzzleKindOptions: { value: PuzzleKind; label: string; desc: string }[] = [
  { value: PuzzleKind.Text, label: '文本密码', desc: '玩家输入文字答案' },
  { value: PuzzleKind.NumberLock, label: '数字密码锁', desc: '旋转拨盘输入数字' },
  { value: PuzzleKind.SymbolSequence, label: '符号序列', desc: '按顺序选择符号' },
  { value: PuzzleKind.Pattern, label: '图案选择', desc: '从图案网格中选择' },
]

async function removeNode() {
  if (!node.value) return
  const ok = await ui.confirm({
    title: '删除该节点？',
    message: `节点「${node.value.content.title || '未命名'}」及其所有连接将被删除，此操作可通过撤销恢复。`,
    confirmText: '删除',
    danger: true,
  })
  if (ok) store.removeNode(node.value.id)
}

function setStart() {
  if (!node.value) return
  store.setStartNode(node.value.id)
  ui.success('已设为起始节点')
}

const outgoingChoices = computed(() => {
  if (!node.value || !store.current) return []
  return store.current.choices.filter((c) => c.fromNodeId === node.value!.id)
})

const allNodes = computed(() => store.current?.nodes ?? [])

function targetLabel(id: ID): string {
  const n = allNodes.value.find((x) => x.id === id)
  return n?.content.title ?? id
}

function updateChoiceLabel(id: ID, label: string) {
  store.updateChoice(id, { label })
}

async function removeChoice(id: ID) {
  const ok = await ui.confirm({
    title: '删除该分支？',
    message: '此分支连接将被删除，可通过撤销恢复。',
    confirmText: '删除',
    danger: true,
  })
  if (ok) store.removeChoice(id)
}

const typeLabel: Record<NodeType, string> = {
  [NodeType.Start]: '起始',
  [NodeType.Scene]: '场景',
  [NodeType.Clue]: '线索',
  [NodeType.Puzzle]: '谜题',
  [NodeType.Ending]: '结局',
}

const typeIcon: Record<NodeType, string> = {
  [NodeType.Start]: 'play',
  [NodeType.Scene]: 'bookOpen',
  [NodeType.Clue]: 'search',
  [NodeType.Puzzle]: 'key',
  [NodeType.Ending]: 'flag',
}

const endingOptions: { value: EndingKind; label: string; desc: string }[] = [
  { value: EndingKind.Good, label: '圆满结局', desc: '玩家达成最佳结果' },
  { value: EndingKind.Neutral, label: '普通结局', desc: '故事正常结束' },
  { value: EndingKind.Bad, label: '悲剧结局', desc: '玩家失败或死亡' },
  { value: EndingKind.Secret, label: '隐藏结局', desc: '需要特殊条件触发' },
]

const showSceneFields = computed(() =>
  node.value?.type === NodeType.Scene ||
  node.value?.type === NodeType.Start ||
  node.value?.type === NodeType.Clue ||
  node.value?.type === NodeType.Puzzle
)
</script>

<template>
  <aside class="inspector">
    <div v-if="!node" class="inspector__empty">
      <AppIcon name="edit" :size="32" />
      <p>在画布上选择一个节点以编辑其内容</p>
    </div>

    <template v-else>
      <div class="inspector__head">
        <div class="inspector__type">
          <span class="inspector__type-icon">
            <AppIcon :name="typeIcon[node.type]" :size="15" />
          </span>
          <span>{{ typeLabel[node.type] }}节点</span>
        </div>
        <button
          v-if="node.type !== NodeType.Start"
          class="lq-btn lq-btn--danger lq-btn--sm"
          @click="removeNode"
        >
          <AppIcon name="trash" :size="13" />
          <span>删除</span>
        </button>
      </div>

      <div class="inspector__body">
        <div class="lq-field">
          <label class="lq-label">标题</label>
          <input
            v-model="form.title"
            class="lq-input"
            placeholder="场景标题"
            @input="saveContent"
          />
        </div>
        <div class="lq-field">
          <label class="lq-label">正文</label>
          <textarea
            v-model="form.text"
            class="lq-textarea"
            rows="6"
            placeholder="描述这个场景发生的事情……"
            @input="saveContent"
          ></textarea>
        </div>

        <!-- 场景视觉配置 -->
        <template v-if="showSceneFields">
          <hr class="lq-divider lq-divider--soft" />
          <p class="inspector__section">
            <AppIcon name="layers" :size="14" />
            <span>场景视觉</span>
          </p>
          <div class="lq-field">
            <label class="lq-label">背景素材</label>
            <select v-model="form.background" class="lq-select" @change="saveContent">
              <option value="">（无背景）</option>
              <option v-for="a in bgAssets" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
            <div v-if="form.background" class="inspector__preview">
              <img :src="resolveAsset(form.background)" alt="背景预览" />
            </div>
          </div>
          <div class="lq-field">
            <label class="lq-label">氛围描述（可选）</label>
            <input
              v-model="form.atmosphere"
              class="lq-input"
              placeholder="如：阴冷、寂静、诡异"
              @input="saveContent"
            />
          </div>
          <div class="lq-field">
            <label class="lq-label">角色立绘（可选）</label>
            <select v-model="form.characterId" class="lq-select" @change="saveContent">
              <option value="">（无立绘）</option>
              <option v-for="a in charAssets" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>
          <div v-if="form.characterId" class="lq-field">
            <label class="lq-label">角色对白（可选）</label>
            <textarea
              v-model="form.dialogue"
              class="lq-textarea"
              rows="2"
              placeholder="角色说的话……"
              @input="saveContent"
            ></textarea>
          </div>
        </template>

        <div v-if="node.type === NodeType.Scene || node.type === NodeType.Start" class="lq-field">
          <label class="lq-label">说话人（可选）</label>
          <input
            v-model="form.speaker"
            class="lq-input"
            placeholder="旁白 / 角色名"
            @input="saveContent"
          />
        </div>

        <!-- 可交互物品（可视化编辑器） -->
        <template v-if="showSceneFields">
          <hr class="lq-divider lq-divider--soft" />
          <p class="inspector__section">
            <AppIcon name="target" :size="14" />
            <span>场景物品编辑器</span>
          </p>
          <SceneEditorCanvas />
        </template>

        <!-- 线索节点 -->
        <template v-if="node.type === NodeType.Clue">
          <hr class="lq-divider lq-divider--soft" />
          <p class="inspector__section">
            <AppIcon name="search" :size="14" />
            <span>线索配置</span>
          </p>
          <div class="lq-field">
            <label class="lq-label">线索物品标识 (key)</label>
            <input
              v-model="form.clueItemKey"
              class="lq-input lq-input--mono"
              placeholder="如：rusty_key"
              @input="saveClue"
            />
          </div>
          <div class="lq-field">
            <label class="lq-label">线索物品名称</label>
            <input
              v-model="form.clueItemName"
              class="lq-input"
              placeholder="如：生锈的钥匙"
              @input="saveClue"
            />
          </div>
          <p class="lq-help">玩家进入该节点时自动获得此线索，显示在物品栏中。</p>
        </template>

        <!-- 谜题节点 -->
        <template v-if="node.type === NodeType.Puzzle">
          <hr class="lq-divider lq-divider--soft" />
          <p class="inspector__section">
            <AppIcon name="key" :size="14" />
            <span>谜题配置</span>
          </p>
          <div class="lq-field">
            <label class="lq-label">谜题类型</label>
            <select v-model="form.puzzleKind" class="lq-select" @change="savePuzzle">
              <option v-for="opt in puzzleKindOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p class="lq-help">{{ puzzleKindOptions.find(o => o.value === form.puzzleKind)?.desc }}</p>
          </div>
          <div class="lq-field">
            <label class="lq-label">谜题标题（可选）</label>
            <input
              v-model="form.puzzleTitle"
              class="lq-input"
              placeholder="显示在谜题面板顶部"
              @input="savePuzzle"
            />
          </div>
          <div class="lq-field">
            <label class="lq-label lq-label--req">正确答案</label>
            <input
              v-model="form.puzzleAnswer"
              class="lq-input lq-input--mono"
              :placeholder="form.puzzleKind === PuzzleKind.NumberLock ? '如：4242' : '如：★☾☀'"
              @input="savePuzzle"
            />
          </div>
          <div v-if="form.puzzleKind === PuzzleKind.NumberLock" class="lq-field">
            <label class="lq-label">密码位数</label>
            <input
              v-model.number="form.puzzleDigits"
              type="number"
              min="1"
              max="8"
              class="lq-input"
              @input="savePuzzle"
            />
          </div>
          <div v-if="form.puzzleKind === PuzzleKind.SymbolSequence" class="lq-field">
            <label class="lq-label">可选符号（空格分隔）</label>
            <input
              v-model="form.puzzleSymbols"
              class="lq-input"
              placeholder="★ ☾ ☀ ⚡ ❄ ✦"
              @input="savePuzzle"
            />
          </div>
          <div class="lq-field">
            <label class="lq-label">输入提示</label>
            <input
              v-model="form.puzzlePrompt"
              class="lq-input"
              @input="savePuzzle"
            />
          </div>
          <div class="lq-field">
            <label class="lq-label">错误提示</label>
            <input
              v-model="form.puzzleHint"
              class="lq-input"
              @input="savePuzzle"
            />
          </div>
          <div class="lq-field">
            <label class="lq-label">最大尝试次数（0 = 无限）</label>
            <input
              v-model.number="form.puzzleMaxAttempts"
              type="number"
              min="0"
              class="lq-input"
              @input="savePuzzle"
            />
          </div>
        </template>

        <!-- 结局节点 -->
        <template v-if="node.type === NodeType.Ending">
          <hr class="lq-divider lq-divider--soft" />
          <p class="inspector__section">
            <AppIcon name="flag" :size="14" />
            <span>结局配置</span>
          </p>
          <div class="lq-field">
            <label class="lq-label">结局类型</label>
            <select
              v-model="form.endingKind"
              class="lq-select"
              @change="saveEnding"
            >
              <option
                v-for="opt in endingOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <p class="lq-help">{{ endingOptions.find(o => o.value === form.endingKind)?.desc }}</p>
          </div>
        </template>

        <div class="lq-field">
          <label class="lq-label">创作者备注（不显示给玩家）</label>
          <input
            v-model="form.note"
            class="lq-input"
            placeholder="设计思路、待办……"
            @input="saveContent"
          />
        </div>

        <button
          v-if="node.type !== NodeType.Start"
          class="lq-btn lq-btn--ghost lq-btn--sm lq-btn--block"
          @click="setStart"
        >
          <AppIcon name="play" :size="13" />
          <span>设为起始节点</span>
        </button>

        <!-- 出发分支 -->
        <hr class="lq-divider lq-divider--soft" />
        <div class="inspector__choices">
          <label class="lq-label">从此节点出发的分支 ({{ outgoingChoices.length }})</label>
          <div v-if="outgoingChoices.length === 0" class="inspector__no-choice">
            <AppIcon name="info" :size="13" />
            <span>暂无分支，拖拽节点右侧锚点到目标节点即可连接。</span>
          </div>
          <div
            v-for="c in outgoingChoices"
            :key="c.id"
            class="inspector__choice"
          >
            <div class="inspector__choice-main">
              <input
                :value="c.label"
                class="lq-input"
                placeholder="选项文字"
                @input="updateChoiceLabel(c.id, ($event.target as HTMLInputElement).value)"
              />
              <span class="inspector__choice-target">
                <AppIcon name="arrowRight" :size="12" />
                {{ targetLabel(c.toNodeId) }}
              </span>
            </div>
            <button
              class="lq-btn lq-btn--ghost lq-btn--sm lq-btn--icon"
              title="删除分支"
              @click="removeChoice(c.id)"
            >
              <AppIcon name="trash" :size="13" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.inspector {
  height: 100%;
  overflow-y: auto;
  background: var(--lq-paper-2);
  display: flex;
  flex-direction: column;
}
.inspector__empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lq-space-3);
  color: var(--lq-ink-faint);
  padding: var(--lq-space-6);
  text-align: center;
}
.inspector__empty p { margin: 0; font-size: var(--lq-fs-sm); }
.inspector__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lq-space-4) var(--lq-space-4) var(--lq-space-3);
  border-bottom: 1px solid var(--lq-line);
  flex-shrink: 0;
}
.inspector__type {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  font-size: var(--lq-fs-sm);
  font-weight: 600;
  color: var(--lq-ink);
}
.inspector__type-icon { display: inline-flex; color: var(--lq-wine); }
.inspector__body {
  padding: var(--lq-space-4);
  flex: 1;
}
.inspector__section {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  font-size: var(--lq-fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--lq-ink-faint);
  font-weight: 600;
  margin: 0 0 var(--lq-space-3);
}
.inspector__section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--lq-space-3);
}
.inspector__section-row .inspector__section { margin: 0; }
.inspector__preview {
  margin-top: var(--lq-space-2);
  border-radius: var(--lq-radius-md);
  overflow: hidden;
  border: 1px solid var(--lq-line);
}
.inspector__preview img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}
.inspector__choices { margin-top: var(--lq-space-2); }
.inspector__no-choice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  line-height: 1.5;
  padding: var(--lq-space-2);
  background: var(--lq-paper);
  border-radius: var(--lq-radius-md);
}
.inspector__choice {
  display: flex;
  gap: var(--lq-space-2);
  align-items: flex-start;
  margin-bottom: var(--lq-space-2);
}
.inspector__choice-main { flex: 1; min-width: 0; }
.inspector__choice-target {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--lq-ink-faint);
  margin-top: 3px;
}

/* 可交互物品卡片 */
.inter-item {
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  margin-bottom: var(--lq-space-3);
  overflow: hidden;
}
.inter-item__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  padding: var(--lq-space-2) var(--lq-space-3);
  background: var(--lq-paper-2);
  border-bottom: 1px solid var(--lq-line);
}
.inter-item__icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}
.inter-item__body {
  padding: var(--lq-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-2);
}
.inter-item__pos {
  display: flex;
  gap: var(--lq-space-2);
}
.inter-item__slider {
  flex: 1;
  accent-color: var(--lq-wine);
}
.lq-field--sm { margin-bottom: 0; }
.lq-input--sm { font-size: var(--lq-fs-sm); padding: 4px 8px; }
.lq-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-soft);
  cursor: pointer;
}
</style>
