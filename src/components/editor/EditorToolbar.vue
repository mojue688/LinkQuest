<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAdventureStore } from '@/stores/adventure'
import { useUI } from '@/stores/ui'
import { NodeType } from '@/types/adventure'
import { exportJSON, downloadBlob, importFromFile } from '@/storage/export'
import AppIcon from '@/components/common/AppIcon.vue'

const emit = defineEmits<{ (e: 'open-ai'): void; (e: 'open-meta'): void }>()
const router = useRouter()
const store = useAdventureStore()
const ui = useUI()

const nodeTypes = [
  { type: NodeType.Scene, icon: 'bookOpen', label: '场景', color: 'slate' },
  { type: NodeType.Clue, icon: 'search', label: '线索', color: 'gold' },
  { type: NodeType.Puzzle, icon: 'key', label: '谜题', color: 'rust' },
  { type: NodeType.Ending, icon: 'flag', label: '结局', color: 'wine' },
]

function nextPosition() {
  const count = store.current?.nodes.length ?? 0
  return { x: 220 + (count % 4) * 200, y: 120 + Math.floor(count / 4) * 160 }
}

function addNode(type: NodeType) {
  store.addNode(type, nextPosition())
}

async function handleSave() {
  const ok = await store.saveCurrent()
  if (ok) ui.success('已保存')
}

async function handlePlay() {
  await store.saveCurrent()
  if (store.currentId) {
    router.push({ name: 'play', params: { id: store.currentId } })
  }
}

function handleExport() {
  if (!store.current) return
  const result = exportJSON(store.current)
  downloadBlob(result.blob, result.filename)
  ui.success('已导出 JSON')
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const adv = await importFromFile(file)
      const ok = await ui.confirm({
        title: '导入作品',
        message: `即将导入「${adv.meta.title}」，当前未保存的编辑将被替换。是否继续？`,
        confirmText: '导入并替换',
      })
      if (!ok) return
      store.setCurrent(adv)
      await store.saveCurrent()
      await store.loadList()
      ui.success('导入成功')
    } catch (e) {
      ui.error((e as Error).message)
    }
  }
  input.click()
}
</script>

<template>
  <aside class="toolbar">
    <div class="toolbar__group">
      <p class="toolbar__title">添加节点</p>
      <button
        v-for="nt in nodeTypes"
        :key="nt.type"
        class="toolbar__btn"
        @click="addNode(nt.type)"
      >
        <span class="toolbar__icon" :class="`is-${nt.color}`">
          <AppIcon :name="nt.icon" :size="15" />
        </span>
        <span class="toolbar__label">{{ nt.label }}</span>
      </button>
    </div>

    <hr class="lq-divider lq-divider--soft" />

    <div class="toolbar__group">
      <p class="toolbar__title">操作</p>
      <button class="toolbar__btn" @click="emit('open-meta')">
        <span class="toolbar__icon"><AppIcon name="info" :size="15" /></span>
        <span class="toolbar__label">作品信息</span>
      </button>
      <button class="toolbar__btn" @click="handleSave">
        <span class="toolbar__icon"><AppIcon name="save" :size="15" /></span>
        <span class="toolbar__label">保存</span>
      </button>
      <button class="toolbar__btn toolbar__btn--accent" @click="handlePlay">
        <span class="toolbar__icon is-wine"><AppIcon name="play" :size="15" /></span>
        <span class="toolbar__label">试玩</span>
      </button>
      <button class="toolbar__btn" @click="handleExport">
        <span class="toolbar__icon"><AppIcon name="download" :size="15" /></span>
        <span class="toolbar__label">导出 JSON</span>
      </button>
      <button class="toolbar__btn" @click="handleImport">
        <span class="toolbar__icon"><AppIcon name="upload" :size="15" /></span>
        <span class="toolbar__label">导入 JSON</span>
      </button>
    </div>

    <hr class="lq-divider lq-divider--soft" />

    <div class="toolbar__group">
      <p class="toolbar__title">AI</p>
      <button class="toolbar__btn toolbar__btn--ai" @click="emit('open-ai')">
        <span class="toolbar__icon is-gold"><AppIcon name="sparkles" :size="15" /></span>
        <span class="toolbar__label">AI 助手</span>
      </button>
    </div>

    <div class="toolbar__hint">
      <AppIcon name="info" :size="13" />
      <span>拖拽节点右侧锚点可连接分支</span>
    </div>
  </aside>
</template>

<style scoped>
.toolbar {
  width: 176px;
  flex-shrink: 0;
  padding: var(--lq-space-4) var(--lq-space-3);
  background: var(--lq-paper-2);
  border-right: 1px solid var(--lq-line);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.toolbar__title {
  font-size: 10px;
  color: var(--lq-ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 var(--lq-space-2);
  font-weight: 600;
}
.toolbar__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.toolbar__btn {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--lq-radius-md);
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  color: var(--lq-ink);
  font-size: var(--lq-fs-sm);
  cursor: pointer;
  transition: all var(--lq-dur) var(--lq-ease);
  text-align: left;
}
.toolbar__btn:hover {
  border-color: var(--lq-ink-faint);
  background: var(--lq-paper-3);
}
.toolbar__btn--accent {
  border-color: var(--lq-wine);
}
.toolbar__btn--accent:hover {
  background: var(--lq-wine-dim);
}
.toolbar__btn--ai {
  border-color: var(--lq-gold);
}
.toolbar__btn--ai:hover {
  background: var(--lq-gold-dim);
}
.toolbar__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  color: var(--lq-ink-soft);
}
.toolbar__icon.is-slate { color: var(--lq-slate); }
.toolbar__icon.is-gold { color: var(--lq-gold); }
.toolbar__icon.is-rust { color: var(--lq-rust); }
.toolbar__icon.is-wine { color: var(--lq-wine); }
.toolbar__label { flex: 1; }
.toolbar__hint {
  margin-top: auto;
  padding: var(--lq-space-2);
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: var(--lq-ink-faint);
  line-height: 1.5;
}
</style>
