import { useMemo, useState } from 'react'
import { Playground, Slider, Stat } from '../components/Playground'
import { DEFAULT_GRID, DEFAULT_PARAMS, convergenceTrace } from '../rl/gridworld'

const FLOOR = 1e-6
const W = 720
const H = 330
const M = { left: 58, right: 20, top: 18, bottom: 44 }
const plotW = W - M.left - M.right
const plotH = H - M.top - M.bottom
const Y_TICKS = [0, -2, -4, -6]

const sci = (v: number) => (v <= FLOOR ? '≤ 1e-6' : v >= 0.01 ? v.toFixed(3) : v.toExponential(1))

function niceStep(max: number) {
  const raw = max / 6
  const pow = 10 ** Math.floor(Math.log10(raw))
  const m = raw / pow
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * pow
}

export function ConvergenceChart() {
  const [gamma, setGamma] = useState(0.9)
  const [slip, setSlip] = useState(0.2)
  const [hover, setHover] = useState<number | null>(null)

  const trace = useMemo(
    () => convergenceTrace(DEFAULT_GRID, { ...DEFAULT_PARAMS, gamma, slip }, FLOOR),
    [gamma, slip],
  )

  const K = Math.max(10, trace.viErrors.length - 1)
  const yMaxLog = Math.max(0, Math.ceil(Math.log10(Math.max(trace.viErrors[0], ...trace.piErrors, 1))))
  const yMinLog = Math.log10(FLOOR)
  const x = (k: number) => M.left + (k / K) * plotW
  const y = (v: number) => {
    const lv = Math.log10(Math.max(v, FLOOR))
    return M.top + ((yMaxLog - lv) / (yMaxLog - yMinLog)) * plotH
  }
  const line = (vals: number[]) => vals.map((v, k) => `${k === 0 ? 'M' : 'L'}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const step = niceStep(K)
  const xTicks = Array.from({ length: Math.floor(K / step) + 1 }, (_, i) => i * step)

  // Measured shrink factor per sweep over the tail of the run.
  const errs = trace.viErrors
  const last = errs.length - 1
  const tail = errs.length >= 3 && errs[last] > 0 ? errs[last] / errs[last - 1] : null

  const sweepsToFloor = errs.length - 1
  const tableRows = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].filter((k) => k < errs.length)
  if (tableRows[tableRows.length - 1] !== errs.length - 1) tableRows.push(errs.length - 1)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const k = Math.round(((px - M.left) / plotW) * K)
    setHover(k >= 0 && k < errs.length ? k : null)
  }

  const tipX = hover === null ? 0 : Math.min(Math.max(x(hover) + 12, M.left), W - M.right - 232)

  return (
    <Playground
      title="Watching the error contract"
      caption={
        <>
          The same gridworld as above, in its default layout. The vertical axis is logarithmic, so a straight line
          means the error is multiplied by a constant every sweep. The guarantee comes from the contraction proof;
          the measured error can only sit on or below it.
        </>
      }
    >
      <div className="controls">
        <Slider label={<>Discount γ</>} value={gamma} min={0.5} max={0.99} step={0.01} onChange={setGamma} format={(v) => v.toFixed(2)} />
        <Slider label="Slip probability" value={slip} min={0} max={0.4} step={0.05} onChange={setSlip} format={(v) => v.toFixed(2)} />
      </div>

      <ul className="legend" aria-label="Legend">
        <li>
          <span className="key key-line key-1" />
          <span>Value iteration: distance from V* after k sweeps</span>
        </li>
        <li>
          <span className="key key-line key-2" />
          <span>
            Guarantee: γ<sup>k</sup> × starting distance
          </span>
        </li>
        <li>
          <span className="key key-dot key-3" />
          <span>Policy iteration: distance after k rounds</span>
        </li>
      </ul>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label={`Error against iterations for gamma ${gamma.toFixed(2)} and slip ${slip.toFixed(2)}. Value iteration needs ${sweepsToFloor} sweeps; policy iteration needs ${trace.piErrors.length} rounds.`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {Y_TICKS.filter((t) => t <= yMaxLog).map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(10 ** t)} y2={y(10 ** t)} className={t === -6 ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={y(10 ** t) + 4} textAnchor="end" className="tick">
              {t === 0 ? '1' : `1e${t}`}
            </text>
          </g>
        ))}
        {xTicks.map((k) => (
          <text key={k} x={x(k)} y={H - M.bottom + 18} textAnchor="middle" className="tick">
            {k}
          </text>
        ))}
        <text x={M.left + plotW / 2} y={H - 6} textAnchor="middle" className="axis-title">
          iterations k (sweeps for value iteration, rounds for policy iteration)
        </text>
        <text x={14} y={M.top + plotH / 2} textAnchor="middle" className="axis-title" transform={`rotate(-90 14 ${M.top + plotH / 2})`}>
          max error (log scale)
        </text>

        {/* Sweep at which the greedy policy is already optimal */}
        <line x1={x(trace.policyOptimalAt)} x2={x(trace.policyOptimalAt)} y1={M.top} y2={M.top + plotH} className="marker-line" />
        <text
          x={x(trace.policyOptimalAt) + 6}
          y={M.top + 12}
          className="marker-label"
          textAnchor={x(trace.policyOptimalAt) > W - 260 ? 'end' : 'start'}
          dx={x(trace.policyOptimalAt) > W - 260 ? -12 : 0}
        >
          greedy policy optimal from sweep {trace.policyOptimalAt}
        </text>

        <path d={line(trace.bound.map((b) => Math.max(b, FLOOR)))} className="series series-2" />
        <path d={line(errs)} className="series series-1" />
        <path d={line(trace.piErrors)} className="series series-3" />
        {trace.piErrors.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={5} className="dot dot-3" />
        ))}

        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} className="crosshair" />
            <circle cx={x(hover)} cy={y(errs[hover])} r={5} className="dot dot-1" />
            <g transform={`translate(${tipX}, ${M.top + 26})`}>
              <rect width={232} height={hover < trace.piErrors.length ? 84 : 66} rx={6} className="tooltip-box" />
              <text x={12} y={20} className="tooltip-title">
                k = {hover}
              </text>
              <circle cx={16} cy={36} r={4} className="dot-plain key-1" />
              <text x={28} y={40} className="tooltip-text">
                value iteration {sci(errs[hover])}
              </text>
              <circle cx={16} cy={54} r={4} className="dot-plain key-2" />
              <text x={28} y={58} className="tooltip-text">
                guarantee {sci(trace.bound[hover])}
              </text>
              {hover < trace.piErrors.length && (
                <>
                  <circle cx={16} cy={72} r={4} className="dot-plain key-3" />
                  <text x={28} y={76} className="tooltip-text">
                    policy iteration {sci(trace.piErrors[hover])}
                  </text>
                </>
              )}
            </g>
          </g>
        )}
      </svg>

      <div className="stats stats-4">
        <Stat label="Sweeps until values are within 1e-6" value={sweepsToFloor} />
        <Stat label="Sweeps until the greedy policy is optimal" value={trace.policyOptimalAt} note="the policy settles long before the values do" />
        <Stat label="Policy-iteration rounds" value={trace.piErrors.length} note="few, but each one is a full policy evaluation" />
        <Stat
          label="Measured shrink per sweep"
          value={tail === null ? 'exact' : tail.toFixed(3)}
          note={tail === null ? 'no slip: the values are exact after a few sweeps' : `guaranteed to be at most γ = ${gamma.toFixed(2)}`}
        />
      </div>

      <details className="table-view">
        <summary>Show the numbers as a table</summary>
        <table>
          <thead>
            <tr>
              <th>k</th>
              <th>Value iteration error</th>
              <th>Guarantee</th>
              <th>Policy iteration error</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((k) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{sci(errs[k])}</td>
                <td>{sci(trace.bound[k])}</td>
                <td>{k < trace.piErrors.length ? sci(trace.piErrors[k]) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Playground>
  )
}
