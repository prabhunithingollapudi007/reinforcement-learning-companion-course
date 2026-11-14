import { useMemo, useState } from 'react'
import { Playground, Slider, Stat } from '../../components/Playground'
import { START, mean, sampleTargets, variance } from '../../rl/prediction'
import '../shared.css'

const W = 720
const H = 250
const M = { left: 132, right: 20, top: 20, bottom: 40 }
const plotW = W - M.left - M.right
const X_MAX = 13
const BIN = 0.5
const ROW_H = 78
const SAMPLES = 400

const x = (v: number) => M.left + (Math.min(Math.max(v, 0), X_MAX) / X_MAX) * plotW

function histogram(values: number[]): number[] {
  const bins = new Array<number>(Math.ceil(X_MAX / BIN)).fill(0)
  for (const v of values) bins[Math.min(bins.length - 1, Math.max(0, Math.floor(v / BIN)))] += 1
  return bins
}

export function TargetSpread() {
  const [error, setError] = useState(0)
  const [gamma, setGamma] = useState(1)
  const [seed, setSeed] = useState(7)

  const t = useMemo(
    () => sampleTargets({ state: START, gamma, estimateError: error, samples: SAMPLES, seed }),
    [error, gamma, seed],
  )
  const rows = [
    { name: 'Monte Carlo targets', sub: 'whole returns', values: t.mc, cls: 'bar-1' },
    { name: 'TD targets', sub: 'r + γ × estimate', values: t.td, cls: 'bar-2' },
  ].map((row) => ({ ...row, bins: histogram(row.values), mean: mean(row.values), variance: variance(row.values) }))
  const tallest = Math.max(...rows.flatMap((r) => r.bins))

  return (
    <Playground
      title="Two kinds of target for the same state"
      caption={
        <>
          {SAMPLES} learning targets for the middle state, of each kind. The green line is the state's true value;
          each triangle is the average of that row's targets. A good target is centred on the green line (low bias)
          and tightly bunched (low variance).
        </>
      }
    >
      <div className="controls">
        <Slider
          label="How wrong the current value estimates are"
          value={error}
          min={0}
          max={3}
          step={0.25}
          onChange={setError}
          format={(v) => (v === 0 ? 'exact' : `+${v.toFixed(2)}`)}
        />
        <Slider label="Discount γ" value={gamma} min={0.7} max={1} step={0.05} onChange={setGamma} format={(v) => v.toFixed(2)} />
      </div>
      <div className="button-row">
        <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
          Draw new samples
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Monte Carlo targets average ${rows[0].mean.toFixed(2)} with variance ${rows[0].variance.toFixed(2)}. TD targets average ${rows[1].mean.toFixed(2)} with variance ${rows[1].variance.toFixed(2)}. The true value is ${t.truth.toFixed(2)}.`}>
        {rows.map((row, i) => {
          const base = M.top + (i + 1) * ROW_H + i * 14
          return (
            <g key={row.name}>
              <text x={12} y={base - 30} className="strip-label">
                {row.name}
              </text>
              <text x={12} y={base - 12} className="tick">
                {row.sub}
              </text>
              <line x1={M.left} x2={W - M.right} y1={base} y2={base} className="axis-line" />
              {row.bins.map((count, b) => {
                if (!count) return null
                const h = (count / tallest) * (ROW_H - 16)
                const left = x(b * BIN) + 1
                const width = Math.max(2, x((b + 1) * BIN) - x(b * BIN) - 2)
                return <rect key={b} x={left} y={base - h} width={width} height={h} rx={2} className={row.cls} />
              })}
              <path d={`M${x(row.mean)},${base + 3} l-6,10 l12,0 Z`} className="mean-mark" />
              <text x={x(row.mean)} y={base + 26} textAnchor="middle" className="tick">
                mean {row.mean.toFixed(2)}
              </text>
            </g>
          )
        })}
        <line x1={x(t.truth)} x2={x(t.truth)} y1={M.top} y2={M.top + 2 * ROW_H + 14} className="truth-line" />
        <text x={x(t.truth) + 6} y={M.top + 10} className="marker-label">
          true value {t.truth.toFixed(2)}
        </text>
        {[0, 2, 4, 6, 8, 10, 12].map((v) => (
          <text key={v} x={x(v)} y={H - 4} textAnchor="middle" className="tick">
            {v}
          </text>
        ))}
      </svg>

      <div className="stats stats-4">
        <Stat label="Monte Carlo bias" value={(rows[0].mean - t.truth).toFixed(2)} note="sampling noise only" />
        <Stat label="Monte Carlo variance" value={rows[0].variance.toFixed(1)} />
        <Stat label="TD bias" value={(rows[1].mean - t.truth).toFixed(2)} note="follows the estimate error" />
        <Stat label="TD variance" value={rows[1].variance.toFixed(1)} />
      </div>
    </Playground>
  )
}
