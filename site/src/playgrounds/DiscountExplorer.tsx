import { useState } from 'react'
import { Playground, Slider, Stat } from '../components/Playground'

const SMALL = { reward: 1, delay: 2 }
const LARGE_REWARD = 10
const STEPS = 30

const W = 680
const H = 210
const M = { left: 44, right: 12, top: 34, bottom: 34 }
const plotW = W - M.left - M.right
const plotH = H - M.top - M.bottom
const band = plotW / (STEPS + 1)
const barW = Math.min(14, band - 4)

const x = (t: number) => M.left + band * t + band / 2
const y = (v: number) => M.top + plotH * (1 - v)

function bar(t: number, v: number) {
  const top = y(v)
  const base = y(0)
  const r = Math.min(4, (base - top) / 2)
  const l = x(t) - barW / 2
  const rt = x(t) + barW / 2
  return `M${l},${base} L${l},${top + r} Q${l},${top} ${l + r},${top} L${rt - r},${top} Q${rt},${top} ${rt},${top + r} L${rt},${base} Z`
}

export function DiscountExplorer() {
  const [gamma, setGamma] = useState(0.9)
  const [delay, setDelay] = useState(12)
  const [hover, setHover] = useState<number | null>(null)

  const worthSmall = SMALL.reward * gamma ** SMALL.delay
  const worthLarge = LARGE_REWARD * gamma ** delay
  const prefersLarge = worthLarge > worthSmall
  const breakEven = (SMALL.reward / LARGE_REWARD) ** (1 / (delay - SMALL.delay))
  const horizon = 1 / (1 - gamma)
  const scale = Math.max(worthSmall, worthLarge)

  return (
    <Playground
      title="Discounting: a small reward soon, or a large one later?"
      caption={
        <>
          Each bar is the weight <span className="mono">γ^t</span> the agent puts on a reward that arrives{' '}
          <em>t</em> steps from now, and the shaded band is the effective horizon 1/(1−γ). The two markers are the
          two offers. Nothing about the world changes when you move γ; only what the agent counts as "better" does.
        </>
      }
    >
      <div className="controls">
        <Slider
          label={<>Discount factor γ</>}
          value={gamma}
          min={0.5}
          max={0.99}
          step={0.01}
          onChange={setGamma}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="Steps until the large reward"
          value={delay}
          min={3}
          max={STEPS}
          step={1}
          onChange={setDelay}
        />
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label={`Discount weights for gamma ${gamma.toFixed(2)}, over ${STEPS} steps`}
        onMouseLeave={() => setHover(null)}
      >
        {/* Effective horizon: how far ahead rewards still count for much */}
        <rect
          x={M.left}
          y={M.top}
          width={Math.min(plotW, band * (Math.min(horizon, STEPS) + 0.5))}
          height={plotH}
          className="horizon-band"
        />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={v === 0 ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="tick">
              {v}
            </text>
          </g>
        ))}
        {Array.from({ length: STEPS + 1 }, (_, t) => (
          <g key={t}>
            <path d={bar(t, gamma ** t)} className={`bar ${hover === t ? 'is-hover' : ''}`} />
            <rect
              x={x(t) - band / 2}
              y={M.top}
              width={band}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(t)}
            />
            {t % 5 === 0 && (
              <text x={x(t)} y={H - M.bottom + 16} textAnchor="middle" className="tick">
                {t}
              </text>
            )}
          </g>
        ))}
        <text x={M.left + plotW / 2} y={H - 2} textAnchor="middle" className="axis-title">
          steps from now (t)
        </text>

        {/* The two offers */}
        {[
          { t: SMALL.delay, label: `+${SMALL.reward}` },
          { t: delay, label: `+${LARGE_REWARD}` },
        ].map((o) => (
          <g key={o.label}>
            <line x1={x(o.t)} x2={x(o.t)} y1={M.top - 6} y2={y(gamma ** o.t) - 3} className="marker-line" />
            <text x={x(o.t)} y={M.top - 12} textAnchor="middle" className="marker-label">
              {o.label}
            </text>
          </g>
        ))}

        {hover !== null && (
          <g transform={`translate(${Math.min(Math.max(x(hover), M.left + 74), W - M.right - 74)}, ${M.top + 4})`}>
            <rect x={-74} y={0} width={148} height={40} rx={6} className="tooltip-box" />
            <text x={0} y={16} textAnchor="middle" className="tooltip-title">
              {hover} step{hover === 1 ? '' : 's'} away
            </text>
            <text x={0} y={32} textAnchor="middle" className="tooltip-text">
              weight γ^{hover} = {(gamma ** hover).toFixed(3)}
            </text>
          </g>
        )}
      </svg>

      <div className="offers">
        {[
          {
            name: `Small and soon: +${SMALL.reward} after ${SMALL.delay} steps`,
            worth: worthSmall,
            formula: `${gamma.toFixed(2)}^${SMALL.delay} × ${SMALL.reward}`,
            preferred: !prefersLarge,
          },
          {
            name: `Large and late: +${LARGE_REWARD} after ${delay} steps`,
            worth: worthLarge,
            formula: `${gamma.toFixed(2)}^${delay} × ${LARGE_REWARD}`,
            preferred: prefersLarge,
          },
        ].map((o) => (
          <div className="offer" key={o.name}>
            <div className="offer-name">
              {o.name}
              {o.preferred && <span className="badge">✓ preferred</span>}
            </div>
            <div className="offer-track">
              <div className="offer-fill" style={{ width: `${Math.max(1, (o.worth / scale) * 100)}%` }} />
            </div>
            <div className="offer-value">
              worth <strong>{o.worth.toFixed(3)}</strong> today <span className="mono dim">= {o.formula}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="stats">
        <Stat
          label="Break-even γ"
          value={breakEven.toFixed(3)}
          note={gamma > breakEven ? 'γ is above it: the agent waits' : 'γ is below it: the agent grabs the small reward'}
        />
        <Stat label="Effective horizon 1/(1−γ)" value={`${horizon.toFixed(1)} steps`} note="rewards much further out barely count" />
      </div>
    </Playground>
  )
}
