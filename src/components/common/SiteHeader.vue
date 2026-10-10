<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const route = useRoute()
const settings = useSettingsStore()

const theme = ref<'light' | 'dark'>('light')
const menuOpen = ref(false)

onMounted(() => {
  settings.load()
  const saved = localStorage.getItem('lq_theme')
  if (saved === 'dark' || saved === 'light') {
    theme.value = saved
    applyTheme()
  }
})

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme.value)
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('lq_theme', theme.value)
  applyTheme()
}

const aiReady = computed(() => settings.enabled && !!settings.apiKey && !!settings.endpoint)

const navItems = [
  { name: 'home', label: '首页', icon: 'home' },
  { name: 'settings', label: '设置', icon: 'settings' },
]

function go(name: string) {
  menuOpen.value = false
  router.push({ name })
}
</script>

<template>
  <header class="lq-header">
    <div class="lq-header__inner">
      <button class="lq-header__brand" @click="go('home')">
        <span class="lq-header__mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l2.4 6.5L21 9l-5.4 4 1.8 7L12 16l-5.4 4 1.8-7L3 9l6.6-.5L12 2z" />
          </svg>
        </span>
        <span class="lq-header__name">谜境</span>
        <span class="lq-header__sub">LinkQuest</span>
      </button>

      <nav class="lq-header__nav" :class="{ 'is-open': menuOpen }">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="lq-header__nav-btn"
          :class="{ 'is-active': route.name === item.name }"
          @click="go(item.name)"
        >
          <AppIcon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </button>
        <button
          class="lq-header__nav-btn lq-header__nav-btn--status"
          :class="{ 'is-on': aiReady }"
          @click="go('settings')"
          :title="aiReady ? 'AI 已配置' : 'AI 未配置，使用本地模式'"
        >
          <span class="lq-header__dot" :class="{ 'is-on': aiReady }"></span>
          <span>{{ aiReady ? 'AI 已连接' : '本地模式' }}</span>
        </button>
      </nav>

      <div class="lq-header__tools">
        <button class="lq-header__icon-btn" @click="toggleTheme" :title="theme === 'light' ? '切换深色' : '切换浅色'">
          <AppIcon :name="theme === 'light' ? 'moon' : 'sun'" :size="17" />
        </button>
        <button class="lq-header__icon-btn lq-header__menu-btn" @click="menuOpen = !menuOpen" :title="menuOpen ? '关闭菜单' : '打开菜单'">
          <AppIcon :name="menuOpen ? 'close' : 'menu'" :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.lq-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--lq-paper);
  border-bottom: 1px solid var(--lq-line);
  backdrop-filter: blur(8px);
}
.lq-header__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--lq-space-6);
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lq-space-4);
}
.lq-header__brand {
  display: flex;
  align-items: baseline;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--lq-ink);
  font-family: var(--lq-font-sans);
}
.lq-header__mark {
  display: inline-flex;
  align-items: center;
  color: var(--lq-wine);
  margin-right: 2px;
  transform: translateY(3px);
}
.lq-header__name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.lq-header__sub {
  font-size: 12px;
  font-family: var(--lq-font-ui);
  color: var(--lq-ink-faint);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.lq-header__nav {
  display: flex;
  align-items: center;
  gap: var(--lq-space-1);
}
.lq-header__nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: none;
  background: none;
  color: var(--lq-ink-soft);
  font-family: var(--lq-font-ui);
  font-size: var(--lq-fs-sm);
  cursor: pointer;
  border-radius: var(--lq-radius-md);
  transition: background-color var(--lq-dur) var(--lq-ease), color var(--lq-dur) var(--lq-ease);
}
.lq-header__nav-btn:hover {
  background: var(--lq-paper-2);
  color: var(--lq-ink);
}
.lq-header__nav-btn.is-active {
  color: var(--lq-wine);
  background: var(--lq-wine-dim);
}
.lq-header__nav-btn--status {
  margin-left: var(--lq-space-2);
  padding-left: 10px;
  border: 1px solid var(--lq-line);
  font-size: var(--lq-fs-xs);
}
.lq-header__nav-btn--status.is-on {
  border-color: var(--lq-moss);
  color: var(--lq-moss);
}
.lq-header__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lq-ink-faint);
}
.lq-header__dot.is-on {
  background: var(--lq-moss);
  box-shadow: 0 0 0 3px var(--lq-moss-dim);
}
.lq-header__tools {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
}
.lq-header__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--lq-line);
  background: var(--lq-paper);
  color: var(--lq-ink-soft);
  border-radius: var(--lq-radius-md);
  cursor: pointer;
  transition: all var(--lq-dur) var(--lq-ease);
}
.lq-header__icon-btn:hover {
  border-color: var(--lq-ink-faint);
  color: var(--lq-ink);
}
.lq-header__menu-btn {
  display: none;
}

@media (max-width: 768px) {
  .lq-header__inner {
    padding: 0 var(--lq-space-4);
  }
  .lq-header__menu-btn {
    display: inline-flex;
  }
  .lq-header__nav {
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: var(--lq-space-3);
    background: var(--lq-paper);
    border-bottom: 1px solid var(--lq-line);
    box-shadow: var(--lq-shadow);
    transform: translateY(-8px);
    opacity: 0;
    pointer-events: none;
    transition: transform var(--lq-dur) var(--lq-ease), opacity var(--lq-dur) var(--lq-ease);
  }
  .lq-header__nav.is-open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  .lq-header__nav-btn {
    justify-content: flex-start;
    padding: 10px 12px;
  }
  .lq-header__nav-btn--status {
    margin-left: 0;
  }
}
</style>
