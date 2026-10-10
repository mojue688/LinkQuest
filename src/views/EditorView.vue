<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdventureStore } from '@/stores/adventure'
import { useSettingsStore } from '@/stores/settings'
import { useUI } from '@/stores/ui'
import type { Adventure } from '@/types/adventure'
import { NodeType } from '@/types/adventure'
import { exportJSON, downloadBlob, importFromFile } from '@/storage/export'
import NodeCanvas from '@/components/editor/NodeCanvas.vue'
import NodeInspector from '@/components/editor/NodeInspector.vue'
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import AIPanel from '@/components/editor/AIPanel.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useAdventureStore()
const settings = useSettingsStore()
const ui = useUI()

const showAI = ref(false)
const showMeta = ref(false)
const showIssues = ref(false)
const metaForm = ref({ title: '', description: '', author: '', tags: '' })

const id = computed(() => route.params.id as string | undefined)
const title = computed(() => store.current?.meta.title ?? '未命名冒险')

const aiQueryPrompt = computed(() => (route.query.prompt as string) ?? '')
const aiQueryOpen = computed(() => route.query.ai === '1')

/* ---------- 布局状态 ---------- */
const viewportW = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const isMobile = computed(() => viewportW.value < 768)
const isTablet = computed(() => viewportW.value >= 768 && viewportW.value < 1024)
const leftCollapsed = ref(false)
const inspectorOpen = ref(true)
const inspectorWidth = ref(340)
const mobileMenu = ref<null | 'add' | 'actions'>(null)
const mobileInspector = ref(false)

function onResize() {
  viewportW.value = window.innerWidth
}
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

watch(isTablet, (t) => {
  if (t) {
    leftCollapsed.value = true
  }
})

/* 属性面板宽度拖拽 */
const resizing = ref(false)
function onResizerDown(e: MouseEvent) {
  e.preventDefault()
  resizing.value = true
  const startX = e.clientX
  const startW = inspectorWidth.value
  function onMove(ev: MouseEvent) {
    const delta = startX - ev.clientX
    const w = Math.max(280, Math.min(480, startW + delta))
    inspectorWidth.value = w
  }
  function onUp() {
    resizing.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const nodeCanvasRef = ref<InstanceType<typeof NodeCanvas> | null>(null)

function syncMetaForm() {
  if (!store.current) return
  metaForm.value = {
    title: store.current.meta.title,
    description: store.current.meta.description,
    author: store.current.meta.author,
    tags: store.current.meta.tags.join(', '),
  }
}

onMounted(async () => {
  settings.load()
  if (viewportW.value >= 768 && viewportW.value < 1024) {
    leftCollapsed.value = true
  }
  if (id.value) {
    await store.open(id.value)
  } else if (!store.current) {
    const newId = await store.create('未命名冒险')
    if (newId) router.replace({ name: 'editor', params: { id: newId } })
  }
  syncMetaForm()

  if (aiQueryOpen.value && aiQueryPrompt.value) {
    showAI.value = true
  }
})

watch(id, async (newId) => {
  if (newId && newId !== store.currentId) {
    await store.open(newId)
    syncMetaForm()
  }
})

watch(showMeta, (open) => {
  if (open) syncMetaForm()
})

/* 选中节点时，移动端自动打开属性抽屉 */
watch(
  () => store.selectedNodeId,
  (nid) => {
    if (isMobile.value && nid) {
      mobileInspector.value = true
    }
  }
)

let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => store.dirty,
  (dirty) => {
    if (dirty) {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => store.saveCurrent(), 2500)
    }
  }
)

onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  if (store.dirty) store.saveCurrent()
})

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  const inField =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  if (inField) return
  const meta = e.ctrlKey || e.metaKey
  if (meta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  } else if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    store.redo()
  } else if (meta && e.key === 's') {
    e.preventDefault()
    store.saveCurrent()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function saveMeta() {
  store.updateMeta({
    title: metaForm.value.title,
    description: metaForm.value.description,
    author: metaForm.value.author,
    tags: metaForm.value.tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  })
  store.saveCurrent()
  showMeta.value = false
  ui.success('作品信息已保存')
}

async function applyAI(adv: Adventure) {
  store.setCurrent(adv)
  await store.saveCurrent()
  await store.loadList()
  showAI.value = false
  syncMetaForm()
  router.replace({ name: 'editor', params: { id: adv.meta.id } })
}

async function backHome() {
  await store.saveCurrent()
  router.push({ name: 'home' })
}

const saveLabel = computed(() => {
  if (store.saving) return '保存中…'
  if (store.dirty) return '未保存'
  return '已保存'
})

const issueList = computed(() => store.validation?.issues ?? [])
const errorIssues = computed(() => issueList.value.filter((i) => i.level === 'error'))
const warnIssues = computed(() => issueList.value.filter((i) => i.level === 'warning'))
const infoIssues = computed(() => issueList.value.filter((i) => i.level === 'info'))

function jumpToNode(nodeId?: string) {
  if (!nodeId) return
  store.selectNode(nodeId)
  nodeCanvasRef.value?.focusNode(nodeId)
  showIssues.value = false
}

/* ---------- 移动端操作（复用于底部栏） ---------- */
function nextPosition() {
  const count = store.current?.nodes.length ?? 0
  return { x: 220 + (count % 4) * 200, y: 120 + Math.floor(count / 4) * 160 }
}
function addNode(type: NodeType) {
  store.addNode(type, nextPosition())
  mobileMenu.value = null
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

const mobileAddTypes = [
  { type: NodeType.Scene, icon: 'bookOpen', label: '场景' },
  { type: NodeType.Clue, icon: 'search', label: '线索' },
  { type: NodeType.Puzzle, icon: 'key', label: '谜题' },
  { type: NodeType.Ending, icon: 'flag', label: '结局' },
]
</script>

<template>
  <div class="editor" v-if="store.current">
    <!-- 顶部栏 -->
    <header class="editor__top">
      <div class="editor__top-left">
        <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="backHome">
          <AppIcon name="arrowLeft" :size="15" />
          <span class="editor__back-text">首页</span>
        </button>
        <button
          v-if="!isMobile"
          class="editor__icon-btn"
          :title="leftCollapsed ? '展开工具栏' : '折叠工具栏'"
          @click="leftCollapsed = !leftCollapsed"
        >
          <AppIcon :name="leftCollapsed ? 'chevronRight' : 'chevronLeft'" :size="15" />
        </button>
        <button class="editor__title" @click="showMeta = true">
          <AppIcon name="book" :size="15" />
          <span class="editor__title-text">{{ title }}</span>
          <span
            class="editor__save"
            :class="{
              'is-dirty': store.dirty,
              'is-saved': !store.dirty && !store.saving,
            }"
          >
            {{ saveLabel }}
          </span>
        </button>
      </div>

      <div class="editor__top-right">
        <button
          class="editor__chip"
          :class="{ 'has-error': errorIssues.length, 'has-warn': warnIssues.length && !errorIssues.length }"
          @click="showIssues = !showIssues"
          title="剧情检查"
        >
          <AppIcon name="alert" :size="14" />
          <span v-if="errorIssues.length" class="editor__chip-text">{{ errorIssues.length }} 问题</span>
          <span v-else-if="warnIssues.length" class="editor__chip-text">{{ warnIssues.length }} 提醒</span>
          <span v-else class="editor__chip-text">检查通过</span>
        </button>
        <button
          class="lq-btn lq-btn--ghost lq-btn--sm"
          :disabled="!store.canUndo"
          @click="store.undo()"
          title="撤销 (Ctrl+Z)"
        >
          <AppIcon name="undo" :size="15" />
        </button>
        <button
          class="lq-btn lq-btn--ghost lq-btn--sm"
          :disabled="!store.canRedo"
          @click="store.redo()"
          title="重做 (Ctrl+Shift+Z)"
        >
          <AppIcon name="redo" :size="15" />
        </button>
        <button
          v-if="!isMobile"
          class="editor__icon-btn"
          :title="inspectorOpen ? '收起属性面板' : '展开属性面板'"
          @click="inspectorOpen = !inspectorOpen"
        >
          <AppIcon name="layers" :size="15" />
        </button>
        <button
          v-if="!isMobile"
          class="lq-btn lq-btn--ghost lq-btn--sm"
          @click="showMeta = true"
        >
          <AppIcon name="info" :size="15" />
          <span>信息</span>
        </button>
        <button
          class="lq-btn lq-btn--sm"
          :disabled="store.saving"
          @click="handleSave"
        >
          <AppIcon name="save" :size="15" />
          <span class="editor__save-text">保存</span>
        </button>
        <button
          v-if="!isMobile"
          class="lq-btn lq-btn--sm"
          @click="handlePlay"
        >
          <AppIcon name="play" :size="15" />
          <span>试玩</span>
        </button>
      </div>
    </header>

    <!-- 桌面/平板主体 -->
    <div v-if="!isMobile" class="editor__body">
      <EditorToolbar :collapsed="leftCollapsed" @open-ai="showAI = true" @open-meta="showMeta = true" />
      <div class="editor__canvas">
        <NodeCanvas ref="nodeCanvasRef" />
      </div>
      <div
        v-if="inspectorOpen"
        class="editor__resizer"
        @mousedown="onResizerDown"
      ></div>
      <div
        v-if="inspectorOpen"
        class="editor__inspector"
        :style="{ width: inspectorWidth + 'px' }"
      >
        <NodeInspector />
      </div>
    </div>

    <!-- 移动端主体 -->
    <div v-else class="editor__mobile-body">
      <div class="editor__canvas editor__canvas--mobile">
        <NodeCanvas ref="nodeCanvasRef" />
      </div>
    </div>

    <!-- 移动端底部工具栏 -->
    <nav v-if="isMobile" class="editor__bottombar">
      <button class="editor__bb-btn" @click="mobileMenu = mobileMenu === 'add' ? null : 'add'">
        <AppIcon name="plus" :size="18" />
        <span>添加</span>
      </button>
      <button class="editor__bb-btn" @click="mobileMenu = mobileMenu === 'actions' ? null : 'actions'">
        <AppIcon name="menu" :size="18" />
        <span>操作</span>
      </button>
      <button class="editor__bb-btn" @click="handleSave">
        <AppIcon name="save" :size="18" />
        <span>保存</span>
      </button>
      <button class="editor__bb-btn" @click="handlePlay">
        <AppIcon name="play" :size="18" />
        <span>试玩</span>
      </button>
      <button
        class="editor__bb-btn"
        :disabled="!store.selectedNode"
        @click="mobileInspector = true"
      >
        <AppIcon name="edit" :size="18" />
        <span>属性</span>
      </button>
    </nav>

    <!-- 移动端添加节点菜单 -->
    <transition name="lq-sheet">
      <div v-if="isMobile && mobileMenu === 'add'" class="editor__sheet" @click.self="mobileMenu = null">
        <div class="editor__sheet-panel">
          <div class="editor__sheet-head">
            <h3>添加节点</h3>
            <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="mobileMenu = null">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="editor__sheet-body">
            <button
              v-for="nt in mobileAddTypes"
              :key="nt.type"
              class="editor__sheet-item"
              @click="addNode(nt.type)"
            >
              <AppIcon :name="nt.icon" :size="18" />
              <span>{{ nt.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 移动端操作菜单 -->
    <transition name="lq-sheet">
      <div v-if="isMobile && mobileMenu === 'actions'" class="editor__sheet" @click.self="mobileMenu = null">
        <div class="editor__sheet-panel">
          <div class="editor__sheet-head">
            <h3>操作</h3>
            <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="mobileMenu = null">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="editor__sheet-body">
            <button class="editor__sheet-item" @click="showMeta = true; mobileMenu = null">
              <AppIcon name="info" :size="18" />
              <span>作品信息</span>
            </button>
            <button class="editor__sheet-item" @click="showAI = true; mobileMenu = null">
              <AppIcon name="sparkles" :size="18" />
              <span>AI 助手</span>
            </button>
            <button class="editor__sheet-item" @click="handleExport(); mobileMenu = null">
              <AppIcon name="download" :size="18" />
              <span>导出 JSON</span>
            </button>
            <button class="editor__sheet-item" @click="handleImport(); mobileMenu = null">
              <AppIcon name="upload" :size="18" />
              <span>导入 JSON</span>
            </button>
            <button class="editor__sheet-item" @click="showIssues = true; mobileMenu = null">
              <AppIcon name="alert" :size="18" />
              <span>剧情检查</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 移动端属性抽屉 -->
    <transition name="lq-drawer">
      <div v-if="isMobile && mobileInspector" class="editor__drawer">
        <div class="editor__drawer-panel">
          <div class="editor__drawer-head">
            <h3>节点属性</h3>
            <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="mobileInspector = false">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="editor__drawer-body">
            <NodeInspector />
          </div>
        </div>
      </div>
    </transition>

    <!-- 问题检查面板 -->
    <transition name="lq-transition-fade">
      <div v-if="showIssues" class="editor__issues" @click.self="showIssues = false">
        <div class="editor__issues-panel lq-fade">
          <div class="editor__issues-head">
            <h3>剧情检查</h3>
            <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="showIssues = false">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="editor__issues-body">
            <div v-if="!issueList.length" class="editor__issues-ok">
              <AppIcon name="check" :size="28" />
              <p>未发现结构性问题。</p>
            </div>
            <template v-else>
              <div v-if="errorIssues.length" class="editor__issues-group">
                <p class="editor__issues-group-title lq-badge--bad">
                  {{ errorIssues.length }} 个错误
                </p>
                <div
                  v-for="(i, idx) in errorIssues"
                  :key="'e' + idx"
                  class="editor__issue editor__issue--error"
                  @click="jumpToNode(i.nodeId)"
                >
                  <AppIcon name="alert" :size="14" />
                  <span>{{ i.message }}</span>
                </div>
              </div>
              <div v-if="warnIssues.length" class="editor__issues-group">
                <p class="editor__issues-group-title lq-badge--warn">
                  {{ warnIssues.length }} 个提醒
                </p>
                <div
                  v-for="(i, idx) in warnIssues"
                  :key="'w' + idx"
                  class="editor__issue editor__issue--warn"
                  @click="jumpToNode(i.nodeId)"
                >
                  <AppIcon name="alert" :size="14" />
                  <span>{{ i.message }}</span>
                </div>
              </div>
              <div v-if="infoIssues.length" class="editor__issues-group">
                <p class="editor__issues-group-title lq-badge--slate">
                  {{ infoIssues.length }} 条建议
                </p>
                <div
                  v-for="(i, idx) in infoIssues"
                  :key="'i' + idx"
                  class="editor__issue editor__issue--info"
                  @click="jumpToNode(i.nodeId)"
                >
                  <AppIcon name="info" :size="14" />
                  <span>{{ i.message }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="store.error" class="editor__error lq-alert lq-alert--error">
      <AppIcon name="alert" :size="15" />
      <span>{{ store.error }}</span>
      <button class="editor__error-close" @click="store.clearError()">
        <AppIcon name="close" :size="14" />
      </button>
    </div>

    <!-- 元信息弹窗 -->
    <transition name="lq-transition-fade">
      <div v-if="showMeta" class="lq-modal" @click.self="showMeta = false">
        <div class="lq-modal__panel lq-fade">
          <div class="lq-modal__head">
            <h3>作品信息</h3>
            <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="showMeta = false">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="lq-modal__body">
            <div class="lq-field">
              <label class="lq-label">标题</label>
              <input v-model="metaForm.title" class="lq-input" />
            </div>
            <div class="lq-field">
              <label class="lq-label">简介</label>
              <textarea v-model="metaForm.description" class="lq-textarea" rows="3"></textarea>
            </div>
            <div class="lq-field">
              <label class="lq-label">作者</label>
              <input v-model="metaForm.author" class="lq-input" />
            </div>
            <div class="lq-field">
              <label class="lq-label">标签（逗号分隔）</label>
              <input v-model="metaForm.tags" class="lq-input" placeholder="谜题, 冒险, 悬疑" />
            </div>
          </div>
          <div class="lq-modal__foot">
            <button class="lq-btn lq-btn--ghost" @click="showMeta = false">取消</button>
            <button class="lq-btn" @click="saveMeta">保存</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- AI 面板 -->
    <AIPanel
      v-if="showAI"
      :initial-prompt="aiQueryPrompt"
      @apply="applyAI"
      @close="showAI = false"
    />
  </div>

  <div v-else class="editor__loading">
    <span class="lq-spin"></span>
    <p>正在加载作品…</p>
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--lq-paper);
}

/* 顶部栏 */
.editor__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lq-space-3);
  padding: var(--lq-space-2) var(--lq-space-4);
  background: var(--lq-paper-2);
  border-bottom: 1px solid var(--lq-line);
  flex-shrink: 0;
  height: 52px;
}
.editor__top-left,
.editor__top-right {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  min-width: 0;
}
.editor__top-left { flex: 1; }
.editor__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--lq-line);
  background: var(--lq-paper);
  border-radius: var(--lq-radius-md);
  color: var(--lq-ink-soft);
  cursor: pointer;
  transition: all var(--lq-dur) var(--lq-ease);
  flex-shrink: 0;
}
.editor__icon-btn:hover {
  border-color: var(--lq-ink-faint);
  color: var(--lq-ink);
}
.editor__title {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  padding: 5px 10px;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--lq-radius-md);
  cursor: pointer;
  color: var(--lq-ink);
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-md);
  font-weight: 600;
  transition: border-color var(--lq-dur) var(--lq-ease);
  min-width: 0;
}
.editor__title:hover { border-color: var(--lq-line); }
.editor__title-text {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor__save {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: var(--lq-radius);
  background: var(--lq-moss-dim);
  color: var(--lq-moss);
  flex-shrink: 0;
}
.editor__save.is-dirty {
  background: var(--lq-rust-dim);
  color: var(--lq-rust);
}
.editor__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--lq-line);
  background: var(--lq-paper);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-soft);
  cursor: pointer;
  flex-shrink: 0;
}
.editor__chip:hover { border-color: var(--lq-ink-faint); }
.editor__chip.has-error { border-color: var(--lq-bad); color: var(--lq-bad); }
.editor__chip.has-warn { border-color: var(--lq-warn); color: var(--lq-warn); }

