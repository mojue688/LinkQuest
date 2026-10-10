<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/common/SiteHeader.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useUI } from '@/stores/ui'

const route = useRoute()
const ui = useUI()

const routeNamesWithoutHeader = new Set(['editor', 'play'])

watch(
  () => route.name,
  (name) => {
    if (name === 'editor' || name === 'play') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      const saved = localStorage.getItem('lq_theme')
      document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light')
    }
  },
  { immediate: true }
)
</script>

<template>
  <SiteHeader v-if="!routeNamesWithoutHeader.has(route.name as string)" />
  <router-view />

  <!-- 全局 Toast -->
  <div class="lq-toast-host" aria-live="polite">
    <transition-group name="lq-toast">
      <div
        v-for="t in ui.state.toasts"
        :key="t.id"
        class="lq-toast"
        :class="`lq-toast--${t.kind}`"
        @click="ui.dismissToast(t.id)"
      >
        <AppIcon
          :name="t.kind === 'success' ? 'check' : t.kind === 'info' ? 'info' : 'alert'"
          :size="16"
        />
        <span class="lq-toast__msg">{{ t.message }}</span>
      </div>
    </transition-group>
  </div>

  <!-- 全局确认对话框 -->
  <transition name="lq-transition-fade">
    <div v-if="ui.state.confirm" class="lq-confirm" @click.self="ui.resolveConfirm(false)">
      <div class="lq-confirm__panel lq-fade" role="dialog" aria-modal="true">
        <div class="lq-confirm__head">
          <span class="lq-confirm__icon" :class="{ 'is-danger': ui.state.confirm.danger }">
            <AppIcon :name="ui.state.confirm.danger ? 'alert' : 'info'" :size="20" />
          </span>
          <h3>{{ ui.state.confirm.title }}</h3>
        </div>
        <p v-if="ui.state.confirm.message" class="lq-confirm__msg">
          {{ ui.state.confirm.message }}
        </p>
        <div class="lq-confirm__foot">
          <button class="lq-btn lq-btn--ghost" @click="ui.resolveConfirm(false)">
            {{ ui.state.confirm.cancelText ?? '取消' }}
          </button>
          <button
            class="lq-btn"
            :class="{ 'lq-btn--danger': ui.state.confirm.danger }"
            @click="ui.resolveConfirm(true)"
          >
            {{ ui.state.confirm.confirmText ?? '确认' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style>
.lq-toast-host {
  position: fixed;
  top: 72px;
  right: var(--lq-space-5);
  z-index: 300;
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-2);
  pointer-events: none;
}
.lq-toast {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  padding: 10px 14px;
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-left: 3px solid var(--lq-info);
  border-radius: var(--lq-radius-md);
  box-shadow: var(--lq-shadow-lg);
  font-size: var(--lq-fs-sm);
  color: var(--lq-ink);
  max-width: 360px;
  pointer-events: auto;
  cursor: pointer;
}
.lq-toast--success { border-left-color: var(--lq-good); }
.lq-toast--warn { border-left-color: var(--lq-warn); }
.lq-toast--error { border-left-color: var(--lq-bad); }
.lq-toast__msg { line-height: 1.5; }
.lq-toast-enter-active,
.lq-toast-leave-active { transition: all 0.25s var(--lq-ease); }
.lq-toast-enter-from { opacity: 0; transform: translateX(20px); }
.lq-toast-leave-to { opacity: 0; transform: translateX(20px); }

.lq-confirm {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(28, 26, 23, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--lq-space-4);
}
.lq-confirm__panel {
  width: min(420px, 94vw);
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  box-shadow: var(--lq-shadow-lg);
  padding: var(--lq-space-5);
}
.lq-confirm__head {
  display: flex;
  align-items: center;
  gap: var(--lq-space-3);
  margin-bottom: var(--lq-space-3);
}
.lq-confirm__head h3 { margin: 0; font-size: var(--lq-fs-md); }
.lq-confirm__icon { display: inline-flex; color: var(--lq-info); }
.lq-confirm__icon.is-danger { color: var(--lq-bad); }
.lq-confirm__msg {
  color: var(--lq-ink-soft);
  font-size: var(--lq-fs-sm);
  line-height: 1.6;
  margin: 0 0 var(--lq-space-5);
}
.lq-confirm__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--lq-space-2);
}
@media (max-width: 768px) {
  .lq-toast-host { right: var(--lq-space-3); left: var(--lq-space-3); }
  .lq-toast { max-width: none; }
}
</style>
