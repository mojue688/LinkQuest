<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayStore } from '@/stores/play'
import { resolveAsset } from '@/assets/registry'
import AppIcon from '@/components/common/AppIcon.vue'

const play = usePlayStore()

interface InventoryEntry {
  key: string
  name: string
  description?: string
  examineText?: string
  icon: string
  closeup?: string
}

const items = computed<InventoryEntry[]>(() => {
  const adv = play.adventure
  if (!adv) return []
  return play.inventory
    .map((key) => {
      const item = adv.items.find((i) => i.key === key)
      return {
        key,
        name: item?.name ?? key,
        description: item?.description,
        examineText: item?.examineText,
        icon: item?.icon ? resolveAsset(item.icon, 'item:default') : resolveAsset('item:default'),
        closeup: item?.closeup ? resolveAsset(item.closeup, 'item:default') : undefined,
      }
    })
    .filter((x) => x.key)
})

/* ---------- 详情面板 ---------- */
const detailKey = ref<string | null>(null)
const detail = computed<InventoryEntry | null>(() =>
  items.value.find((it) => it.key === detailKey.value) ?? null
)

function showDetail(key: string) {
  detailKey.value = key
}
function closeDetail() {
  detailKey.value = null
}
</script>

<template>
  <div class="inv" v-if="items.length">
    <div class="inv__head">
      <AppIcon name="search" :size="14" />
      <span class="inv__label">已收集线索</span>
      <span class="inv__count">{{ items.length }}</span>
    </div>
    <div class="inv__items">
      <button
        v-for="it in items"
        :key="it.key"
        class="inv__item"
        @click="showDetail(it.key)"
      >
        <img :src="it.icon" class="inv__item-icon" :alt="it.name" />
        <span class="inv__item-name">{{ it.name }}</span>
        <AppIcon name="search" :size="10" class="inv__item-hint" />
      </button>
    </div>

    <!-- 详情面板 -->
    <transition name="lq-transition-fade">
      <div v-if="detail" class="inv-detail">
        <div class="inv-detail__backdrop" @click="closeDetail"></div>
        <div class="inv-detail__panel">
          <div class="inv-detail__head">
            <img :src="detail.icon" class="inv-detail__icon" :alt="detail.name" />
            <h3 class="inv-detail__title">{{ detail.name }}</h3>
            <button class="inv-detail__close" @click="closeDetail">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="inv-detail__body">
            <img
              v-if="detail.closeup"
              :src="detail.closeup"
              class="inv-detail__closeup"
              :alt="detail.name"
            />
            <p v-if="detail.description" class="inv-detail__desc">{{ detail.description }}</p>
            <p v-if="detail.examineText" class="inv-detail__examine">{{ detail.examineText }}</p>
            <p v-if="!detail.description && !detail.examineText" class="inv-detail__empty">
              暂无详细信息。
            </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.inv {
  display: flex;
  align-items: center;
  gap: var(--lq-space-3);
  padding: var(--lq-space-3) var(--lq-space-4);
  background: var(--lq-gold-dim);
  border: 1px solid var(--lq-gold);
  border-radius: var(--lq-radius-md);
  flex-wrap: wrap;
  position: relative;
}
.inv__head {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--lq-gold);
  font-size: var(--lq-fs-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}
.inv__count {
  background: var(--lq-gold);
  color: var(--lq-paper);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 11px;
}
.inv__items {
  display: flex;
  gap: var(--lq-space-2);
  flex-wrap: wrap;
}
.inv__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius);
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink);
  cursor: pointer;
  transition: all var(--lq-dur) var(--lq-ease);
}
.inv__item:hover {
  border-color: var(--lq-gold);
  background: var(--lq-gold-dim);
  transform: translateY(-1px);
}
.inv__item-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.inv__item-hint {
  color: var(--lq-ink-faint);
  opacity: 0.5;
}

/* 详情面板 */
.inv-detail {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--lq-space-4);
}
.inv-detail__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 6, 4, 0.5);
  backdrop-filter: blur(3px);
}
.inv-detail__panel {
  position: relative;
  width: min(440px, 94vw);
  max-height: 80vh;
  background: var(--lq-paper);
  border: 1px solid var(--lq-gold);
  border-radius: var(--lq-radius-lg);
  box-shadow: var(--lq-shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.inv-detail__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-3);
  padding: var(--lq-space-4) var(--lq-space-5);
  border-bottom: 1px solid var(--lq-line);
  background: var(--lq-gold-dim);
}
.inv-detail__icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
  background: var(--lq-paper);
  border-radius: var(--lq-radius);
  padding: 3px;
}
.inv-detail__title {
  flex: 1;
  margin: 0;
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-lg);
  color: var(--lq-ink);
}
.inv-detail__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--lq-ink-faint);
  padding: 4px;
  border-radius: var(--lq-radius);
  transition: all var(--lq-dur) var(--lq-ease);
  flex-shrink: 0;
}
.inv-detail__close:hover {
  color: var(--lq-ink);
  background: var(--lq-paper-2);
}
.inv-detail__body {
  padding: var(--lq-space-5);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-3);
}
.inv-detail__closeup {
  width: 100%;
  border-radius: var(--lq-radius-md);
  border: 1px solid var(--lq-line);
}
.inv-detail__desc {
  font-size: var(--lq-fs-sm);
  color: var(--lq-ink-faint);
  line-height: 1.7;
  margin: 0;
  font-style: italic;
}
.inv-detail__examine {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-md);
  line-height: 1.8;
  color: var(--lq-ink);
  margin: 0;
  white-space: pre-wrap;
}
.inv-detail__empty {
  color: var(--lq-ink-faint);
  font-size: var(--lq-fs-sm);
  margin: 0;
  text-align: center;
  padding: var(--lq-space-4);
}

@media (max-width: 600px) {
  .inv__item-hint { display: none; }
}
</style>
