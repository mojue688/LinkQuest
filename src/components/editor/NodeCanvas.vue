<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  VueFlow,
  useVueFlow,
  MarkerType,
  type Connection,
  type NodeMouseEvent,
  type EdgeMouseEvent,
} from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useAdventureStore } from '@/stores/adventure'
import {
  NodeType,
  type Adventure,
  type ID,
  type SceneNode,
} from '@/types/adventure'
import SceneNodeCard from './SceneNodeCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const store = useAdventureStore()

const nodes = computed(() =>
  (store.current?.nodes ?? []).map((n: SceneNode) => ({
    id: n.id,
    type: 'lqNode',
    position: { ...n.position },
    data: { nodeType: n.type, title: n.content.title },
    selected: n.id === store.selectedNodeId,
  }))
)

const edges = computed(() =>
  (store.current?.choices ?? []).map((c) => ({
    id: c.id,
    source: c.fromNodeId,
    target: c.toNodeId,
    label: c.label,
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: 'var(--lq-ink-faint)', strokeWidth: 1.5 },
  }))
)

const {
  onConnect,
  onNodeDragStop,
  onNodeClick,
  onPaneClick,
  onEdgeClick,
  fitView,
  zoomIn,
  zoomOut,
  findNode,
} = useVueFlow()

onConnect((params: Connection) => {
  if (!params.source || !params.target) return
  if (params.source === params.target) return
  store.addChoice(params.source, params.target, '继续')
})

onNodeDragStop((evt: NodeMouseEvent) => {
  store.commitNodePosition(evt.node.id, { ...evt.node.position })
})

onNodeClick((evt: NodeMouseEvent) => {
  store.selectNode(evt.node.id)
})

onEdgeClick((evt: EdgeMouseEvent) => {
  store.selectNode(evt.edge.source as string)
})

onPaneClick(() => {
  store.selectNode(null)
})

/* ---------- 画布操作 ---------- */
function zoomFit() {
  fitView({ padding: 0.2, duration: 300 })
}
function zoomInFn() {
  zoomIn({ duration: 200 })
}
function zoomOutFn() {
  zoomOut({ duration: 200 })
}

/** 居中定位到指定节点 */
function focusNode(id: ID) {
  store.selectNode(id)
  nextTick(() => {
    const n = findNode(id)
    if (n) {
      fitView({ nodes: [id], padding: 0.6, duration: 300 })
    }
  })
}

/** 定位起始节点 */
function focusStart() {
  if (!store.current) return
  focusNode(store.current.startNodeId)
}

/** 结局节点列表 */
const endingNodes = computed(() =>
  (store.current?.nodes ?? []).filter((n) => n.type === NodeType.Ending)
)

/* ---------- 搜索 ---------- */
const searchQuery = ref('')
const searchOpen = ref(false)
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return (store.current?.nodes ?? [])
    .filter((n) => n.content.title.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
    .slice(0, 12)
})
function onSearchFocus() {
  searchOpen.value = true
}
function onSearchBlur() {
  setTimeout(() => { searchOpen.value = false }, 150)
}
function jumpTo(id: ID) {
  focusNode(id)
  searchOpen.value = false
  searchQuery.value = ''
}

/* ---------- 自动布局（轻量分层，不引入依赖） ---------- */
function autoLayout() {
  if (!store.current) return
  store.snapshot()
  const positions = computeLayeredLayout(store.current)
  for (const node of store.current.nodes) {
    const p = positions[node.id]
    if (p) node.position = p
  }
  store.dirty = true
  store.revalidate()
  nextTick(() => fitView({ padding: 0.2, duration: 400 }))
}

function computeLayeredLayout(adv: Adventure): Record<ID, { x: number; y: number }> {
  const layers = bfsLayers(adv)
  const maxLayer = Math.max(0, ...layers.values())
  for (const n of adv.nodes) {
    if (!layers.has(n.id)) layers.set(n.id, maxLayer + 1)
  }
  const byLayer = new Map<number, ID[]>()
  for (const [id, l] of layers) {
    if (!byLayer.has(l)) byLayer.set(l, [])
    byLayer.get(l)!.push(id)
  }
  const positions: Record<ID, { x: number; y: number }> = {}
  const layerGapX = 300
  const nodeGapY = 150
  for (const [l, ids] of byLayer) {
    const count = ids.length
    ids.forEach((id, i) => {
      positions[id] = {
        x: 80 + l * layerGapX,
        y: 80 + i * nodeGapY + (count === 1 ? 120 : 0),
      }
    })
  }
  return positions
}

function bfsLayers(adv: Adventure): Map<ID, number> {
  const layers = new Map<ID, number>()
  const queue: ID[] = [adv.startNodeId]
  layers.set(adv.startNodeId, 0)
  while (queue.length) {
    const cur = queue.shift()!
    const curLayer = layers.get(cur)!
    const outs = adv.choices.filter((c) => c.fromNodeId === cur)
    for (const c of outs) {
      if (!layers.has(c.toNodeId)) {
        layers.set(c.toNodeId, curLayer + 1)
        queue.push(c.toNodeId)
      }
    }
  }
  return layers
}

function cardData(data: unknown): { nodeType: NodeType; title: string } {
  return data as { nodeType: NodeType; title: string }
}

defineExpose({ focusNode, autoLayout, zoomFit })
</script>

