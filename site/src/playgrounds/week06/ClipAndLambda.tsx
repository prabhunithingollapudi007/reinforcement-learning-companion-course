import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { clipIsActive, clipObjective, kStepWeights, lambdaSweep } from '../../rl/ppo'
import '../shared.css'

const PW = 340
const PH = 230
const M = { left: 34, right: 12, top: 30, bottom: 30 }
const R_MAX = 2

function ClipPanel({ advantage, epsilon, ratio }: { advantage: number; epsilon: number; ratio: number }) {
  const yLo = advantage > 0 ? 0 : -R_MAX
  const yHi = advantage > 0 ? R_MAX : 0
  const px = (r: number) => M.left + (r / R_MAX) * (PW - M.left - M.right)
  const py = (v: number) => M.top + ((yHi - v) / (yHi - yLo)) * (PH - M.top - M.bottom)
  const pts = Array.from({ length: 81 }, (_, i) => (i / 80) * R_MAX)
  const clipped = pts.map((r, i) => `${i === 0 ? 'M' : 'L'}${px(r).toFixed(1)},${py(clipObjective(r, advantage, epsilon)).toFixed(1)}`).join(' ')
  const here = clipObjective(ratio, advantage, epsilon)
  const flat = clipIsActive(ratio, advantage, epsilon)
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} className="chart" role="img" aria-label={`Clipped objective when the advantage is ${advantage > 0 ? 'positive' : 'negative'}. At ratio ${ratio.toFixed(2)} the objective is ${here.toFixed(2)}${flat ? ' and flat' : ''}.`}>
      <text x={M.left} y={18} className="strip-label">
        {advantage > 0 ? 'Action was better than expected (A > 0)' : 'Action was worse than expected (A < 0)'}
      </text>
      <rect x={px(1 - epsilon)} y={M.top} width={px(1 + epsilon) - px(1 - epsilon)} height={PH - M.top - M.bottom} className="horizon-band" />
      <line x1={M.left} x2={PW - M.right} y1={py(0)} y2={py(0)} className="axis-line" />
      <line x1={px(0)} y1={py(0)} x2={px(R_MAX)} y2={py(R_MAX * advantage)} className="series series-2" style={{ strokeWidth: 1.5 }} />
      <path d={clipped} className="series series-1" style={{ strokeWidth: 3 }} />
      <line x1={px(ratio)} x2={px(ratio)} y1={M.top} y2={PH - M.bottom} className="crosshair" />
      <circle cx={px(ratio)} cy={py(here)} r={6} className="dot dot-1" />
      <text x={px(ratio) + (ratio > 1.4 ? -10 : 10)} y={py(here) + (advantage > 0 ? -10 : 18)} textAnchor={ratio > 1.4 ? 'end' : 'start'} className="marker-label">
        {flat ? 'flat: no push' : 'sloped: pushes'}
      </text>
      {[0, 1, 2].map((r) => (
        <text key={r} x={px(r)} y={PH - 10} textAnchor="middle" className="tick">
          {r}
        </text>
      ))}
      <text x={PW - M.right} y={PH - 10} textAnchor="end" className="axis-title">
        ratio r
      </text>
    </svg>
  )
}

/** The clipped surrogate objective, for both signs of the advantage. */
export function ClipExplorer() {
  const [epsilon, setEpsilon] = useState(0.2)
  const [ratio, setRatio] = useState(1.5)

  return (
    <Playground
      title="What the clip does"
      caption={
        <>
          The horizontal axis is the ratio r = new probability of the action ÷ old probability. The thin orange line
          is the unclipped objective, r × A. The thick blue line is what PPO maximises. The shaded band is 1 ± ε.
          Where the blue line is flat, changing the policy further earns nothing.
        </>
      }
    >
      <div className="controls">
        <Slider label="Clip range ε" value={epsilon} min={0.05} max={0.5} step={0.05} onChange={setEpsilon} format={(v) => v.toFixed(2)} />
        <Slider label="Probability ratio r" value={ratio} min={0} max={2} step={0.05} onChange={setRatio} format={(v) => v.toFixed(2)} />
      </div>
      <ul className="legend" aria-label="Legend">
        <li>
          <span className="key key-line key-1" />
          <span>clipped objective (PPO)</span>
        </li>
        <li>
          <span className="key key-line key-2" />
          <span>unclipped objective r × A</span>
        </li>
      </ul>
      <div className="panels-2">
        <ClipPanel advantage={1} epsilon={epsilon} ratio={ratio} />
        <ClipPanel advantage={-1} epsilon={epsilon} ratio={ratio} />
      </div>
      <div className="stats">
        <Stat label="If A = +1" value={clipObjective(ratio, 1, epsilon).toFixed(2)} note={clipIsActive(ratio, 1, epsilon) ? 'clipped: already made much more likely' : 'not clipped'} />
        <Stat label="If A = −1" value={clipObjective(ratio, -1, epsilon).toFixed(2)} note={clipIsActive(ratio, -1, epsilon) ? 'clipped: already made much less likely' : 'not clipped'} />
      </div>
    </Playground>
  )
}

