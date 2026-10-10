/**
 * 存档与读档：将试玩会话持久化到 IndexedDB。
 * 实际落库由 storage/database 实现。
 */
import type { GameState, ID, PlaySession } from '@/types/adventure'
import {
  putSession,
  getSession,
  listSessionsByAdventure,
  deleteSession as dbDeleteSession,
} from '@/storage/database'
import { genId } from '@/utils/factory'

/** 保存当前会话（新增或更新） */
export async function saveSession(session: PlaySession): Promise<ID> {
  await putSession(session)
  return session.id
}

/** 从 GameState 创建并保存一个新会话 */
export async function saveCurrentState(
  adventureId: ID,
  state: GameState,
  existingId?: ID
): Promise<ID> {
  const now = Date.now()
  let startedAt = now
  if (existingId) {
    const existing = await getSession(existingId)
    if (existing) startedAt = existing.startedAt
  }
  const session: PlaySession = {
    id: existingId ?? genId('session'),
    adventureId,
    state,
    startedAt,
    updatedAt: now,
  }
  await putSession(session)
  return session.id
}

/** 读取指定会话 */
export async function loadSession(id: ID): Promise<PlaySession | null> {
  return getSession(id)
}

/** 列出某作品下的全部存档 */
export async function listSessions(adventureId: ID): Promise<PlaySession[]> {
  return listSessionsByAdventure(adventureId)
}

/** 删除存档 */
export async function deleteSession(id: ID): Promise<void> {
  await dbDeleteSession(id)
}

/** 从存档恢复 GameState（兼容旧存档：补全新增字段） */
export async function resumeFromSession(id: ID): Promise<GameState | null> {
  const s = await getSession(id)
  if (!s) return null
  const state = s.state
  if (!state.interactedItems) state.interactedItems = []
  if (!state.puzzleStates) state.puzzleStates = {}
  return state
}