<template>
  <div class="canvas">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.3"
      :max-zoom="2"
      fit-view-on-init
      class="canvas__flow"
    >
      <template #node-lqNode="props">
        <SceneNodeCard
          :data="cardData(props.data)"
          :selected="props.selected"
        />
      </template>
    </VueFlow>

    <!-- 搜索框 -->
    <div class="canvas__search">
      <AppIcon name="search" :size="14" />
      <input
        v-model="searchQuery"
        class="canvas__search-input"
        placeholder="搜索节点…"
        @focus="onSearchFocus"
        @blur="onSearchBlur"
      />
      <transition name="lq-transition-fade">
        <div v-if="searchOpen && searchResults.length" class="canvas__search-results">
          <button
            v-for="n in searchResults"
            :key="n.id"
            class="canvas__search-item"
            @mousedown.prevent="jumpTo(n.id)"
          >
            <span class="canvas__search-type" :class="`is-${n.type}`">{{ n.type }}</span>
            <span class="canvas__search-title">{{ n.content.title || '未命名' }}</span>
          </button>
        </div>
      </transition>
      <div v-if="searchOpen && searchQuery && !searchResults.length" class="canvas__search-empty">
        无匹配节点
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="canvas__toolbar">
      <button class="canvas__tool" title="放大" @click="zoomInFn">
        <AppIcon name="zoomIn" :size="15" />
      </button>
      <button class="canvas__tool" title="缩小" @click="zoomOutFn">
        <AppIcon name="zoomOut" :size="15" />
      </button>
      <button class="canvas__tool" title="适应全部节点" @click="zoomFit">
        <AppIcon name="fit" :size="15" />
      </button>
      <span class="canvas__tool-divider"></span>
      <button class="canvas__tool" title="定位起始节点" @click="focusStart">
        <AppIcon name="play" :size="15" />
      </button>
      <button class="canvas__tool" title="自动整理布局" @click="autoLayout">
        <AppIcon name="shuffle" :size="15" />
      </button>
    </div>

    <!-- 结局定位 -->
    <div v-if="endingNodes.length" class="canvas__endings">
      <select
        class="canvas__endings-select"
        @change="(e) => { const v = (e.target as HTMLSelectElement).value; if (v) focusNode(v); (e.target as HTMLSelectElement).value = '' }"
      >
        <option value="">定位结局…</option>
        <option v-for="n in endingNodes" :key="n.id" :value="n.id">{{ n.content.title || '未命名结局' }}</option>
      </select>
    </div>

    <div class="canvas__hint">
      <AppIcon name="info" :size="12" />
      <span>拖拽移动 · 拖拽右侧锚点连接 · 点击编辑</span>
    </div>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  height: 100%;
  width: 100%;
  background: var(--lq-paper);
  background-image: radial-gradient(circle, var(--lq-line) 1px, transparent 1px);
  background-size: 22px 22px;
  border-radius: var(--lq-radius-lg);
  overflow: hidden;
  border: 1px solid var(--lq-line);
}
.canvas__flow {
  height: 100%;
  width: 100%;
}

/* 搜索 */
.canvas__search {
  position: absolute;
  left: var(--lq-space-3);
  top: var(--lq-space-3);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  box-shadow: var(--lq-shadow-sm);
  z-index: 5;
}
.canvas__search-input {
  border: none;
  background: none;
  outline: none;
  color: var(--lq-ink);
  font-size: var(--lq-fs-sm);
  width: 130px;
  font-family: var(--lq-font-ui);
}
.canvas__search-input::placeholder { color: var(--lq-ink-faint); }
.canvas__search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  box-shadow: var(--lq-shadow-lg);
  max-height: 280px;
  overflow-y: auto;
  z-index: 10;
}
.canvas__search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--lq-ink);
  font-size: var(--lq-fs-sm);
}
.canvas__search-item:hover { background: var(--lq-paper-2); }
.canvas__search-type {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: var(--lq-radius);
  background: var(--lq-paper-3);
  color: var(--lq-ink-faint);
  text-transform: uppercase;
  flex-shrink: 0;
}
.canvas__search-type.is-start { color: var(--lq-moss); }
.canvas__search-type.is-puzzle { color: var(--lq-rust); }
.canvas__search-type.is-ending { color: var(--lq-wine); }
.canvas__search-type.is-clue { color: var(--lq-gold); }
.canvas__search-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas__search-empty {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  padding: 8px 10px;
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  z-index: 10;
}

/* 工具栏 */
.canvas__toolbar {
  position: absolute;
  right: var(--lq-space-3);
  top: var(--lq-space-3);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  padding: 4px;
  box-shadow: var(--lq-shadow-sm);
  z-index: 5;
}
.canvas__tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--lq-ink-soft);
  border-radius: var(--lq-radius);
  cursor: pointer;
  transition: all var(--lq-dur) var(--lq-ease);
}
.canvas__tool:hover {
  background: var(--lq-paper-3);
  color: var(--lq-ink);
}
.canvas__tool-divider {
  height: 1px;
  background: var(--lq-line);
  margin: 2px 4px;
}

/* 结局定位 */
.canvas__endings {
  position: absolute;
  right: var(--lq-space-3);
  top: calc(var(--lq-space-3) + 140px);
  z-index: 5;
}
.canvas__endings-select {
  padding: 5px 8px;
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  color: var(--lq-ink-soft);
  font-size: var(--lq-fs-xs);
  cursor: pointer;
  box-shadow: var(--lq-shadow-sm);
}

.canvas__hint {
  position: absolute;
  left: var(--lq-space-3);
  bottom: var(--lq-space-3);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  font-size: 11px;
  color: var(--lq-ink-faint);
  z-index: 5;
}

@media (max-width: 768px) {
  .canvas__search-input { width: 90px; }
  .canvas__hint { display: none; }
  .canvas__endings { display: none; }
}
</style>
