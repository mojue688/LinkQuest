<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlayStore } from '@/stores/play'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()
const node = computed(() => play.currentNode)
const symbols = computed(() => node.value?.puzzle?.symbols ?? ['★', '☾', '☀', '⚡', '❄', '✦'])
const answerLen = computed(() => node.value?.puzzle?.answer.length ?? 4)

const sequence = ref<string[]>([])

watch(node, () => { sequence.value = [] })

function pick(sym: string) {
  if (sequence.value.length < answerLen.value) {
    sequence.value.push(sym)
  }
}
function pop() {
  sequence.value.pop()
}
function clear() {
  sequence.value = []
}
function submit() {
  play.solvePuzzle(sequence.value.join(''))
}

const pstate = computed(() => {
  if (!node.value) return { solved: false, attempts: 0 }
  return play.puzzleState(node.value.id)
})
</script>

<template>
  <div class="ss" v-if="node?.puzzle">
    <div class="ss__head">
      <AppIcon name="key" :size="18" />
      <span>{{ node.puzzle.title || node.puzzle.prompt }}</span>
    </div>
    <div class="ss__slots">
      <div
        v-for="i in answerLen"
        :key="i"
        class="ss__slot"
        :class="{ 'ss__slot--filled': sequence[i - 1] }"
      >
        {{ sequence[i - 1] || '·' }}
      </div>
    </div>
    <div class="ss__symbols">
      <button
        v-for="sym in symbols"
        :key="sym"
        class="ss__sym"
        @click="pick(sym)"
      >{{ sym }}</button>
    </div>
    <div class="ss__actions">
      <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="pop" :disabled="!sequence.length">
        <AppIcon name="arrowLeft" :size="14" />
        <span>删除</span>
      </button>
      <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="clear" :disabled="!sequence.length">
        <span>清空</span>
      </button>
      <button class="lq-btn" @click="submit" :disabled="sequence.length < answerLen">
        <AppIcon name="arrowRight" :size="15" />
        <span>提交</span>
      </button>
    </div>
    <div v-if="play.puzzleError" class="ss__error">
      <AppIcon name="alert" :size="14" />
      <span>{{ play.puzzleError }}</span>
    </div>
    <p v-if="pstate.attempts > 0 && !play.puzzleError" class="ss__attempts">
      已尝试 {{ pstate.attempts }} 次
    </p>
  </div>
</template>

<style scoped>
.ss {
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-rust);
  border-radius: var(--lq-radius-lg);
  padding: var(--lq-space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lq-space-3);
}
.ss__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  color: var(--lq-rust);
  font-size: var(--lq-fs-sm);
  font-weight: 600;
}
.ss__slots {
  display: flex;
  gap: var(--lq-space-2);
}
.ss__slot {
  width: 44px;
  height: 44px;
  border: 2px dashed var(--lq-line);
  border-radius: var(--lq-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--lq-ink-faint);
}
.ss__slot--filled {
  border-style: solid;
  border-color: var(--lq-gold);
  background: var(--lq-gold-dim);
  color: var(--lq-gold);
}
.ss__symbols {
  display: flex;
  gap: var(--lq-space-2);
  flex-wrap: wrap;
  justify-content: center;
}
.ss__sym {
  width: 48px;
  height: 48px;
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius);
  background: var(--lq-paper);
  font-size: 24px;
  cursor: pointer;
  transition: all var(--lq-dur) var(--lq-ease);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ss__sym:hover {
  border-color: var(--lq-gold);
  background: var(--lq-gold-dim);
  transform: translateY(-2px);
}
.ss__actions {
  display: flex;
  gap: var(--lq-space-2);
  flex-wrap: wrap;
  justify-content: center;
}
.ss__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--lq-space-2) var(--lq-space-3);
  background: rgba(154, 50, 50, 0.08);
  color: var(--lq-bad);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-sm);
}
.ss__attempts {
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  margin: 0;
}
</style>
