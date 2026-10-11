<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAdventureStore } from '@/stores/adventure'
import {
  InteractAction,
  type ID,
  type Interactable,
  type SceneNode,
} from '@/types/adventure'
import { resolveAsset, listAssets } from '@/assets/registry'
import { genId } from '@/utils/factory'
import AppIcon from '@/components/common/AppIcon.vue'

const store = useAdventureStore()
const node = computed<SceneNode | null>(() => store.selectedNode)
const interactables = computed<Interactable[]>(() => node.value?.interactables ?? [])

const itemAssets = listAssets('item')
const allNodes = computed(() => store.current?.nodes ?? [])

const bgSrc = computed(() => {
  const bg = node.value?.content.background
  return resolveAsset(bg, 'bg:default')
})

/* ---------- 选中状态 ---------- */
const selectedId = ref<string | null>(null)
const selected = computed(() =>
  interactables.value.find((it) => it.id === selectedId.value) ?? null
)

watch(node, () => { selectedId.value = null })

function selectItem(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

/* ---------- 拖拽定位 ---------- */
const canvasRef = ref<HTMLElement | null>(null)
const draggingId = ref<string | null>(null)
const dragMoved = ref(false)

function onPointerDown(it: Interactable, e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  draggingId.value = it.id
  selectedId.value = it.id
  dragMoved.value = false
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  } catch { /* ignore */ }
}

function onPointerMove(e: PointerEvent) {
  if (!draggingId.value || !canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  const cx = Math.max(2, Math.min(98, Math.round(x * 10) / 10))
  const cy = Math.max(2, Math.min(98, Math.round(y * 10) / 10))
  updateLive(draggingId.value, { position: { x: cx, y: cy } })
  dragMoved.value = true
}

function onPointerUp() {
  if (draggingId.value && dragMoved.value) {
    commitHistory()
  }
  draggingId.value = null
  dragMoved.value = false
}

/* ---------- 物品 CRUD ---------- */
function addInteractable() {
  if (!node.value) return
  const list = [...interactables.value]
  const newItem: Interactable = {
    id: genId('it'),
    name: `物品 ${list.length + 1}`,
    icon: 'item:default',
    position: { x: 50, y: 50 },
    size: 48,
    action: InteractAction.Inspect,
    description: '',
    revealText: '',
    once: false,
  }
  list.push(newItem)
  store.updateNodeTracked(node.value.id, { interactables: list })
  selectedId.value = newItem.id
}

function removeInteractable(id: ID) {
  if (!node.value) return
  const list = interactables.value.filter((it) => it.id !== id)
  store.updateNodeTracked(node.value.id, { interactables: list })
  if (selectedId.value === id) selectedId.value = null
}

function updateLive(id: ID, patch: Partial<Interactable>) {
  if (!node.value) return
  const list = [...interactables.value]
  const idx = list.findIndex((it) => it.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], ...patch }
  store.updateNode(node.value.id, { interactables: list })
}

function updateTracked(id: ID, patch: Partial<Interactable>) {
  if (!node.value) return
  const list = [...interactables.value]
  const idx = list.findIndex((it) => it.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], ...patch }
  store.updateNodeTracked(node.value.id, { interactables: list })
}

function commitHistory() {
  if (!node.value) return
  store.snapshot()
  store.dirty = true
}

/* ---------- 动作选项 ---------- */
const actionOptions: { value: InteractAction; label: string }[] = [
  { value: InteractAction.Inspect, label: '查看详情' },
  { value: InteractAction.CollectClue, label: '收集线索' },
  { value: InteractAction.GiveItem, label: '获得道具' },
  { value: InteractAction.OpenPuzzle, label: '开启谜题' },
  { value: InteractAction.GoToNode, label: '跳转剧情' },
  { value: InteractAction.RevealText, label: '显示文本' },
]

