<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayStore } from '@/stores/play'
import { NodeType, InteractAction, type Interactable } from '@/types/adventure'
import { resolveAsset } from '@/assets/registry'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()
const node = computed(() => play.currentNode)
const isPuzzle = computed(() => node.value?.type === NodeType.Puzzle)
const isEnding = computed(() => node.value?.type === NodeType.Ending)
const isClue = computed(() => node.value?.type === NodeType.Clue)

const bgSrc = computed(() => {
  const bg = node.value?.content.background
  return resolveAsset(bg, 'bg:default')
})
const charSrc = computed(() => {
  const cid = node.value?.content.characterId
  if (!cid) return ''
  return resolveAsset(cid, 'char:silhouette')
})
const interactables = computed(() => play.visibleInteractables)

function itemIcon(it: Interactable): string {
  return resolveAsset(it.icon, 'item:default')
}

/* ---------- 物品状态 ---------- */
type ItemStatus = 'default' | 'inspected' | 'collected' | 'used'

function itemStatus(it: Interactable): ItemStatus {
  if (!node.value) return 'default'
  const interacted = play.isInteracted(node.value.id, it.id)
  if (!interacted) return 'default'
  if (it.action === InteractAction.CollectClue || it.action === InteractAction.GiveItem) return 'collected'
  if (it.action === InteractAction.GoToNode) return 'used'
  return 'inspected'
}

/* ---------- 调查详情面板 ---------- */
const investigateItem = ref<Interactable | null>(null)
const investigateResult = ref<{ message: string; collected: boolean; navigated: boolean } | null>(null)
const showClueAnimation = ref(false)

function onInteract(it: Interactable) {
  investigateItem.value = it
  play.interact(it.id)
  investigateResult.value = {
    message: play.interactMessage,
    collected: play.interactCollected,
    navigated: play.log.length > 0 && play.log[play.log.length - 1].startsWith('前往'),
  }
  if (play.interactCollected) {
    showClueAnimation.value = true
    setTimeout(() => { showClueAnimation.value = false }, 1200)
  }
  if (investigateResult.value.navigated) {
    setTimeout(() => { closeInvestigate() }, 800)
  }
}

function closeInvestigate() {
  investigateItem.value = null
  investigateResult.value = null
  play.clearInteractMessage()
}

watch(node, () => { closeInvestigate() })

/* ---------- 图片加载失败 ---------- */
const bgError = ref(false)
const charError = ref(false)
watch(bgSrc, () => { bgError.value = false })
watch(charSrc, () => { charError.value = false })

function onBgError() { bgError.value = true }
function onCharError() { charError.value = true }

/* ---------- 移动端检测 ---------- */
const isTouch = ref(false)
if (typeof window !== 'undefined') {
  isTouch.value = window.matchMedia('(hover: none)').matches
}
</script>