const BW = 720
const BH = 170

/** How lambda trades bias against variance in the advantage estimate. */
export function LambdaDial() {
  const [lambda, setLambda] = useState(0.8)
  const [valueError, setValueError] = useState(-0.6)

  const sweep = useMemo(() => lambdaSweep({ valueError, gamma: 1, samples: 3000, seed: 5 }), [valueError])
  const index = Math.round(lambda * 20)
  const best = sweep.rmse.indexOf(Math.min(...sweep.rmse))
  const weights = kStepWeights(lambda, 12)
  const band = (BW - 60) / 12

  return (
    <Playground
      title="The λ dial"
      caption={
        <>
          Advantage estimates for the middle state of Week 2's corridor, from 3000 episodes, using a critic whose
          values are wrong by the amount you choose. λ = 0 trusts the critic after one step; λ = 1 ignores it and
          uses the whole return. Total error combines bias and spread.
        </>
      }
    >
      <div className="controls">
        <Slider label="λ" value={lambda} min={0} max={1} step={0.05} onChange={setLambda} format={(v) => v.toFixed(2)} />
        <Slider
          label="How wrong the critic is"
          value={valueError}
          min={-0.8}
          max={0.8}
          step={0.1}
          onChange={setValueError}
          format={(v) => (Math.abs(v) < 1e-9 ? 'exact' : `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`)}
        />
      </div>

      <LineChart
        series={[
          { name: 'spread (standard deviation)', values: sweep.spread, slot: 1 },
          { name: 'bias (size)', values: sweep.bias.map(Math.abs), slot: 2 },
          { name: 'total error', values: sweep.rmse, slot: 3 },
        ]}
        xLabel="λ"
        yLabel="error in the advantage"
        ariaLabel={`Against lambda: spread rises from ${sweep.spread[0].toFixed(1)} to ${sweep.spread[20].toFixed(1)}; bias falls from ${Math.abs(sweep.bias[0]).toFixed(1)} to ${Math.abs(sweep.bias[20]).toFixed(1)}. Total error is lowest at lambda ${sweep.lambdas[best].toFixed(2)}.`}
        yMin={0}
        yMax={6}
        height={270}
        marker={{ x: index, label: `λ = ${lambda.toFixed(2)}` }}
        xFormat={(k) => (k / 20).toFixed(k % 2 === 0 ? 1 : 2)}
        format={(v) => v.toFixed(2)}
        tableRows={[0, 4, 8, 12, 16, 18, 19, 20]}
      />

      <div className="chart-title">Weight this λ puts on the 1-step, 2-step, … estimators</div>
      <svg viewBox={`0 0 ${BW} ${BH}`} className="chart" role="img" aria-label={`Weights on the k-step estimators: ${weights.slice(0, 4).map((w) => w.toFixed(2)).join(', ')} and so on.`}>
        <line x1={40} x2={BW - 20} y1={BH - 34} y2={BH - 34} className="axis-line" />
        {weights.map((w, i) => {
          const cx = 40 + band * i + band / 2
          const h = (w / Math.max(...weights)) * (BH - 70)
          const top = BH - 34 - h
          const r = Math.min(4, h / 2)
          return (
            <g key={i}>
              {h > 0.5 && <path d={`M${cx - 11},${BH - 34} L${cx - 11},${top + r} Q${cx - 11},${top} ${cx - 11 + r},${top} L${cx + 11 - r},${top} Q${cx + 11},${top} ${cx + 11},${top + r} L${cx + 11},${BH - 34} Z`} className="bar-1" />}
              <text x={cx} y={top - 6} textAnchor="middle" className="tick">
                {w >= 0.005 ? w.toFixed(2) : ''}
              </text>
              <text x={cx} y={BH - 14} textAnchor="middle" className="tick">
                {i === 11 ? (lambda >= 1 ? 'all' : '12') : i + 1}
              </text>
            </g>
          )
        })}
        <text x={BW / 2} y={BH - 0} textAnchor="middle" className="axis-title">
          real rewards used before trusting the critic
        </text>
      </svg>

      <div className="stats stats-4">
        <Stat label="Spread at this λ" value={sweep.spread[index].toFixed(2)} />
        <Stat label="Bias at this λ" value={sweep.bias[index].toFixed(2)} />
        <Stat label="Total error at this λ" value={sweep.rmse[index].toFixed(2)} />
        <Stat label="Best λ for this critic" value={sweep.lambdas[best].toFixed(2)} note={`total error ${sweep.rmse[best].toFixed(2)}`} />
      </div>
    </Playground>
  )
}
