import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import {
  ARMS,
  BEST_WITHOUT_CLUE,
  BEST_WITH_CLUE,
  CHECKPOINTS,
  CLUE,
  META_CHECKPOINTS,
  MetaLearner,
  PULLS,
  goalAverage,
  metaAverage,
  trainGoals,
  ucbAverage,
  ucbFromScratch,
  type Pull,
} from '../../rl/multitask'
import '../shared.css'

const GRID_PX = 300

function ReachGrid({
  title,
  size,
  start,
  reach,
  slot,
  onPick,
}: {
  title: string
  size: number
  start: number
  reach: boolean[]
  slot: 1 | 2
  onPick: (cell: number) => void
}) {
  const cell = GRID_PX / size
  const count = reach.filter(Boolean).length - 1
  return (
    <div>
      <div className="chart-title">{title}</div>
      <svg
        viewBox={`0 0 ${GRID_PX} ${GRID_PX}`}
        className="chart"
        role="img"
        aria-label={`${title}: from the marked start cell the agent can reach ${count} of the ${size * size - 1} other cells when asked to.`}
      >
        {reach.map((ok, g) => (
          <rect
            key={g}
            x={(g % size) * cell + 1.5}
            y={Math.floor(g / size) * cell + 1.5}
            width={cell - 3}
            height={cell - 3}
            rx={5}
            className={g === start ? 'cell-rect reach-start' : ok ? `cell-rect bar-${slot}` : 'cell-rect reach-no'}
            style={{ cursor: 'pointer' }}
            onClick={() => onPick(g)}
          >
            <title>{g === start ? 'start here' : ok ? 'reaches this goal when asked' : 'cannot reach this goal yet'}</title>
          </rect>
        ))}
        <text x={(start % size) * cell + cell / 2} y={Math.floor(start / size) * cell + cell / 2 + 5} textAnchor="middle" className="cell-start" pointerEvents="none">
          S
        </text>
      </svg>
      <div className="trace">
        reaches <span className="mono">{count}</span> of {size * size - 1} goals
      </div>
    </div>
  )
}

/** Goal-conditioned learning with and without hindsight relabelling. */
export function Hindsight() {
  const [size, setSize] = useState(8)
  const [step, setStep] = useState(4)
  const [extra, setExtra] = useState(4)
  const [picked, setPicked] = useState<number | null>(null)
  const episodes = CHECKPOINTS[step]
  const start = picked !== null && picked < size * size ? picked : Math.floor(size / 2 - 1) * size + Math.floor(size / 2) - 1

  const plain = useMemo(() => trainGoals({ size, episodes, hindsight: 0, seed: 1 }), [size, episodes])
  const hind = useMemo(() => trainGoals({ size, episodes, hindsight: extra, seed: 1 }), [size, episodes, extra])
  const curves = useMemo(() => ({ plain: goalAverage(size, 0, 10), hind: goalAverage(size, extra, 10) }), [size, extra])
  const plainReach = useMemo(() => plain.learner.reachable(start, 5), [plain, start])
  const hindReach = useMemo(() => hind.learner.reachable(start, 5), [hind, start])

  return (
    <Playground
      title="Hindsight: every failure reached somewhere"
      caption={
        <>
          Each episode the agent is dropped in a random cell and told a random goal cell. It is paid 1 only on the step
          that reaches the goal. Both agents see the same number of episodes. The grids show which goals each can
          reach from the cell marked S. Click any cell to move S.
        </>
      }
    >
      <div className="controls controls-3">
        <Slider label="Grid" value={size} min={6} max={10} step={2} onChange={setSize} format={(v) => `${v} × ${v}`} />
        <Slider label="Training episodes" value={step} min={0} max={CHECKPOINTS.length - 1} step={1} onChange={setStep} format={() => `${episodes}`} />
        <Slider label="Hindsight goals per step" value={extra} min={1} max={8} step={1} onChange={setExtra} format={(v) => `${v}`} />
      </div>

      <div className="panels-2">
        <ReachGrid title="Learning only from the goal it was given" size={size} start={start} reach={plainReach} slot={2} onPick={setPicked} />
        <ReachGrid title="Also relabelling with goals it reached" size={size} start={start} reach={hindReach} slot={1} onPick={setPicked} />
      </div>

      <div className="chart-title">Share of random start-goal pairs solved, averaged over 10 agents of each kind</div>
      <LineChart
        series={[
          { name: 'With hindsight relabelling', values: curves.hind, slot: 1, dots: true },
          { name: 'Given goal only', values: curves.plain, slot: 2, dots: true },
        ]}
        xLabel="training episodes"
        yLabel="goals reached"
        ariaLabel={`Success rate against training episodes on a ${size} by ${size} grid. With hindsight it rises from ${curves.hind[0].toFixed(2)} to ${curves.hind[CHECKPOINTS.length - 1].toFixed(2)}; with the given goal only, from ${curves.plain[0].toFixed(2)} to ${curves.plain[CHECKPOINTS.length - 1].toFixed(2)}.`}
        yMin={0}
        yMax={1}
        height={240}
        marker={{ x: step, label: `${episodes} episodes` }}
        format={(v) => `${Math.round(v * 100)}%`}
        xFormat={(k) => `${CHECKPOINTS[k]}`}
        tableRows={CHECKPOINTS.map((_, i) => i)}
      />
      <div className="stats">
        <Stat label="Updates that carried a signal, given goal only" value={`${(plain.usefulShare * 100).toFixed(1)}%`} note="the rest learned “nothing happened”" />
        <Stat label="With hindsight" value={`${(hind.usefulShare * 100).toFixed(0)}%`} note="every relabelled step leads to its goal" />
        <Stat label="Real episodes used" value={`${episodes}`} note="the same for both: hindsight costs no extra experience" />
      </div>
    </Playground>
  )
}