<template>
  <transition name="scene" mode="out-in">
    <div
      v-if="node"
      :key="node.id"
      class="scene"
      :class="{
        'scene--ending': isEnding,
        'scene--puzzle': isPuzzle,
        'scene--clue': isClue,
        'scene--touch': isTouch,
      }"
    >
      <!-- 背景图层 -->
      <div class="scene__bg-wrap">
        <img
          v-if="!bgError"
          :src="bgSrc"
          class="scene__bg"
          alt="场景背景"
          @error="onBgError"
        />
        <div v-else class="scene__bg-fallback">
          <AppIcon name="alert" :size="32" />
          <span>场景背景加载失败</span>
        </div>
        <div class="scene__bg-vignette"></div>
        <div v-if="node.content.atmosphere" class="scene__atmosphere">
          <AppIcon name="sparkles" :size="12" />
          <span>{{ node.content.atmosphere }}</span>
        </div>
      </div>

      <!-- 可交互物品层 -->
      <div v-if="interactables.length" class="scene__hotspots">
        <button
          v-for="it in interactables"
          :key="it.id"
          class="scene__hotspot"
          :class="`scene__hotspot--${itemStatus(it)}`"
          :style="{
            left: `${it.position.x}%`,
            top: `${it.position.y}%`,
            width: `${it.size ?? 48}px`,
            height: `${it.size ?? 48}px`,
          }"
          :aria-label="it.name"
          @click="onInteract(it)"
        >
          <img :src="itemIcon(it)" class="scene__hotspot-icon" :alt="it.name" />
          <span class="scene__hotspot-ring"></span>
          <span class="scene__hotspot-label">{{ it.name }}</span>
          <span v-if="itemStatus(it) === 'collected'" class="scene__hotspot-badge">
            <AppIcon name="check" :size="10" />
          </span>
          <span v-else-if="itemStatus(it) === 'inspected'" class="scene__hotspot-badge scene__hotspot-badge--inspected">
            <AppIcon name="check" :size="10" />
          </span>
          <span v-else-if="itemStatus(it) === 'used'" class="scene__hotspot-badge scene__hotspot-badge--used">
            <AppIcon name="arrowRight" :size="10" />
          </span>
        </button>
      </div>

      <!-- 角色立绘层 -->
      <div v-if="charSrc && !charError" class="scene__char">
        <img :src="charSrc" class="scene__char-img" alt="角色" @error="onCharError" />
      </div>

      <!-- 文本/对白层 -->
      <div class="scene__overlay">
        <div v-if="node.content.speaker" class="scene__speaker">
          {{ node.content.speaker }}
        </div>
        <h2 class="scene__title">{{ node.content.title }}</h2>
        <div class="scene__divider">
          <span class="scene__divider-mark"></span>
        </div>
        <p v-if="node.content.dialogue && charSrc" class="scene__dialogue">
          {{ node.content.dialogue }}
        </p>
        <p class="scene__text">{{ node.content.text }}</p>

        <div v-if="isPuzzle && node.puzzle" class="scene__badge">
          <span class="lq-badge lq-badge--rust">密码谜题</span>
          <span class="scene__badge-text">{{ node.puzzle.prompt }}</span>
        </div>
        <div v-if="isClue" class="scene__badge">
          <span class="lq-badge lq-badge--gold">线索发现</span>
          <span class="scene__badge-text">你获得了一条新的线索。</span>
        </div>
        <div v-if="isEnding" class="scene__ending-mark">— 故事结束 —</div>
      </div>

      <!-- 调查详情面板 -->
      <transition name="investigate">
        <div
          v-if="investigateItem && investigateResult"
          class="investigate"
          :class="{ 'investigate--collected': investigateResult.collected }"
        >
          <div class="investigate__backdrop" @click="closeInvestigate"></div>
          <div class="investigate__panel">
            <div class="investigate__head">
              <img
                :src="itemIcon(investigateItem)"
                class="investigate__icon"
                :alt="investigateItem.name"
              />
              <div class="investigate__title-wrap">
                <h3 class="investigate__title">{{ investigateItem.name }}</h3>
                <span v-if="investigateResult.collected" class="investigate__tag investigate__tag--gold">
                  <AppIcon name="star" :size="11" />
                  <span>已收集</span>
                </span>
                <span v-else-if="investigateResult.navigated" class="investigate__tag investigate__tag--wine">
                  <AppIcon name="arrowRight" :size="11" />
                  <span>前往中</span>
                </span>
                <span v-else class="investigate__tag investigate__tag--slate">
                  <AppIcon name="search" :size="11" />
                  <span>已调查</span>
                </span>
              </div>
              <button class="investigate__close" @click="closeInvestigate">
                <AppIcon name="close" :size="16" />
              </button>
            </div>
            <div class="investigate__body">
              <p v-if="investigateItem.description && investigateItem.description !== investigateResult.message" class="investigate__desc">
                {{ investigateItem.description }}
              </p>
              <p class="investigate__result">{{ investigateResult.message }}</p>
            </div>
            <div class="investigate__actions">
              <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="closeInvestigate">
                <span>关闭</span>
              </button>
            </div>
          </div>
          <!-- 线索发现动画 -->
          <transition name="clue-fx">
            <div v-if="showClueAnimation" class="investigate__clue-fx">
              <span class="investigate__clue-particle" v-for="i in 8" :key="i" :style="{ '--i': i }"></span>
            </div>
          </transition>
        </div>
      </transition>

      <!-- 交互反馈浮层（轻量提示，非调查面板） -->
      <transition name="lq-transition-fade">
        <div
          v-if="play.interactMessage && !investigateItem"
          class="scene__interact-feedback"
          :class="{ 'scene__interact-feedback--collected': play.interactCollected }"
          @click="play.clearInteractMessage()"
        >
          <AppIcon :name="play.interactCollected ? 'star' : 'info'" :size="16" />
          <span>{{ play.interactMessage }}</span>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.scene {
  position: relative;
  border-radius: var(--lq-radius-lg);
  overflow: hidden;
  border: 1px solid var(--lq-line);
  background: var(--lq-ink-deep, #0e0c0a);
  min-height: 320px;
  display: flex;
  flex-direction: column;
}
.scene--ending { border-color: var(--lq-wine); }
.scene--puzzle { border-color: var(--lq-rust); }
.scene--clue { border-color: var(--lq-gold); }

/* 背景图层 */
.scene__bg-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  flex-shrink: 0;
  overflow: hidden;
}
.scene__bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.scene__bg-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lq-space-2);
  background: linear-gradient(135deg, #1c1a17, #0e0c0a);
  color: var(--lq-ink-faint);
  font-size: var(--lq-fs-sm);
}
.scene__bg-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%);
  pointer-events: none;
}
.scene__atmosphere {
  position: absolute;
  top: var(--lq-space-3);
  right: var(--lq-space-3);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(14, 12, 10, 0.7);
  border-radius: 999px;
  color: var(--lq-gold);
  font-size: var(--lq-fs-xs);
  letter-spacing: 0.08em;
  backdrop-filter: blur(4px);
  z-index: 3;
}