/* 桌面主体 */
.editor__body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.editor__canvas {
  flex: 1;
  min-width: 0;
  padding: var(--lq-space-3);
}
.editor__resizer {
  width: 5px;
  flex-shrink: 0;
  cursor: col-resize;
  background: var(--lq-line);
  border-left: 1px solid var(--lq-line);
  border-right: 1px solid var(--lq-line);
  transition: background var(--lq-dur) var(--lq-ease);
}
.editor__resizer:hover { background: var(--lq-ink-faint); }
.editor__inspector {
  flex-shrink: 0;
  overflow: hidden;
  border-left: 1px solid var(--lq-line);
}
.editor__error {
  position: fixed;
  bottom: var(--lq-space-4);
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  max-width: 90vw;
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
}
.editor__error-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
}
.editor__loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lq-space-3);
  color: var(--lq-ink-soft);
}

/* 问题面板 */
.editor__issues {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(28, 26, 23, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
}
.editor__issues-panel {
  width: min(420px, 92vw);
  height: 100%;
  background: var(--lq-paper);
  border-left: 1px solid var(--lq-line);
  box-shadow: var(--lq-shadow-lg);
  display: flex;
  flex-direction: column;
}
.editor__issues-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lq-space-4) var(--lq-space-5);
  border-bottom: 1px solid var(--lq-line);
}
.editor__issues-head h3 { margin: 0; }
.editor__issues-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--lq-space-4) var(--lq-space-5);
}
.editor__issues-ok {
  text-align: center;
  color: var(--lq-good);
  padding: var(--lq-space-8) var(--lq-space-4);
}
.editor__issues-ok p { margin-top: var(--lq-space-3); color: var(--lq-ink-soft); }
.editor__issues-group { margin-bottom: var(--lq-space-5); }
.editor__issues-group-title {
  font-size: var(--lq-fs-xs);
  font-weight: 600;
  margin-bottom: var(--lq-space-2);
  display: inline-block;
  padding: 3px 9px;
  border-radius: var(--lq-radius);
}
.editor__issue {
  display: flex;
  align-items: flex-start;
  gap: var(--lq-space-2);
  padding: var(--lq-space-2) var(--lq-space-3);
  border-radius: var(--lq-radius-md);
  font-size: var(--lq-fs-sm);
  margin-bottom: var(--lq-space-1);
  cursor: pointer;
  line-height: 1.5;
}
.editor__issue--error { background: rgba(154, 50, 50, 0.06); color: var(--lq-bad); }
.editor__issue--warn { background: var(--lq-rust-dim); color: var(--lq-warn); }
.editor__issue--info { background: var(--lq-slate-dim); color: var(--lq-info); }
.editor__issue:hover { filter: brightness(0.96); }

