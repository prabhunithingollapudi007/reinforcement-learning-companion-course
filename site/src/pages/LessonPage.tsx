import { useEffect, useRef, useState } from 'react'
import { SourceList } from '../components/Blocks'
import { WEEKS, findWeek } from '../course'
import { LESSONS, LESSON_MINUTES } from '../lessons'

interface Props {
  n: number
  done: boolean
  onToggleDone: () => void
}

export function LessonPage({ n, done, onToggleDone }: Props) {
  const found = findWeek(n)
  const articleRef = useRef<HTMLElement>(null)
  const [toc, setToc] = useState<{ id: string; text: string }[]>([])
  const Lesson = LESSONS[n]

  // Build "On this page" from the lesson's section headings once it has rendered.
  useEffect(() => {
    const el = articleRef.current
    if (!el) return
    const collect = () => {
      const heads = Array.from(el.querySelectorAll('h2[id]')).map((h) => ({ id: h.id, text: h.textContent ?? '' }))
      setToc((prev) => (prev.length === heads.length && prev.every((p, i) => p.id === heads[i].id) ? prev : heads))
    }
    collect()
    const observer = new MutationObserver(collect)
    observer.observe(el, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [n])

  if (!found) return null
  const { week, part } = found
  const prev = WEEKS.find((w) => w.n === n - 1)
  const next = WEEKS.find((w) => w.n === n + 1)

  return (
    <article className="lesson" ref={articleRef}>
      <header className="lesson-head">
        <div className="kicker">
          Part {part.n} · {part.title} · Week {week.n}
          {LESSON_MINUTES[n] && <> · about {LESSON_MINUTES[n]} minutes</>}
        </div>
        <h1>{week.title}</h1>
        <p className="lede">{week.summary}</p>
        <details className="fold fold-sources" open={!Lesson}>
          <summary>
            <span className="fold-tag">Sources</span>
            The lectures and reading this week is built from
          </summary>
          <div className="fold-body">
            <SourceList sources={week.sources} />
          </div>
        </details>
      </header>

      {Lesson ? (
        <>
          {toc.length > 0 && (
            <nav className="toc" aria-label="On this page">
              <div className="toc-label">On this page</div>
              <ol>
                {toc.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                      {t.text}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="prose">
            <Lesson />
          </div>
          <div className="done-row">
            <button type="button" className={`btn ${done ? '' : 'btn-primary'}`} onClick={onToggleDone} aria-pressed={done}>
              {done ? '✓ Completed (click to undo)' : 'Mark week as complete'}
            </button>
          </div>
        </>
      ) : (
        <div className="prose">
          <aside className="callout callout-plain">
            <div className="callout-label">Planned</div>
            <div className="callout-body">
              <p>This week is not written yet. Below is what it will cover; the lectures above are already worth reading.</p>
            </div>
          </aside>
          <h2>Topics</h2>
          <ul>
            {week.topics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h2>Planned playgrounds</h2>
          <ul>
            {week.playgrounds.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <nav className="pager" aria-label="Lessons">
        {prev ? (
          <a href={`#/week/${prev.n}`} className="pager-link">
            <span className="dim">← Week {prev.n}</span>
            {prev.title}
          </a>
        ) : (
          <a href="#/" className="pager-link">
            <span className="dim">←</span>
            Start here
          </a>
        )}
        {next && (
          <a href={`#/week/${next.n}`} className="pager-link pager-next">
            <span className="dim">Week {next.n} →</span>
            {next.title}
          </a>
        )}
      </nav>
    </article>
  )
}
