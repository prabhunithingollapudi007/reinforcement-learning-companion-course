import { createContext, useContext } from 'react'
import { findWeek } from './course'

// Every page has a real address, so a search engine can index each week and a
// link can point at one: the site root is the home page, then `notation/` and
// `week/3/`. The build writes a ready-made HTML file at each of these.

export type Route = { page: 'home' } | { page: 'notation' } | { page: 'week'; n: number }

/** Where a page lives below the site root: '', 'notation/' or 'week/3/'. */
export function routePath(route: Route): string {
  if (route.page === 'week') return `week/${route.n}/`
  return route.page === 'notation' ? 'notation/' : ''
}

/** The page a path below the site root names, or null if it names none. */
export function routeAt(path: string): Route | null {
  const clean = path.replace(/index\.html$/, '').replace(/\/$/, '')
  if (clean === '') return { page: 'home' }
  if (clean === 'notation') return { page: 'notation' }
  const week = /^week\/(\d+)$/.exec(clean)
  return week && findWeek(Number(week[1])) ? { page: 'week', n: Number(week[1]) } : null
}

/**
 * Splits a full URL path into the site root and the page. The root is not known
 * in advance (the site may be hosted in a subfolder), so it is read off the path.
 */
export function parsePath(pathname: string): { base: string; route: Route } {
  const clean = pathname.replace(/index\.html$/, '')
  const nested = /^(.*\/)(week\/\d+|notation)\/?$/.exec(clean)
  if (nested) return { base: nested[1], route: routeAt(nested[2]) ?? { page: 'home' } }
  return { base: clean.slice(0, clean.lastIndexOf('/') + 1) || '/', route: { page: 'home' } }
}

/** Links used to look like '#/week/3'. Old ones are still honoured. */
export function parseLegacyHash(hash: string): Route | null {
  if (!hash.startsWith('#/')) return null
  const route = routeAt(hash.slice(2))
  return route && route.page !== 'home' ? route : null
}

/** A relative link from one page to another, so it works wherever the site is hosted. */
export function linkTo(to: Route, from: Route): string {
  const up = from.page === 'home' ? '' : from.page === 'notation' ? '../' : '../../'
  return up + routePath(to) || './'
}

export const RouteContext = createContext<Route>({ page: 'home' })

/** Returns a function that gives the link to any page from the current one. */
export function useLink(): (to: Route) => string {
  const from = useContext(RouteContext)
  return (to) => linkTo(to, from)
}

export const HOME: Route = { page: 'home' }
export const NOTATION: Route = { page: 'notation' }
export const week = (n: number): Route => ({ page: 'week', n })