/* ---------- 移动端 ---------- */
.editor__mobile-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
.editor__canvas--mobile {
  flex: 1;
  min-width: 0;
  padding: var(--lq-space-2);
}
.editor__bottombar {
  display: flex;
  flex-shrink: 0;
  background: var(--lq-paper-2);
  border-top: 1px solid var(--lq-line);
  padding: 6px env(safe-area-inset-bottom, 0px);
  z-index: 20;
}
.editor__bb-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  background: none;
  border: none;
  color: var(--lq-ink-soft);
  font-size: 11px;
  cursor: pointer;
  min-height: 52px;
  transition: color var(--lq-dur) var(--lq-ease);
}
.editor__bb-btn:active { color: var(--lq-wine); }
.editor__bb-btn:disabled { opacity: 0.4; }

/* 移动端弹出层 */
.editor__sheet {
  position: fixed;
  inset: 0;
  z-index: 85;
  background: rgba(28, 26, 23, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.editor__sheet-panel {
  width: 100%;
  max-width: 480px;
  background: var(--lq-paper);
  border-top-left-radius: var(--lq-radius-lg);
  border-top-right-radius: var(--lq-radius-lg);
  box-shadow: var(--lq-shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.editor__sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lq-space-4) var(--lq-space-5);
  border-bottom: 1px solid var(--lq-line);
}
.editor__sheet-head h3 { margin: 0; }
.editor__sheet-body {
  padding: var(--lq-space-3) var(--lq-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-2);
  overflow-y: auto;
}
.editor__sheet-item {
  display: flex;
  align-items: center;
  gap: var(--lq-space-3);
  padding: 14px var(--lq-space-4);
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  color: var(--lq-ink);
  font-size: var(--lq-fs-md);
  cursor: pointer;
  text-align: left;
  min-height: 48px;
}
.editor__sheet-item:active { background: var(--lq-paper-3); }

/* 移动端属性抽屉 */
.editor__drawer {
  position: fixed;
  inset: 0;
  z-index: 88;
  background: rgba(28, 26, 23, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
}
.editor__drawer-panel {
  width: 100%;
  max-width: 440px;
  height: 100%;
  background: var(--lq-paper);
  box-shadow: var(--lq-shadow-lg);
  display: flex;
  flex-direction: column;
}
.editor__drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lq-space-4) var(--lq-space-5);
  border-bottom: 1px solid var(--lq-line);
  flex-shrink: 0;
  padding-top: calc(var(--lq-space-4) + env(safe-area-inset-top, 0px));
}
.editor__drawer-head h3 { margin: 0; }
.editor__drawer-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 抽屉/弹出层过渡 */
.lq-sheet-enter-active,
.lq-sheet-leave-active {
  transition: opacity 0.2s var(--lq-ease);
}
.lq-sheet-enter-active .editor__sheet-panel,
.lq-sheet-leave-active .editor__sheet-panel {
  transition: transform 0.25s var(--lq-ease);
}
.lq-sheet-enter-from,
.lq-sheet-leave-to { opacity: 0; }
.lq-sheet-enter-from .editor__sheet-panel,
.lq-sheet-leave-to .editor__sheet-panel { transform: translateY(100%); }

.lq-drawer-enter-active,
.lq-drawer-leave-active {
  transition: opacity 0.2s var(--lq-ease);
}
.lq-drawer-enter-active .editor__drawer-panel,
.lq-drawer-leave-active .editor__drawer-panel {
  transition: transform 0.25s var(--lq-ease);
}
.lq-drawer-enter-from,
.lq-drawer-leave-to { opacity: 0; }
.lq-drawer-enter-from .editor__drawer-panel,
.lq-drawer-leave-to .editor__drawer-panel { transform: translateX(100%); }

/* 平板/窄桌面 */
@media (max-width: 1024px) {
  .editor__title-text { max-width: 160px; }
  .editor__chip-text { display: none; }
}
@media (max-width: 900px) and (min-width: 768px) {
  .editor__save-text { display: none; }
}
@media (max-width: 767px) {
  .editor__top { padding: var(--lq-space-2) var(--lq-space-3); height: 48px; }
  .editor__back-text { display: none; }
  .editor__save-text { display: none; }
  .editor__title-text { max-width: 120px; }
}
</style>
