<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { NodeType } from '@/types/adventure'
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  data: { nodeType: NodeType; title: string }
  selected?: boolean
}>()

const iconMap: Record<NodeType, string> = {
  [NodeType.Start]: 'play',
  [NodeType.Scene]: 'bookOpen',
  [NodeType.Clue]: 'search',
  [NodeType.Puzzle]: 'key',
  [NodeType.Ending]: 'flag',
}
</script>

<template>
  <div
    class="node"
    :class="[`node--${data.nodeType}`, { 'node--selected': selected }]"
  >
    <Handle type="target" :position="Position.Left" />
    <span class="node__icon">
      <AppIcon :name="iconMap[data.nodeType]" :size="14" />
    </span>
    <span class="node__title">{{ data.title || '未命名' }}</span>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.node {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  min-width: 110px;
  border-radius: var(--lq-radius-md);
  border: 1px solid var(--lq-line);
  background: var(--lq-paper);
  color: var(--lq-ink);
  font-size: var(--lq-fs-sm);
  font-family: var(--lq-font-ui);
  box-shadow: var(--lq-shadow-sm);
  transition: border-color var(--lq-dur) var(--lq-ease), box-shadow var(--lq-dur) var(--lq-ease);
}
.node__icon {
  display: inline-flex;
  color: var(--lq-ink-soft);
  flex-shrink: 0;
}
.node__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
  font-weight: 500;
}
.node--selected {
  border-color: var(--lq-wine);
  box-shadow: 0 0 0 2px var(--lq-wine-dim), var(--lq-shadow);
}
.node--start {
  border-color: var(--lq-moss);
  background: var(--lq-moss-dim);
}
.node--start .node__icon { color: var(--lq-moss); }
.node--puzzle {
  border-color: var(--lq-rust);
}
.node--puzzle .node__icon { color: var(--lq-rust); }
.node--ending {
  border-color: var(--lq-wine);
}
.node--ending .node__icon { color: var(--lq-wine); }
.node--clue .node__icon { color: var(--lq-gold); }
.node--scene .node__icon { color: var(--lq-slate); }
</style>