/* ---------- 键盘导航 ---------- */
function onKeydown(e: KeyboardEvent) {
  if (!selected.value) return
  if (e.key === 'Escape') {
    selectedId.value = null
    return
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    e.preventDefault()
    removeInteractable(selected.value.id)
    return
  }
  const step = e.shiftKey ? 5 : 1
  let { x, y } = selected.value.position
  if (e.key === 'ArrowLeft') x = Math.max(0, x - step)
  else if (e.key === 'ArrowRight') x = Math.min(100, x + step)
  else if (e.key === 'ArrowUp') y = Math.max(0, y - step)
  else if (e.key === 'ArrowDown') y = Math.min(100, y + step)
  else return
  e.preventDefault()
  updateLive(selected.value.id, { position: { x, y } })
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="sec">
    <!-- 工具栏 -->
    <div class="sec__toolbar">
      <span class="sec__count">
        <AppIcon name="target" :size="14" />
        <span>{{ interactables.length }} 个可交互物品</span>
      </span>
      <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="addInteractable">
        <AppIcon name="plus" :size="13" />
        <span>添加物品</span>
      </button>
    </div>

    <!-- 画布 -->
    <div
      ref="canvasRef"
      class="sec__canvas"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img :src="bgSrc" class="sec__bg" alt="场景背景" />
      <div class="sec__bg-overlay"></div>

      <!-- 物品标记 -->
      <div
        v-for="it in interactables"
        :key="it.id"
        class="sec__item"
        :class="{
          'sec__item--selected': selectedId === it.id,
          'sec__item--dragging': draggingId === it.id,
        }"
        :style="{
          left: `${it.position.x}%`,
          top: `${it.position.y}%`,
          width: `${it.size ?? 48}px`,
          height: `${it.size ?? 48}px`,
        }"
        @pointerdown="onPointerDown(it, $event)"
        @click="selectItem(it.id)"
      >
        <img :src="resolveAsset(it.icon, 'item:default')" class="sec__item-icon" :alt="it.name" />
        <span class="sec__item-label">{{ it.name }}</span>
        <span class="sec__item-pos">{{ Math.round(it.position.x) }},{{ Math.round(it.position.y) }}</span>
      </div>

      <!-- 空状态提示 -->
      <div v-if="interactables.length === 0" class="sec__empty">
        <AppIcon name="target" :size="24" />
        <p>点击上方"添加物品"在场景中放置可交互热点</p>
      </div>
    </div>

    <!-- 选中物品的属性面板 -->
    <transition name="lq-transition-fade">
      <div v-if="selected" class="sec__props">
        <div class="sec__props-head">
          <img :src="resolveAsset(selected.icon, 'item:default')" class="sec__props-icon" alt="" />
          <span class="sec__props-title">编辑：{{ selected.name }}</span>
          <button class="lq-btn lq-btn--danger lq-btn--sm lq-btn--icon" @click="removeInteractable(selected.id)">
            <AppIcon name="trash" :size="13" />
          </button>
        </div>

        <div class="sec__props-body">
          <div class="lq-field lq-field--sm">
            <label class="lq-label">名称</label>
            <input
              :value="selected.name"
              class="lq-input lq-input--sm"
              placeholder="物品名称"
              @input="updateTracked(selected.id, { name: ($event.target as HTMLInputElement).value })"
            />
          </div>

          <div class="lq-field lq-field--sm">
            <label class="lq-label">图标</label>
            <select
              :value="selected.icon ?? 'item:default'"
              class="lq-select"
              @change="updateTracked(selected.id, { icon: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="a in itemAssets" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>

          <div class="lq-field lq-field--sm">
            <label class="lq-label">交互动作</label>
            <select
              :value="selected.action"
              class="lq-select"
              @change="updateTracked(selected.id, { action: ($event.target as HTMLSelectElement).value as InteractAction })"
            >
              <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div v-if="selected.action === 'collect' || selected.action === 'give'" class="lq-field lq-field--sm">
            <label class="lq-label">目标物品 key</label>
            <input
              :value="selected.target ?? ''"
              class="lq-input lq-input--sm lq-input--mono"
              placeholder="如：rusty_key"
              @input="updateTracked(selected.id, { target: ($event.target as HTMLInputElement).value })"
            />
          </div>

          <div v-if="selected.action === 'goto'" class="lq-field lq-field--sm">
            <label class="lq-label">跳转目标节点</label>
            <select
              :value="selected.target ?? ''"
              class="lq-select"
              @change="updateTracked(selected.id, { target: ($event.target as HTMLSelectElement).value })"
            >
              <option value="">（选择节点）</option>
              <option v-for="n in allNodes" :key="n.id" :value="n.id">{{ n.content.title || n.id }}</option>
            </select>
          </div>

          <div v-if="selected.action === 'puzzle'" class="lq-field lq-field--sm">
            <label class="lq-label">谜题节点</label>
            <select
              :value="selected.target ?? ''"
              class="lq-select"
              @change="updateTracked(selected.id, { target: ($event.target as HTMLSelectElement).value })"
            >
              <option value="">（选择谜题节点）</option>
              <option v-for="n in allNodes.filter(n => n.type === 'puzzle')" :key="n.id" :value="n.id">{{ n.content.title || n.id }}</option>
            </select>
          </div>

          <div class="sec__props-row">
            <div class="lq-field lq-field--sm">
              <label class="lq-label">X: {{ Math.round(selected.position.x) }}%</label>
              <input
                type="range" min="0" max="100"
                :value="selected.position.x"
                class="sec__slider"
                @input="updateTracked(selected.id, { position: { x: Number(($event.target as HTMLInputElement).value), y: selected.position.y } })"
              />
            </div>
            <div class="lq-field lq-field--sm">
              <label class="lq-label">Y: {{ Math.round(selected.position.y) }}%</label>
              <input
                type="range" min="0" max="100"
                :value="selected.position.y"
                class="sec__slider"
                @input="updateTracked(selected.id, { position: { x: selected.position.x, y: Number(($event.target as HTMLInputElement).value) } })"
              />
            </div>
          </div>

          <div class="lq-field lq-field--sm">
            <label class="lq-label">热点大小: {{ selected.size ?? 48 }}px</label>
            <input
              type="range" min="24" max="96"
              :value="selected.size ?? 48"
              class="sec__slider"
              @input="updateTracked(selected.id, { size: Number(($event.target as HTMLInputElement).value) })"
            />
          </div>

          <div class="lq-field lq-field--sm">
            <label class="lq-label">描述（查看时显示）</label>
            <input
              :value="selected.description ?? ''"
              class="lq-input lq-input--sm"
              placeholder="物品描述"
              @input="updateTracked(selected.id, { description: ($event.target as HTMLInputElement).value })"
            />
          </div>

          <div class="lq-field lq-field--sm">
            <label class="lq-label">交互后文本</label>
            <input
              :value="selected.revealText ?? ''"
              class="lq-input lq-input--sm"
              placeholder="交互后显示的文字"
              @input="updateTracked(selected.id, { revealText: ($event.target as HTMLInputElement).value })"
            />
          </div>

          <label class="lq-check">
            <input
              type="checkbox"
              :checked="selected.once ?? false"
              @change="updateTracked(selected.id, { once: ($event.target as HTMLInputElement).checked })"
            />
            <span>一次性交互（交互后消失）</span>
          </label>
        </div>
      </div>
    </transition>

    <!-- 操作提示 -->
    <div v-if="!selected && interactables.length > 0" class="sec__hint">
      <AppIcon name="info" :size="13" />
      <span>点击物品选中编辑 · 拖拽调整位置 · 方向键微调 · Delete 删除</span>
    </div>
  </div>
