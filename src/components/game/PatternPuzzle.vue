<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlayStore } from '@/stores/play'
import { resolveAsset } from '@/assets/registry'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()
const node = computed(() => play.currentNode)
const patterns = computed(() => node.value?.puzzle?.patterns ?? [])
const rawAnswer = computed(() => node.value?.puzzle?.answer ?? '')
const isSequence = computed(() => rawAnswer.value.includes(','))
const answerLen = computed(() => {
  if (isSequence.value) return rawAnswer.value.split(',').length
  return 1
})

const selected = ref<string[]>([])

watch(node, () => { selected.value = [] })

function toggle(pid: string) {
  const idx = selected.value.indexOf(pid)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else if (selected.value.length < answerLen.value) {
    selected.value.push(pid)
  }
}
function clear() {
  selected.value = []
}
function submit() {
  play.solvePuzzle(selected.value.join(','))
}

const pstate = computed(() => {
  if (!node.value) return { solved: false, attempts: 0 }
  return play.puzzleState(node.value.id)
})
</script>

<template>
  <div class="pp" v-if="node?.puzzle">
    <div class="pp__head">
      <AppIcon name="key" :size="18" />
      <span>{{ node.puzzle.title || node.puzzle.prompt }}</span>
    </div>
    <div class="pp__progress">
      <span>已选 {{ selected.length }} / {{ answerLen }}</span>
    </div>
    <div class="pp__grid">
      <button
        v-for="pid in patterns"
        :key="pid"
        class="pp__cell"
        :class="{ 'pp__cell--active': selected.includes(pid) }"
        @click="toggle(pid)"
      >
        <img :src="resolveAsset(pid, 'item:default')" class="pp__img" :alt="pid" />
        <span v-if="selected.includes(pid)" class="pp__order">{{ selected.indexOf(pid) + 1 }}</span>
      </button>
    </div>
    <div class="pp__actions">
      <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="clear" :disabled="!selected.length">
        <span>清空</span>
      </button>
      <button class="lq-btn" @click="submit" :disabled="selected.length < answerLen">
        <AppIcon name="arrowRight" :size="15" />
        <span>提交</span>
      </button>
    </div>
    <div v-if="play.puzzleError" class="pp__error">
      <AppIcon name="alert" :size="14" />
      <span>{{ play.puzzleError }}</span>
    </div>
    <p v-if="pstate.attempts > 0 && !play.puzzleError" class="pp__attempts">
      已尝试 {{ pstate.attempts }} 次
    </p>
  </div>
</template>

<style scoped>
.pp {
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-rust);
  border-radius: var(--lq-radius-lg);
  padding: var(--lq-space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lq-space-3);
}
.pp__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  color: var(--lq-rust);
  font-size: var(--lq-fs-sm);
  font-weight: 600;
}
.pp__progress {
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
}
.pp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: var(--lq-space-2);
  max-width: 360px;
}
.pp__cell {
  position: relative;
  aspect-ratio: 1;
  border: 2px solid var(--lq-line);
  border-radius: var(--lq-radius);
  background: var(--lq-paper);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--lq-dur) var(--lq-ease);
  padding: var(--lq-space-2);
}
.pp__cell:hover {
  border-color: var(--lq-gold);
}
.pp__cell--active {
  border-color: var(--lq-gold);
  background: var(--lq-gold-dim);
  box-shadow: 0 0 12px rgba(202,168,64,0.3);
}
.pp__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.pp__order {
  position: absolute;
  top: 2px;
  right: 4px;
  background: var(--lq-gold);
  color: var(--lq-paper);
  border-radius: 999px;
  width: 18px;
  height: 18px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.pp__actions {
  display: flex;
  gap: var(--lq-space-2);
}
.pp__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--lq-space-2) var(--lq-space-3);
  background: rgba(154, 50, 50, 0.08);
  color: var(--lq-bad);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-sm);
}
.pp__attempts {
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  margin: 0;
}
</style>
