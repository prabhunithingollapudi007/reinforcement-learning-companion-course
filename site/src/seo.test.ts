import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'
import { SITE_URL, WEEKS } from './course'
import { HOME, week } from './router'
import { ALL_ROUTES, SITE_NAME, headTags, llmsTxt, pageMeta, sitemap } from './seo'

describe('what each page tells search engines', () => {
  const metas = ALL_ROUTES.map(pageMeta)

  it('is different for every page', () => {
    expect(metas).toHaveLength(18)
    expect(new Set(metas.map((m) => m.title)).size).toBe(18)
    expect(new Set(metas.map((m) => m.description)).size).toBe(18)
    expect(new Set(metas.map((m) => m.url)).size).toBe(18)
  })

  it('names the subject and stays a sensible length', () => {
    for (const m of metas) {
      expect(m.title).toContain(SITE_NAME)
      expect(m.title.length).toBeLessThanOrEqual(90)
      expect(m.description.length).toBeGreaterThanOrEqual(80)
      expect(m.description.length).toBeLessThanOrEqual(420)
      expect(m.url.startsWith(SITE_URL)).toBe(true)
    }
  })

  it('describes a week by its own title, summary and topics', () => {
    const w = WEEKS[5]
    const m = pageMeta(week(w.n))
    expect(m.title).toBe(`${w.title} (Week ${w.n}) | ${SITE_NAME}`)
    expect(m.description).toContain(w.summary)
    for (const topic of w.topics) expect(m.description).toContain(topic)
    expect(m.url).toBe(`${SITE_URL}week/${w.n}/`)
    expect(m.jsonLd['@type']).toBe('LearningResource')
    expect(m.jsonLd.teaches).toEqual(w.topics)
  })

  it('describes the home page as a free course that lists all 16 weeks', () => {
    const m = pageMeta(HOME)
    expect(m.url).toBe(SITE_URL)
    expect(m.jsonLd['@type']).toBe('Course')
    expect(m.jsonLd.isAccessibleForFree).toBe(true)
    expect(m.jsonLd.hasPart).toHaveLength(16)
    expect(m.description).toMatch(/unofficial/i)
  })

  it('never presents Stanford as the provider', () => {
    for (const m of metas) {
      const ld = JSON.stringify([m.jsonLd.provider, m.jsonLd.author])
      expect(ld).not.toMatch(/stanford/i)
    }
  })
})

describe('the tags written into a page', () => {
  it('escape text and point at the page itself', () => {
    const tags = headTags(week(3), '../../')
    expect(tags).toContain('<title>Learning to act: SARSA and Q-learning (Week 3) | Reinforcement Learning Companion</title>')
    expect(tags).toContain(`<link rel="canonical" href="${SITE_URL}week/3/" />`)
    expect(tags).toContain(`<meta property="og:image" content="${SITE_URL}social-card.png" />`)
    expect(tags).toContain('href="../../llms.txt"')
    // "Batch MC vs batch TD" style text is fine; a raw quote or angle bracket would break the tag.
    for (const route of ALL_ROUTES) {
      const head = headTags(route, '')
      for (const content of head.matchAll(/content="([^"]*)"/g)) expect(content[1]).not.toMatch(/[<>]/)
      const script = /<script type="application\/ld\+json">(.*)<\/script>/.exec(head)![1]
      expect(script).not.toContain('</')
      expect(JSON.parse(script)).toEqual(pageMeta(route).jsonLd)
    }
  })

  it('agree with the title the development page starts with', () => {
    expect(indexHtml).toContain(`<title>${pageMeta(HOME).title}</title>`)
  })
})

describe('the site maps', () => {
  it('sitemap.xml lists every page once', () => {
    const xml = sitemap('2026-01-01')
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(ALL_ROUTES.map((r) => pageMeta(r).url))
    expect(xml).toContain('<lastmod>2026-01-01</lastmod>')
  })

  it('llms.txt links every week and says the site is unofficial', () => {
    const text = llmsTxt()
    expect(text.startsWith(`# ${SITE_NAME}\n`)).toBe(true)
    for (const w of WEEKS) expect(text).toContain(`[Week ${w.n}: ${w.title}](${SITE_URL}week/${w.n}/)`)
    expect(text).toMatch(/not affiliated with/)
  })
})