</template>

<style scoped>
.sec {
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-3);
}
.sec__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sec__count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* 画布 */
.sec__canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  overflow: hidden;
  background: #0e0c0a;
  cursor: default;
  touch-action: none;
  user-select: none;
}
.sec__bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}
.sec__bg-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%);
  pointer-events: none;
}

/* 物品标记 */
.sec__item {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 2px dashed transparent;
  border-radius: 50%;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--lq-dur) var(--lq-ease), box-shadow var(--lq-dur) var(--lq-ease);
  touch-action: none;
}
.sec__item:hover {
  border-color: var(--lq-gold);
}
.sec__item--selected {
  border-color: var(--lq-wine);
  border-style: solid;
  box-shadow: 0 0 12px rgba(122, 46, 46, 0.4);
}
.sec__item--dragging {
  cursor: grabbing;
  border-color: var(--lq-wine);
  border-style: solid;
  box-shadow: 0 0 16px rgba(122, 46, 46, 0.6);
  z-index: 10;
}
.sec__item-icon {
  width: 55%;
  height: 55%;
  object-fit: contain;
  pointer-events: none;
  opacity: 0.85;
}
.sec__item-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--lq-gold);
  white-space: nowrap;
  background: rgba(14, 12, 10, 0.85);
  padding: 1px 6px;
  border-radius: 999px;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}
.sec__item-pos {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: var(--lq-ink-faint);
  font-family: var(--lq-font-mono);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--lq-dur) var(--lq-ease);
}
.sec__item--selected .sec__item-pos,
.sec__item--dragging .sec__item-pos {
  opacity: 1;
}

/* 空状态 */
.sec__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lq-space-2);
  color: var(--lq-ink-faint);
  pointer-events: none;
}
.sec__empty p {
  margin: 0;
  font-size: var(--lq-fs-sm);
}

/* 属性面板 */
.sec__props {
  background: var(--lq-paper);
  border: 1px solid var(--lq-wine);
  border-radius: var(--lq-radius-md);
  overflow: hidden;
}
.sec__props-head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  padding: var(--lq-space-2) var(--lq-space-3);
  background: var(--lq-wine-dim);
  border-bottom: 1px solid var(--lq-line);
}
.sec__props-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}
.sec__props-title {
  flex: 1;
  font-size: var(--lq-fs-sm);
  font-weight: 600;
  color: var(--lq-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sec__props-body {
  padding: var(--lq-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-2);
}
.sec__props-row {
  display: flex;
  gap: var(--lq-space-2);
}
.sec__props-row > * { flex: 1; }
.sec__slider {
  width: 100%;
  accent-color: var(--lq-wine);
}

/* 提示 */
.sec__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  padding: var(--lq-space-2);
  background: var(--lq-paper);
  border-radius: var(--lq-radius-md);
  line-height: 1.5;
}

@media (max-width: 600px) {
  .sec__item-label { font-size: 9px; }
  .sec__hint { font-size: 10px; }
  .sec__canvas { min-height: 220px; }
  .sec__item { min-width: 44px; min-height: 44px; }
}
</style>
