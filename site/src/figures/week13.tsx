import { arrow } from './arrows'
import { Figure } from './Figure'

/** One policy, told which task to do. */
export function TaskConditioning() {
  const ids = [
    { y: 112, title: 'a task number', eg: 'task 3 of 10' },
    { y: 150, title: 'a sentence', eg: '“hang the towel”' },
    { y: 188, title: 'a goal state', eg: 'what done looks like' },
  ]
  return (
    <Figure
      height={236}
      label="One policy network with two inputs: the state, and a task identifier z. The identifier can be a task number, a sentence, or a goal state. The output is an action. The same weights serve every task."
      caption="Multi-task RL needs almost no new machinery. Append a task identifier z to the state and you have one ordinary MDP whose state is (state, z). What is new is the opportunity: the tasks share one set of weights, so what one task teaches about balance or grammar is available to all."
    >
      <rect x={30} y={30} width={170} height={46} rx={10} className="fig-box" />
      <text x={115} y={58} textAnchor="middle" className="fig-text">
        state
      </text>
      <text x={30} y={100} className="fig-label">
        task identifier z, one of:
      </text>
      {ids.map((id) => (
        <g key={id.title}>
          <rect x={30} y={id.y} width={170} height={30} rx={8} className="fig-chip-accent" />
          <text x={42} y={id.y + 20} className="fig-small">
            {id.title}
          </text>
        </g>
      ))}
      <line x1={202} y1={53} x2={296} y2={104} className="fig-line" markerEnd={arrow('ink')} />
      <line x1={202} y1={165} x2={296} y2={132} className="fig-line-s1" markerEnd={arrow('s1')} />
      <rect x={300} y={78} width={170} height={80} rx={14} className="fig-box-accent" />
      <text x={385} y={112} textAnchor="middle" className="fig-big">
        one policy
      </text>
      <text x={385} y={134} textAnchor="middle" className="fig-math">
        π(a | s, z)
      </text>
      <line x1={472} y1={118} x2={536} y2={118} className="fig-line" markerEnd={arrow('ink')} />
      <rect x={540} y={95} width={150} height={46} rx={10} className="fig-box" />
      <text x={615} y={123} textAnchor="middle" className="fig-text">
        action
      </text>
      <text x={385} y={196} textAnchor="middle" className="fig-small">
        the same weights for every task
      </text>
    </Figure>
  )
}

/** Hindsight relabelling of one failed episode. */
export function Relabel() {
  const path = 'M69,169 L109,169 L149,169 L149,129 L189,129 L229,129 L229,104'
  return (
    <Figure
      height={250}
      label="An episode on a grid. The agent was asked to reach goal G in the top right but ended at a different cell, E. Stored as asked, every step has reward 0 and teaches nothing. Stored again with E as the goal, the same steps end in reward 1 and teach how to reach E."
      caption="The episode failed at what it was asked to do, and succeeded perfectly at something else: getting to E. Relabelling stores it a second time as if E had been the goal all along. No new experience is collected; the same steps are simply given a goal for which they were a success."
    >
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => <rect key={`${r}-${c}`} x={50 + c * 40} y={30 + r * 40} width={38} height={38} rx={6} className="fig-box" />),
      )}
      <circle cx={69} cy={169} r={7} className="fig-dot" />
      <text x={69} y={246} textAnchor="middle" className="fig-small">
        start
      </text>
      <line x1={69} y1={234} x2={69} y2={182} className="fig-line-muted" />
      <rect x={250} y={30} width={38} height={38} rx={6} className="fig-chip" />
      <text x={269} y={55} textAnchor="middle" className="fig-strong">
        G
      </text>
      <rect x={210} y={70} width={38} height={38} rx={6} className="fig-chip-accent" />
      <text x={229} y={90} textAnchor="middle" className="fig-strong">
        E
      </text>
      <path d={path} className="fig-line-s1" markerEnd={arrow('s1')} />
      <rect x={330} y={30} width={370} height={84} rx={12} className="fig-box" />
      <text x={346} y={56} className="fig-strong">
        Stored as asked: goal G
      </text>
      <text x={346} y={78} className="fig-small">
        rewards 0, 0, 0, 0, 0, 0
      </text>
      <text x={346} y={98} className="fig-small">
        teaches only that nothing happened
      </text>
      <rect x={330} y={130} width={370} height={84} rx={12} className="fig-box-accent" />
      <text x={346} y={156} className="fig-strong">
        Stored again in hindsight: goal E
      </text>
      <text x={346} y={178} className="fig-small">
        rewards 0, 0, 0, 0, 0, 1
      </text>
      <text x={346} y={198} className="fig-small">
        teaches a route to E from six different cells
      </text>
    </Figure>
  )
}

