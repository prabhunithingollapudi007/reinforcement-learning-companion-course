import { arrow } from './arrows'
import { Figure } from './Figure'

/** One task described at six levels of detail. */
export function Ladder() {
  const rungs = ['Host a dinner party', 'Cook the main course', 'Make the sauce', 'Chop an onion', 'Pick up the knife', 'Close the fingers']
  return (
    <Figure
      height={270}
      label="One task at six levels of detail, from top to bottom: host a dinner party, cook the main course, make the sauce, chop an onion, pick up the knife, close the fingers. Learning the top level directly from motor commands is very hard. Each step down is a shorter, easier task."
      caption="Nobody learns to host a dinner party as one long string of muscle movements. The top rung is thousands of steps with one distant reward. The bottom rung takes a fraction of a second. Hierarchy is the bet that a hard task is a short sequence of easier ones, all the way down."
    >
      {rungs.map((r, i) => (
        <g key={r}>
          <rect x={150 + i * 22} y={16 + i * 40} width={270} height={30} rx={8} className={i === 0 ? 'fig-box-accent' : 'fig-box'} />
          <text x={166 + i * 22} y={36 + i * 40} className="fig-text">
            {r}
          </text>
          {i < rungs.length - 1 && <line x1={176 + i * 22} y1={46 + i * 40} x2={190 + i * 22} y2={54 + i * 40} className="fig-line-muted" />}
        </g>
      ))}
      <text x={20} y={36} className="fig-strong">
        very hard to
      </text>
      <text x={20} y={54} className="fig-strong">
        learn directly
      </text>
      <text x={546} y={232} className="fig-strong">
        easy to learn
      </text>
      <line x1={620} y1={40} x2={620} y2={206} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={634} y={110} className="fig-small">
        shorter,
      </text>
      <text x={634} y={128} className="fig-small">
        more often,
      </text>
      <text x={634} y={146} className="fig-small">
        more reusable
      </text>
    </Figure>
  )
}

/** A two-level policy on a shared timeline. */
export function TwoLevels() {
  const ticks = Array.from({ length: 12 }, (_, i) => 150 + i * 46)
  return (
    <Figure
      height={250}
      label="Two policies on one timeline. The high-level policy looks at the observation and the overall task and issues a subgoal every few steps. The low-level policy looks at the observation and the current subgoal and issues an action at every step."
      caption="The high level decides what to do next and speaks rarely. The low level decides how, and acts at every step. The subgoal g is the only thing that passes between them: an action from the high level's point of view, a task from the low level's."
    >
      <text x={20} y={52} className="fig-strong">
        High level
      </text>
      <text x={20} y={70} className="fig-small">
        π(g | o, task)
      </text>
      <text x={20} y={166} className="fig-strong">
        Low level
      </text>
      <text x={20} y={184} className="fig-small">
        π(a | o, g)
      </text>
      {[0, 4, 8].map((i, k) => (
        <g key={i}>
          <rect x={ticks[i] - 14} y={34} width={170} height={40} rx={10} className="fig-box-accent" />
          <text x={ticks[i] + 71} y={59} textAnchor="middle" className="fig-text">
            {['subgoal: “chop the onion”', 'subgoal: “heat the pan”', 'subgoal: “add the onion”'][k]}
          </text>
          <line x1={ticks[i] + 4} y1={76} x2={ticks[i] + 4} y2={140} className="fig-line-s1" markerEnd={arrow('s1')} />
        </g>
      ))}
      {ticks.map((x, i) => (
        <g key={x}>
          <rect x={x - 14} y={146} width={36} height={36} rx={8} className="fig-box" />
          <text x={x + 4} y={169} textAnchor="middle" className="fig-math-small">
            a
          </text>
          {i < ticks.length - 1 && <line x1={x + 24} y1={164} x2={x + 30} y2={164} className="fig-line-muted" />}
        </g>
      ))}
      <line x1={136} y1={212} x2={690} y2={212} className="fig-line-muted" markerEnd={arrow('muted')} />
      <text x={413} y={236} textAnchor="middle" className="fig-small">
        time: one action per step, one subgoal every few steps
      </text>
    </Figure>
  )
}

/** Each level needs the other to exist before it can be trained properly. */
export function WhoTrainsWhom() {
  return (
    <Figure
      height={220}
      label="Two boxes. The low level is trained to reach subgoals, but which subgoals? Ideally the ones the high level will ask for. The high level is trained to solve the task, but with which low level? Ideally the one that was actually learned. Each depends on the other."
      caption="A chicken-and-egg problem. The usual way out is to train the two levels separately first, then adapt at least one of them to the shortcomings of the other: for example, fine-tune the high level so that it only asks for things this particular low level can do."
    >
      <rect x={40} y={40} width={270} height={110} rx={14} className="fig-box" />
      <text x={175} y={70} textAnchor="middle" className="fig-big">
        Low level
      </text>
      <text x={175} y={96} textAnchor="middle" className="fig-small">
        trained to reach subgoals
      </text>
      <text x={175} y={124} textAnchor="middle" className="fig-strong">
        but which subgoals?
      </text>
      <rect x={410} y={40} width={270} height={110} rx={14} className="fig-box" />
      <text x={545} y={70} textAnchor="middle" className="fig-big">
        High level
      </text>
      <text x={545} y={96} textAnchor="middle" className="fig-small">
        trained to solve the whole task
      </text>
      <text x={545} y={124} textAnchor="middle" className="fig-strong">
        but with which low level?
      </text>
      <path d="M312,74 Q360,50 406,74" className="fig-line-s1" markerEnd={arrow('s1')} fill="none" />
      <path d="M408,118 Q360,142 314,118" className="fig-line-s2" markerEnd={arrow('s2')} fill="none" />
      <text x={360} y={36} textAnchor="middle" className="fig-small">
        the ones this one will ask for
      </text>
      <text x={360} y={172} textAnchor="middle" className="fig-small">
        the one this one turned out to be
      </text>
      <text x={360} y={204} textAnchor="middle" className="fig-label">
        train separately, then adapt one to the other
      </text>
    </Figure>
  )
}
