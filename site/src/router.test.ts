import { describe, expect, it } from 'vitest'
import { WEEKS } from './course'
import { HOME, NOTATION, linkTo, parseLegacyHash, parsePath, routeAt, routePath, week, type Route } from './router'

const ALL: Route[] = [HOME, NOTATION, ...WEEKS.map((w) => week(w.n))]

describe('page addresses', () => {
  it('gives every page its own address below the site root', () => {
    expect(routePath(HOME)).toBe('')
    expect(routePath(NOTATION)).toBe('notation/')
    expect(routePath(week(6))).toBe('week/6/')
    expect(new Set(ALL.map(routePath)).size).toBe(18)
  })

  it('reads a page back from its address', () => {
    for (const route of ALL) expect(routeAt(routePath(route))).toEqual(route)
    expect(routeAt('week/6')).toEqual(week(6))
    expect(routeAt('week/6/index.html')).toEqual(week(6))
    expect(routeAt('index.html')).toEqual(HOME)
  })

  it('refuses addresses that name no page', () => {
    expect(routeAt('week/17/')).toBeNull()
    expect(routeAt('week/0/')).toBeNull()
    expect(routeAt('week/six/')).toBeNull()
    expect(routeAt('assets/index.js')).toBeNull()
  })
})

describe('finding the site root', () => {
  it('works at the top of a domain, as under npm run dev', () => {
    expect(parsePath('/')).toEqual({ base: '/', route: HOME })
    expect(parsePath('/week/12/')).toEqual({ base: '/', route: week(12) })
    expect(parsePath('/notation/')).toEqual({ base: '/', route: NOTATION })
  })

  it('works in a subfolder, as on GitHub Pages', () => {
    const base = '/reinforcement-learning-companion-course/'
    expect(parsePath(base)).toEqual({ base, route: HOME })
    expect(parsePath(base + 'index.html')).toEqual({ base, route: HOME })
    expect(parsePath(base + 'week/3/')).toEqual({ base, route: week(3) })
    expect(parsePath(base + 'week/3')).toEqual({ base, route: week(3) })
    expect(parsePath(base + 'week/3/index.html')).toEqual({ base, route: week(3) })
    expect(parsePath(base + 'notation/')).toEqual({ base, route: NOTATION })
  })

  it('shows the home page, with the right root, for a week that does not exist', () => {
    expect(parsePath('/site/week/99/')).toEqual({ base: '/site/', route: HOME })
  })
})

describe('links between pages', () => {
  it('are relative, and land on the right page from anywhere', () => {
    const root = 'https://example.org/some/folder/'
    for (const from of ALL) {
      for (const to of ALL) {
        const landed = new URL(linkTo(to, from), root + routePath(from))
        expect(landed.href).toBe(root + routePath(to))
      }
    }
  })
})

describe('old-style links', () => {
  it('are still understood', () => {
    expect(parseLegacyHash('#/week/3')).toEqual(week(3))
    expect(parseLegacyHash('#/notation')).toEqual(NOTATION)
  })

  it('are not confused with anything else', () => {
    expect(parseLegacyHash('')).toBeNull()
    expect(parseLegacyHash('#/')).toBeNull()
    expect(parseLegacyHash('#big-picture')).toBeNull()
    expect(parseLegacyHash('#/week/99')).toBeNull()
  })
})
