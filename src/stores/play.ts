import { defineStore } from 'pinia'
import type { Adventure, Choice, GameState, ID, Interactable, SceneNode } from '@/types/adventure'
import {
  type RuntimeContext,
  createInitialState,
  choose as runtimeChoose,
  solvePuzzle as runtimeSolvePuzzle,
  interactItem as runtimeInteractItem,
  getVisibleInteractables as runtimeGetVisibleInteractables,
  getAvailableChoices as runtimeGetAvailableChoices,
  getPuzzleState as runtimeGetPuzzleState,
  isInteracted as runtimeIsInteracted,
} from '@/engine/runtime'
import { saveCurrentState, listSessions, resumeFromSession } from '@/engine/save'

/**
 * 游戏运行时状态仓库：维护试玩过程中的动态状态。
 */
export const usePlayStore = defineStore('play', {
  state: () => ({
    adventure: null as Adventure | null,
    state: null as GameState | null,
    log: [] as string[],
    sessionId: null as ID | null,
    message: '',
    puzzleError: '',
    puzzleAttempts: 0,
    interactMessage: '',
    interactCollected: false,
  }),
  getters: {
    isEnded: (state): boolean => state.state?.ended ?? false,
    currentNode(state): SceneNode | null {
      const adv = state.adventure
      const st = state.state
      if (!adv || !st) return null
      return adv.nodes.find((n) => n.id === st.currentNodeId) ?? null
    },
    availableChoices(state): Choice[] {
      const adv = state.adventure
      const st = state.state
      if (!adv || !st) return []
      const ctx: RuntimeContext = { adventure: adv, state: st }
      return runtimeGetAvailableChoices(ctx)
    },
    inventory(state): string[] {
      return state.state?.inventory ?? []
    },
    visitedCount(state): number {
      return state.state?.visitedNodes.length ?? 0
    },
    visibleInteractables(state): Interactable[] {
      const adv = state.adventure
      const st = state.state
      if (!adv || !st) return []
      const ctx: RuntimeContext = { adventure: adv, state: st }
      return runtimeGetVisibleInteractables(ctx)
    },
  },
  actions: {
    start(adventure: Adventure): void {
      this.adventure = adventure
      this.state = createInitialState(adventure)
      this.log = [`进入：${this.currentNode?.content.title ?? '开端'}`]
      this.sessionId = null
      this.message = ''
      this.puzzleError = ''
      this.puzzleAttempts = 0
      this.interactMessage = ''
      this.interactCollected = false
    },
    /** 从存档恢复 */
    resume(adventure: Adventure, state: GameState, sessionId: ID): void {
      this.adventure = adventure
      this.state = state
      this.sessionId = sessionId
      this.log = [`恢复进度：${this.currentNode?.content.title ?? '当前场景'}`]
      this.message = '已恢复上次进度'
      this.puzzleError = ''
      this.puzzleAttempts = 0
      this.interactMessage = ''
      this.interactCollected = false
    },
    ctx(): RuntimeContext | null {
      if (!this.adventure || !this.state) return null
      return { adventure: this.adventure, state: this.state }
    },
    choose(choiceId: ID): void {
      const ctx = this.ctx()
      if (!ctx) return
      try {
        const result = runtimeChoose(ctx, choiceId)
        this.state = { ...result.state }
        this.log.push(`选择 → ${result.node.content.title}`)
        this.message = ''
        this.puzzleError = ''
        this.puzzleAttempts = 0
        this.interactMessage = ''
        this.interactCollected = false
      } catch (e) {
        this.message = (e as Error).message
      }
    },
    interact(interactableId: ID): void {
      const ctx = this.ctx()
      if (!ctx) return
      const res = runtimeInteractItem(ctx, interactableId)
      this.state = { ...ctx.state }
      this.interactMessage = res.message
      this.interactCollected = res.collected
      if (res.collected) {
        this.log.push(`发现：${res.message}`)
      } else if (res.navigated && res.result) {
        this.log.push(`前往 → ${res.result.node.content.title}`)
      }
    },
    isInteracted(nodeId: ID, interactableId: ID): boolean {
      if (!this.state) return false
      return runtimeIsInteracted(this.state, nodeId, interactableId)
    },
    puzzleState(nodeId: ID): { solved: boolean; attempts: number } {
      const ctx = this.ctx()
      if (!ctx) return { solved: false, attempts: 0 }
      return runtimeGetPuzzleState(ctx, nodeId)
    },
    solvePuzzle(answer: string): boolean {
      const ctx = this.ctx()
      if (!ctx) return false
      this.puzzleAttempts++
      const res = runtimeSolvePuzzle(ctx, answer)
      if (res.correct && res.result) {
        this.state = { ...res.result.state }
        this.log.push(`密码正确 → ${res.result.node.content.title}`)
        this.puzzleError = ''
        this.puzzleAttempts = 0
        this.interactMessage = ''
      } else {
        this.puzzleError = res.message
      }
      return res.correct
    },
    async saveProgress(): Promise<void> {
      if (!this.adventure || !this.state) return
      try {
        this.sessionId = await saveCurrentState(
          this.adventure.meta.id,
          this.state,
          this.sessionId ?? undefined
        )
        this.message = '进度已保存'
      } catch (e) {
        this.message = (e as Error).message
      }
    },
    reset(): void {
      if (this.adventure) this.start(this.adventure)
    },
    clearMessage(): void {
      this.message = ''
    },
    clearInteractMessage(): void {
      this.interactMessage = ''
      this.interactCollected = false
    },
  },
})

/** 列出某作品的存档 */
export async function getSessions(adventureId: ID) {
  return listSessions(adventureId)
}

/** 读取存档状态 */
export async function loadSessionState(id: ID) {
  return resumeFromSession(id)
}
