<script setup lang="ts">
import { computed } from 'vue'
import { VueFlow, useVueFlow, MarkerType, type Connection, type NodeMouseEvent, type EdgeMouseEvent } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useAdventureStore } from '@/stores/adventure'
import { NodeType, type SceneNode } from '@/types/adventure'
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

const { onConnect, onNodeDragStop, onNodeClick, onPaneClick, onEdgeClick, fitView, zoomIn, zoomOut } =
  useVueFlow()

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

function zoomFit() {
  fitView()
}
function zoomInFn() {
  zoomIn()
}
function zoomOutFn() {
  zoomOut()
}

function cardData(data: unknown): { nodeType: NodeType; title: string } {
  return data as { nodeType: NodeType; title: string }
}

defineExpose({ zoomFit })
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
    <div class="canvas__toolbar">
      <button class="canvas__tool" title="放大" @click="zoomInFn">
        <AppIcon name="zoomIn" :size="15" />
      </button>
      <button class="canvas__tool" title="缩小" @click="zoomOutFn">
        <AppIcon name="zoomOut" :size="15" />
      </button>
      <button class="canvas__tool" title="适应画布" @click="zoomFit">
        <AppIcon name="fit" :size="15" />
      </button>
    </div>
    <div class="canvas__hint">
      <AppIcon name="info" :size="12" />
      <span>拖拽节点移动 · 拖拽右侧锚点连接分支 · 点击节点编辑</span>
    </div>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  height: 100%;
  width: 100%;
  background: var(--lq-paper);
  background-image:
    radial-gradient(circle, var(--lq-line) 1px, transparent 1px);
  background-size: 22px 22px;
  border-radius: var(--lq-radius-lg);
  overflow: hidden;
  border: 1px solid var(--lq-line);
}
.canvas__flow {
  height: 100%;
  width: 100%;
}
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
}
</style>
