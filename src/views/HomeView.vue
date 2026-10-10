<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdventureStore } from '@/stores/adventure'
import { useSettingsStore } from '@/stores/settings'
import { useUI } from '@/stores/ui'
import { adventureTemplates, generateFromTemplate } from '@/ai/fallback'
import { summary } from '@/storage/export'
import { NodeType, type Adventure } from '@/types/adventure'
import AppIcon from '@/components/common/AppIcon.vue'

const router = useRouter()
const store = useAdventureStore()
const settings = useSettingsStore()
const ui = useUI()

const aiPrompt = ref('')
const creating = ref(false)

onMounted(() => {
  store.loadList()
  settings.load()
})

const list = computed(() => store.list)
const isEmpty = computed(() => !store.loading && list.value.length === 0)
const aiReady = computed(() => settings.enabled && settings.isConfigured)

const recent = computed(() => list.value.slice(0, 6))

async function createNew() {
  if (creating.value) return
  creating.value = true
  try {
    const id = await store.create('未命名冒险')
    if (id) router.push({ name: 'editor', params: { id } })
  } finally {
    creating.value = false
  }
}

async function continueEdit() {
  if (list.value.length === 0) {
    createNew()
    return
  }
  router.push({ name: 'editor', params: { id: list.value[0].meta.id } })
}

async function playTemplate(tplId: string) {
  const adv = generateFromTemplate(tplId)
  if (!adv) return
  store.setCurrent(adv)
  const ok = await store.saveCurrent()
  if (!ok) {
    ui.error('保存失败，无法进入试玩')
    return
  }
  router.push({ name: 'play', params: { id: adv.meta.id } })
}

function useTemplate(tplId: string) {
  const adv = generateFromTemplate(tplId)
  if (!adv) return
  store.setCurrent(adv)
  store.saveCurrent().then((ok) => {
    if (ok) {
      router.push({ name: 'editor', params: { id: adv.meta.id } })
    } else {
      ui.error('保存失败，无法打开编辑器')
    }
  })
}

function startAIGenerate() {
  const prompt = aiPrompt.value.trim()
  if (!prompt) {
    ui.warn('请先描述你想创作的故事')
    return
  }
  router.push({ name: 'editor', query: { ai: '1', prompt } })
}

function openEditor(id: string) {
  router.push({ name: 'editor', params: { id } })
}

function playAdventure(id: string) {
  router.push({ name: 'play', params: { id } })
}

async function removeAdventure(id: string, title: string) {
  const ok = await ui.confirm({
    title: `删除作品「${title}」？`,
    message: '此操作不可恢复，该作品的所有剧情和存档将被永久删除。',
    confirmText: '永久删除',
    danger: true,
  })
  if (!ok) return
  await store.remove(id)
  ui.success('作品已删除')
}

async function duplicateAdventure(adv: Adventure) {
  const clone = JSON.parse(JSON.stringify(adv)) as Adventure
  clone.meta.id = `adv_${crypto.randomUUID()}`
  clone.meta.title = `${adv.meta.title} 副本`
  clone.meta.createdAt = Date.now()
  clone.meta.updatedAt = Date.now()
  store.setCurrent(clone)
  const ok = await store.saveCurrent()
  if (!ok) {
    ui.error('复制失败，保存出错')
    return
  }
  await store.loadList()
  ui.success('已复制作品')
}

function fmtTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function nodeCount(adv: Adventure): number {
  return summary(adv).nodes
}

function endingCount(adv: Adventure): number {
  return adv.nodes.filter((n) => n.type === NodeType.Ending).length
}

const examplePrompts = [
  '设计一个发生在午夜教学楼的悬疑解谜故事，主角发现一间不存在的教室，需要通过收集线索、破解密码逃离，包含三个不同结局。',
  '一个太空站上，AI 突然失控锁死了所有舱门，宇航员必须在氧气耗尽前找到重启核心的密码。',
  '古董店里一面会说话的镜子，它声称能映出人的秘密，但每次提问都要付出代价。',
]

function useExamplePrompt(p: string) {
  aiPrompt.value = p
}