const leverName = (arm: number) => (arm === CLUE ? 'clue' : `${arm + 1}`)

function PullStrip({ label, pulls, y }: { label: string; pulls: Pull[]; y: number }) {
  const x0 = 170
  const w = (720 - x0) / PULLS
  return (
    <g>
      <text x={0} y={y + 24} className="strip-label">
        {label}
      </text>
      {pulls.map((p, t) => (
        <g key={t}>
          <rect x={x0 + t * w + 2} y={y} width={w - 4} height={38} rx={8} className={p.paid ? 'bar-3' : p.arm === CLUE ? 'pull-clue' : 'reach-no'}>
            <title>
              pull {t + 1}: {p.arm === CLUE ? 'the clue' : `lever ${p.arm + 1}`}, {p.paid ? 'paid 1' : 'paid nothing'}
            </title>
          </rect>
          <text x={x0 + t * w + w / 2} y={y + 24} textAnchor="middle" className={p.paid ? 'pull-text-on' : 'pull-text'} pointerEvents="none">
            {leverName(p.arm)}
          </text>
        </g>
      ))}
    </g>
  )
}

/** Slow learning across tasks buying fast learning within one. */
export function LearningToLearn() {
  const [step, setStep] = useState(0)
  const [good, setGood] = useState(5)
  const tasks = META_CHECKPOINTS[step]

  const learner = useMemo(() => {
    const l = new MetaLearner(1)
    l.train(tasks)
    return l
  }, [tasks])
  const score = useMemo(() => learner.evaluate(400, 7), [learner])
  const pulls = useMemo(() => learner.runTask(good, false), [learner, good])
  const scratch = useMemo(() => ucbFromScratch(good), [good])
  const curve = useMemo(() => metaAverage(20), [])
  const ucb = useMemo(() => ucbAverage(), [])

  return (
    <Playground
      title="Learning to learn"
      caption={
        <>
          A family of tasks: eight levers, one of which pays 1 every time, and a ninth, the clue, which pays nothing
          but reveals which lever does. Which lever pays changes with every task, and each task lasts ten pulls. The
          top row is an agent that has practised on other tasks from the family. The bottom row is a good
          general-purpose bandit algorithm meeting the family for the first time.
        </>
      }
    >
      <div className="controls">
        <Slider label="Tasks practised on beforehand" value={step} min={0} max={META_CHECKPOINTS.length - 1} step={1} onChange={setStep} format={() => `${tasks}`} />
        <Slider label="In this new task, the paying lever is" value={good + 1} min={1} max={ARMS} step={1} onChange={(v) => setGood(v - 1)} format={(v) => `lever ${v}`} />
      </div>

      <svg
        viewBox="0 0 720 122"
        className="chart"
        role="img"
        aria-label={`Ten pulls on a new task where lever ${good + 1} pays. The practised agent pulls ${pulls.map((p) => leverName(p.arm)).join(', ')} and earns ${pulls.filter((p) => p.paid).length}. UCB from scratch pulls ${scratch.map((p) => leverName(p.arm)).join(', ')} and earns ${scratch.filter((p) => p.paid).length}.`}
      >
        <PullStrip label="Practised agent" pulls={pulls} y={6} />
        <PullStrip label="UCB from scratch" pulls={scratch} y={62} />
        <text x={720} y={118} textAnchor="end" className="tick">
          pull 1 to 10 →
        </text>
      </svg>
      <ul className="swatches">
        <li>
          <i className="swatch swatch-3" /> paid 1
        </li>
        <li>
          <i className="swatch swatch-clue" /> pulled the clue
        </li>
        <li>
          <i className="swatch swatch-none" /> paid nothing
        </li>
      </ul>

      <div className="chart-title">Reward on a brand-new task, averaged over 20 separately trained agents</div>
      <LineChart
        series={[
          { name: 'Practised agent', values: curve.reward, slot: 1, dots: true },
          { name: 'UCB from scratch', values: curve.reward.map(() => ucb.reward), slot: 2 },
        ]}
        xLabel="tasks practised on beforehand"
        yLabel="reward in 10 pulls"
        ariaLabel={`Reward on a new task against the number of practice tasks. The practised agent rises from ${curve.reward[0].toFixed(1)} to ${curve.reward[curve.reward.length - 1].toFixed(1)} of a possible ${BEST_WITH_CLUE}. UCB from scratch earns ${ucb.reward.toFixed(1)} regardless.`}
        yMin={0}
        yMax={10}
        height={240}
        marker={{ x: step, label: `${tasks} tasks` }}
        format={(v) => v.toFixed(2)}
        xFormat={(k) => `${META_CHECKPOINTS[k]}`}
        tableRows={META_CHECKPOINTS.map((_, i) => i)}
      />
      <div className="stats stats-4">
        <Stat label="This agent, on new tasks" value={score.reward.toFixed(2)} note={`pulls the clue first in ${Math.round(score.clueFirst * 100)}% of them`} />
        <Stat label="UCB from scratch" value={ucb.reward.toFixed(2)} note="spends nine pulls trying everything once" />
        <Stat label="Best without the clue" value={BEST_WITHOUT_CLUE.toFixed(1)} note="try levers one by one until one pays" />
        <Stat label="Best possible" value={BEST_WITH_CLUE.toFixed(1)} note="ask first, then pull what the clue names" />
      </div>
    </Playground>
  )
}
