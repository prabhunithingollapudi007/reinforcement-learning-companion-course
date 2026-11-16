import { MDXProvider } from '@mdx-js/react'
import { Suspense, useEffect, useState, type ComponentProps } from 'react'
import { PARTS, WEEKS } from './course'
import { LESSONS } from './lessons'
import { Home } from './pages/Home'
import { LessonPage } from './pages/LessonPage'
import { Notation } from './pages/Notation'
import { useProgress, useTheme } from './progress'
import { HOME, NOTATION, RouteContext, linkTo, parsePath, routeAt, routePath, week, type Route } from './router'
import { pageMeta } from './seo'

/**
 * The current page. It starts as the page the address names, then follows clicks
 * on the site's own links (without reloading) and the browser's back button.
 * `base` is the site root; it is absent when a page is rendered at build time.
 */
function useRoute(initial: Route, base?: string): Route {
  const [route, setRoute] = useState<Route>(initial)

  useEffect(() => {
    if (base === undefined) return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target instanceof Element ? e.target.closest('a') : null
      if (!link || link.target || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || url.hash || !url.pathname.startsWith(base)) return
      const to = routeAt(url.pathname.slice(base.length))
      if (!to) return
      e.preventDefault()
      window.history.pushState(null, '', base + routePath(to))
      setRoute(to)
      window.scrollTo(0, 0)
    }
    const onPop = () => setRoute(parsePath(window.location.pathname).route)
    document.addEventListener('click', onClick)
    window.addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', onPop)
    }
  }, [base])

  useEffect(() => {
    document.title = pageMeta(route).title
  }, [route])

  return route
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function textOf(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: unknown } }).props.children)
  }
  return ''
}

// How plain Markdown elements render inside lessons.
const mdxComponents = {
  h2: (props: ComponentProps<'h2'>) => <h2 id={slug(textOf(props.children))} {...props} />,
  a: (props: ComponentProps<'a'>) =>
    // Links to other sites open in a new tab; links within this site do not.
    /^[a-z][a-z0-9+.-]*:/i.test(props.href ?? '') ? <a target="_blank" rel="noreferrer" {...props} /> : <a {...props} />,
  table: (props: ComponentProps<'table'>) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
}

export default function App({ initialRoute, base }: { initialRoute: Route; base?: string }) {
  const route = useRoute(initialRoute, base)
  const link = (to: Route) => linkTo(to, route)
  const { completed, toggle } = useProgress()
  const { theme, toggle: toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const built = WEEKS.filter((w) => LESSONS[w.n]).length
  const done = completed.filter((n) => LESSONS[n]).length

  return (
    <RouteContext value={route}>
    <div className="shell">
      <header className="topbar">
        <button type="button" className="btn btn-quiet menu-button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
          {menuOpen ? 'Close' : 'Lessons'}
        </button>
        <a className="topbar-title" href={link(HOME)}>
          RL Companion
        </a>
      </header>

      <nav
        className={`sidebar ${menuOpen ? 'is-open' : ''}`}
        aria-label="Course"
        onClick={(e) => {
          // On narrow screens the menu covers the page: close it once a link is chosen.
          if ((e.target as HTMLElement).closest('a')) setMenuOpen(false)
        }}
      >
        <a className="brand" href={link(HOME)}>
          <span className="brand-kicker">Unofficial · CS 234 + CS 224R</span>
          <span className="brand-name">Reinforcement Learning Companion</span>
        </a>

        <div className="progress" aria-label={`${done} of ${WEEKS.length} weeks completed`}>
          <div className="progress-text">
            <span>
              {done} of {WEEKS.length} weeks done
            </span>
            <span className="dim">{built} available</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(done / WEEKS.length) * 100}%` }} />
          </div>
        </div>

        <ul className="nav-list">
          <li>
            <a className={`nav-link ${route.page === 'home' ? 'is-active' : ''}`} href={link(HOME)}>
              Start here
            </a>
          </li>
          <li>
            <a className={`nav-link ${route.page === 'notation' ? 'is-active' : ''}`} href={link(NOTATION)}>
              Notation
            </a>
          </li>
        </ul>

        {PARTS.map((part) => (
          <div className="nav-part" key={part.n}>
            <div className="nav-part-title">
              Part {part.n} · {part.title}
            </div>
            <ul className="nav-list">
              {part.weeks.map((w) => {
                const active = route.page === 'week' && route.n === w.n
                const available = Boolean(LESSONS[w.n])
                return (
                  <li key={w.n}>
                    <a className={`nav-link ${active ? 'is-active' : ''} ${available ? '' : 'is-planned'}`} href={link(week(w.n))}>
                      <span className="nav-num">{completed.includes(w.n) ? '✓' : String(w.n).padStart(2, '0')}</span>
                      <span className="nav-text">{w.title}</span>
                      {!available && <span className="nav-soon">planned</span>}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        <button type="button" className="btn btn-quiet theme-button" onClick={toggleTheme}>
          Switch to {theme === 'dark' ? 'light' : 'dark'} theme
        </button>
      </nav>

      <main className="main">
        <MDXProvider components={mdxComponents}>
          <Suspense fallback={<p className="dim">Loading…</p>}>
            {route.page === 'home' && <Home completed={completed} />}
            {route.page === 'notation' && <Notation />}
            {route.page === 'week' && (
              <LessonPage key={route.n} n={route.n} done={completed.includes(route.n)} onToggleDone={() => toggle(route.n)} />
            )}
          </Suspense>
        </MDXProvider>
      </main>
    </div>
    </RouteContext>
  )
}
