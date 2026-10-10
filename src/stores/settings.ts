import { defineStore } from 'pinia'
import type { AICapability } from '@/types/adventure'

const STORAGE_KEY = 'linkquest_ai_settings'

/** 默认配置（不含密钥） */
export const DEFAULT_ENDPOINT = 'https://api.openai.com/v1'
export const DEFAULT_MODEL = 'gpt-4o-mini'

interface PersistedSettings {
  enabled: boolean
  apiKey: string
  endpoint: string
  model: string
  capabilities: AICapability[]
  timeout: number
  maxRetries: number
  soundEnabled: boolean
  skipAnimations: boolean
}

/**
 * AI 设置仓库：维护 AI 能力的开关与密钥配置（仅存于本地 localStorage，不上传任何后端）。
 *
 * 安全说明：
 * - API Key 存于浏览器 localStorage，可被开发者工具查看，仅适合个人本地体验。
 * - 不要在公共环境保存密钥，使用后请清除。
 * - 面向公众部署应使用后端代理，不将公共密钥打包进前端。
 */
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    enabled: false,
    apiKey: '',
    endpoint: DEFAULT_ENDPOINT,
    model: DEFAULT_MODEL,
    capabilities: new Set<AICapability>(),
    timeout: 30000,
    maxRetries: 2,
    loaded: false,
    soundEnabled: false,
    skipAnimations: false,
  }),
  getters: {
    isConfigured: (state): boolean =>
      !!state.apiKey && !!state.endpoint && !!state.model,
  },
  actions: {
    load(): void {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const data = JSON.parse(raw) as Partial<PersistedSettings>
          this.enabled = data.enabled ?? false
          this.apiKey = data.apiKey ?? ''
          this.endpoint = data.endpoint ?? DEFAULT_ENDPOINT
          this.model = data.model ?? DEFAULT_MODEL
          this.capabilities = new Set(data.capabilities ?? [])
          this.timeout = data.timeout ?? 30000
          this.maxRetries = data.maxRetries ?? 2
          this.soundEnabled = data.soundEnabled ?? false
          this.skipAnimations = data.skipAnimations ?? false
        }
      } catch {
        // 忽略损坏的本地配置
      }
      this.loaded = true
    },
    toggle(on: boolean): void {
      this.enabled = on
      this.persist()
    },
    setKey(key: string): void {
      this.apiKey = key
      this.persist()
    },
    setField(field: 'endpoint' | 'model', value: string): void {
      this[field] = value
      this.persist()
    },
    toggleCapability(cap: AICapability, on: boolean): void {
      if (on) this.capabilities.add(cap)
      else this.capabilities.delete(cap)
      this.persist()
    },
    toggleSound(on: boolean): void {
      this.soundEnabled = on
      this.persist()
    },
    toggleSkipAnimations(on: boolean): void {
      this.skipAnimations = on
      this.persist()
    },
    /** 清除 API Key（其他配置保留） */
    clearKey(): void {
      this.apiKey = ''
      this.persist()
    },
    /** 恢复默认配置（不清除密钥） */
    resetDefaults(): void {
      this.endpoint = DEFAULT_ENDPOINT
      this.model = DEFAULT_MODEL
      this.timeout = 30000
      this.maxRetries = 2
      this.persist()
    },
    /** 清除全部 AI 配置 */
    clearAll(): void {
      this.enabled = false
      this.apiKey = ''
      this.endpoint = DEFAULT_ENDPOINT
      this.model = DEFAULT_MODEL
      this.capabilities = new Set()
      this.persist()
    },
    persist(): void {
      const data: PersistedSettings = {
        enabled: this.enabled,
        apiKey: this.apiKey,
        endpoint: this.endpoint,
        model: this.model,
        capabilities: Array.from(this.capabilities),
        timeout: this.timeout,
        maxRetries: this.maxRetries,
        soundEnabled: this.soundEnabled,
        skipAnimations: this.skipAnimations,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // localStorage 不可用时静默
      }
    },
  },
})
