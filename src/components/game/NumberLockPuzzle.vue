<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlayStore } from '@/stores/play'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()
const node = computed(() => play.currentNode)
const digits = computed(() => node.value?.puzzle?.digits ?? node.value?.puzzle?.answer.length ?? 3)
const digitsArr = computed(() => Array.from({ length: digits.value }, (_, i) => i))

const wheel = ref<number[]>(Array.from({ length: digits.value }, () => 0))

watch(digits, (n) => {
  wheel.value = Array.from({ length: n }, () => 0)
})

function roll(i: number, dir: number) {
  wheel.value[i] = (wheel.value[i] + dir + 10) % 10
}

function submit() {
  const answer = wheel.value.join('')
  play.solvePuzzle(answer)
}

const pstate = computed(() => {
  if (!node.value) return { solved: false, attempts: 0 }
  return play.puzzleState(node.value.id)
})
</script>

<template>
  <div class="nl" v-if="node?.puzzle">
    <div class="nl__head">
      <AppIcon name="lock" :size="18" />
      <span>{{ node.puzzle.title || node.puzzle.prompt }}</span>
    </div>
    <div class="nl__lock">
      <div class="nl__body">
        <div v-for="i in digitsArr" :key="i" class="nl__digit">
          <button class="nl__btn" @click="roll(i, 1)" tabindex="-1">
            <AppIcon name="chevronUp" :size="14" />
          </button>
          <div class="nl__wheel">{{ wheel[i] }}</div>
          <button class="nl__btn" @click="roll(i, -1)" tabindex="-1">
            <AppIcon name="chevronDown" :size="14" />
          </button>
        </div>
      </div>
      <div class="nl__shackle"></div>
    </div>
    <button class="lq-btn nl__submit" @click="submit">
      <AppIcon name="key" :size="15" />
      <span>开锁</span>
    </button>
    <div v-if="play.puzzleError" class="nl__error">
      <AppIcon name="alert" :size="14" />
      <span>{{ play.puzzleError }}</span>
    </div>
    <p v-if="pstate.attempts > 0 && !play.puzzleError" class="nl__attempts">
      已尝试 {{ pstate.attempts }} 次
    </p>
  </div>
</template>

<style scoped>
.nl {
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-rust);
  border-radius: var(--lq-radius-lg);
  padding: var(--lq-space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lq-space-3);
}
.nl__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  color: var(--lq-rust);
  font-size: var(--lq-fs-sm);
  font-weight: 600;
}
.nl__lock {
  position: relative;
  padding: var(--lq-space-4) var(--lq-space-5) var(--lq-space-5);
  background: linear-gradient(180deg, #3a3a3a, #2a2a2a);
  border-radius: var(--lq-radius-lg);
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3);
}
.nl__shackle {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 24px;
  border: 4px solid #6a6a6a;
  border-bottom: none;
  border-radius: 50% 50% 0 0;
  background: transparent;
}
.nl__body {
  display: flex;
  gap: var(--lq-space-2);
}
.nl__digit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.nl__btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--lq-radius);
  width: 28px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #aaa;
  transition: all var(--lq-dur) var(--lq-ease);
}
.nl__btn:hover {
  background: rgba(255,255,255,0.2);
  color: #fff;
}
.nl__wheel {
  width: 44px;
  height: 52px;
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: var(--lq-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--lq-font-mono);
  font-size: 28px;
  font-weight: 700;
  color: var(--lq-gold);
  text-shadow: 0 0 8px rgba(202,168,64,0.5);
}
.nl__submit { margin-top: var(--lq-space-2); }
.nl__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--lq-space-2) var(--lq-space-3);
  background: rgba(154, 50, 50, 0.08);
  color: var(--lq-bad);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-sm);
}
.nl__attempts {
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  margin: 0;
}
</style>
