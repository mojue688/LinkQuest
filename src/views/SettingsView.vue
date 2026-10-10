<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useSettingsStore, DEFAULT_ENDPOINT, DEFAULT_MODEL } from '@/stores/settings'
import { useUI } from '@/stores/ui'
import { testConnection } from '@/ai/provider'
import { AICapability } from '@/types/adventure'
import AppIcon from '@/components/common/AppIcon.vue'

const settings = useSettingsStore()
const ui = useUI()

const showKey = ref(false)
const testing = ref(false)
const testResult = ref<{ ok: boolean; message: string; latency?: number } | null>(null)

const caps: { value: AICapability; label: string; desc: string }[] = [
  { value: AICapability.GenerateScene, label: '生成场景', desc: '根据提示生成场景文本' },
  { value: AICapability.GenerateBranch, label: '生成分支', desc: '为场景生成可选行动' },
  { value: AICapability.ReviewPlot, label: '剧情评审', desc: '对剧情给出建议' },
  { value: AICapability.SuggestEnding, label: '结局建议', desc: '推荐结局走向' },
]

onMounted(() => {
  settings.load()
})

const keyMasked = computed(() => {
  const k = settings.apiKey
  if (!k) return ''
  if (showKey.value) return k
  return k.length > 8 ? k.slice(0, 4) + '••••' + k.slice(-4) : '••••'
})

function save() {
  settings.persist()
  ui.success('设置已保存到本地')
}

function toggleCap(cap: AICapability, on: boolean) {
  settings.toggleCapability(cap, on)
}

async function runTest() {
  if (testing.value) return
  if (!settings.isConfigured) {
    testResult.value = { ok: false, message: '请先填写 Endpoint、模型名称和 API Key。' }
    return
  }
  testing.value = true
  testResult.value = null
  try {
    const result = await testConnection({
      enabled: true,
      apiKey: settings.apiKey,
      endpoint: settings.endpoint,
      model: settings.model,
      capabilities: Array.from(settings.capabilities),
      timeout: settings.timeout,
      maxRetries: 0,
    })
    testResult.value = result
    if (result.ok) ui.success('连接测试成功')
    else ui.error('连接测试失败')
  } finally {
    testing.value = false
  }
}

async function clearKey() {
  const ok = await ui.confirm({
    title: '清除 API Key？',
    message: '清除后将无法调用 AI，回退到本地模板模式。',
    confirmText: '清除',
    danger: true,
  })
  if (ok) {
    settings.clearKey()
    testResult.value = null
    ui.success('已清除 API Key')
  }
}

async function resetDefaults() {
  const ok = await ui.confirm({
    title: '恢复默认配置？',
    message: 'Endpoint 和模型名称将恢复为默认值，API Key 保留不变。',
    confirmText: '恢复',
  })
  if (ok) {
    settings.resetDefaults()
    testResult.value = null
    ui.success('已恢复默认配置')
  }
}

async function clearAll() {
  const ok = await ui.confirm({
    title: '清除全部 AI 配置？',
    message: '将关闭 AI 并清除所有配置，回退到纯本地模式。',
    confirmText: '全部清除',
    danger: true,
  })
  if (ok) {
    settings.clearAll()
    testResult.value = null
    ui.success('已清除全部 AI 配置')
  }
}

