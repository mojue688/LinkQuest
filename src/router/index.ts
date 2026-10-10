import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/editor/:id?',
    name: 'editor',
    component: () => import('@/views/EditorView.vue'),
    meta: { title: '编辑器' },
  },
  {
    path: '/play/:id',
    name: 'play',
    component: () => import('@/views/PlayView.vue'),
    meta: { title: '试玩' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: 'AI 设置' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const title = (to.meta.title as string) ?? ''
  document.title = title ? `${title} - 谜境 LinkQuest` : '谜境 LinkQuest'
})

export default router