const features = [
  { icon: 'route', title: '可视化剧情画布', desc: '拖拽节点编织分支，线索、谜题、结局一目了然。' },
  { icon: 'puzzle', title: '线索与密码谜题', desc: '玩家收集线索、破解密码，真正参与解谜。' },
  { icon: 'gitBranch', title: '多分支多结局', desc: '好、坏、普通、隐藏结局，选择决定走向。' },
  { icon: 'feather', title: 'AI 一句话生成', desc: '描述你的故事构想，AI 生成完整剧情骨架。' },
]

const steps = [
  { n: '01', title: '描述或拖拽', desc: '用一句话告诉 AI 你想要的故事，或从模板开始。' },
  { n: '02', title: '编织分支', desc: '在画布上连接场景、线索与结局，调整每一处对白。' },
  { n: '03', title: '试玩发布', desc: '一键试玩你的互动故事，导出 JSON 分享给他人。' },
]
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero__inner">
        <div class="hero__text">
          <p class="hero__eyebrow">互动叙事创作平台 · 纯前端 · 本地保存</p>
          <h1 class="hero__title">
            每个人都能创造<br />
            自己的<em>谜境</em>。
          </h1>
          <p class="hero__lead">
            用可视化节点画布编织剧情分支、线索与密码谜题，在浏览器中即可试玩、导出你的互动故事。
            配置 AI 后，一句话就能生成完整的解谜冒险。
          </p>
          <div class="hero__actions">
            <button class="lq-btn lq-btn--lg" @click="createNew" :disabled="creating">
              <AppIcon name="feather" :size="18" />
              <span>开始创作</span>
            </button>
            <button class="lq-btn lq-btn--ghost lq-btn--lg" @click="playTemplate('midnight')">
              <AppIcon name="play" :size="18" />
              <span>试玩示范故事</span>
            </button>
            <button
              v-if="list.length"
              class="lq-btn lq-btn--ghost lq-btn--lg"
              @click="continueEdit"
            >
              <AppIcon name="bookOpen" :size="18" />
              <span>继续上次创作</span>
            </button>
          </div>

          <!-- AI 一句话生成入口 -->
          <div class="hero__ai">
            <div class="hero__ai-label">
              <AppIcon name="sparkles" :size="15" />
              <span>AI 一句话生成故事</span>
              <span class="lq-badge" :class="aiReady ? 'lq-badge--moss' : 'lq-badge--slate'">
                {{ aiReady ? '已连接' : '本地模式' }}
              </span>
            </div>
            <div class="hero__ai-input">
              <input
                v-model="aiPrompt"
                class="lq-input"
                placeholder="描述你想创作的故事，例如：午夜教学楼的悬疑解谜……"
                @keyup.enter="startAIGenerate"
              />
              <button class="lq-btn" @click="startAIGenerate">
                <AppIcon name="wand" :size="16" />
                <span>生成</span>
              </button>
            </div>
            <div class="hero__ai-examples">
              <button
                v-for="(p, i) in examplePrompts"
                :key="i"
                class="hero__ai-chip"
                @click="useExamplePrompt(p)"
              >
                {{ p.slice(0, 18) }}…
              </button>
            </div>
            <p v-if="!aiReady" class="hero__ai-hint">
              <AppIcon name="info" :size="13" />
              <span>未配置 AI 时将使用本地模板生成。前往</span>
              <router-link :to="{ name: 'settings' }">设置页</router-link>
              <span>配置模型可获得更丰富的生成。</span>
            </p>
          </div>
        </div>

        <!-- 装饰性故事卡片堆叠 -->
        <div class="hero__visual" aria-hidden="true">
          <div class="hero__card hero__card--3">
            <span class="hero__card-tag">隐藏结局</span>
            <span class="hero__card-title">暗夜古堡</span>
          </div>
          <div class="hero__card hero__card--2">
            <span class="hero__card-tag">密码谜题</span>
            <span class="hero__card-title">古墓探秘</span>
          </div>
          <div class="hero__card hero__card--1">
            <span class="hero__card-eyebrow">悬疑 · 多结局</span>
            <span class="hero__card-title">午夜教学楼</span>
            <span class="hero__card-mood">凌晨两点，一扇不该存在的门。</span>
            <div class="hero__card-nodes">
              <span class="hero__node hero__node--start">起</span>
              <span class="hero__node">场</span>
              <span class="hero__node hero__node--clue">线</span>
              <span class="hero__node hero__node--puzzle">谜</span>
              <span class="hero__node hero__node--end">局</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 创作流程 -->
    <section class="section">
      <div class="section__inner">
        <h2 class="section__title">三步创作你的互动故事</h2>
        <div class="steps">
          <div v-for="s in steps" :key="s.n" class="steps__item">
            <span class="steps__n">{{ s.n }}</span>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 示例模板 -->
    <section class="section section--alt">
      <div class="section__inner">
        <div class="section__head">
          <div>
            <h2 class="section__title">从模板开始</h2>
            <p class="section__sub">精选示例故事，点击即可试玩或在此基础上创作。</p>
          </div>
        </div>
        <div class="templates">
          <article
            v-for="tpl in adventureTemplates"
            :key="tpl.id"
            class="templates__card"
          >
            <div class="templates__cover">
              <span class="templates__mood">{{ tpl.mood }}</span>
              <span class="templates__scale">{{ tpl.scale }}</span>
            </div>
            <div class="templates__body">
              <h3>{{ tpl.name }}</h3>
              <p class="templates__desc">{{ tpl.description }}</p>
              <div class="templates__tags">
                <span v-for="t in tpl.tags" :key="t" class="lq-badge lq-badge--slate">{{ t }}</span>
              </div>
              <div class="templates__actions">
                <button class="lq-btn lq-btn--subtle lq-btn--sm" @click="useTemplate(tpl.id)">
                  <AppIcon name="edit" :size="14" />
                  <span>以此创作</span>
                </button>
                <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="playTemplate(tpl.id)">
                  <AppIcon name="play" :size="14" />
                  <span>试玩</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 最近作品 -->
    <section class="section">
      <div class="section__inner">
        <div class="section__head">
          <div>
            <h2 class="section__title">我的作品</h2>
            <p class="section__sub">所有作品保存在浏览器本地，无需账号。</p>
          </div>
          <button class="lq-btn lq-btn--subtle lq-btn--sm" @click="createNew">
            <AppIcon name="plus" :size="14" />
            <span>新建作品</span>
          </button>
        </div>

        <div v-if="store.error" class="lq-alert lq-alert--error">{{ store.error }}</div>

        <!-- 空状态 -->
        <div v-if="isEmpty" class="empty">
          <div class="empty__icon">
            <AppIcon name="book" :size="40" />
          </div>
          <h3 class="empty__title">还没有任何作品</h3>
          <p class="empty__desc">
            创建你的第一个互动冒险，或从上方模板开始体验完整流程。
          </p>
          <div class="empty__actions">
            <button class="lq-btn" @click="createNew">
              <AppIcon name="plus" :size="16" />
              <span>创建新作品</span>
            </button>
            <button class="lq-btn lq-btn--ghost" @click="playTemplate('midnight')">
              <AppIcon name="play" :size="16" />
              <span>试玩示例</span>
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="store.loading" class="works">
          <div v-for="i in 3" :key="i" class="works__skeleton lq-skeleton"></div>
        </div>

        <!-- 作品网格 -->
        <div v-else class="works">
          <article
            v-for="adv in recent"
            :key="adv.meta.id"
            class="works__card"
          >
            <div class="works__card-head">
              <h3 class="works__card-title">{{ adv.meta.title || '未命名冒险' }}</h3>
              <span class="lq-badge lq-badge--slate">{{ nodeCount(adv) }} 节点</span>
            </div>
            <p class="works__card-desc">
              {{ adv.meta.description || '暂无简介，打开编辑器补充故事背景。' }}
            </p>
            <div class="works__card-meta">
              <span class="lq-faint">
                <AppIcon name="clock" :size="12" />
                {{ fmtTime(adv.meta.updatedAt) }}
              </span>
              <span class="lq-badge lq-badge--gold">{{ endingCount(adv) }} 结局</span>
            </div>
            <div class="works__card-actions">
              <button class="lq-btn lq-btn--sm" @click="openEditor(adv.meta.id)">
                <AppIcon name="edit" :size="14" />
                <span>编辑</span>
              </button>
              <button class="lq-btn lq-btn--ghost lq-btn--sm" @click="playAdventure(adv.meta.id)">
                <AppIcon name="play" :size="14" />
                <span>试玩</span>
              </button>
              <button class="lq-btn lq-btn--ghost lq-btn--sm lq-btn--icon" title="复制" @click="duplicateAdventure(adv)">
                <AppIcon name="copy" :size="14" />
              </button>
              <button class="lq-btn lq-btn--danger lq-btn--sm lq-btn--icon works__del" title="删除" @click="removeAdventure(adv.meta.id, adv.meta.title)">
                <AppIcon name="trash" :size="14" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 平台能力 -->
    <section class="section section--alt">
      <div class="section__inner">
        <h2 class="section__title">为互动叙事而生</h2>
        <div class="features">
          <div v-for="f in features" :key="f.title" class="features__item">
            <span class="features__icon">
              <AppIcon :name="f.icon" :size="22" />
            </span>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer__inner">
        <span class="footer__brand">谜境 LinkQuest</span>
        <span class="lq-faint">纯前端 · IndexedDB 本地保存 · AI 可选</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home { min-height: 100%; }

