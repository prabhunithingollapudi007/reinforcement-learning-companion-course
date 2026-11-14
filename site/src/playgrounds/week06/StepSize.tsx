import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { CLIFF_AT, ridgeAscent, ridgeValue } from '../../rl/ppo'
import '../shared.css'

const W = 720
const H = 250
const M = { left: 44, right: 16, top: 20, bottom: 36 }
const X_MIN = -4
const X_MAX = 6
const Y_MIN = -1.2
const Y_MAX = 1.1
const STEPS = 40

const px = (mu: number) => M.left + ((Math.min(Math.max(mu, X_MIN), X_MAX) - X_MIN) / (X_MAX - X_MIN)) * (W - M.left - M.right)
const py = (v: number) => M.top + ((Y_MAX - Math.min(Math.max(v, Y_MIN), Y_MAX)) / (Y_MAX - Y_MIN)) * (H - M.top - M.bottom)

export function StepSize() {
  const [learningRate, setLearningRate] = useState(1)
  const [limited, setLimited] = useState(false)
  const [maxKL, setMaxKL] = useState(0.5)

  const run = useMemo(() => ridgeAscent({ learningRate, maxKL: limited ? maxKL : null, steps: STEPS }), [learningRate, limited, maxKL])
  const landscape = useMemo(
    () =>
      Array.from({ length: 201 }, (_, i) => X_MIN + (i / 200) * (X_MAX - X_MIN))
        .map((mu, i) => `${i === 0 ? 'M' : 'L'}${px(mu).toFixed(1)},${py(ridgeValue(mu)).toFixed(1)}`)
        .join(' '),
    [],
  )
  const final = run.values[STEPS]
  const offChart = run.mus.some((mu) => mu < X_MIN || mu > X_MAX)

  return (
    <Playground
      title="One learning rate is too small, another falls off a cliff"
      caption={
        <>
          The curve is the performance of a policy as its one parameter changes: a long slope up to a ridge, then a
          cliff. Each dot is the policy after one gradient step, using the exact gradient, so nothing here is noise.
          Past the cliff the curve is flat, so a policy that lands there has no gradient to follow back.
        </>
      }
    >
      <div className="controls">
        <Slider label="Learning rate" value={learningRate} min={0.1} max={10} step={0.1} onChange={setLearningRate} format={(v) => v.toFixed(1)} />
        <Slider
          label="Largest change allowed per step (KL)"
          value={maxKL}
          min={0.02}
          max={0.5}
          step={0.02}
          onChange={setMaxKL}
          format={(v) => v.toFixed(2)}
          hint={limited ? undefined : 'turn on the limit below to use this'}
        />
      </div>
      <div className="toggles">
        <label className="toggle">
          <input type="checkbox" checked={limited} onChange={(e) => setLimited(e.target.checked)} />
          <span>
            <span className="toggle-label">Limit how far the policy may move per step</span>
            <span className="toggle-hint">{limited ? 'steps are cut short at the KL limit: a trust region' : 'plain gradient ascent'}</span>
          </span>
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Performance landscape with the path of ${STEPS} gradient steps. Final performance ${final.toFixed(2)}.`}>
        {[-1, 0, 1].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={py(v)} y2={py(v)} className={v === -1 ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={py(v) + 4} textAnchor="end" className="tick">
              {v}
            </text>
          </g>
        ))}
        <line x1={px(CLIFF_AT)} x2={px(CLIFF_AT)} y1={py(Y_MAX) + 14} y2={py(-1)} className="marker-line" />
        <text x={px(CLIFF_AT) + 6} y={py(Y_MAX) + 22} className="marker-label">
          cliff edge
        </text>
        <path d={landscape} className="series" style={{ stroke: 'var(--text-muted)' }} />
        {run.mus.map((mu, k) =>
          mu >= X_MIN && mu <= X_MAX ? (
            <circle key={k} cx={px(mu)} cy={py(run.values[k])} r={k === STEPS ? 7 : 4.5} className={`dot ${run.collapsed ? 'dot-2' : 'dot-1'}`} opacity={0.25 + 0.75 * (k / STEPS)} />
          ) : null,
        )}
        {[-4, -2, 0, 2, 4, 6].map((v) => (
          <text key={v} x={px(v)} y={H - 14} textAnchor="middle" className="tick">
            {v}
          </text>
        ))}
        <text x={(W + M.left) / 2} y={H - 0} textAnchor="middle" className="axis-title">
          policy parameter
        </text>
      </svg>

      <div className="stats">
        <Stat
          label={`Performance after ${STEPS} steps`}
          value={final.toFixed(2)}
          note={run.collapsed ? '✕ collapsed' : final > 0.89 ? '✓ at the top of the ridge (0.90)' : 'still climbing'}
        />
        <Stat label="Performance after 10 steps" value={run.values[10].toFixed(2)} note={offChart ? 'some steps left the chart' : undefined} />
      </div>

      <div className="chart-title">Performance after each step</div>
      <LineChart
        series={[{ name: 'performance', values: run.values, slot: run.collapsed ? 2 : 1 }]}
        xLabel="gradient steps"
        yLabel="performance"
        ariaLabel={`Performance over ${STEPS} steps, ending at ${final.toFixed(2)}.`}
        yMin={-1.2}
        yMax={1}
        height={220}
        format={(v) => v.toFixed(2)}
      />
    </Playground>
  )
}