/* 可交互物品层 */
.scene__hotspots {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  pointer-events: none;
  z-index: 2;
}
.scene__hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transition: all var(--lq-dur) var(--lq-ease);
  opacity: 0.45;
}
.scene__hotspot-icon {
  width: 50%;
  height: 50%;
  object-fit: contain;
  pointer-events: none;
  opacity: 0.5;
  transition: opacity var(--lq-dur) var(--lq-ease);
}
.scene__hotspot-ring {
  position: absolute;
  inset: 2px;
  border: 1.5px solid var(--lq-gold);
  border-radius: 50%;
  opacity: 0;
  transition: opacity var(--lq-dur) var(--lq-ease);
  pointer-events: none;
}
.scene__hotspot:hover,
.scene__hotspot:focus-visible {
  opacity: 1;
  background: rgba(14, 12, 10, 0.5);
  backdrop-filter: blur(2px);
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 0 20px rgba(202, 168, 64, 0.4);
}
.scene__hotspot:hover .scene__hotspot-icon,
.scene__hotspot:focus-visible .scene__hotspot-icon {
  opacity: 1;
}
.scene__hotspot:hover .scene__hotspot-ring,
.scene__hotspot:focus-visible .scene__hotspot-ring {
  opacity: 0.6;
  animation: hotspot-ring 1.5s ease-out infinite;
}
@keyframes hotspot-ring {
  0% { opacity: 0.6; transform: scale(0.95); }
  100% { opacity: 0; transform: scale(1.3); }
}
.scene__hotspot:focus-visible {
  outline: 2px solid var(--lq-gold);
  outline-offset: 3px;
}
.scene__hotspot-label {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--lq-gold);
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--lq-dur) var(--lq-ease);
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0,0,0,0.9);
  background: rgba(14, 12, 10, 0.8);
  padding: 2px 8px;
  border-radius: 999px;
}
.scene__hotspot:hover .scene__hotspot-label,
.scene__hotspot:focus-visible .scene__hotspot-label {
  opacity: 1;
}