/* ---------- Hero ---------- */
.hero {
  padding: var(--lq-space-12) var(--lq-space-6) var(--lq-space-10);
  background:
    radial-gradient(900px 400px at 85% 10%, var(--lq-wine-dim), transparent 60%),
    radial-gradient(700px 300px at 10% 90%, var(--lq-gold-dim), transparent 60%);
}
.hero__inner {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--lq-space-10);
  align-items: center;
}
.hero__eyebrow {
  font-family: var(--lq-font-ui);
  font-size: var(--lq-fs-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lq-wine);
  font-weight: 600;
  margin: 0 0 var(--lq-space-4);
}
.hero__title {
  font-size: var(--lq-fs-3xl);
  font-weight: 700;
  line-height: 1.15;
  margin: 0 0 var(--lq-space-5);
  color: var(--lq-ink);
}
.hero__title em {
  font-style: italic;
  color: var(--lq-wine);
  position: relative;
}
.hero__lead {
  font-size: var(--lq-fs-md);
  line-height: 1.75;
  color: var(--lq-ink-soft);
  margin: 0 0 var(--lq-space-6);
  max-width: 520px;
}
.hero__actions {
  display: flex;
  gap: var(--lq-space-3);
  flex-wrap: wrap;
  margin-bottom: var(--lq-space-8);
}

