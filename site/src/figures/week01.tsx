import type { ReactNode } from 'react'
import { arrow } from './arrows'
import { Figure } from './Figure'

/** Where Week 1 sits: which of the two simplifying assumptions each part of the course keeps. */
export function CourseQuadrant() {
  const cells: { x: number; y: number; accent?: boolean; week: string; lines: string[] }[] = [
    { x: 170, y: 44, accent: true, week: 'Week 1', lines: ['Planning: value iteration', 'and policy iteration'] },
    { x: 440, y: 44, week: 'Week 12', lines: ['Search guided by learned', 'values (AlphaZero)'] },
    { x: 170, y: 150, week: 'Weeks 2–3', lines: ['Learn from experience:', 'Monte Carlo, TD, Q-learning'] },
    { x: 440, y: 150, week: 'Week 4 onward', lines: ['Deep RL: neither', 'assumption holds'] },
  ]
  return (
    <Figure
      height={262}
      label="A two by two map. Model known and values in a table: Week 1. Model unknown, table: Weeks 2 and 3. Model unknown, approximation: Week 4 onward. Model known, approximation: Week 12."
      caption="Two assumptions make this week easy: you know the rules, and the world is small. The rest of the course removes them one at a time."
    >
      <text x={300} y={28} textAnchor="middle" className="fig-label">
        Values fit in a table
      </text>
      <text x={570} y={28} textAnchor="middle" className="fig-label">
        Too many states: approximate
      </text>
      <text x={20} y={90} className="fig-label">
        Model known
      </text>
      <text x={20} y={196} className="fig-label">
        Model unknown
      </text>
      {cells.map((c) => (
        <g key={c.week}>
          <rect x={c.x} y={c.y} width={260} height={96} rx={10} className={c.accent ? 'fig-box-accent' : 'fig-box'} />
          <text x={c.x + 16} y={c.y + 28} className="fig-strong">
            {c.week}
          </text>
          {c.lines.map((line, i) => (
            <text key={line} x={c.x + 16} y={c.y + 52 + i * 18} className="fig-small">
              {line}
            </text>
          ))}
          {c.accent && (
            <text x={c.x + 244} y={c.y + 28} textAnchor="end" className="fig-label">
              you are here
            </text>
          )}
        </g>
      ))}
    </Figure>
  )
}

/** The agent-environment loop, and the trajectory it produces. */
export function InteractionLoop() {
  const strip: { text: string; kind: 's' | 'a' | 'r' | 'more' }[] = [
    { text: 's₀', kind: 's' },
    { text: 'a₀', kind: 'a' },
    { text: 'r₀', kind: 'r' },
    { text: 's₁', kind: 's' },
    { text: 'a₁', kind: 'a' },
    { text: 'r₁', kind: 'r' },
    { text: 's₂', kind: 's' },
    { text: '…', kind: 'more' },
  ]
  const sx = (i: number) => 96 + i * 76
  return (
    <Figure
      height={252}
      label="The agent sends an action to the world. The world returns the next state and a reward. Repeating this gives a trajectory: state, action, reward, state, action, reward, and so on."
      caption="The loop runs once per time step. Written out in order, the result is a trajectory. Everything else this week is bookkeeping about trajectories like this one."
    >
      <rect x={70} y={36} width={180} height={84} rx={12} className="fig-box-accent" />
      <text x={160} y={72} textAnchor="middle" className="fig-big">
        Agent
      </text>
      <text x={160} y={96} textAnchor="middle" className="fig-small">
        chooses with a policy π
      </text>
      <rect x={470} y={36} width={180} height={84} rx={12} className="fig-box" />
      <text x={560} y={72} textAnchor="middle" className="fig-big">
        World
      </text>
      <text x={560} y={96} textAnchor="middle" className="fig-small">
        dynamics P, reward R
      </text>

      <line x1={250} y1={60} x2={468} y2={60} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={50} textAnchor="middle" className="fig-text">
        action aₜ
      </text>
      <line x1={470} y1={98} x2={252} y2={98} className="fig-line" markerEnd={arrow('ink')} />
      <text x={360} y={118} textAnchor="middle" className="fig-text">
        next state sₜ₊₁, reward rₜ
      </text>

      <text x={70} y={168} className="fig-label">
        One episode, written out
      </text>
      {strip.map((item, i) => (
        <g key={i}>
          {i > 0 && <line x1={sx(i - 1) + 22} y1={206} x2={sx(i) - 24} y2={206} className="fig-line-muted" markerEnd={arrow('muted')} />}
          {item.kind === 's' && <circle cx={sx(i)} cy={206} r={19} className="fig-node" />}
          {item.kind === 'a' && <rect x={sx(i) - 19} y={188} width={38} height={36} rx={8} className="fig-box-accent" />}
          {item.kind === 'r' && <rect x={sx(i) - 19} y={190} width={38} height={32} rx={16} className="fig-chip" />}
          <text x={sx(i)} y={211} textAnchor="middle" className="fig-math">
            {item.text}
          </text>
        </g>
      ))}
    </Figure>
  )
}

