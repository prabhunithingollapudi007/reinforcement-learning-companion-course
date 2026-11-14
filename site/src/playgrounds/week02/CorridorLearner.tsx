import { useMemo, useRef, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import {
  N_STATES,
  learningCurves,
  mcUpdate,
  mulberry32,
  rmsError,
  sampleEpisode,
  tdUpdate,
  trueValues,
  type Episode,
} from '../../rl/prediction'
import '../shared.css'

const W = 720
const H = 250
const M = { left: 44, right: 12, top: 16, bottom: 40 }
const plotW = W - M.left - M.right
const plotH = H - M.top - M.bottom
const band = plotW / N_STATES
const BAR = 22
const Y_MAX = 10
const SUB = '₁₂₃₄₅₆₇'

const zeros = () => new Array<number>(N_STATES).fill(0)
const y = (v: number) => M.top + plotH * (1 - Math.min(Math.max(v, 0), Y_MAX) / Y_MAX)
const cx = (s: number) => M.left + band * s + band / 2

function bar(x: number, v: number) {
  const top = y(v)
  const base = y(0)
  const r = Math.min(4, (base - top) / 2)
  return `M${x},${base} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + BAR - r},${top} Q${x + BAR},${top} ${x + BAR},${top + r} L${x + BAR},${base} Z`
}

export function CorridorLearner() {
  const [alpha, setAlpha] = useState(0.1)
  const [gamma, setGamma] = useState(1)
  const [sim, setSim] = useState({ mc: zeros(), td: zeros(), episodes: 0, last: null as Episode | null })
  const [hover, setHover] = useState<number | null>(null)
  const rng = useRef(mulberry32(11))

  const truth = useMemo(() => trueValues(gamma), [gamma])
  const curves = useMemo(() => learningCurves({ episodes: 100, runs: 200, alpha, gamma, seed: 3 }), [alpha, gamma])

  const reset = () => {
    rng.current = mulberry32(11)
    setSim({ mc: zeros(), td: zeros(), episodes: 0, last: null })
  }

  const run = (count: number) => {
    let { mc, td, last } = sim
    for (let i = 0; i < count; i++) {
      last = sampleEpisode(rng.current)
      mc = mcUpdate(mc, last, gamma, alpha)
      td = tdUpdate(td, last, gamma, alpha)
    }
    setSim({ mc, td, episodes: sim.episodes + count, last })
  }

  const visited = new Set(sim.last?.map((step) => step.state) ?? [])
  const lastReward = sim.last ? sim.last[sim.last.length - 1].reward : null

  return (
    <Playground
      title="Monte Carlo and TD learning the same corridor"
      caption={
        <>
          A rover starts in the middle and moves left or right by coin flip. Leaving at the left end pays +1, at the
          right end +10. Both methods see exactly the same episodes. The dark ticks are the true values, which
          neither method is told.
        </>
      }
    >
      <div className="controls">
        <Slider label="Learning rate α" value={alpha} min={0.02} max={0.5} step={0.02} onChange={(v) => { setAlpha(v); reset() }} format={(v) => v.toFixed(2)} />
        <Slider label="Discount γ" value={gamma} min={0.5} max={1} step={0.05} onChange={(v) => { setGamma(v); reset() }} format={(v) => v.toFixed(2)} />
      </div>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={() => run(1)}>
          Run 1 episode
        </button>
        <button type="button" className="btn" onClick={() => run(20)}>
          Run 20
        </button>
        <button type="button" className="btn btn-quiet" onClick={reset}>
          Reset
        </button>
      </div>

      <ul className="swatches" aria-label="Legend">
        <li>
          <span className="swatch swatch-1" />
          Monte Carlo estimate
        </li>
        <li>
          <span className="swatch swatch-2" />
          TD(0) estimate
        </li>
        <li>
          <span className="swatch swatch-truth" />
          true value
        </li>
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Value estimates for the seven states after ${sim.episodes} episodes`} onMouseLeave={() => setHover(null)}>
        {[...Array(N_STATES).keys()].map((s) => visited.has(s) && <rect key={s} x={M.left + band * s + 4} y={M.top} width={band - 8} height={plotH} rx={6} className="col-band" />)}
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={v === 0 ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="tick">
              {v}
            </text>
          </g>
        ))}
        {[...Array(N_STATES).keys()].map((s) => (
          <g key={s} onMouseEnter={() => setHover(s)}>
            <path d={bar(cx(s) - BAR - 1, sim.mc[s])} className="bar-1" />
            <path d={bar(cx(s) + 1, sim.td[s])} className="bar-2" />
            <line x1={cx(s) - BAR - 5} x2={cx(s) + BAR + 5} y1={y(truth[s])} y2={y(truth[s])} className="truth-tick" />
            <text x={cx(s)} y={H - M.bottom + 22} textAnchor="middle" className="col-label">
              s{SUB[s]}
            </text>
            <rect x={M.left + band * s} y={M.top} width={band} height={plotH + 30} fill="transparent" />
          </g>
        ))}
        {hover !== null && (
          <g transform={`translate(${Math.min(Math.max(cx(hover) - 85, M.left), W - M.right - 170)}, ${M.top + 2})`}>
            <rect width={170} height={74} rx={6} className="tooltip-box" />
            <text x={12} y={18} className="tooltip-title">
              state s{SUB[hover]}
            </text>
            <text x={12} y={36} className="tooltip-text">
              Monte Carlo {sim.mc[hover].toFixed(2)}
            </text>
            <text x={12} y={52} className="tooltip-text">
              TD(0) {sim.td[hover].toFixed(2)}
            </text>
            <text x={12} y={68} className="tooltip-text">
              true value {truth[hover].toFixed(2)}
            </text>
          </g>
        )}
      </svg>

      <p className="trace" role="status">
        {sim.last ? (
          <>
            Last episode: <span className="mono">{sim.last.map((step) => `s${SUB[step.state]}`).join(' → ')}</span>, then out
            with reward +{lastReward}. The shaded columns are the states it visited.
          </>
        ) : (
          'No episodes yet. Both estimates start at zero.'
        )}
      </p>

      <div className="stats">
        <Stat label="Episodes" value={sim.episodes} />
        <Stat label="Monte Carlo error (RMS)" value={rmsError(sim.mc, truth).toFixed(2)} />
        <Stat label="TD(0) error (RMS)" value={rmsError(sim.td, truth).toFixed(2)} />
      </div>

      <div className="chart-title">The same race, averaged over 200 fresh runs at these settings</div>
      <LineChart
        series={[
          { name: 'Monte Carlo', values: curves.mc, slot: 1 },
          { name: 'TD(0)', values: curves.td, slot: 2 },
        ]}
        xLabel="episodes"
        yLabel="RMS error"
        ariaLabel={`Average error against episodes. After 100 episodes Monte Carlo is at ${curves.mc[100].toFixed(2)} and TD at ${curves.td[100].toFixed(2)}.`}
        yMin={0}
        height={260}
        tableRows={[0, 5, 10, 20, 30, 50, 75, 100]}
      />
    </Playground>
  )
}
