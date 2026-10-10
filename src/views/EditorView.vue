<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdventureStore } from '@/stores/adventure'
import { useSettingsStore } from '@/stores/settings'
import { useUI } from '@/stores/ui'
import type { Adventure } from '@/types/adventure'
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
  if (id.value) {
    await store.open(id.value)
  } else if (!store.current) {
    const newId = await store.create('未命名冒险')
    if (newId) router.replace({ name: 'editor', params: { id: newId } })
  }
  syncMetaForm()

  // 从首页带 prompt 跳转过来，自动打开 AI 面板
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

// 自动保存（防抖 2.5s）
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

// 离开前保存
onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  if (store.dirty) store.saveCurrent()
})

// 键盘快捷键
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
  // 清除 query
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
  showIssues.value = false
}
</script>

<template>
  <div class="editor" v-if="store.current">
    <header class="editor__top">
      <div class="editor__top-left">
        <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="backHome">
          <AppIcon name="arrowLeft" :size="15" />
          <span>首页</span>
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
          <span v-if="errorIssues.length">{{ errorIssues.length }} 问题</span>
          <span v-else-if="warnIssues.length">{{ warnIssues.length }} 提醒</span>
          <span v-else>检查通过</span>
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
        <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="showMeta = true">
          <AppIcon name="info" :size="15" />
          <span>信息</span>
        </button>
        <button
          class="lq-btn lq-btn--sm"
          :disabled="store.saving"
          @click="store.saveCurrent()"
        >
          <AppIcon name="save" :size="15" />
          <span>保存</span>
        </button>
      </div>
    </header>

    <div class="editor__body">
      <EditorToolbar @open-ai="showAI = true" @open-meta="showMeta = true" />
      <div class="editor__canvas">
        <NodeCanvas />
      </div>
      <div class="editor__inspector">
        <NodeInspector />
      </div>
    </div>

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
  overflow: hidden;
  background: var(--lq-paper);
}
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
}
.editor__title:hover { border-color: var(--lq-line); }
.editor__title-text { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.editor__save {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: var(--lq-radius);
  background: var(--lq-moss-dim);
  color: var(--lq-moss);
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
}
.editor__chip:hover { border-color: var(--lq-ink-faint); }
.editor__chip.has-error { border-color: var(--lq-bad); color: var(--lq-bad); }
.editor__chip.has-warn { border-color: var(--lq-warn); color: var(--lq-warn); }
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
.editor__inspector {
  width: 340px;
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

@media (max-width: 900px) {
  .editor__inspector {
    width: 280px;
  }
}
@media (max-width: 720px) {
  .editor__body { flex-direction: column; }
  .editor__inspector {
    width: 100%;
    height: 240px;
    border-left: none;
    border-top: 1px solid var(--lq-line);
  }
  .editor__top-right .lq-btn span { display: none; }
}
</style>
