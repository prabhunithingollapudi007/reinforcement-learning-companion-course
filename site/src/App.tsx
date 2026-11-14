import { MDXProvider } from '@mdx-js/react'
import { Suspense, useEffect, useState, type ComponentProps } from 'react'
import { PARTS, WEEKS, findWeek } from './course'
import { LESSONS } from './lessons'
import { Home } from './pages/Home'
import { LessonPage } from './pages/LessonPage'
import { Notation } from './pages/Notation'
import { useProgress, useTheme } from './progress'

type Route = { page: 'home' } | { page: 'notation' } | { page: 'week'; n: number }

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const week = /^week\/(\d+)$/.exec(path)
  if (week && findWeek(Number(week[1]))) return { page: 'week', n: Number(week[1]) }
  if (path === 'notation') return { page: 'notation' }
  return { page: 'home' }
}

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
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
    props.href?.startsWith('#') ? <a {...props} /> : <a target="_blank" rel="noreferrer" {...props} />,
  table: (props: ComponentProps<'table'>) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
}

export default function App() {
  const route = useRoute()
  const { completed, toggle } = useProgress()
  const { theme, toggle: toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const built = WEEKS.filter((w) => LESSONS[w.n]).length
  const done = completed.filter((n) => LESSONS[n]).length

  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="btn btn-quiet menu-button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
          {menuOpen ? 'Close' : 'Lessons'}
        </button>
        <a className="topbar-title" href="#/">
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
        <a className="brand" href="#/">
          <span className="brand-kicker">Stanford CS 234 + CS 224R</span>
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
            <a className={`nav-link ${route.page === 'home' ? 'is-active' : ''}`} href="#/">
              Start here
            </a>
          </li>
          <li>
            <a className={`nav-link ${route.page === 'notation' ? 'is-active' : ''}`} href="#/notation">
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
                    <a className={`nav-link ${active ? 'is-active' : ''} ${available ? '' : 'is-planned'}`} href={`#/week/${w.n}`}>
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
  )
}