/* AI 入口 */
.hero__ai {
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  padding: var(--lq-space-4);
  max-width: 560px;
}
.hero__ai-label {
  display: flex;
  align-items: center;
  gap: var(--lq-space-2);
  font-size: var(--lq-fs-sm);
  font-weight: 600;
  color: var(--lq-ink);
  margin-bottom: var(--lq-space-3);
}
.hero__ai-label .lq-badge { margin-left: auto; }
.hero__ai-input {
  display: flex;
  gap: var(--lq-space-2);
}
.hero__ai-input .lq-input { flex: 1; }
.hero__ai-examples {
  display: flex;
  gap: var(--lq-space-2);
  margin-top: var(--lq-space-3);
  flex-wrap: wrap;
}
.hero__ai-chip {
  padding: 4px 10px;
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: 999px;
  font-size: 11px;
  color: var(--lq-ink-soft);
  cursor: pointer;
  transition: all var(--lq-dur) var(--lq-ease);
}
.hero__ai-chip:hover {
  border-color: var(--lq-wine);
  color: var(--lq-wine);
}
.hero__ai-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--lq-fs-xs);
  color: var(--lq-ink-faint);
  margin: var(--lq-space-3) 0 0;
  line-height: 1.5;
}
.hero__ai-hint a { color: var(--lq-wine); }

