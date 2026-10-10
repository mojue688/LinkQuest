<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayStore } from '@/stores/play'
import { PuzzleKind } from '@/types/adventure'
import NumberLockPuzzle from '@/components/game/NumberLockPuzzle.vue'
import SymbolSequencePuzzle from '@/components/game/SymbolSequencePuzzle.vue'
import PatternPuzzle from '@/components/game/PatternPuzzle.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()
const node = computed(() => play.currentNode)
const kind = computed(() => node.value?.puzzle?.kind ?? PuzzleKind.Text)
const answer = ref('')

function submit() {
  if (!answer.value.trim()) return
  const ok = play.solvePuzzle(answer.value)
  if (ok) answer.value = ''
}
</script>

<template>
  <div v-if="node?.puzzle">
    <NumberLockPuzzle v-if="kind === PuzzleKind.NumberLock" />
    <SymbolSequencePuzzle v-else-if="kind === PuzzleKind.SymbolSequence" />
    <PatternPuzzle v-else-if="kind === PuzzleKind.Pattern" />
    <div v-else class="puzzle">
      <div class="puzzle__panel">
        <div class="puzzle__head">
          <AppIcon name="key" :size="18" />
          <span>{{ node.puzzle.title || node.puzzle.prompt }}</span>
        </div>
        <p v-if="node.puzzle.story" class="puzzle__story">{{ node.puzzle.story }}</p>
        <div v-if="node.puzzle.requiredItems && node.puzzle.requiredItems.length" class="puzzle__req">
          <AppIcon name="info" :size="13" />
          <span>需要线索：{{ node.puzzle.requiredItems.map(k => play.adventure?.items.find(i => i.key === k)?.name ?? k).join('、') }}</span>
        </div>
        <div class="puzzle__row">
          <input
            v-model="answer"
            class="lq-input lq-input--mono puzzle__input"
            placeholder="输入答案……"
            autocomplete="off"
            @keyup.enter="submit"
          />
          <button class="lq-btn" @click="submit">
            <AppIcon name="arrowRight" :size="15" />
            <span>提交</span>
          </button>
        </div>
        <div v-if="play.puzzleError" class="puzzle__error">
          <AppIcon name="alert" :size="14" />
          <span>{{ play.puzzleError }}</span>
        </div>
        <p v-if="play.puzzleAttempts > 0 && !play.puzzleError" class="puzzle__attempts">
          已尝试 {{ play.puzzleAttempts }} 次
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.puzzle__panel {
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-rust);
  border-radius: var(--lq-radius-lg);
  padding: var(--lq-space-5);
}
.puzzle__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  color: var(--lq-rust);
  font-size: var(--lq-fs-sm);
  font-weight: 600;
  margin-bottom: var(--lq-space-3);
}
.puzzle__story {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-sm);
  line-height: 1.7;
  color: var(--lq-ink-soft);
  margin: 0 0 var(--lq-space-3);
  padding: var(--lq-space-2) var(--lq-space-3);
  background: var(--lq-paper);
  border-radius: var(--lq-radius-md);
  border-left: 3px solid var(--lq-rust);
  white-space: pre-wrap;
}
.puzzle__req {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--lq-space-3);
  padding: var(--lq-space-2) var(--lq-space-3);
  background: var(--lq-gold-dim);
  color: var(--lq-gold);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-xs);
}
.puzzle__row {
  display: flex;
  gap: var(--lq-space-2);
}
.puzzle__input { flex: 1; font-size: var(--lq-fs-md); }
.puzzle__error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--lq-space-3);
  padding: var(--lq-space-2) var(--lq-space-3);
  background: rgba(154, 50, 50, 0.08);
  color: var(--lq-bad);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-sm);
}
.puzzle__attempts {
  margin-top: var(--lq-space-2);
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
}
</style>
