<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUI } from '@/stores/ui'
import { createProvider } from '@/ai/provider'
import { generateStory, convertToAdventure, normalizeAIStory } from '@/ai/generator'
import { reviewAdventure } from '@/ai/reviewer'
import { adventureTemplates, generateFromTemplate } from '@/ai/fallback'
import type { Adventure, AICapability } from '@/types/adventure'
import type { AIStory, PlotReviewResult } from '@/ai/types'
import { AIError } from '@/ai/types'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{ initialPrompt?: string }>()
const emit = defineEmits<{
  (e: 'apply', adv: Adventure): void
  (e: 'close'): void
}>()

const settings = useSettingsStore()
const ui = useUI()

const prompt = ref(props.initialPrompt ?? '')
const endingCount = ref(3)
const loading = ref(false)
const error = ref('')
const result = ref<AIStory | null>(null)
const source = ref<'ai' | 'template'>('template')
const reviewResult = ref<PlotReviewResult | null>(null)
const showReview = ref(false)
const abortRef = ref<AbortController | null>(null)

const aiReady = computed(() => settings.enabled && settings.isConfigured)

onMounted(() => {
  if (props.initialPrompt && aiReady.value) {
    // 自动触发生成
    generate()
  }
})

watch(
  () => props.initialPrompt,
  (p) => {
    if (p) prompt.value = p
  }
)

const examplePrompts = [
  '设计一个发生在午夜教学楼的悬疑解谜故事，主角发现一间不存在的教室，需要通过收集线索、破解密码逃离，包含三个不同结局。',
  '一个太空站上，AI 突然失控锁死了所有舱门，宇航员必须在氧气耗尽前找到重启核心的密码。',
  '古董店里一面会说话的镜子，它声称能映出人的秘密，但每次提问都要付出代价。',
]

function useExample(p: string) {
  prompt.value = p
}

async function generate() {
  const p = prompt.value.trim()
  if (!p) {
    ui.warn('请先描述你想创作的故事')
    return
  }
  if (loading.value) return

  loading.value = true
  error.value = ''
  result.value = null
  reviewResult.value = null
  abortRef.value = new AbortController()

  try {
    const config = {
      enabled: settings.enabled,
      apiKey: settings.apiKey,
      endpoint: settings.endpoint,
      model: settings.model,
      capabilities: Array.from(settings.capabilities) as AICapability[],
      timeout: settings.timeout,
      maxRetries: settings.maxRetries,
    }
    const client = createProvider(config)
    const res = await generateStory(client, {
      prompt: p,
      endingCount: endingCount.value,
    })
    // 再次校验（generateStory 内部已校验，这里确保安全）
    const story = normalizeAIStory(res.story, endingCount.value)
    result.value = story
    source.value = res.source
    if (res.source === 'ai') {
      ui.success('AI 已生成故事，请预览后导入')
    } else {
      ui.info('使用本地模板生成（未配置 AI 或 AI 不可用）')
    }
  } catch (e) {
    if (e instanceof AIError) {
      error.value = formatAIError(e)
    } else {
      error.value = (e as Error).message || '生成失败'
    }
  } finally {
    loading.value = false
    abortRef.value = null
  }
}

function formatAIError(e: AIError): string {
  const prefix: Record<AIError['kind'], string> = {
    auth: '鉴权失败',
    network: '网络错误',
    timeout: '请求超时',
    rate_limit: '请求被限流',
    parse: '返回解析失败',
    invalid: '生成内容无效',
    unknown: '生成失败',
  }
  return `${prefix[e.kind]}：${e.message}`
}

function cancel() {
  if (abortRef.value) {
    abortRef.value.abort()
  }
  loading.value = false
  ui.info('已取消生成')
}

function applyResult() {
  if (!result.value) return
  try {
    const adv = convertToAdventure(result.value)
    emit('apply', adv)
  } catch (e) {
    ui.error('导入失败：' + (e as Error).message)
  }
}

function applyTemplate(id: string) {
  const adv = generateFromTemplate(id)
  if (adv) emit('apply', adv)
}

