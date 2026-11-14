import { useMemo, useRef, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { PEAK, gradientEstimate, reward, sampleBatch, type Batch } from '../../rl/policyGradient'
import { mulberry32 } from '../../rl/prediction'
import '../shared.css'

const W = 720
const H = 250
const M = { left: 20, right: 20, top: 22, bottom: 34 }
const X_MIN = -4
const X_MAX = 6
const SIGMA = 1
const START = -1

const px = (a: number) => M.left + ((Math.min(Math.max(a, X_MIN), X_MAX) - X_MIN) / (X_MAX - X_MIN)) * (W - M.left - M.right)
const py = (v: number) => M.top + (1 - v) * (H - M.top - M.bottom)
const density = (a: number, mu: number) => Math.exp(-((a - mu) ** 2) / (2 * SIGMA * SIGMA))

interface State {
  mu: number
  history: number[]
  batch: Batch | null
}
const fresh = (): State => ({ mu: START, history: [START], batch: null })

export function PolicyClimb() {
  const [learningRate, setLearningRate] = useState(0.5)
  const [batchSize, setBatchSize] = useState(20)
  const [offset, setOffset] = useState(0)
  const [useBaseline, setUseBaseline] = useState(true)
  const [state, setState] = useState<State>(fresh)
  const rng = useRef(mulberry32(2))

  const reset = () => {
    rng.current = mulberry32(2)
    setState(fresh())
  }

  const step = (count: number) => {
    let { mu, batch } = state
    const history = state.history.slice()
    for (let k = 0; k < count; k++) {
      batch = sampleBatch(mu, SIGMA, batchSize, offset, rng.current)
      const baseline = useBaseline ? batch.rewards.reduce((a, b) => a + b, 0) / batch.rewards.length : 0
      mu += learningRate * gradientEstimate(batch, mu, SIGMA, baseline)
      history.push(mu)
    }
    setState({ mu, history, batch })
  }

  const curvePath = useMemo(
    () => Array.from({ length: 101 }, (_, i) => X_MIN + (i / 100) * (X_MAX - X_MIN)).map((a, i) => `${i === 0 ? 'M' : 'L'}${px(a).toFixed(1)},${py(reward(a)).toFixed(1)}`).join(' '),
    [],
  )
  const policyPath = Array.from({ length: 101 }, (_, i) => X_MIN + (i / 100) * (X_MAX - X_MIN))
    .map((a, i) => `${i === 0 ? 'M' : 'L'}${px(a).toFixed(1)},${py(density(a, state.mu) * 0.9).toFixed(1)}`)
    .join(' ')
  const off = state.mu < X_MIN || state.mu > X_MAX

  return (
    <Playground
      title="A policy climbing a reward it cannot see"
      caption={
        <>
          The grey curve is the reward for each action. The agent never sees it. Its policy is the blue bell: it
          samples actions from it (the dots), is told the reward of each, and shifts the bell toward the actions that
          did better than average. The baseline here is the batch's average reward.
        </>
      }
    >
      <div className="controls controls-3">
        <Slider label="Learning rate" value={learningRate} min={0.1} max={1} step={0.1} onChange={(v) => { setLearningRate(v); reset() }} format={(v) => v.toFixed(1)} />
        <Slider label="Actions sampled per update" value={batchSize} min={2} max={50} step={1} onChange={(v) => { setBatchSize(v); reset() }} />
        <Slider label="Constant added to every reward" value={offset} min={0} max={10} step={1} onChange={(v) => { setOffset(v); reset() }} format={(v) => `+${v}`} />
      </div>
      <div className="toggles">
        <label className="toggle">
          <input type="checkbox" checked={useBaseline} onChange={(e) => { setUseBaseline(e.target.checked); reset() }} />
          <span>
            <span className="toggle-label">Subtract a baseline</span>
            <span className="toggle-hint">{useBaseline ? 'compare each reward with the batch average' : 'use the raw rewards'}</span>
          </span>
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={() => step(1)}>
          One update
        </button>
        <button type="button" className="btn" onClick={() => step(25)}>
          25 updates
        </button>
        <button type="button" className="btn btn-quiet" onClick={reset}>
          Reset
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`The policy is centred on action ${state.mu.toFixed(2)}. The reward peaks at action ${PEAK}.`}>
        <line x1={M.left} x2={W - M.right} y1={py(0)} y2={py(0)} className="axis-line" />
        <path d={curvePath} className="series" style={{ stroke: 'var(--text-muted)' }} />
        {!off && <path d={policyPath} className="series series-1" />}
        {state.batch?.actions.map((a, i) => (
          <circle key={i} cx={px(a)} cy={py(0) - 7} r={4.5} className="dot dot-2" opacity={0.3 + 0.7 * Math.min(1, reward(a))} />
        ))}
        <line x1={px(PEAK)} x2={px(PEAK)} y1={py(1) - 4} y2={py(0)} className="truth-line" />
        <text x={px(PEAK) + 6} y={py(1) + 2} className="marker-label">
          best action
        </text>
        {!off && (
          <text x={px(state.mu)} y={py(0.9) - 8} textAnchor="middle" className="marker-label">
            policy
          </text>
        )}
        {[-4, -2, 0, 2, 4, 6].map((v) => (
          <text key={v} x={px(v)} y={H - 12} textAnchor="middle" className="tick">
            {v}
          </text>
        ))}
        <text x={W / 2} y={H - 0} textAnchor="middle" className="axis-title">
          action
        </text>
      </svg>

      <div className="stats">
        <Stat label="Updates" value={state.history.length - 1} />
        <Stat label="Centre of the policy" value={state.mu.toFixed(2)} note={off ? 'off the chart' : `best action is ${PEAK}`} />
      </div>

      <div className="chart-title">Centre of the policy after each update</div>
      <LineChart
        series={[{ name: 'centre of the policy', values: state.history.length > 1 ? state.history : [START, START], slot: 1 }]}
        xLabel="updates"
        yLabel="policy centre"
        ariaLabel={`The policy centre over ${state.history.length - 1} updates, ending at ${state.mu.toFixed(2)}.`}
        yMin={-4}
        yMax={8}
        height={220}
        format={(v) => v.toFixed(2)}
      />
    </Playground>
  )
}
