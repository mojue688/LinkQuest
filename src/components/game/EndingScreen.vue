<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayStore } from '@/stores/play'
import { EndingKind, NodeType } from '@/types/adventure'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()
const router = useRouter()

const node = computed(() => play.currentNode)
const kindLabel = computed(() => {
  const k = node.value?.endingKind
  const map: Record<EndingKind, string> = {
    [EndingKind.Good]: '圆满结局',
    [EndingKind.Neutral]: '普通结局',
    [EndingKind.Bad]: '悲剧结局',
    [EndingKind.Secret]: '隐藏结局',
  }
  return k ? map[k] : '结局'
})
const kindClass = computed(() => {
  const k = node.value?.endingKind
  return k ?? EndingKind.Neutral
})

function replay() {
  play.reset()
}
function backHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div
    v-if="node && node.type === NodeType.Ending"
    class="ending"
    :class="`ending--${kindClass}`"
  >
    <div class="ending__ornament">
      <span class="ending__ornament-line"></span>
      <AppIcon name="star" :size="28" />
      <span class="ending__ornament-line"></span>
    </div>
    <p class="ending__kind">{{ kindLabel }}</p>
    <h2 class="ending__title">{{ node.content.title }}</h2>
    <p class="ending__text">{{ node.content.text }}</p>
    <div class="ending__stats">
      <div class="ending__stat">
        <span class="ending__stat-n">{{ play.visitedCount }}</span>
        <span class="ending__stat-l">个场景</span>
      </div>
      <div class="ending__stat">
        <span class="ending__stat-n">{{ play.inventory.length }}</span>
        <span class="ending__stat-l">条线索</span>
      </div>
      <div class="ending__stat">
        <span class="ending__stat-n">{{ play.log.length }}</span>
        <span class="ending__stat-l">次行动</span>
      </div>
    </div>
    <div class="ending__actions">
      <button class="lq-btn lq-btn--lg" @click="replay">
        <AppIcon name="refresh" :size="16" />
        <span>重新游玩</span>
      </button>
      <button class="lq-btn lq-btn--ghost lq-btn--lg" @click="backHome">
        <AppIcon name="home" :size="16" />
        <span>返回首页</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ending {
  text-align: center;
  padding: var(--lq-space-10) var(--lq-space-6);
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
}
.ending--good { border-color: var(--lq-moss); }
.ending--bad { border-color: var(--lq-bad); }
.ending--secret { border-color: var(--lq-wine); }
.ending__ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--lq-space-3);
  color: var(--lq-wine);
  margin-bottom: var(--lq-space-4);
}
.ending__ornament-line {
  width: 48px;
  height: 1px;
  background: var(--lq-wine);
  opacity: 0.5;
}
.ending__kind {
  font-family: var(--lq-font-ui);
  font-size: var(--lq-fs-xs);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--lq-wine);
  margin: 0 0 var(--lq-space-2);
  font-weight: 600;
}
.ending__title {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-2xl);
  margin: 0 0 var(--lq-space-4);
}
.ending__text {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-md);
  line-height: 1.9;
  color: var(--lq-ink);
  white-space: pre-wrap;
  margin: 0 auto var(--lq-space-6);
  max-width: 560px;
}
.ending__stats {
  display: flex;
  justify-content: center;
  gap: var(--lq-space-8);
  margin-bottom: var(--lq-space-6);
}
.ending__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.ending__stat-n {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-xl);
  font-weight: 700;
  color: var(--lq-wine);
}
.ending__stat-l { font-size: var(--lq-fs-xs); color: var(--lq-ink-faint); }
.ending__actions {
  display: flex;
  gap: var(--lq-space-3);
  justify-content: center;
  flex-wrap: wrap;
}
</style>
