import { defineStore } from 'pinia'
import type {
  Adventure,
  Choice,
  ID,
  NodeType,
  SceneNode,
  ValidationResult,
} from '@/types/adventure'
import {
  listAdventures,
  getAdventure,
  putAdventure,
  deleteAdventure,
} from '@/storage/database'
import {
  createAdventure,
  createNode,
  createChoice,
  deepClone,
} from '@/utils/factory'
import { validateAdventure } from '@/engine/validation'

const MAX_HISTORY = 60

/**
 * 作品仓库：管理作品列表与当前编辑中的作品，含节点/选项操作、撤销重做。
 */
export const useAdventureStore = defineStore('adventure', {
  state: () => ({
    list: [] as Adventure[],
    current: null as Adventure | null,
    selectedNodeId: null as ID | null,
    loading: false,
    saving: false,
    error: '' as string,
    dirty: false,
    lastSavedAt: 0 as number,
    // 撤销/重做历史栈（保存 Adventure 快照）
    history: [] as Adventure[],
    historyIndex: -1,
    // 校验结果缓存
    validation: null as ValidationResult | null,
  }),
  getters: {
    currentId: (state): ID | null => state.current?.meta.id ?? null,
    selectedNode(state): SceneNode | null {
      const cur = state.current
      if (!cur) return null
      return cur.nodes.find((n) => n.id === state.selectedNodeId) ?? null
    },
    canUndo(state): boolean {
      return state.historyIndex > 0
    },
    canRedo(state): boolean {
      return state.historyIndex < state.history.length - 1
    },
    issueCount(state): number {
      return state.validation?.issues.filter((i) => i.level === 'error').length ?? 0
    },
    warnCount(state): number {
      return state.validation?.issues.filter((i) => i.level === 'warning').length ?? 0
    },
  },
  actions: {
    /* ---------- 历史栈 ---------- */
    /** 在执行变更前快照当前状态（用于撤销） */
    snapshot(): void {
      if (!this.current) return
      // 截断 redo 分支
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push(deepClone(this.current))
      if (this.history.length > MAX_HISTORY) {
        this.history.shift()
      } else {
        this.historyIndex++
      }
    },
    /** 重置历史栈（新基线，如打开/AI 导入后） */
    resetHistory(): void {
      this.history = this.current ? [deepClone(this.current)] : []
      this.historyIndex = this.history.length - 1
    },
    undo(): void {
      if (!this.canUndo) return
      this.historyIndex--
      this.current = deepClone(this.history[this.historyIndex])
      this.dirty = true
      this.revalidate()
    },
    redo(): void {
      if (!this.canRedo) return
      this.historyIndex++
      this.current = deepClone(this.history[this.historyIndex])
      this.dirty = true
      this.revalidate()
    },

    /* ---------- 校验 ---------- */
    revalidate(): void {
      if (!this.current) {
        this.validation = null
        return
      }
      this.validation = validateAdventure(this.current)
    },

    /* ---------- 列表/读写 ---------- */
    async loadList(): Promise<void> {
      this.loading = true
      this.error = ''
      try {
        this.list = await listAdventures()
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.loading = false
      }
    },
    async open(id: ID): Promise<boolean> {
      this.loading = true
      this.error = ''
      try {
        const adv = await getAdventure(id)
        if (adv) {
          this.current = adv
          this.selectedNodeId = adv.startNodeId
          this.dirty = false
          this.lastSavedAt = adv.meta.updatedAt
          this.resetHistory()
          this.revalidate()
          return true
        }
        this.error = '作品不存在'
        return false
      } catch (e) {
        this.error = (e as Error).message
        return false
      } finally {
        this.loading = false
      }
    },
    async create(title: string): Promise<ID> {
      this.error = ''
      try {
        const adv = createAdventure(title)
        await putAdventure(deepClone(adv))
        this.current = adv
        this.selectedNodeId = adv.startNodeId
        this.dirty = false
        this.lastSavedAt = adv.meta.updatedAt
        this.resetHistory()
        this.revalidate()
        await this.loadList()
        return adv.meta.id
      } catch (e) {
        this.error = (e as Error).message
        return ''
      }
    },
    async saveCurrent(): Promise<boolean> {
      if (!this.current) return false
      this.saving = true
      this.error = ''
      const snapshot = deepClone(this.current)
      const snapshotKey = JSON.stringify(snapshot)
      try {
        await putAdventure(snapshot)
        // 仅当保存期间没有新编辑时才清除 dirty
        if (JSON.stringify(this.current) === snapshotKey) {
          this.dirty = false
        }
        this.lastSavedAt = Date.now()
        return true
      } catch (e) {
        this.error = (e as Error).message
        return false
      } finally {
        this.saving = false
      }
    },
    async remove(id: ID): Promise<void> {
      this.error = ''
      try {
        await deleteAdventure(id)
        if (this.current?.meta.id === id) {
          this.current = null
          this.selectedNodeId = null
          this.history = []
          this.historyIndex = -1
        }
        await this.loadList()
      } catch (e) {
        this.error = (e as Error).message
      }
    },
    setCurrent(adv: Adventure): void {
      this.current = adv
      this.selectedNodeId = adv.startNodeId
      this.dirty = true
      this.resetHistory()
      this.revalidate()
    },
    selectNode(id: ID | null): void {
      this.selectedNodeId = id
    },
    updateMeta(patch: Partial<Adventure['meta']>): void {
      if (!this.current) return
      this.snapshot()
      Object.assign(this.current.meta, patch)
      this.dirty = true
    },
    addNode(type: NodeType, position: { x: number; y: number }): SceneNode | null {
      if (!this.current) return null
      this.snapshot()
      const node = createNode(type, position)
      this.current.nodes.push(node)
      this.selectedNodeId = node.id
      this.dirty = true
      this.revalidate()
      return node
    },
    updateNode(id: ID, patch: Partial<SceneNode>): void {
      if (!this.current) return
      const node = this.current.nodes.find((n) => n.id === id)
      if (node) {
        Object.assign(node, patch)
        this.dirty = true
        this.revalidate()
      }
    },
    /** 带历史记录的节点更新（用于属性面板显式保存） */
    updateNodeTracked(id: ID, patch: Partial<SceneNode>): void {
      if (!this.current) return
      this.snapshot()
      const node = this.current.nodes.find((n) => n.id === id)
      if (node) {
        Object.assign(node, patch)
        this.dirty = true
        this.revalidate()
      }
    },
    updateNodeContent(id: ID, patch: Partial<SceneNode['content']>): void {
      if (!this.current) return
      const node = this.current.nodes.find((n) => n.id === id)
      if (node) {
        Object.assign(node.content, patch)
        this.dirty = true
      }
    },
    updateNodePosition(id: ID, position: { x: number; y: number }): void {
      if (!this.current) return
      const node = this.current.nodes.find((n) => n.id === id)
      if (node) {
        node.position = position
        this.dirty = true
      }
    },
    /** 拖拽结束时提交一次历史快照 */
    commitNodePosition(id: ID, position: { x: number; y: number }): void {
      if (!this.current) return
      this.snapshot()
      const node = this.current.nodes.find((n) => n.id === id)
      if (node) {
        node.position = position
        this.dirty = true
      }
    },
    removeNode(id: ID): void {
      if (!this.current) return
      if (this.current.startNodeId === id) {
        this.error = '不能删除起始节点'
        return
      }
      this.snapshot()
      this.current.nodes = this.current.nodes.filter((n) => n.id !== id)
      this.current.choices = this.current.choices.filter(
        (c) => c.fromNodeId !== id && c.toNodeId !== id
      )
      if (this.selectedNodeId === id) this.selectedNodeId = null
      this.dirty = true
      this.revalidate()
    },
    addChoice(fromId: ID, toId: ID, label = '继续'): Choice | null {
      if (!this.current) return null
      this.snapshot()
      const choice = createChoice(fromId, toId, label)
      this.current.choices.push(choice)
      this.dirty = true
      this.revalidate()
      return choice
    },
    updateChoice(id: ID, patch: Partial<Choice>): void {
      if (!this.current) return
      const c = this.current.choices.find((x) => x.id === id)
      if (c) {
        Object.assign(c, patch)
        this.dirty = true
        this.revalidate()
      }
    },
    updateChoiceTracked(id: ID, patch: Partial<Choice>): void {
      if (!this.current) return
      this.snapshot()
      const c = this.current.choices.find((x) => x.id === id)
      if (c) {
        Object.assign(c, patch)
        this.dirty = true
        this.revalidate()
      }
    },
    removeChoice(id: ID): void {
      if (!this.current) return
      this.snapshot()
      this.current.choices = this.current.choices.filter((c) => c.id !== id)
      this.dirty = true
      this.revalidate()
    },
    setStartNode(id: ID): void {
      if (!this.current) return
      this.snapshot()
      this.current.startNodeId = id
      this.dirty = true
      this.revalidate()
    },
    /** 确保物品存在（线索节点引用时） */
    ensureItem(key: string, name: string): void {
      if (!this.current) return
      if (!this.current.items.some((i) => i.key === key)) {
        this.current.items.push({
          id: `item_${key}`,
          key,
          name,
        })
        this.dirty = true
      }
    },
    clearError(): void {
      this.error = ''
    },
  },
})
