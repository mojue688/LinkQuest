import { describe, it, expect } from 'vitest'
import { exportHTML, exportJSON, validateImported } from './export'
import { createAdventure } from '@/utils/factory'
import { type Adventure } from '@/types/adventure'

function makeAdventure(title: string, description = ''): Adventure {
  const adv = createAdventure(title)
  adv.meta.description = description
  return adv
}

describe('exportHTML', () => {
  it('应转义标题中的 HTML 特殊字符', () => {
    const adv = makeAdventure('<script>alert(1)</script>')
    const result = exportHTML(adv)
    expect(result.format).toBe('html')
    expect(result.filename).toContain('.html')
    return result.blob.text().then((html) => {
      expect(html).not.toContain('<script>alert(1)</script>')
      expect(html).toContain('&lt;script&gt;')
    })
  })

  it('应转义描述中的 HTML 特殊字符', () => {
    const adv = makeAdventure('测试', '<img src=x onerror=alert(1)>')
    const result = exportHTML(adv)
    return result.blob.text().then((html) => {
      expect(html).not.toContain('<img src=x onerror=alert(1)>')
      expect(html).toContain('&lt;img')
    })
  })

  it('应转义 JSON 数据中的 HTML 字符', () => {
    const adv = makeAdventure('测试', '正常描述')
    adv.nodes[0].content.text = '<b>粗体</b>'
    const result = exportHTML(adv)
    return result.blob.text().then((html) => {
      const preContent = html.match(/<pre>([\s\S]*?)<\/pre>/)
      expect(preContent).toBeTruthy()
      expect(preContent![1]).toContain('&lt;b&gt;')
    })
  })

  it('文件名应基于标题并安全化', () => {
    const adv = makeAdventure('我的故事/测试')
    const result = exportHTML(adv)
    expect(result.filename).not.toContain('/')
    expect(result.filename).toMatch(/\.html$/)
  })
})

describe('exportJSON', () => {
  it('应生成合法的 JSON blob', () => {
    const adv = makeAdventure('测试故事')
    const result = exportJSON(adv)
    expect(result.format).toBe('json')
    expect(result.filename).toMatch(/\.linkquest\.json$/)
    return result.blob.text().then((text) => {
      const parsed = JSON.parse(text)
      expect(parsed.meta.title).toBe('测试故事')
    })
  })
})

describe('validateImported', () => {
  it('应接受合法的 Adventure JSON', () => {
    const adv = makeAdventure('导入测试')
    const json = JSON.stringify(adv)
    const result = validateImported(JSON.parse(json))
    expect(result.meta.title).toBe('导入测试')
  })

  it('应拒绝缺少 meta 的数据', () => {
    expect(() => validateImported({ nodes: [] })).toThrow('meta')
  })

  it('应拒绝缺少 nodes 的数据', () => {
    expect(() =>
      validateImported({ meta: { id: 'a', title: 't' }, choices: [], startNodeId: 'x' })
    ).toThrow('nodes')
  })

  it('应拒绝分支指向不存在节点的情况', () => {
    const adv = makeAdventure('测试')
    adv.choices.push({
      id: 'c1',
      fromNodeId: adv.startNodeId,
      toNodeId: 'nonexistent',
      label: '去往不存在',
      effects: [],
    })
    expect(() => validateImported(JSON.parse(JSON.stringify(adv)))).toThrow('目标节点不存在')
  })
})
