import { useState, type ReactNode } from 'react'

// A small line chart for playgrounds: up to four series, hover read-out,
// legend and a table view. Colours are the validated series slots.

export interface Series {
  name: string
  values: number[] // y at x = 0, 1, 2, ...
  slot: 1 | 2 | 3 | 4
  dots?: boolean
}

interface Marker {
  x: number
  label: string
}

interface Props {
  series: Series[]
  xLabel: string
  yLabel: string
  ariaLabel: string
  log?: boolean
  /** Smallest value drawn on a log axis. */
  floor?: number
  yMax?: number
  yMin?: number
  marker?: Marker
  height?: number
  format?: (v: number) => string
  /** x positions listed in the table view. Defaults to a spread of about ten. */
  tableRows?: number[]
  legendNote?: ReactNode
  /** How to print an x position, when x is not simply a count. */
  xFormat?: (k: number) => string
}

const W = 720
const M = { left: 58, right: 20, top: 18, bottom: 44 }

function niceStep(span: number, target = 6) {
  const raw = span / target
  const pow = 10 ** Math.floor(Math.log10(raw))
  const m = raw / pow
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * pow
}

const defaultFormat = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(2) : v.toFixed(3))

export function LineChart({
  series,
  xLabel,
  yLabel,
  ariaLabel,
  log = false,
  floor = 1e-6,
  yMax,
  yMin,
  marker,
  height = 300,
  format = defaultFormat,
  tableRows,
  legendNote,
  xFormat = String,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const plotW = W - M.left - M.right
  const plotH = height - M.top - M.bottom
  const n = Math.max(2, ...series.map((s) => s.values.length))
  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v))

  const hi = yMax ?? Math.max(...all, log ? floor * 10 : 0)
  const lo = yMin ?? (log ? floor : Math.min(0, ...all))
  const top = log ? Math.ceil(Math.log10(hi)) : hi
  const bottom = log ? Math.log10(lo) : lo
  const x = (k: number) => M.left + (k / (n - 1)) * plotW
  const y = (v: number) => {
    const t = log ? Math.log10(Math.max(v, floor)) : v
    return M.top + ((top - t) / (top - bottom || 1)) * plotH
  }

  const xStep = Math.max(1, niceStep(n - 1)) // x is a count, so never tick at fractions
  const xTicks = Array.from({ length: Math.floor((n - 1) / xStep) + 1 }, (_, i) => Math.round(i * xStep))
  const yTicks: number[] = []
  if (log) for (let e = top; e >= bottom; e -= Math.max(1, Math.round((top - bottom) / 4))) yTicks.push(10 ** e)
  else {
    const step = niceStep(top - bottom, 4)
    for (let v = Math.ceil(bottom / step) * step; v <= top + 1e-9; v += step) yTicks.push(v)
  }
  const superscript = (n: number) => String(n).replace(/[-0-9]/g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)])
  const tick = (v: number) => {
    if (!log) return Number(v.toPrecision(4)).toString()
    if (v >= 1 && v < 1e5) return String(v)
    return v >= 1 ? `10${superscript(Math.round(Math.log10(v)))}` : v.toExponential(0)
  }

  const path = (values: number[]) =>
    values.map((v, k) => `${k === 0 ? 'M' : 'L'}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const rows = tableRows ?? [...new Set(Array.from({ length: 11 }, (_, i) => Math.round((i / 10) * (n - 1))))]
  const tipW = 220
  const tipH = 26 + series.length * 18
  const tipX = hover === null ? 0 : Math.min(Math.max(x(hover) + 12, M.left), W - M.right - tipW)

  return (
    <>
      {series.length > 1 && (
        <ul className="legend" aria-label="Legend">
          {series.map((s) => (
            <li key={s.name}>
              <span className={`key ${s.dots ? 'key-dot' : 'key-line'} key-${s.slot}`} />
              <span>{s.name}</span>
            </li>
          ))}
          {legendNote && <li className="dim">{legendNote}</li>}
        </ul>
      )}
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="chart"
        role="img"
        aria-label={ariaLabel}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const k = Math.round((((e.clientX - rect.left) / rect.width) * W - M.left) / (plotW / (n - 1)))
          setHover(k >= 0 && k < n ? k : null)
        }}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((v, i) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={i === (log ? yTicks.length - 1 : 0) ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="tick">
              {tick(v)}
            </text>
          </g>
        ))}
        {xTicks.map((k) => (
          <text key={k} x={x(k)} y={height - M.bottom + 18} textAnchor="middle" className="tick">
            {xFormat(k)}
          </text>
        ))}
        <text x={M.left + plotW / 2} y={height - 6} textAnchor="middle" className="axis-title">
          {xLabel}
        </text>
        <text x={14} y={M.top + plotH / 2} textAnchor="middle" className="axis-title" transform={`rotate(-90 14 ${M.top + plotH / 2})`}>
          {yLabel}
        </text>

        {marker && (
          <>
            <line x1={x(marker.x)} x2={x(marker.x)} y1={M.top} y2={M.top + plotH} className="marker-line" />
            <text
              x={x(marker.x) + (x(marker.x) > W - 260 ? -6 : 6)}
              y={M.top + 12}
              textAnchor={x(marker.x) > W - 260 ? 'end' : 'start'}
              className="marker-label"
            >
              {marker.label}
            </text>
          </>
        )}

        {series.map((s) => (
          <g key={s.name}>
            <path d={path(s.values)} className={`series series-${s.slot}`} />
            {s.dots && s.values.map((v, k) => <circle key={k} cx={x(k)} cy={y(v)} r={5} className={`dot dot-${s.slot}`} />)}
          </g>
        ))}

        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} className="crosshair" />
            {series.map((s) => hover < s.values.length && <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={5} className={`dot dot-${s.slot}`} />)}
            <g transform={`translate(${tipX}, ${M.top + 22})`}>
              <rect width={tipW} height={tipH} rx={6} className="tooltip-box" />
              <text x={12} y={18} className="tooltip-title">
                {xLabel.split(' (')[0]} {xFormat(hover)}
              </text>
              {series.map((s, i) => (
                <g key={s.name}>
                  <circle cx={16} cy={32 + i * 18} r={4} className={`dot-plain key-${s.slot}`} />
                  <text x={28} y={36 + i * 18} className="tooltip-text">
                    {s.name.split(':')[0]} {hover < s.values.length ? format(s.values[hover]) : '–'}
                  </text>
                </g>
              ))}
            </g>
          </g>
        )}
      </svg>
      <details className="table-view">
        <summary>Show the numbers as a table</summary>
        <table>
          <thead>
            <tr>
              <th>{xLabel.split(' (')[0]}</th>
              {series.map((s) => (
                <th key={s.name}>{s.name.split(':')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k}>
                <td>{xFormat(k)}</td>
                {series.map((s) => (
                  <td key={s.name}>{k < s.values.length ? format(s.values[k]) : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}
