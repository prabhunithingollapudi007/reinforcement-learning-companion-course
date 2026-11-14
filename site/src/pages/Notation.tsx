import katex from 'katex'

function M({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { throwOnError: false }) }} />
}

// The two courses write the same objects differently. This page grows as lessons are added.
const ROWS: { idea: string; a: string; b: string; note: string }[] = [
  { idea: 'State, action', a: 's, a', b: 's_t, a_t', note: 'CS 224R also uses an observation o_t when the state is not fully visible.' },
  { idea: 'Dynamics', a: "P(s' \\mid s, a)", b: 'p(s_{t+1} \\mid s_t, a_t)', note: 'Known in Week 1, unknown from Week 2 on.' },
  { idea: 'Reward', a: 'R(s, a)', b: 'r(s_t, a_t)', note: 'Both take the expected immediate reward of a state-action pair.' },
  { idea: 'Policy', a: '\\pi(a \\mid s)', b: '\\pi_\\theta(a \\mid s)', note: 'The subscript is the neural-network weights.' },
  { idea: 'Return', a: 'G_t = \\sum_{k \\ge 0} \\gamma^k r_{t+k}', b: '\\sum_{t=1}^{T} r(s_t, a_t)', note: 'CS 234 discounts over an infinite horizon; CS 224R starts with a finite, undiscounted sum.' },
  { idea: 'A whole episode', a: '(s_0, a_0, r_0, s_1, \\dots)', b: '\\tau = (s_1, a_1, \\dots, s_T, a_T)', note: 'CS 224R calls it a trajectory or roll-out and writes its probability as p_θ(τ).' },
  { idea: 'State value', a: 'V^\\pi(s)', b: 'V^\\pi(s)', note: 'Expected return from s when following π.' },
  { idea: 'Action value', a: 'Q^\\pi(s, a)', b: 'Q^\\pi(s, a)', note: 'Take a first, then follow π.' },
  { idea: 'Optimal value', a: 'V^*(s)', b: 'V^*(s)', note: 'The best any policy can do from s.' },
  { idea: 'Bellman backup', a: 'BV, \\; B^\\pi V', b: '\\text{(not named)}', note: 'CS 234 treats the backup as an operator on value functions.' },
]

export function Notation() {
  return (
    <article className="lesson">
      <header className="lesson-head">
        <div className="kicker">Reference</div>
        <h1>Notation</h1>
        <p className="lede">The same objects, as each course writes them. Lessons on this site follow CS 234 unless they say otherwise.</p>
      </header>
      <div className="prose">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Idea</th>
                <th>CS 234</th>
                <th>CS 224R</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.idea}>
                  <td>{r.idea}</td>
                  <td>
                    <M>{r.a}</M>
                  </td>
                  <td>
                    <M>{r.b}</M>
                  </td>
                  <td className="small">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