/* 物品状态 */
.scene__hotspot--collected {
  opacity: 0.25;
}
.scene__hotspot--collected .scene__hotspot-icon {
  filter: grayscale(0.8) brightness(0.6);
}
.scene__hotspot--inspected {
  opacity: 0.3;
}
.scene__hotspot--used {
  opacity: 0.2;
}
.scene__hotspot--collected:hover,
.scene__hotspot--inspected:hover,
.scene__hotspot--used:hover {
  opacity: 0.7;
}

/* 状态徽章 */
.scene__hotspot-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: var(--lq-gold);
  color: var(--lq-paper);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(14, 12, 10, 0.8);
  pointer-events: none;
}
.scene__hotspot-badge--inspected {
  background: var(--lq-slate);
}
.scene__hotspot-badge--used {
  background: var(--lq-wine);
}

/* 触摸设备：默认更明显 */
.scene--touch .scene__hotspot {
  opacity: 0.65;
}
.scene--touch .scene__hotspot-icon {
  opacity: 0.7;
}
.scene--touch .scene__hotspot-ring {
  opacity: 0.3;
}

/* 角色立绘层 */
.scene__char {
  position: absolute;
  bottom: 0;
  right: var(--lq-space-5);
  height: calc(100% - 40px);
  pointer-events: none;
  z-index: 2;
}
.scene__char-img {
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
}

/* 文本/对白层 */
.scene__overlay {
  position: relative;
  background: var(--lq-paper-2);
  padding: var(--lq-space-6) var(--lq-space-5);
  flex: 1;
  z-index: 1;
}
.scene__speaker {
  font-family: var(--lq-font-ui);
  font-size: var(--lq-fs-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lq-wine);
  margin-bottom: var(--lq-space-2);
  font-weight: 600;
}
.scene__title {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-xl);
  margin: 0 0 var(--lq-space-3);
  line-height: 1.2;
}
.scene__divider {
  display: flex;
  align-items: center;
  margin-bottom: var(--lq-space-4);
}
.scene__divider-mark {
  width: 32px;
  height: 2px;
  background: var(--lq-wine);
}
.scene__dialogue {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-md);
  line-height: 1.8;
  color: var(--lq-wine);
  font-style: italic;
  margin: 0 0 var(--lq-space-3);
  padding: var(--lq-space-2) var(--lq-space-3);
  border-left: 3px solid var(--lq-wine);
  background: var(--lq-wine-dim);
  border-radius: 0 var(--lq-radius-md) var(--lq-radius-md) 0;
}
.scene__text {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-md);
  line-height: 1.9;
  color: var(--lq-ink);
  white-space: pre-wrap;
  margin: 0;
}
.scene__badge {
  margin-top: var(--lq-space-5);
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
}
.scene__badge-text { font-size: var(--lq-fs-sm); color: var(--lq-ink-soft); }
.scene__ending-mark {
  margin-top: var(--lq-space-6);
  text-align: center;
  color: var(--lq-wine);
  letter-spacing: 0.3em;
  font-family: var(--lq-font-sans);
  font-style: italic;
}