/** Markov process -> reward process -> decision process, drawn on one chain. */
export function ThreeLayers() {
  const xs = [330, 430, 530, 630]
  const rewards = ['+1', '0', '0', '+10']
  const rows: { y: number; title: string; adds: string; math: string; rewards: boolean; actions: boolean }[] = [
    { y: 58, title: 'Markov process', adds: 'states and chance', math: 'P(s′ | s)', rewards: false, actions: false },
    { y: 168, title: 'Markov reward process', adds: '+ a reward in each state', math: 'R(s),  γ', rewards: true, actions: false },
    { y: 288, title: 'Markov decision process', adds: '+ a choice of action', math: 'P(s′ | s, a),  R(s, a)', rewards: true, actions: true },
  ]
  return (
    <Figure
      height={352}
      label="Three versions of the same four-state chain. First with random transitions only. Then with a reward in each state. Then with two actions, left and right, that the agent chooses between."
      caption="Each layer adds one thing to the one above. The bottom row is the lecture's Mars rover in miniature: reward at both ends, and the agent chooses which way to drive."
    >
      {rows.map((row) => (
        <g key={row.title}>
          <text x={20} y={row.y - 14} className="fig-strong">
            {row.title}
          </text>
          <text x={20} y={row.y + 6} className="fig-small">
            {row.adds}
          </text>
          <text x={20} y={row.y + 30} className="fig-math-small">
            {row.math}
          </text>
          {row.actions && (
            <>
              <line x1={20} y1={row.y + 50} x2={44} y2={row.y + 50} className="fig-line-s1" markerEnd={arrow('s1')} />
              <text x={52} y={row.y + 54} className="fig-small">
                action: right
              </text>
              <line x1={164} y1={row.y + 50} x2={140} y2={row.y + 50} className="fig-line-s2" markerEnd={arrow('s2')} />
              <text x={172} y={row.y + 54} className="fig-small">
                action: left
              </text>
            </>
          )}
          {xs.slice(0, -1).map((x, i) => (
            <g key={x}>
              <path
                d={`M${x + 16},${row.y - 14} Q${x + 50},${row.y - 40} ${xs[i + 1] - 17},${row.y - 15}`}
                className={row.actions ? 'fig-line-s1' : 'fig-line'}
                markerEnd={arrow(row.actions ? 's1' : 'ink')}
              />
              <path
                d={`M${xs[i + 1] - 16},${row.y + 14} Q${x + 50},${row.y + 40} ${x + 17},${row.y + 15}`}
                className={row.actions ? 'fig-line-s2' : 'fig-line'}
                markerEnd={arrow(row.actions ? 's2' : 'ink')}
              />
            </g>
          ))}
          {xs.map((x, i) => (
            <g key={x}>
              <circle cx={x} cy={row.y} r={20} className="fig-node" />
              <text x={x} y={row.y + 5} textAnchor="middle" className="fig-math">
                s{'₁₂₃₄'[i]}
              </text>
              {row.rewards && (
                <>
                  <rect x={x - 20} y={row.y + 34} width={40} height={22} rx={11} className={rewards[i] === '0' ? 'fig-chip' : 'fig-chip-accent'} />
                  <text x={x} y={row.y + 50} textAnchor="middle" className="fig-small">
                    {rewards[i]}
                  </text>
                </>
              )}
            </g>
          ))}
        </g>
      ))}
    </Figure>
  )
}