/* 装饰卡片 */
.hero__visual {
  position: relative;
  height: 380px;
}
.hero__card {
  position: absolute;
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  box-shadow: var(--lq-shadow-lg);
  padding: var(--lq-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-2);
}
.hero__card--1 {
  top: 20px;
  left: 30px;
  right: 30px;
  z-index: 3;
  background: var(--lq-paper);
  border-color: var(--lq-wine);
  transform: rotate(-1.5deg);
}
.hero__card--2 {
  top: 90px;
  left: 60px;
  right: 80px;
  z-index: 2;
  transform: rotate(2deg);
  opacity: 0.85;
}
.hero__card--3 {
  top: 160px;
  left: 100px;
  right: 50px;
  z-index: 1;
  transform: rotate(-3deg);
  opacity: 0.6;
}
.hero__card-eyebrow {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lq-wine);
  font-weight: 600;
}
.hero__card-title {
  font-family: var(--lq-font-sans);
  font-size: var(--lq-fs-xl);
  font-weight: 700;
  color: var(--lq-ink);
}
.hero__card-mood {
  font-size: var(--lq-fs-sm);
  color: var(--lq-ink-soft);
  font-style: italic;
}
.hero__card-tag {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  background: var(--lq-gold-dim);
  color: var(--lq-gold);
  border-radius: var(--lq-radius);
}
.hero__card-nodes {
  display: flex;
  gap: var(--lq-space-2);
  margin-top: var(--lq-space-2);
}
.hero__node {
  width: 28px;
  height: 28px;
  border-radius: var(--lq-radius-md);
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--lq-ink-soft);
}
.hero__node--start { border-color: var(--lq-moss); color: var(--lq-moss); }
.hero__node--clue { border-color: var(--lq-slate); color: var(--lq-slate); }
.hero__node--puzzle { border-color: var(--lq-rust); color: var(--lq-rust); }
.hero__node--end { border-color: var(--lq-wine); color: var(--lq-wine); }

/* ---------- Section ---------- */
.section { padding: var(--lq-space-10) var(--lq-space-6); }
.section--alt { background: var(--lq-paper-2); }
.section__inner {
  max-width: 1180px;
  margin: 0 auto;
}
.section__title {
  font-size: var(--lq-fs-xl);
  margin: 0 0 var(--lq-space-2);
}
.section__sub {
  color: var(--lq-ink-soft);
  font-size: var(--lq-fs-sm);
  margin: 0;
}
.section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--lq-space-4);
  margin-bottom: var(--lq-space-5);
}

/* ---------- Steps ---------- */
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--lq-space-5);
}
.steps__item {
  padding: var(--lq-space-5);
  border-left: 2px solid var(--lq-wine);
}
.steps__n {
  font-family: var(--lq-font-mono);
  font-size: var(--lq-fs-sm);
  color: var(--lq-wine);
  letter-spacing: 0.1em;
}
.steps__item h3 { margin: var(--lq-space-2) 0 var(--lq-space-2); font-size: var(--lq-fs-md); }
.steps__item p { color: var(--lq-ink-soft); font-size: var(--lq-fs-sm); margin: 0; line-height: 1.6; }

/* ---------- Templates ---------- */
.templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--lq-space-5);
}
.templates__card {
  background: var(--lq-paper);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  overflow: hidden;
  transition: border-color var(--lq-dur) var(--lq-ease), box-shadow var(--lq-dur) var(--lq-ease), transform var(--lq-dur) var(--lq-ease);
}
.templates__card:hover {
  border-color: var(--lq-ink-faint);
  box-shadow: var(--lq-shadow);
  transform: translateY(-3px);
}
.templates__cover {
  padding: var(--lq-space-6) var(--lq-space-5);
  background:
    linear-gradient(135deg, var(--lq-wine-dim), transparent),
    var(--lq-paper-3);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-2);
  min-height: 90px;
}
.templates__mood {
  font-family: var(--lq-font-sans);
  font-style: italic;
  color: var(--lq-ink);
  font-size: var(--lq-fs-md);
  line-height: 1.4;
}
.templates__scale {
  font-family: var(--lq-font-mono);
  font-size: 11px;
  color: var(--lq-ink-faint);
}
.templates__body { padding: var(--lq-space-4) var(--lq-space-5) var(--lq-space-5); }
.templates__body h3 { margin: 0 0 var(--lq-space-2); font-size: var(--lq-fs-md); }
.templates__desc { font-size: var(--lq-fs-sm); color: var(--lq-ink-soft); margin: 0 0 var(--lq-space-3); line-height: 1.6; }
.templates__tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: var(--lq-space-4); }
.templates__actions { display: flex; gap: var(--lq-space-2); }

