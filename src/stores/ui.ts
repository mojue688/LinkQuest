import { reactive, readonly } from 'vue'

interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ToastKind = 'info' | 'success' | 'warn' | 'error'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const state = reactive({
  toasts: [] as ToastItem[],
  confirm: null as (ConfirmOptions & { resolve: (v: boolean) => void }) | null,
})

let seq = 0

function toast(kind: ToastKind, message: string, duration = 3200) {
  const id = ++seq
  state.toasts.push({ id, kind, message })
  if (state.toasts.length > 4) state.toasts.shift()
  setTimeout(() => {
    state.toasts = state.toasts.filter((t) => t.id !== id)
  }, duration)
}

function dismissToast(id: number) {
  state.toasts = state.toasts.filter((t) => t.id !== id)
}

function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    state.confirm = { ...opts, resolve }
  })
}

function resolveConfirm(value: boolean) {
  if (state.confirm) {
    state.confirm.resolve(value)
    state.confirm = null
  }
}

export function useUI() {
  return {
    state: readonly(state),
    toast,
    info: (m: string, d?: number) => toast('info', m, d),
    success: (m: string, d?: number) => toast('success', m, d),
    warn: (m: string, d?: number) => toast('warn', m, d),
    error: (m: string, d?: number) => toast('error', m, d),
    dismissToast,
    confirm,
    resolveConfirm,
  }
}