function BackupTree({ ox, title, mode }: { ox: number; title: string; mode: 'average' | 'max' }) {
  const root = { x: ox + 205, y: 66 }
  const actions = [
    { x: ox + 140, y: 152 },
    { x: ox + 270, y: 152 },
  ]
  const leaves = [
    [ox + 100, ox + 180],
    [ox + 230, ox + 310],
  ]
  const best = 0
  return (
    <g>
      <text x={ox + 205} y={26} textAnchor="middle" className="fig-strong">
        {title}
      </text>
      <text x={ox + 12} y={70} className="fig-small">
        state s
      </text>
      <text x={ox + 12} y={156} className="fig-small">
        action a
      </text>
      <text x={ox + 12} y={246} className="fig-small">
        next s′
      </text>
      {actions.map((a, i) => {
        const chosen = mode === 'average' || i === best
        return (
          <g key={i} className={chosen ? '' : 'fig-faded'}>
            <line x1={root.x} y1={root.y + 16} x2={a.x} y2={a.y - 6} className={mode === 'max' && i === best ? 'fig-line-s1' : 'fig-line'} />
            {leaves[i].map((lx) => (
              <g key={lx}>
                <line x1={a.x} y1={a.y + 6} x2={lx} y2={228} className="fig-line" />
                <circle cx={lx} cy={242} r={14} className="fig-node" />
              </g>
            ))}
            <circle cx={a.x} cy={a.y} r={6} className="fig-dot" />
          </g>
        )
      })}
      <circle cx={root.x} cy={root.y} r={16} className="fig-node-accent" />
      <text x={root.x} y={root.y + 5} textAnchor="middle" className="fig-math">
        s
      </text>
      {mode === 'average' ? (
        <text x={ox + 160} y={104} textAnchor="end" className="fig-math-small">
          π(a | s)
        </text>
      ) : (
        <>
          <path d={`M${ox + 178},${106} Q${ox + 205},${122} ${ox + 232},${106}`} className="fig-line-s1" />
          <text x={ox + 205} y={140} textAnchor="middle" className="fig-strong">
            max
          </text>
        </>
      )}
      <text x={ox + 112} y={196} textAnchor="end" className="fig-math-small">
        P(s′ | s, a)
      </text>
      <text x={ox + 205} y={282} textAnchor="middle" className="fig-small">
        {mode === 'average' ? 'average over actions, then over next states' : 'keep the best action; chance still averages'}
      </text>
    </g>
  )
}

/** The two Bellman backups as trees. */
export function BackupDiagram() {
  return (
    <Figure
      height={296}
      label="Two backup trees. Left: a state branches to actions weighted by the policy, and each action branches to next states weighted by the dynamics; the value is the average. Right: the same tree, but only the best action is kept."
      caption="A backup computes the value of the top state from the values of the states at the bottom. Open circles are states, solid dots are actions. Left is this section; right is value iteration, two sections on."
    >
      <BackupTree ox={0} title="Evaluate a policy: average" mode="average" />
      <line x1={360} y1={16} x2={360} y2={286} className="fig-line-muted" />
      <BackupTree ox={360} title="Find the best: maximise" mode="max" />
    </Figure>
  )
}

