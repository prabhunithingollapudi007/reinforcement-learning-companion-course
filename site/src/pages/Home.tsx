import { COURSE_LINKS, PARTS } from '../course'
import { LESSONS } from '../lessons'

export function Home({ completed }: { completed: number[] }) {
  return (
    <article className="lesson">
      <header className="lesson-head">
        <div className="kicker">Start here</div>
        <h1>How to use this companion</h1>
        <p className="lede">
          One 16-week path through reinforcement learning, following two Stanford courses: CS 234 for the foundations
          and CS 224R for deep methods and applications. An unofficial companion, not part of either course.
        </p>
      </header>

      <div className="prose">
        <h2>What this is</h2>
        <p>
          A study layer that sits beside the lectures. Stanford's slides do the teaching; this site makes each idea
          something you can see, poke at and implement. It assumes you already know machine learning, the maths and
          how to program, and have not studied RL formally.
        </p>
        <p>Every lesson has the same parts, in the same order:</p>
        <ul>
          <li>
            <strong>Big picture.</strong> Where the lesson sits and what problem it solves.
          </li>
          <li>
            <strong>Figures and playgrounds.</strong> Each key concept is drawn first and explained second. The
            interactive panels let you change the numbers and watch what happens; hard ideas also get a
            plain-language restatement.
          </li>
          <li>
            <strong>Derivations that earn their place.</strong> Folded away by default, each with a line on why it is
            worth doing. The rest are given as results with a pointer to the slide.
          </li>
          <li>
            <strong>Python lab and quiz.</strong> Write the algorithms in the editor on the lesson page and run the
            tests there; the code is saved to the <code>labs</code> folder. Then check what stuck.
          </li>
          <li>
            <strong>Quick recap.</strong> A short card you can reread months later without the rest of the lesson.
          </li>
        </ul>

        <h2>A loop that works</h2>
        <ol>
          <li>Read the big picture and play with the playgrounds (20 minutes).</li>
          <li>Go through the lecture slides listed under Sources. They will read like revision.</li>
          <li>Come back for the derivations and do the Python lab.</li>
          <li>Take the quiz, then mark the week complete.</li>
        </ol>

        <h2>The course in one map</h2>
        <div className="map">
          {PARTS.map((part) => (
            <section className="map-part" key={part.n}>
              <div className="map-head">
                <span className="map-n">Part {part.n}</span>
                <h3>{part.title}</h3>
              </div>
              <p className="map-blurb">{part.blurb}</p>
              <ul className="map-weeks">
                {part.weeks.map((w) => (
                  <li key={w.n}>
                    <a href={`#/week/${w.n}`}>
                      <span className="nav-num">{completed.includes(w.n) ? '✓' : String(w.n).padStart(2, '0')}</span>
                      {w.title}
                    </a>
                    {!LESSONS[w.n] && <span className="nav-soon">planned</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <h2>Official course materials</h2>
        <ul>
          {COURSE_LINKS.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="dim small">
          This is an unofficial, independent study aid. It is not affiliated with, endorsed by, or produced by
          Stanford University or the instructors of either course. The lecture slides belong to their authors and are
          linked, not copied; the lesson text, figures and code here are original, and any mistakes in them are this
          site's own. Progress you mark here is saved in this browser only.
        </p>

        <p>
          <a className="btn btn-primary" href="#/week/1">
            Begin with Week 1 →
          </a>
        </p>
      </div>
    </article>
  )
}
