/**
 * IndexedDB 本地存储（基于 Dexie 封装）
 * 纯前端，无任何后端请求。所有失败均抛出异常，由调用方提示用户。
 */
import Dexie from 'dexie'
import type { Adventure, PlaySession } from '@/types/adventure'

/** LinkQuest 本地数据库 */
export class LinkQuestDB extends Dexie {
  // adventures 使用 any 表类型以避免 Dexie 对 ConditionGroup 递归类型的 KeyPaths 推导失败；
  // CRUD 函数仍以 Adventure 类型对外暴露，保证调用方类型安全。
  adventures!: Dexie.Table<any, string>
  sessions!: Dexie.Table<PlaySession, string>

  constructor() {
    super('linkquest')
    this.version(1).stores({
      adventures: 'meta.id, meta.updatedAt',
      sessions: 'id, adventureId, updatedAt',
    })
  }
}

/** 单例数据库实例 */
export const db: LinkQuestDB = new LinkQuestDB()

/* ---------- 作品 CRUD ---------- */

/** 新增或更新作品（以 meta.id 为主键） */
export async function putAdventure(adventure: Adventure): Promise<void> {
  try {
    adventure.meta.updatedAt = Date.now()
    await db.adventures.put(adventure)
  } catch (e) {
    throw new Error('保存作品失败：' + (e as Error).message)
  }
}

/** 读取单个作品 */
export async function getAdventure(id: string): Promise<Adventure | null> {
  try {
    const adv = await db.adventures.get(id)
    return adv ?? null
  } catch (e) {
    throw new Error('读取作品失败：' + (e as Error).message)
  }
}

/** 列出全部作品，按更新时间倒序 */
export async function listAdventures(): Promise<Adventure[]> {
  try {
    const list = await db.adventures.toArray()
    return list.sort((a, b) => b.meta.updatedAt - a.meta.updatedAt)
  } catch (e) {
    throw new Error('加载作品列表失败：' + (e as Error).message)
  }
}

/** 删除作品 */
export async function deleteAdventure(id: string): Promise<void> {
  try {
    await db.transaction('rw', db.adventures, db.sessions, async () => {
      await db.adventures.delete(id)
      await db.sessions.where('adventureId').equals(id).delete()
    })
  } catch (e) {
    throw new Error('删除作品失败：' + (e as Error).message)
  }
}

/* ---------- 存档 CRUD ---------- */

/** 新增或更新存档 */
export async function putSession(session: PlaySession): Promise<void> {
  try {
    session.updatedAt = Date.now()
    await db.sessions.put(session)
  } catch (e) {
    throw new Error('保存进度失败：' + (e as Error).message)
  }
}

/** 读取存档 */
export async function getSession(id: string): Promise<PlaySession | null> {
  try {
    const s = await db.sessions.get(id)
    return s ?? null
  } catch (e) {
    throw new Error('读取进度失败：' + (e as Error).message)
  }
}

/** 列出某作品下的全部存档，按更新时间倒序 */
export async function listSessionsByAdventure(
  adventureId: string
): Promise<PlaySession[]> {
  try {
    const list = await db.sessions.where('adventureId').equals(adventureId).toArray()
    return list.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (e) {
    throw new Error('加载存档列表失败：' + (e as Error).message)
  }
}

/** 删除存档 */
export async function deleteSession(id: string): Promise<void> {
  try {
    await db.sessions.delete(id)
  } catch (e) {
    throw new Error('删除存档失败：' + (e as Error).message)
  }
}