/* ---------- Works ---------- */
.works {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--lq-space-4);
}
.works__skeleton { height: 180px; border-radius: var(--lq-radius-lg); }
.works__card {
  background: var(--lq-paper-2);
  border: 1px solid var(--lq-line);
  border-radius: var(--lq-radius-lg);
  padding: var(--lq-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--lq-space-3);
  transition: border-color var(--lq-dur) var(--lq-ease), box-shadow var(--lq-dur) var(--lq-ease);
}
.works__card:hover { border-color: var(--lq-ink-faint); box-shadow: var(--lq-shadow); }
.works__card-head { display: flex; align-items: center; justify-content: space-between; gap: var(--lq-space-2); }
.works__card-title { margin: 0; font-size: var(--lq-fs-md); }
.works__card-desc {
  font-size: var(--lq-fs-sm);
  color: var(--lq-ink-soft);
  line-height: 1.6;
  margin: 0;
  flex: 1;
}
.works__card-meta { display: flex; align-items: center; justify-content: space-between; font-size: var(--lq-fs-xs); }
.works__card-meta span { display: inline-flex; align-items: center; gap: 4px; }
.works__card-actions { display: flex; gap: var(--lq-space-2); align-items: center; }
.works__del { margin-left: auto; }

/* ---------- Empty ---------- */
.empty {
  text-align: center;
  padding: var(--lq-space-12) var(--lq-space-6);
  background: var(--lq-paper-2);
  border: 1px dashed var(--lq-line);
  border-radius: var(--lq-radius-lg);
}
.empty__icon { color: var(--lq-ink-faint); margin-bottom: var(--lq-space-3); }
.empty__title { font-size: var(--lq-fs-lg); margin: 0 0 var(--lq-space-2); }
.empty__desc { color: var(--lq-ink-soft); font-size: var(--lq-fs-sm); max-width: 380px; margin: 0 auto var(--lq-space-5); line-height: 1.6; }
.empty__actions { display: flex; gap: var(--lq-space-3); justify-content: center; flex-wrap: wrap; }

/* ---------- Features ---------- */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--lq-space-5);
}
.features__item { padding: var(--lq-space-5); }
.features__icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  background: var(--lq-wine-dim);
  color: var(--lq-wine);
  border-radius: var(--lq-radius-md);
  margin-bottom: var(--lq-space-3);
}
.features__item h3 { font-size: var(--lq-fs-md); margin: 0 0 var(--lq-space-2); }
.features__item p { color: var(--lq-ink-soft); font-size: var(--lq-fs-sm); margin: 0; line-height: 1.6; }

/* ---------- Footer ---------- */
.footer {
  padding: var(--lq-space-8) var(--lq-space-6);
  border-top: 1px solid var(--lq-line);
}
.footer__inner {
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lq-space-4);
}
.footer__brand {
  font-family: var(--lq-font-sans);
  font-weight: 700;
  color: var(--lq-ink);
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .hero__inner { grid-template-columns: 1fr; }
  .hero__visual { display: none; }
  .steps { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .hero { padding: var(--lq-space-8) var(--lq-space-4) var(--lq-space-6); }
  .hero__title { font-size: var(--lq-fs-2xl); }
  .section { padding: var(--lq-space-8) var(--lq-space-4); }
  .hero__actions { flex-direction: column; align-items: stretch; }
  .hero__actions .lq-btn { width: 100%; }
}
</style>
