import { useMemo, useRef, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider } from '../../components/Playground'
import {
  COLS,
  GOAL,
  ROWS,
  START,
  averageRewards,
  emptyQ,
  greedyPath,
  isCliff,
  runEpisode,
  smooth,
  type EpisodeResult,
  type Method,
  type QTable,
} from '../../rl/control'
import { mulberry32 } from '../../rl/prediction'
import '../shared.css'

const SIZE = 68
const METHODS: { id: Method; name: string; slot: 1 | 2; offset: number }[] = [
  { id: 'qlearning', name: 'Q-learning', slot: 1, offset: 6 },
  { id: 'sarsa', name: 'SARSA', slot: 2, offset: -6 },
]

interface Agent {
  Q: QTable
  recent: EpisodeResult[]
}
const freshAgents = (): Record<Method, Agent> => ({ sarsa: { Q: emptyQ(), recent: [] }, qlearning: { Q: emptyQ(), recent: [] } })

export function CliffWalker() {
  const [epsilon, setEpsilon] = useState(0.1)
  const [alpha, setAlpha] = useState(0.5)
  const [episodes, setEpisodes] = useState(0)
  const agents = useRef(freshAgents())
  const rngs = useRef({ sarsa: mulberry32(11), qlearning: mulberry32(11) })

  const reset = () => {
    agents.current = freshAgents()
    rngs.current = { sarsa: mulberry32(11), qlearning: mulberry32(11) }
    setEpisodes(0)
  }

  const train = (count: number) => {
    for (const m of METHODS) {
      const agent = agents.current[m.id]
      for (let e = 0; e < count; e++) {
        agent.recent.push(runEpisode(agent.Q, m.id, { alpha, epsilon, gamma: 1 }, rngs.current[m.id]))
      }
      agent.recent = agent.recent.slice(-50)
    }
    setEpisodes((n) => n + count)
  }

  const curves = useMemo(() => {
    const h = { alpha, epsilon, gamma: 1 }
    return {
      sarsa: smooth(averageRewards('sarsa', h, 300, 30, 5), 10),
      qlearning: smooth(averageRewards('qlearning', h, 300, 30, 5), 10),
    }
  }, [alpha, epsilon])

  // Reading the refs during render is safe here: `episodes` changes whenever they do.
  // oxlint-disable-next-line react/refs
  const view = METHODS.map((m) => {
    const agent = agents.current[m.id]
    const route = greedyPath(agent.Q)
    const recent = agent.recent
    return {
      ...m,
      route,
      average: recent.length ? recent.reduce((s, r) => s + r.reward, 0) / recent.length : null,
      falls: recent.filter((r) => r.fell).length,
      seen: recent.length,
    }
  })

  const cx = (s: number) => (s % COLS) * SIZE + SIZE / 2
  const cy = (s: number) => Math.floor(s / COLS) * SIZE + SIZE / 2

  return (
    <Playground
      title="SARSA and Q-learning on a cliff"
      caption={
        <>
          Every step costs 1. Stepping onto the cliff costs 100 and ends the episode. Both agents act ε-greedily while
          they learn, so each occasionally takes a random step. The coloured lines show the route each one would take
          if it stopped exploring and acted greedily on what it has learned.
        </>
      }
    >
      <div className="controls">
        <Slider label="Exploration ε" value={epsilon} min={0.02} max={0.3} step={0.02} onChange={(v) => { setEpsilon(v); reset() }} format={(v) => v.toFixed(2)} />
        <Slider label="Learning rate α" value={alpha} min={0.1} max={0.9} step={0.1} onChange={(v) => { setAlpha(v); reset() }} format={(v) => v.toFixed(1)} />
      </div>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={() => train(500)}>
          Train 500 episodes
        </button>
        <button type="button" className="btn" onClick={() => train(20)}>
          Train 20
        </button>
        <button type="button" className="btn btn-quiet" onClick={reset}>
          Reset
        </button>
      </div>

      <ul className="swatches" aria-label="Legend">
        {METHODS.map((m) => (
          <li key={m.id}>
            <span className={`swatch swatch-${m.slot}`} />
            {m.name} greedy route
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${COLS * SIZE} ${ROWS * SIZE}`} className="grid" role="img" aria-label={`Cliff world after ${episodes} training episodes. ${view.map((v) => `${v.name}: ${v.route.reachesGoal ? `${v.route.path.length - 1} step route` : 'no settled route'}`).join('. ')}.`}>
        {Array.from({ length: ROWS * COLS }, (_, s) => (
          <g key={s} transform={`translate(${(s % COLS) * SIZE}, ${Math.floor(s / COLS) * SIZE})`}>
            <rect x={1} y={1} width={SIZE - 2} height={SIZE - 2} rx={7} fill={isCliff(s) ? 'var(--cell-neg)' : s === GOAL ? 'var(--cell-pos)' : 'var(--cell-mid)'} className="cell-rect" />
            {s === START && (
              <text x={SIZE / 2} y={SIZE - 10} textAnchor="middle" className="cell-terminal">
                start
              </text>
            )}
            {s === GOAL && (
              <text x={SIZE / 2} y={SIZE - 10} textAnchor="middle" className="cell-terminal">
                goal
              </text>
            )}
          </g>
        ))}
        <text x={(COLS * SIZE) / 2} y={(ROWS - 1) * SIZE + SIZE / 2 + 5} textAnchor="middle" className="cell-terminal">
          cliff: −100
        </text>
        {episodes > 0 &&
          view.map(
            (v) =>
              v.route.reachesGoal && (
                <polyline
                  key={v.id}
                  points={v.route.path.map((s) => `${cx(s) + v.offset},${cy(s) + v.offset}`).join(' ')}
                  className={`series series-${v.slot}`}
                  style={{ strokeWidth: 4 }}
                />
              ),
          )}
      </svg>

      <div className="cards">
        {view.map((v) => (
          <div className="card" key={v.id}>
            <div className="card-title">{v.name}</div>
            <div className="card-value">{episodes === 0 ? '–' : v.route.reachesGoal ? `${v.route.path.length - 1} steps` : 'not settled'}</div>
            <div className="card-note">
              {episodes === 0
                ? 'Not trained yet.'
                : `Greedy route length. While learning, its last ${v.seen} episodes averaged ${v.average!.toFixed(1)} reward and ${v.falls} ended in a fall.`}
            </div>
          </div>
        ))}
      </div>

      <div className="chart-title">Reward per episode while learning, averaged over 30 fresh runs at these settings</div>
      <LineChart
        series={[
          { name: 'Q-learning', values: curves.qlearning, slot: 1 },
          { name: 'SARSA', values: curves.sarsa, slot: 2 },
        ]}
        xLabel="episodes"
        yLabel="reward per episode"
        ariaLabel={`Reward per episode during learning. After 300 episodes SARSA averages ${curves.sarsa[299].toFixed(0)} and Q-learning ${curves.qlearning[299].toFixed(0)}.`}
        yMin={-120}
        yMax={0}
        height={260}
        format={(v) => v.toFixed(1)}
        tableRows={[0, 10, 25, 50, 100, 150, 200, 250, 299]}
      />
    </Playground>
  )
}