async function runReview() {
  if (!result.value) return
  showReview.value = true
  reviewResult.value = null
  try {
    const adv = convertToAdventure(result.value)
    const config = {
      enabled: settings.enabled,
      apiKey: settings.apiKey,
      endpoint: settings.endpoint,
      model: settings.model,
      capabilities: Array.from(settings.capabilities) as AICapability[],
      timeout: settings.timeout,
      maxRetries: settings.maxRetries,
    }
    const client = createProvider(config)
    reviewResult.value = await reviewAdventure(client, adv)
  } catch (e) {
    reviewResult.value = {
      issues: [],
      source: 'local',
    }
    ui.error('审查失败：' + (e as Error).message)
  }
}

const nodeTypeLabel: Record<string, string> = {
  start: '起始',
  scene: '场景',
  clue: '线索',
  puzzle: '谜题',
  ending: '结局',
}

const endingCountOptions = [2, 3, 4, 5]
</script>

<template>
  <div class="ai__overlay" @click.self="emit('close')">
    <div class="ai__panel lq-fade">
      <div class="ai__head">
        <div class="ai__head-title">
          <AppIcon name="sparkles" :size="18" />
          <h3>AI 故事生成</h3>
          <span class="lq-badge" :class="aiReady ? 'lq-badge--moss' : 'lq-badge--slate'">
            {{ aiReady ? 'AI 已连接' : '本地模式' }}
          </span>
        </div>
        <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="emit('close')">
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <div class="ai__body">
        <!-- 输入区 -->
        <div class="ai__input-section">
          <label class="lq-label">用一句话描述你想创作的故事</label>
          <textarea
            v-model="prompt"
            class="lq-textarea"
            rows="3"
            placeholder="例如：设计一个发生在午夜教学楼的悬疑解谜故事，主角发现一间不存在的教室……"
            :disabled="loading"
          ></textarea>

          <div class="ai__input-options">
            <div class="ai__option">
              <label class="lq-label">结局数量</label>
              <select v-model.number="endingCount" class="lq-select" :disabled="loading">
                <option v-for="n in endingCountOptions" :key="n" :value="n">{{ n }} 个结局</option>
              </select>
            </div>
          </div>

          <div class="ai__examples">
            <span class="ai__examples-label">示例：</span>
            <button
              v-for="(p, i) in examplePrompts"
              :key="i"
              class="ai__example-chip"
              @click="useExample(p)"
              :disabled="loading"
            >
              {{ p.slice(0, 22) }}…
            </button>
          </div>

          <div class="ai__gen-actions">
            <button
              v-if="!loading"
              class="lq-btn lq-btn--lg"
              @click="generate"
            >
              <AppIcon name="wand" :size="17" />
              <span>{{ aiReady ? '生成故事' : '用模板生成' }}</span>
            </button>
            <button v-else class="lq-btn lq-btn--ghost lq-btn--lg" @click="cancel">
              <AppIcon name="stop" :size="16" />
              <span>取消生成</span>
            </button>
          </div>

          <p v-if="!aiReady" class="ai__mode-hint">
            <AppIcon name="info" :size="13" />
            <span>未配置 AI，将使用内置模板生成。前往</span>
            <router-link :to="{ name: 'settings' }">设置</router-link>
            <span>配置模型可获得更丰富的剧情。</span>
          </p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="ai__loading">
          <span class="lq-spin"></span>
          <p>正在{{ aiReady ? '调用 AI 生成故事' : '使用模板生成' }}，请稍候……</p>
        </div>

        <!-- 错误 -->
        <div v-if="error" class="lq-alert lq-alert--error ai__error">
          <AppIcon name="alert" :size="15" />
          <div>
            <p class="lq-alert__title">生成失败</p>
            <p>{{ error }}</p>
          </div>
        </div>

        <!-- 生成结果预览 -->
        <div v-if="result" class="ai__result">
          <div class="ai__result-head">
            <div>
              <h4>{{ result.title }}</h4>
              <p class="ai__result-desc">{{ result.description }}</p>
            </div>
            <span class="lq-badge" :class="source === 'ai' ? 'lq-badge--moss' : 'lq-badge--slate'">
              {{ source === 'ai' ? 'AI 生成' : '模板生成' }}
            </span>
          </div>

          <div class="ai__result-tags">
            <span v-for="t in result.tags" :key="t" class="lq-badge lq-badge--slate">{{ t }}</span>
            <span class="lq-badge lq-badge--gold">{{ result.nodes.length }} 节点</span>
            <span class="lq-badge lq-badge--wine">{{ result.choices.length }} 分支</span>
          </div>

          <!-- 节点预览 -->
          <div class="ai__nodes">
            <div
              v-for="n in result.nodes"
              :key="n.id"
              class="ai__node"
              :class="`ai__node--${n.type}`"
            >
              <span class="ai__node-type">{{ nodeTypeLabel[n.type] }}</span>
              <span class="ai__node-title">{{ n.title }}</span>
              <span class="ai__node-text lq-clamp-2">{{ n.text }}</span>
              <span v-if="n.puzzleAnswer" class="ai__node-meta">密码：{{ n.puzzleAnswer }}</span>
              <span v-if="n.endingKind" class="ai__node-meta">结局：{{ n.endingKind }}</span>
            </div>
          </div>

          <!-- 审查 -->
          <div class="ai__review">
            <button class="lq-btn lq-btn--subtle lq-btn--sm" @click="runReview" :disabled="loading">
              <AppIcon name="beaker" :size="14" />
              <span>剧情审查</span>
            </button>
            <div v-if="reviewResult" class="ai__review-result">
              <p class="ai__review-source">
                {{ reviewResult.source === 'ai' ? 'AI + 本地' : '本地' }}审查 ·
                {{ reviewResult.issues.length }} 个问题
              </p>
              <div
                v-for="(iss, i) in reviewResult.issues.slice(0, 8)"
                :key="i"
                class="ai__review-issue"
                :class="`is-${iss.level}`"
              >
                <AppIcon :name="iss.level === 'error' ? 'alert' : 'info'" :size="13" />
                <span>{{ iss.message }}</span>
              </div>
              <div v-if="reviewResult.aiSuggestions?.length" class="ai__review-ai">
                <p class="ai__review-ai-title">AI 建议：</p>
                <p v-for="(s, i) in reviewResult.aiSuggestions" :key="i">· {{ s }}</p>
              </div>
            </div>
          </div>

          <!-- 导入操作 -->
          <div class="ai__apply">
            <button class="lq-btn lq-btn--lg" @click="applyResult">
              <AppIcon name="check" :size="17" />
              <span>导入到编辑器</span>
            </button>
            <button class="lq-btn lq-btn--ghost" @click="generate" :disabled="loading">
              <AppIcon name="refresh" :size="15" />
              <span>重新生成</span>
            </button>
          </div>
        </div>

        <!-- 模板快捷区（无结果时显示） -->
        <div v-if="!result && !loading" class="ai__templates">
          <p class="ai__templates-title">或从内置模板快速开始</p>
          <div class="ai__template-list">
            <button
              v-for="tpl in adventureTemplates"
              :key="tpl.id"
              class="ai__template"
              @click="applyTemplate(tpl.id)"
            >
              <span class="ai__template-name">{{ tpl.name }}</span>
              <span class="ai__template-desc">{{ tpl.description }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai__overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 26, 23, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
  padding: var(--lq-space-4);
}
.ai__panel {
  width: min(640px, 96vw);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  box-shadow: var(--lq-shadow-lg);
  display: flex;
  flex-direction: column;
}
.ai__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lq-space-4) var(--lq-space-5);
  border-bottom: 1px solid var(--lq-line);
  flex-shrink: 0;
}
.ai__head-title {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
}
.ai__head-title h3 { margin: 0; }
.ai__body {
  padding: var(--lq-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-4);
}
.ai__input-section { display: flex; flex-direction: column; gap: var(--lq-space-3); }
.ai__input-options { display: flex; gap: var(--lq-space-3); }
.ai__option { flex: 1; }
.ai__examples { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ai__examples-label { font-size: var(--lq-fs-xs); color: var(--lq-ink-faint); }
.ai__example-chip {
  padding: 3px 9px;
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: 999px;
  font-size: 11px;
  color: var(--lq-ink-soft);
  cursor: pointer;
}
.ai__example-chip:hover { border-color: var(--lq-wine); color: var(--lq-wine); }
.ai__gen-actions { display: flex; gap: var(--lq-space-2); }
.ai__gen-actions .lq-btn { flex: 1; }
.ai__mode-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  flex-wrap: wrap;
}
.ai__mode-hint a { color: var(--lq-wine); }
.ai__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lq-space-3);
  padding: var(--lq-space-8);
  color: var(--lq-ink-soft);
}
.ai__error { display: flex; gap: var(--lq-space-2); align-items: flex-start; }
.ai__error p { margin: 0; }

