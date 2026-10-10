<script setup lang="ts">
import { usePlayStore } from '@/stores/play'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()

function pick(id: string) {
  play.choose(id)
}
</script>

<template>
  <div class="choices">
    <button
      v-for="c in play.availableChoices"
      :key="c.id"
      class="choices__btn"
      @click="pick(c.id)"
    >
      <span class="choices__marker">
        <AppIcon name="chevronRight" :size="16" />
      </span>
      <span class="choices__label">{{ c.label }}</span>
      <span v-if="c.description" class="choices__desc">{{ c.description }}</span>
    </button>
    <div v-if="play.availableChoices.length === 0 && !play.isEnded" class="choices__empty">
      <AppIcon name="alert" :size="20" />
      <p>没有可用的行动选项。这可能是一个未完成的分支。</p>
      <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="play.reset">重新开始</button>
    </div>
  </div>
</template>

<style scoped>
.choices {
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-2);
}
.choices__btn {
  display: flex;
  align-items: center;
  gap: var(--lq-space-3);
  padding: var(--lq-space-3) var(--lq-space-4);
  border-radius: var(--lq-radius-md);
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  color: var(--lq-ink);
  font-family: var(--lq-font-ui);
  font-size: var(--lq-fs-base);
  cursor: pointer;
  text-align: left;
  transition: all var(--lq-dur) var(--lq-ease);
  width: 100%;
}
.choices__btn:hover {
  border-color: var(--lq-wine);
  background: var(--lq-wine-dim);
  transform: translateX(4px);
}
.choices__btn:focus-visible {
  outline: 2px solid var(--lq-wine);
  outline-offset: 2px;
}
.choices__marker {
  display: inline-flex;
  color: var(--lq-wine);
  flex-shrink: 0;
}
.choices__label { flex: 1; }
.choices__desc { font-size: var(--lq-fs-xs); color: var(--lq-ink-faint); }
.choices__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lq-space-2);
  padding: var(--lq-space-6);
  color: var(--lq-ink-faint);
  text-align: center;
}
.choices__empty p { margin: 0; font-size: var(--lq-fs-sm); }
</style>