/** The lecture's worked backup on the Mars rover. */
export function RoverBackup() {
  const values = ['1', '0', '0', '0', '0', '0', '10']
  const cx = (i: number) => 40 + i * 92 + 44
  return (
    <Figure
      height={216}
      label="Seven states in a row with current value estimates 1, 0, 0, 0, 0, 0, 10. From state six the action stays put with probability one half and moves to state seven with probability one half. The new value of state six is 2.5."
      caption={
        <>
          The worked example from CS 234 lecture 2, with γ = 0.5. Half the time the rover reaches the state worth 10,
          and that future is discounted once. Every backup is this calculation.
        </>
      }
    >
      <text x={40} y={24} className="fig-label">
        Current estimates Vₖ
      </text>
      {values.map((v, i) => (
        <g key={i}>
          <rect x={40 + i * 92} y={64} width={88} height={56} rx={8} className={i === 5 ? 'fig-box-accent' : 'fig-box'} />
          <text x={40 + i * 92 + 9} y={82} className="fig-math-small">
            s{'₁₂₃₄₅₆₇'[i]}
          </text>
          <text x={cx(i)} y={108} textAnchor="middle" className="fig-big">
            {v}
          </text>
        </g>
      ))}
      <path d={`M${cx(5) - 16},64 C${cx(5) - 30},22 ${cx(5) + 14},22 ${cx(5) + 2},62`} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={cx(5) - 34} y={36} textAnchor="end" className="fig-small">
        stay 0.5
      </text>
      <path d={`M${cx(5) + 22},64 Q${cx(5) + 60},26 ${cx(6) - 8},62`} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={cx(6) - 4} y={36} className="fig-small">
        move 0.5
      </text>
      <line x1={cx(5)} y1={122} x2={cx(5)} y2={148} className="fig-line" markerEnd={arrow('ink')} />
      <text x={680} y={172} textAnchor="end" className="fig-text">
        new value of s₆ = 0 + 0.5 × (0.5 × 0 + 0.5 × 10) = <tspan className="fig-big">2.5</tspan>
      </text>
      <text x={680} y={196} textAnchor="end" className="fig-small">
        reward now + γ × (expected value of where it lands)
      </text>
    </Figure>
  )
}

/** Policy iteration as zig-zagging between two conditions until both hold. */
export function PolicyIterationFunnel() {
  const top = (x: number) => 48 + ((x - 70) * 80) / 550
  const bottom = (x: number) => 208 - ((x - 70) * 80) / 550
  const xs = [100, 190, 280, 355, 425, 480, 525, 560, 588]
  const points = xs.map((x, i) => ({ x, y: i % 2 === 0 ? bottom(x) : top(x) }))
  const shorten = (a: { x: number; y: number }, b: { x: number; y: number }, by: number) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: b.x - ((b.x - a.x) * by) / len, y: b.y - ((b.y - a.y) * by) / len }
  }
  return (
    <Figure
      height={250}
      label="Two lines converge to a point. One is the condition that the values are correct for the policy; the other that the policy is greedy for the values. Policy iteration zig-zags between them, alternating evaluate and improve steps, and ends where they meet: the optimal policy and value."
      caption="Evaluation makes the values right for the current policy. Improvement makes the policy greedy for those values, which makes the values slightly wrong again. The only place both hold is the optimum."
    >
      <line x1={70} y1={top(70)} x2={620} y2={128} className="fig-line-muted" />
      <line x1={70} y1={bottom(70)} x2={620} y2={128} className="fig-line-muted" />
      <text x={70} y={32} className="fig-small">
        values are correct for the policy
      </text>
      <text x={70} y={236} className="fig-small">
        policy is greedy for the values
      </text>
      {points.slice(1).map((p, i) => {
        const from = points[i]
        const evaluate = i % 2 === 0
        const to = shorten(from, p, 3)
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className={evaluate ? 'fig-line-s1' : 'fig-line-s3'}
            markerEnd={arrow(evaluate ? 's1' : 's3')}
          />
        )
      })}
      <circle cx={points[0].x} cy={points[0].y} r={5} className="fig-dot" />
      <text x={92} y={190} textAnchor="end" className="fig-small">
        any policy
      </text>
      <text x={136} y={124} textAnchor="end" className="fig-strong">
        evaluate
      </text>
      <text x={246} y={112} className="fig-strong">
        improve
      </text>
      <circle cx={620} cy={128} r={7} className="fig-dot-s1" />
      <text x={634} y={124} className="fig-math">
        π*, V*
      </text>
      <text x={634} y={144} className="fig-small">
        optimal
      </text>
    </Figure>
  )
}