const endpointPresets = [
  { label: 'OpenAI', endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: '智谱 GLM', endpoint: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { label: 'Moonshot', endpoint: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
]

function applyPreset(p: { endpoint: string; model: string }) {
  settings.endpoint = p.endpoint
  settings.model = p.model
  settings.persist()
}
</script>

<template>
  <div class="lq-page settings">
    <div class="settings__head">
      <div>
        <h1 class="lq-title">AI 设置</h1>
        <p class="settings__lead">
          AI 为可选增强能力。未配置或不可用时，平台自动回退到本地模板模式，
          断网无密钥亦可完整编辑、试玩、导出作品。所有配置仅保存在浏览器本地。
        </p>
      </div>
      <span class="lq-badge" :class="settings.enabled && settings.isConfigured ? 'lq-badge--moss' : 'lq-badge--slate'">
        {{ settings.enabled && settings.isConfigured ? 'AI 已启用' : '本地模式' }}
      </span>
    </div>

    <!-- 启用开关 -->
    <section class="lq-card settings__card">
      <label class="lq-switch">
        <input type="checkbox" v-model="settings.enabled" @change="settings.persist()" />
        <span class="lq-switch__track"></span>
        <div>
          <div class="settings__switch-title">启用 AI 增强</div>
          <div class="lq-help">关闭后所有 AI 功能回退到本地模板，明确标注来源。</div>
        </div>
      </label>
    </section>

    <!-- 服务商预设 -->
    <section class="lq-card settings__card">
      <h3 class="settings__card-title">快速选择服务商</h3>
      <p class="lq-help">选择后会自动填入 Endpoint 和推荐模型，你仍需自行填入 API Key。</p>
      <div class="settings__presets">
        <button
          v-for="p in endpointPresets"
          :key="p.label"
          class="settings__preset"
          :class="{ 'is-active': settings.endpoint === p.endpoint }"
          @click="applyPreset(p)"
        >
          <span class="settings__preset-name">{{ p.label }}</span>
          <span class="settings__preset-model">{{ p.model }}</span>
        </button>
      </div>
    </section>

    <!-- 连接配置 -->
    <section class="lq-card settings__card">
      <h3 class="settings__card-title">连接配置</h3>

      <div class="lq-field">
        <label class="lq-label lq-label--req">API Endpoint</label>
        <input
          v-model="settings.endpoint"
          class="lq-input lq-input--mono"
          placeholder="https://api.openai.com/v1"
        />
        <p class="lq-help">兼容 OpenAI 风格 Chat Completions 的接口地址，以 /v1 结尾。</p>
      </div>

      <div class="lq-field">
        <label class="lq-label lq-label--req">模型名称</label>
        <input
          v-model="settings.model"
          class="lq-input"
          placeholder="如：gpt-4o-mini"
        />
        <p class="lq-help">由你的模型服务商提供，如 gpt-4o-mini、deepseek-chat、glm-4-flash 等。</p>
      </div>

      <div class="lq-field">
        <label class="lq-label lq-label--req">API Key</label>
        <div class="settings__key-row">
          <input
            v-model="settings.apiKey"
            class="lq-input lq-input--mono"
            :type="showKey ? 'text' : 'password'"
            placeholder="留空则不调用外部模型"
          />
          <button class="lq-btn lq-btn--ghost lq-btn--icon" @click="showKey = !showKey" :title="showKey ? '隐藏' : '显示'">
            <AppIcon :name="showKey ? 'eyeOff' : 'eye'" :size="16" />
          </button>
          <button
            v-if="settings.apiKey"
            class="lq-btn lq-btn--ghost lq-btn--icon"
            @click="clearKey"
            title="清除密钥"
          >
            <AppIcon name="trash" :size="16" />
          </button>
        </div>
        <p class="lq-help">
          当前密钥：<span class="lq-mono">{{ keyMasked || '未设置' }}</span>
        </p>
      </div>

      <div class="lq-field-row">
        <div class="lq-field" style="flex:1">
          <label class="lq-label">请求超时（毫秒）</label>
          <input v-model.number="settings.timeout" type="number" min="5000" step="1000" class="lq-input" />
        </div>
        <div class="lq-field" style="flex:1">
          <label class="lq-label">最大重试次数</label>
          <input v-model.number="settings.maxRetries" type="number" min="0" max="5" class="lq-input" />
        </div>
      </div>

      <div class="settings__test">
        <button class="lq-btn lq-btn--subtle" @click="runTest" :disabled="testing">
          <span v-if="testing" class="lq-spin"></span>
          <AppIcon v-else name="wifi" :size="15" />
          <span>{{ testing ? '测试中…' : '测试连接' }}</span>
        </button>
        <div v-if="testResult" class="settings__test-result" :class="testResult.ok ? 'is-ok' : 'is-fail'">
          <AppIcon :name="testResult.ok ? 'check' : 'alert'" :size="15" />
          <span>{{ testResult.message }}</span>
          <span v-if="testResult.latency" class="lq-faint">（{{ testResult.latency }}ms）</span>
        </div>
      </div>
    </section>

    <!-- 启用能力 -->
    <section class="lq-card settings__card">
      <h3 class="settings__card-title">启用能力</h3>
      <p class="lq-help">选择需要 AI 辅助的功能，未勾选的能力将使用本地回退。</p>
      <div class="settings__caps">
        <label
          v-for="c in caps"
          :key="c.value"
          class="settings__cap"
        >
          <input
            type="checkbox"
            :checked="settings.capabilities.has(c.value)"
            @change="toggleCap(c.value, ($event.target as HTMLInputElement).checked)"
          />
          <div>
            <div class="settings__cap-title">{{ c.label }}</div>
            <div class="lq-help">{{ c.desc }}</div>
          </div>
        </label>
      </div>
    </section>

    <!-- 安全说明 -->
    <section class="lq-alert lq-alert--warn settings__card">
      <div class="settings__alert-title">
        <AppIcon name="alert" :size="16" />
        <span>API Key 安全说明</span>
      </div>
      <ul class="settings__alert-list">
        <li>API Key 仅保存在你浏览器的 localStorage 中，不会上传到本平台任何后端。</li>
        <li>直接从浏览器请求第三方 API 时，密钥可能被浏览器开发者工具或网络请求面板查看，仅适合个人本地体验。</li>
        <li>不要在公共电脑上保存密钥，使用完毕后请点击「清除密钥」。</li>
        <li>本平台不宣称 localStorage 等同于安全密钥存储，也不会对密钥做任何加密。</li>
        <li>不会将你的密钥发送到未说明的第三方服务。</li>
        <li>若未来面向公众提供共享 AI 服务，应使用后端代理或云函数，不要将公共密钥打包进前端。</li>
      </ul>
    </section>

    <!-- 获取说明 -->
    <section class="lq-card settings__card">
      <h3 class="settings__card-title">如何获取 API Key</h3>
      <ol class="settings__steps">
        <li>注册一个兼容 OpenAI 接口的大模型服务商账号（如 OpenAI、DeepSeek、智谱、Moonshot 等）。</li>
        <li>在服务商控制台创建 API Key（通常称为「密钥」「Token」）。</li>
        <li>将 Endpoint、模型名称和 API Key 填入上方表单。</li>
        <li>点击「测试连接」验证配置是否正确。</li>
        <li>返回编辑器，在 AI 面板用一句话生成你的互动故事。</li>
      </ol>
    </section>

    <!-- 操作 -->
    <section class="settings__actions">
      <button class="lq-btn" @click="save">
        <AppIcon name="save" :size="15" />
        <span>保存设置</span>
      </button>
      <button class="lq-btn lq-btn--ghost" @click="resetDefaults">
        <AppIcon name="refresh" :size="15" />
        <span>恢复默认</span>
      </button>
      <button class="lq-btn lq-btn--danger" @click="clearAll">
        <AppIcon name="trash" :size="15" />
        <span>清除全部配置</span>
      </button>
    </section>

    <p class="settings__footer-note">
      默认 Endpoint：<span class="lq-mono">{{ DEFAULT_ENDPOINT }}</span> ·
      默认模型：<span class="lq-mono">{{ DEFAULT_MODEL }}</span>
    </p>
  </div>
</template>

<style scoped>
.settings { max-width: 720px; }
.settings__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--lq-space-4);
  margin-bottom: var(--lq-space-5);
}
.settings__lead {
  color: var(--lq-ink-soft);
  font-size: var(--lq-fs-sm);
  line-height: 1.7;
  margin: var(--lq-space-2) 0 0;
  max-width: 560px;
}
.settings__card { margin-bottom: var(--lq-space-4); }
.settings__card-title { font-size: var(--lq-fs-md); margin: 0 0 var(--lq-space-4); }
.settings__switch-title { font-size: var(--lq-fs-base); font-weight: 600; }

