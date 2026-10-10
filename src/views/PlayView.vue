<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayStore, getSessions, loadSessionState } from '@/stores/play'
import { useUI } from '@/stores/ui'
import { getAdventure } from '@/storage/database'
import { NodeType, type PlaySession } from '@/types/adventure'
import SceneView from '@/components/game/SceneView.vue'
import ChoiceList from '@/components/game/ChoiceList.vue'
import PuzzleInput from '@/components/game/PuzzleInput.vue'
import EndingScreen from '@/components/game/EndingScreen.vue'
import InventoryBar from '@/components/game/InventoryBar.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const play = usePlayStore()
const ui = useUI()

const id = computed(() => route.params.id as string)
const loaded = ref(false)
const loadError = ref('')
const showHistory = ref(false)
const showResumePrompt = ref(false)
const pendingSession = ref<PlaySession | null>(null)

const node = computed(() => play.currentNode)
const isPuzzle = computed(() => node.value?.type === NodeType.Puzzle)
const isEnding = computed(() => node.value?.type === NodeType.Ending)

onMounted(async () => {
  try {
    const adv = await getAdventure(id.value)
    if (!adv) {
      loadError.value = '作品不存在，可能已被删除。'
      return
    }
    // 检查是否有存档
    const sessions = await getSessions(adv.meta.id)
    if (sessions.length > 0) {
      pendingSession.value = sessions[0]
      showResumePrompt.value = true
      play.start(adv) // 先初始化，等待用户选择
      loaded.value = true
    } else {
      play.start(adv)
      loaded.value = true
    }
  } catch (e) {
    loadError.value = (e as Error).message
  }
})

async function resumeGame() {
  if (!pendingSession.value) return
  const adv = play.adventure
  if (!adv) return
  const state = await loadSessionState(pendingSession.value.id)
  if (state) {
    play.resume(adv, state, pendingSession.value.id)
    ui.success('已恢复上次进度')
  }
  showResumePrompt.value = false
}

function startFresh() {
  if (play.adventure) play.start(play.adventure)
  showResumePrompt.value = false
}

function backHome() {
  router.push({ name: 'home' })
}

function backEditor() {
  router.push({ name: 'editor', params: { id: id.value } })
}

async function saveProgress() {
  await play.saveProgress()
}

function restart() {
  play.reset()
  ui.info('已重新开始')
}

function fmtLogTime(_idx: number): string {
  return ''
}
void fmtLogTime
</script>

