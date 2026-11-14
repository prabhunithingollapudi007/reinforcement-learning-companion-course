import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { EXPLORER_NAMES, epsilonEpisodesNeeded, runExplorer, summarise, type Explorer } from '../../rl/exploration'
import '../shared.css'

const KINDS: { id: Explorer; slot: 1 | 2 | 3 }[] = [
  { id: 'epsilon', slot: 2 },
  { id: 'bonus', slot: 1 },
  { id: 'posterior', slot: 3 },
]
const EPISODES = 100
const W = 720
const CELL_H = 30

/** How far three explorers get down a corridor whose reward is at the far end. */
export function LongCorridor() {
  const [n, setN] = useState(8)
  const [epsilon, setEpsilon] = useState(0.1)
  const [upTo, setUpTo] = useState(20)

  const summaries = useMemo(() => {
    const o = { n, episodes: EPISODES, epsilon, bonus: 0.5 }
    return { epsilon: summarise('epsilon', o, 20), bonus: summarise('bonus', o, 20), posterior: summarise('posterior', o, 20) }
  }, [n, epsilon])
  const visits = useMemo(() => {
    const o = { n, episodes: upTo, epsilon, bonus: 0.5, seed: 100 }
    return { epsilon: runExplorer('epsilon', o).visits, bonus: runExplorer('bonus', o).visits, posterior: runExplorer('posterior', o).visits }
  }, [n, epsilon, upTo])

  const cellW = (W - 190) / n

  return (
    <Playground
      title="A reward at the end of a long corridor"
      caption={
        <>
          The agent starts in the leftmost cell and knows nothing. "Retreat" always pays 0.05 and returns it to the
          start. "Advance" pays nothing until the far end, where it pays 1 per step. The rows show where one agent of
          each kind has been during its first episodes: darker means more visits. The chart averages 20 agents.
        </>
      }
    >
      <div className="controls controls-3">
        <Slider label="Corridor length" value={n} min={4} max={12} step={1} onChange={setN} format={(v) => `${v} cells`} />
        <Slider label="ε for ε-greedy" value={epsilon} min={0.05} max={0.5} step={0.05} onChange={setEpsilon} format={(v) => v.toFixed(2)} />
        <Slider label="Show visits during the first" value={upTo} min={1} max={EPISODES} step={1} onChange={setUpTo} format={(v) => `${v} episodes`} />
      </div>

      <svg viewBox={`0 0 ${W} ${KINDS.length * (CELL_H + 22) + 16}`} className="chart" role="img" aria-label={`Cells visited in the first ${upTo} episodes. ${KINDS.map((k) => `${EXPLORER_NAMES[k.id]} reached cell ${visits[k.id].reduce((far, v, s) => (v > 0 ? s + 1 : far), 1)} of ${n}`).join('. ')}.`}>
        {KINDS.map((k, row) => {
          const y = 8 + row * (CELL_H + 22)
          const max = Math.max(1, ...visits[k.id])
          return (
            <g key={k.id}>
              <text x={0} y={y + 20} className="strip-label">
                {k.id === 'epsilon' ? 'ε-greedy' : k.id === 'bonus' ? 'Exploration bonus' : 'Posterior sampling'}
              </text>
              {visits[k.id].map((v, s) => (
                <g key={s}>
                  <rect
                    x={180 + s * cellW + 1}
                    y={y}
                    width={cellW - 2}
                    height={CELL_H}
                    rx={5}
                    fill={v === 0 ? 'var(--cell-mid)' : `color-mix(in oklab, var(--series-${k.slot}) ${Math.round(25 + 75 * Math.sqrt(v / max))}%, var(--cell-mid))`}
                    className="cell-rect"
                  />
                  {s === n - 1 && (
                    <text x={180 + s * cellW + cellW / 2} y={y + 20} textAnchor="middle" className="cell-start">
                      +1
                    </text>
                  )}
                </g>
              ))}
              <text x={180} y={y + CELL_H + 14} className="tick">
                {v0(visits[k.id])}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="chart-title">Reward per episode, averaged over 20 agents of each kind</div>
      <LineChart
        series={KINDS.map((k) => ({ name: EXPLORER_NAMES[k.id], values: summaries[k.id].averageReturns, slot: k.slot }))}
        xLabel="episodes"
        yLabel="reward per episode"
        ariaLabel={`Reward per episode over ${EPISODES} episodes. ${KINDS.map((k) => `${EXPLORER_NAMES[k.id]} ends at ${summaries[k.id].averageReturns[EPISODES - 1].toFixed(1)}`).join('; ')}. The best possible is 5.`}
        yMin={0}
        yMax={5}
        height={250}
        marker={{ x: Math.min(upTo, EPISODES - 1), label: `episode ${upTo}` }}
        format={(v) => v.toFixed(2)}
        tableRows={[0, 5, 10, 20, 40, 60, 80, 99]}
      />
      <div className="stats">
        {KINDS.map((k) => {
          const s = summaries[k.id]
          return (
            <Stat
              key={k.id}
              label={`${EXPLORER_NAMES[k.id]}: first reached the end`}
              value={s.medianFoundAt === null ? (s.foundShare === 0 ? 'never' : `in ${Math.round(s.foundShare * 100)}% of runs`) : `episode ${s.medianFoundAt}`}
              note={s.medianFoundAt === null ? `got to cell ${Math.round(s.farthest) + 1} of ${n} on average` : 'median over 20 agents'}
            />
          )
        })}
        <Stat
          label="Episodes ε-greedy needs, roughly"
          value={formatBig(epsilonEpisodesNeeded(n, epsilon))}
          note={`(2/ε) to the power ${n - 1}: every step must be a lucky random advance`}
        />
      </div>
    </Playground>
  )
}

function v0(visits: number[]): string {
  let far = 0
  visits.forEach((v, s) => {
    if (v > 0) far = s
  })
  return `reached cell ${far + 1} of ${visits.length}`
}

function formatBig(x: number): string {
  if (x < 1e4) return Math.round(x).toLocaleString('en-US')
  const exp = Math.floor(Math.log10(x))
  return `${(x / 10 ** exp).toFixed(1)} × 10^${exp}`
}