.settings__presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--lq-space-2);
  margin-top: var(--lq-space-3);
}
.settings__preset {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--lq-space-3);
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--lq-dur) var(--lq-ease);
}
.settings__preset:hover { border-color: var(--lq-ink-faint); }
.settings__preset.is-active { border-color: var(--lq-wine); background: var(--lq-wine-dim); }
.settings__preset-name { font-size: var(--lq-fs-sm); font-weight: 600; }
.settings__preset-model { font-size: 11px; color: var(--lq-ink-faint); font-family: var(--lq-font-mono); }

.settings__key-row { display: flex; gap: var(--lq-space-2); align-items: stretch; }
.settings__key-row .lq-input { flex: 1; }

.settings__test { display: flex; align-items: center; gap: var(--lq-space-3); margin-top: var(--lq-space-3); flex-wrap: wrap; }
.settings__test-result {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--lq-fs-sm);
  padding: 6px 12px;
  border-radius: var(--lq-radius-md);
}
.settings__test-result.is-ok { background: var(--lq-moss-dim); color: var(--lq-good); }
.settings__test-result.is-fail { background: rgba(154, 50, 50, 0.08); color: var(--lq-bad); }

.settings__caps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--lq-space-3);
  margin-top: var(--lq-space-3);
}
.settings__cap {
  display: flex;
  gap: var(--lq-space-3);
  padding: var(--lq-space-3);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-md);
  cursor: pointer;
  background: var(--lq-paper-2);
  align-items: flex-start;
}
.settings__cap:hover { border-color: var(--lq-wine); }
.settings__cap-title { font-size: var(--lq-fs-sm); margin-bottom: 2px; font-weight: 600; }

.settings__alert-title {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  font-weight: 600;
  margin-bottom: var(--lq-space-2);
}
.settings__alert-list { margin: 0; padding-left: var(--lq-space-5); line-height: 1.8; font-size: var(--lq-fs-sm); }
.settings__alert-list li { margin-bottom: 4px; }

.settings__steps { margin: 0; padding-left: var(--lq-space-5); line-height: 1.9; font-size: var(--lq-fs-sm); color: var(--lq-ink-soft); }
.settings__steps li { margin-bottom: 6px; }

.settings__actions {
  display: flex;
  gap: var(--lq-space-2);
  flex-wrap: wrap;
  margin-top: var(--lq-space-4);
}
.settings__footer-note {
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  margin-top: var(--lq-space-4);
}
@media (max-width: 600px) {
  .settings__actions .lq-btn { width: 100%; }
}
</style>