/* 调查详情面板 */
.investigate {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.investigate__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 6, 4, 0.6);
  backdrop-filter: blur(2px);
}
.investigate__panel {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg) var(--lq-radius-lg) 0 0;
  box-shadow: var(--lq-shadow-lg);
  animation: investigate-slide-up 0.3s var(--lq-ease);
}
.investigate--collected .investigate__panel {
  border-color: var(--lq-gold);
  box-shadow: 0 0 24px rgba(202, 168, 64, 0.3), var(--lq-shadow-lg);
}
@keyframes investigate-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.investigate__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-3);
  padding: var(--lq-space-4) var(--lq-space-5);
  border-bottom: 1px solid var(--lq-line);
}
.investigate__icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: var(--lq-radius);
  background: var(--lq-paper-2);
  padding: 4px;
}
.investigate__title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  flex-wrap: wrap;
}
.investigate__title {
  margin: 0;
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-lg);
  color: var(--lq-ink);
}
.investigate__tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.investigate__tag--gold { background: var(--lq-gold-dim); color: var(--lq-gold); }
.investigate__tag--wine { background: var(--lq-wine-dim); color: var(--lq-wine); }
.investigate__tag--slate { background: var(--lq-slate-dim); color: var(--lq-slate); }
.investigate__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--lq-ink-faint);
  padding: 4px;
  border-radius: var(--lq-radius);
  transition: all var(--lq-dur) var(--lq-ease);
  flex-shrink: 0;
}
.investigate__close:hover {
  color: var(--lq-ink);
  background: var(--lq-paper-2);
}
.investigate__body {
  padding: var(--lq-space-4) var(--lq-space-5);
}
.investigate__desc {
  font-size: var(--lq-fs-sm);
  color: var(--lq-ink-faint);
  line-height: 1.7;
  margin: 0 0 var(--lq-space-3);
  font-style: italic;
}
.investigate__result {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-md);
  line-height: 1.8;
  color: var(--lq-ink);
  margin: 0;
  white-space: pre-wrap;
}
.investigate--collected .investigate__result {
  color: var(--lq-gold);
}
.investigate__actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 var(--lq-space-5) var(--lq-space-4);
}

/* 线索发现粒子动画 */
.investigate__clue-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 21;
}
.investigate__clue-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--lq-gold);
  border-radius: 50%;
  opacity: 0;
  animation: clue-particle 1s ease-out forwards;
  animation-delay: calc(var(--i) * 0.08s);
  --i: 0;
}
@keyframes clue-particle {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + cos(var(--i) * 45deg) * 80px), calc(-50% + sin(var(--i) * 45deg) * 80px)) scale(0);
  }
}

/* 交互反馈浮层 */
.scene__interact-feedback {
  position: absolute;
  bottom: var(--lq-space-4);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  padding: var(--lq-space-3) var(--lq-space-5);
  background: rgba(14, 12, 10, 0.85);
  color: var(--lq-paper);
  border-radius: var(--lq-radius-lg);
  font-size: var(--lq-fs-sm);
  max-width: 80%;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(6px);
  box-shadow: var(--lq-shadow-md);
}
.scene__interact-feedback--collected {
  background: rgba(74, 58, 26, 0.9);
  color: var(--lq-gold);
  border: 1px solid var(--lq-gold);
}

/* 转场动画 */
.scene-enter-active,
.scene-leave-active {
  transition: opacity 0.35s var(--lq-ease), transform 0.35s var(--lq-ease);
}
.scene-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.scene-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 调查面板转场 */
.investigate-enter-active,
.investigate-leave-active {
  transition: opacity 0.25s var(--lq-ease);
}
.investigate-enter-from,
.investigate-leave-to {
  opacity: 0;
}

/* 线索动画转场 */
.clue-fx-enter-active,
.clue-fx-leave-active {
  transition: opacity 0.3s var(--lq-ease);
}
.clue-fx-enter-from,
.clue-fx-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .scene__char { right: var(--lq-space-2); }
  .scene__overlay { padding: var(--lq-space-4) var(--lq-space-3); }
  .investigate__panel { max-width: 100%; }
  .investigate__head { padding: var(--lq-space-3) var(--lq-space-4); }
  .investigate__body { padding: var(--lq-space-3) var(--lq-space-4); }
}
</style>