/** Three ways of telling the agent what to do. */
export function HowTheTaskIsKnown() {
  const cols = [
    { x: 20, title: 'Multi-task', lines: ['told which task:', 'z is given'], foot: 'works at once on tasks it trained on' },
    { x: 250, title: 'Goal-conditioned', lines: ['told the goal:', 'z is a state to reach'], foot: 'works at once, even on goals never asked for' },
    { x: 480, title: 'Meta-RL', lines: ['told nothing:', 'must work z out by trying'], foot: 'works after a few episodes of experience' },
  ]
  return (
    <Figure
      height={200}
      label="Three settings. In multi-task RL the agent is told which task it is doing. In goal-conditioned RL it is told the goal state. In meta-RL it is told nothing and has to work out the task from its own first few episodes."
      caption="The three settings of this week differ in how the agent finds out what the task is. Meta-RL is the hardest because finding out is part of the job: the agent has to explore the new task before it can do it."
    >
      {cols.map((c, i) => (
        <g key={c.title}>
          <rect x={c.x} y={24} width={220} height={104} rx={14} className={i === 2 ? 'fig-box-accent' : 'fig-box'} />
          <text x={c.x + 110} y={54} textAnchor="middle" className="fig-big">
            {c.title}
          </text>
          {c.lines.map((line, j) => (
            <text key={line} x={c.x + 110} y={82 + j * 19} textAnchor="middle" className="fig-text">
              {line}
            </text>
          ))}
          <text x={c.x + 110} y={156} textAnchor="middle" className="fig-small">
            {c.foot.split(', ')[0]}
            {c.foot.includes(', ') ? ',' : ''}
          </text>
          {c.foot.includes(', ') && (
            <text x={c.x + 110} y={174} textAnchor="middle" className="fig-small">
              {c.foot.split(', ')[1]}
            </text>
          )}
        </g>
      ))}
    </Figure>
  )
}

/** A black-box meta-learner: memory that survives across episodes of one task. */
export function MemoryAcrossEpisodes() {
  const cells = [
    { x: 40, top: 's₁, no reward yet', out: 'a₁' },
    { x: 150, top: 's₂, r₁', out: 'a₂' },
    { x: 260, top: 's₃, r₂', out: 'a₃' },
    { x: 410, top: 's₁, r₃', out: 'a₁' },
    { x: 520, top: 's₂, r₁', out: 'a₂' },
    { x: 630, top: 's₃, r₂', out: 'a₃' },
  ]
  return (
    <Figure
      height={250}
      label="A recurrent policy unrolled over two episodes of the same task. At each step it receives the state and the previous reward and produces an action. Its hidden memory is passed from step to step, and, crucially, from the end of episode one into the start of episode two. It is reset only when the task changes."
      caption="Black-box meta-RL (RL²). Two changes turn an ordinary recurrent policy into a learner: rewards are fed in as inputs, and the memory is carried across episodes of the same task. The weights are trained slowly, over thousands of tasks. Inside one task nothing is trained: all the learning is the memory filling up."
    >
      <text x={150} y={26} textAnchor="middle" className="fig-label">
        episode 1 of a new task
      </text>
      <text x={520} y={26} textAnchor="middle" className="fig-label">
        episode 2 of the same task
      </text>
      <line x1={355} y1={14} x2={355} y2={206} className="fig-line-muted" strokeDasharray="4 5" />
      {cells.map((c, i) => (
        <g key={i}>
          <text x={c.x + 25} y={62} textAnchor="middle" className="fig-small">
            {c.top}
          </text>
          <line x1={c.x + 25} y1={70} x2={c.x + 25} y2={98} className="fig-line" markerEnd={arrow('ink')} />
          <rect x={c.x - 10} y={102} width={70} height={46} rx={10} className="fig-box-accent" />
          <text x={c.x + 25} y={130} textAnchor="middle" className="fig-text">
            memory
          </text>
          <line x1={c.x + 25} y1={150} x2={c.x + 25} y2={178} className="fig-line" markerEnd={arrow('ink')} />
          <text x={c.x + 25} y={198} textAnchor="middle" className="fig-math">
            {c.out}
          </text>
          {i < cells.length - 1 && <line x1={c.x + 62} y1={125} x2={cells[i + 1].x - 14} y2={125} className="fig-line-s1" markerEnd={arrow('s1')} />}
        </g>
      ))}
      <text x={355} y={232} textAnchor="middle" className="fig-strong">
        the memory is not reset between episodes: this is where the learning lives
      </text>
    </Figure>
  )
}
