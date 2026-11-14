// Rows of small histograms on one shared axis, for comparing how two or three
// sets of samples are spread. Each row shows its mean; an optional line marks the truth.

export interface StripRow {
  name: string
  sub?: string
  values: number[]
  slot: 1 | 2 | 3
}

interface Props {
  rows: StripRow[]
  min: number
  max: number
  bin: number
  ticks: number[]
  truth?: { value: number; label: string }
  ariaLabel: string
}

const W = 720
const M = { left: 150, right: 20, top: 22, bottom: 26 }
const ROW_H = 78
const GAP = 16

export function StripHistogram({ rows, min, max, bin, ticks, truth, ariaLabel }: Props) {
  const plotW = W - M.left - M.right
  const height = M.top + rows.length * ROW_H + (rows.length - 1) * GAP + 30 + M.bottom
  const x = (v: number) => M.left + ((Math.min(Math.max(v, min), max) - min) / (max - min)) * plotW
  const nBins = Math.ceil((max - min) / bin)
  const stats = rows.map((row) => {
    const bins = new Array<number>(nBins).fill(0)
    for (const v of row.values) bins[Math.min(nBins - 1, Math.max(0, Math.floor((v - min) / bin)))] += 1
    return { bins, mean: row.values.reduce((a, b) => a + b, 0) / row.values.length }
  })
  const tallest = Math.max(1, ...stats.flatMap((s) => s.bins))
  const bottom = M.top + rows.length * ROW_H + (rows.length - 1) * GAP

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="chart" role="img" aria-label={ariaLabel}>
      {rows.map((row, i) => {
        const base = M.top + (i + 1) * ROW_H + i * GAP
        return (
          <g key={row.name}>
            <text x={12} y={base - 30} className="strip-label">
              {row.name}
            </text>
            {row.sub && (
              <text x={12} y={base - 12} className="tick">
                {row.sub}
              </text>
            )}
            <line x1={M.left} x2={W - M.right} y1={base} y2={base} className="axis-line" />
            {stats[i].bins.map((count, b) => {
              if (!count) return null
              const h = (count / tallest) * (ROW_H - 18)
              const left = x(min + b * bin) + 1
              const width = Math.max(2, x(min + (b + 1) * bin) - x(min + b * bin) - 2)
              return <rect key={b} x={left} y={base - h} width={width} height={h} rx={2} className={`bar-${row.slot}`} />
            })}
            <path d={`M${x(stats[i].mean)},${base + 3} l-6,10 l12,0 Z`} className="mean-mark" />
            <text x={x(stats[i].mean)} y={base + 26} textAnchor="middle" className="tick">
              mean {stats[i].mean.toFixed(2)}
            </text>
          </g>
        )
      })}
      {truth && (
        <>
          <line x1={x(truth.value)} x2={x(truth.value)} y1={M.top - 6} y2={bottom} className="truth-line" />
          <text x={x(truth.value) + 6} y={M.top + 4} className="marker-label">
            {truth.label}
          </text>
        </>
      )}
      {ticks.map((v) => (
        <text key={v} x={x(v)} y={height - 4} textAnchor="middle" className="tick">
          {v}
        </text>
      ))}
    </svg>
  )
}