/** One backup pulls any two value functions closer, and both toward V*. */
export function ContractionPicture() {
  const star = 650
  const g = 0.7
  const rows = [0, 1, 2].map((k) => ({
    y: 64 + k * 80,
    name: ['start', 'after 1 backup', 'after 2 backups'][k],
    gap: ['gap d', 'at most γ · d', 'at most γ² · d'][k],
    a: star - 450 * g ** k,
    b: star - 230 * g ** k,
  }))
  const bracket = (x1: number, x2: number, y: number): ReactNode => (
    <path d={`M${x1},${y + 5} L${x1},${y} L${x2},${y} L${x2},${y + 5}`} className="fig-line" />
  )
  return (
    <Figure
      height={272}
      label="Two different value functions, V and V prime, shown as points on a line. After each backup the gap between them shrinks by at least a factor gamma, and both move toward the fixed point V star."
      caption="Apply the same backup to two different guesses and they end up closer together, every time. Since V* does not move, every guess is pulled toward it. Drawn for γ = 0.7."
    >
      <line x1={star} y1={34} x2={star} y2={252} className="fig-line-s3" />
      <text x={star} y={24} textAnchor="middle" className="fig-math">
        V*
      </text>
      {rows.map((row) => (
        <g key={row.name}>
          <text x={20} y={row.y + 5} className="fig-small">
            {row.name}
          </text>
          <line x1={150} y1={row.y} x2={690} y2={row.y} className="fig-line-muted" />
          {bracket(row.a, row.b, row.y - 20)}
          <text x={(row.a + row.b) / 2} y={row.y - 26} textAnchor="middle" className="fig-small">
            {row.gap}
          </text>
          <circle cx={row.a} cy={row.y} r={7} className="fig-dot-s1" />
          <circle cx={row.b} cy={row.y} r={7} className="fig-dot-s2" />
          <text x={row.a} y={row.y + 24} textAnchor="middle" className="fig-math-small">
            V
          </text>
          <text x={row.b} y={row.y + 24} textAnchor="middle" className="fig-math-small">
            V′
          </text>
        </g>
      ))}
    </Figure>
  )
}

/** How this week's pieces turn into the algorithm families of the course. */
export function AlgorithmMap() {
  const rows: { y: number; from: [string, string]; how: string; to: [string, string] }[] = [
    { y: 34, from: ['Value iteration', 'back up with a max'], how: 'sample instead of sum', to: ['Value-based: Q-learning, DQN', 'Weeks 3–4'] },
    { y: 100, from: ['Policy iteration', 'evaluate, then improve'], how: 'learn critic and actor', to: ['Actor-critic, policy gradient', 'Weeks 5–7'] },
    { y: 166, from: ['The model P and R', 'given to you this week'], how: 'learn the model first', to: ['Model-based RL, tree search', 'Week 12'] },
  ]
  return (
    <Figure
      height={292}
      label="Value iteration becomes value-based methods such as Q-learning and DQN. Policy iteration becomes actor-critic and policy gradient methods. The model becomes model-based RL and tree search. Imitation learning stands apart: it copies a good policy and needs no reward."
      caption="CS 224R's first lecture sorts the algorithms to come into families. Three of them are this week's ideas with an assumption removed."
    >
      <text x={20} y={20} className="fig-label">
        This week
      </text>
      <text x={440} y={20} className="fig-label">
        Becomes
      </text>
      {rows.map((row) => (
        <g key={row.y}>
          <rect x={20} y={row.y} width={250} height={50} rx={10} className="fig-box-accent" />
          <text x={34} y={row.y + 22} className="fig-strong">
            {row.from[0]}
          </text>
          <text x={34} y={row.y + 40} className="fig-small">
            {row.from[1]}
          </text>
          <line x1={272} y1={row.y + 30} x2={438} y2={row.y + 30} className="fig-line" markerEnd={arrow('ink')} />
          <text x={355} y={row.y + 22} textAnchor="middle" className="fig-small">
            {row.how}
          </text>
          <rect x={440} y={row.y} width={260} height={50} rx={10} className="fig-box" />
          <text x={454} y={row.y + 22} className="fig-strong">
            {row.to[0]}
          </text>
          <text x={454} y={row.y + 40} className="fig-small">
            {row.to[1]}
          </text>
        </g>
      ))}
      <text x={34} y={254} className="fig-small">
        Nothing from this week: it copies
      </text>
      <text x={34} y={272} className="fig-small">
        a good policy and needs no reward.
      </text>
      <rect x={440} y={232} width={260} height={50} rx={10} className="fig-box" />
      <text x={454} y={254} className="fig-strong">
        Imitation learning
      </text>
      <text x={454} y={272} className="fig-small">
        Week 8
      </text>
    </Figure>
  )
}