<template>
  <div class="play">
    <!-- 错误 -->
    <div v-if="loadError" class="play__error">
      <AppIcon name="alert" :size="32" />
      <p>{{ loadError }}</p>
      <button class="lq-btn" @click="backHome">返回首页</button>
    </div>

    <!-- 加载中 -->
    <div v-else-if="!loaded" class="play__loading">
      <span class="lq-spin"></span>
      <p>正在加载作品…</p>
    </div>

    <!-- 游戏界面 -->
    <div v-else class="play__wrap">
      <header class="play__top">
        <div class="play__top-left">
          <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="backHome">
            <AppIcon name="arrowLeft" :size="14" />
            <span>首页</span>
          </button>
          <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="backEditor">
            <AppIcon name="edit" :size="14" />
            <span>编辑</span>
          </button>
        </div>
        <h1 class="play__title">{{ play.adventure?.meta.title }}</h1>
        <div class="play__top-right">
          <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="showHistory = !showHistory">
            <AppIcon name="clock" :size="14" />
            <span>记录</span>
          </button>
          <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="saveProgress">
            <AppIcon name="save" :size="14" />
            <span>存档</span>
          </button>
          <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="restart">
            <AppIcon name="refresh" :size="14" />
            <span>重开</span>
          </button>
        </div>
      </header>

      <main class="play__main">
        <InventoryBar />

        <SceneView />

        <div class="play__action">
          <EndingScreen v-if="isEnding" />
          <template v-else>
            <PuzzleInput v-if="isPuzzle" />
            <ChoiceList v-else />
          </template>
        </div>

        <div v-if="play.message && !isEnding" class="play__msg lq-alert lq-alert--info">
          <AppIcon name="info" :size="14" />
          <span>{{ play.message }}</span>
        </div>
      </main>

      <!-- 历史记录抽屉 -->
      <transition name="lq-transition-fade">
        <div v-if="showHistory" class="play__history" @click.self="showHistory = false">
          <div class="play__history-panel lq-fade">
            <div class="play__history-head">
              <h3>行动记录</h3>
              <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="showHistory = false">
                <AppIcon name="close" :size="16" />
              </button>
            </div>
            <div class="play__history-body">
              <p v-for="(line, i) in play.log" :key="i" class="play__history-item">
                <span class="play__history-n">{{ i + 1 }}</span>
                <span>{{ line }}</span>
              </p>
            </div>
          </div>
        </div>
      </transition>

      <!-- 恢复存档提示 -->
      <transition name="lq-transition-fade">
        <div v-if="showResumePrompt" class="play__resume">
          <div class="play__resume-panel lq-fade">
            <AppIcon name="clock" :size="28" />
            <h3>发现上次存档</h3>
            <p>是否从上次进度继续？</p>
            <div class="play__resume-actions">
              <button class="lq-btn" @click="resumeGame">
                <AppIcon name="arrowRight" :size="15" />
                <span>继续游玩</span>
              </button>
              <button class="lq-btn lq-btn--ghost" @click="startFresh">从头开始</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.play {
  min-height: 100vh;
  background: var(--lq-paper);
}
.play__error,
.play__loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lq-space-4);
  color: var(--lq-ink-soft);
}
.play__wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.play__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lq-space-3);
  padding: var(--lq-space-3) var(--lq-space-5);
  background: var(--lq-paper-2);
  border-bottom: 1px solid var(--lq-line);
  flex-shrink: 0;
}
.play__top-left,
.play__top-right {
  display: flex;
  gap: var(--lq-space-2);
}
.play__title {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-md);
  margin: 0;
  text-align: center;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.play__main {
  flex: 1;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: var(--lq-space-6) var(--lq-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-5);
}
.play__action { min-height: 60px; }
.play__msg {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
}

.play__history {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(28, 26, 23, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
}
.play__history-panel {
  width: min(360px, 90vw);
  height: 100%;
  background: var(--lq-paper);
  border-left: 1px solid var(--lq-line);
  display: flex;
  flex-direction: column;
}
.play__history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lq-space-4) var(--lq-space-5);
  border-bottom: 1px solid var(--lq-line);
}
.play__history-head h3 { margin: 0; }
.play__history-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--lq-space-4);
}
.play__history-item {
  display: flex;
  gap: var(--lq-space-3);
  font-size: var(--lq-fs-sm);
  color: var(--lq-ink-soft);
  padding: var(--lq-space-2) 0;
  border-bottom: 1px solid var(--lq-line-soft);
  margin: 0;
}
.play__history-n {
  font-family: var(--lq-font-mono);
  font-size: 11px;
  color: var(--lq-ink-faint);
  flex-shrink: 0;
}

.play__resume {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(28, 26, 23, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--lq-space-4);
}
.play__resume-panel {
  width: min(380px, 94vw);
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  box-shadow: var(--lq-shadow-lg);
  padding: var(--lq-space-8) var(--lq-space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lq-space-2);
  color: var(--lq-wine);
}
.play__resume-panel h3 { margin: var(--lq-space-3) 0 0; color: var(--lq-ink); }
.play__resume-panel p { color: var(--lq-ink-soft); margin: 0 0 var(--lq-space-4); }
.play__resume-actions { display: flex; gap: var(--lq-space-2); flex-wrap: wrap; justify-content: center; }

@media (max-width: 600px) {
  .play__top { padding: var(--lq-space-2) var(--lq-space-3); }
  .play__top-right .lq-btn span { display: none; }
  .play__main { padding: var(--lq-space-4) var(--lq-space-3); }
}
</style>