.ai__result {
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  padding: var(--lq-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-3);
}
.ai__result-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--lq-space-3); }
.ai__result-head h4 { margin: 0 0 4px; }
.ai__result-desc { font-size: var(--lq-fs-sm); color: var(--lq-ink-soft); margin: 0; }
.ai__result-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.ai__nodes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--lq-space-2);
  max-height: 280px;
  overflow-y: auto;
}
.ai__node {
  padding: var(--lq-space-3);
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ai__node-type { font-size: 10px; color: var(--lq-ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }
.ai__node-title { font-size: var(--lq-fs-sm); font-weight: 600; }
.ai__node-text { font-size: var(--lq-fs-xs); color: var(--lq-ink-soft); line-height: 1.5; }
.ai__node-meta { font-size: 10px; color: var(--lq-gold); font-family: var(--lq-font-mono); }
.ai__node--ending { border-color: var(--lq-wine); }
.ai__node--puzzle { border-color: var(--lq-rust); }
.ai__node--clue { border-color: var(--lq-gold); }
.ai__node--start { border-color: var(--lq-moss); }
.ai__review { display: flex; flex-direction: column; gap: var(--lq-space-2); }
.ai__review-result { display: flex; flex-direction: column; gap: 4px; }
.ai__review-source { font-size: var(--lq-fs-xs); color: var(--lq-ink-faint); margin: 0; }
.ai__review-issue {
  display: flex;
  gap: 6px;
  font-size: var(--lq-fs-xs);
  padding: 4px 8px;
  border-radius: var(--lq-radius);
  align-items: flex-start;
}
.ai__review-issue.is-error { background: rgba(154, 50, 50, 0.08); color: var(--lq-bad); }
.ai__review-issue.is-warning { background: var(--lq-rust-dim); color: var(--lq-warn); }
.ai__review-issue.is-info { background: var(--lq-slate-dim); color: var(--lq-info); }
.ai__review-ai { margin-top: var(--lq-space-2); padding: var(--lq-space-2); background: var(--lq-gold-dim); border-radius: var(--lq-radius-md); }
.ai__review-ai-title { font-size: var(--lq-fs-xs); font-weight: 600; color: var(--lq-gold); margin: 0 0 4px; }
.ai__review-ai p { font-size: var(--lq-fs-xs); color: var(--lq-ink-soft); margin: 2px 0; }
.ai__apply { display: flex; gap: var(--lq-space-2); }

.ai__templates { border-top: 1px solid var(--lq-line); padding-top: var(--lq-space-4); }
.ai__templates-title { font-size: var(--lq-fs-sm); color: var(--lq-ink-soft); margin: 0 0 var(--lq-space-3); }
.ai__template-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--lq-space-2); }
.ai__template {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--lq-space-3);
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--lq-dur) var(--lq-ease);
}
.ai__template:hover { border-color: var(--lq-wine); }
.ai__template-name { font-size: var(--lq-fs-sm); font-weight: 600; color: var(--lq-ink); }
.ai__template-desc { font-size: var(--lq-fs-xs); color: var(--lq-ink-soft); }
@media (max-width: 600px) {
  .ai__template-list { grid-template-columns: 1fr; }
}
</style>
