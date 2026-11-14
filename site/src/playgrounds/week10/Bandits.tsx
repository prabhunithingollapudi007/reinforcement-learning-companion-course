import { useMemo, useRef, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { STRATEGY_NAMES, averageRegret, betaDensity, chooseArm, emptyStats, estimate, pull, ucbBonus, type ArmStats, type Strategy } from '../../rl/bandits'
import { mulberry32 } from '../../rl/prediction'
import '../shared.css'

const STEPS = 5000
const EVERY = 10 // plot every tenth pull

/** Average regret of four strategies on the same three-armed bandit. */
export function RegretRace() {
  const [gap, setGap] = useState(0.2)
  const [epsilon, setEpsilon] = useState(0.1)
  const means = useMemo(() => [0.7, 0.7 - gap, 0.7 - 2 * gap].map((m) => Number(m.toFixed(3))), [gap])

  const curves = useMemo(() => {
    const thin = (c: number[]) => c.filter((_, t) => t % EVERY === 0)
    return {
      greedy: thin(averageRegret('greedy', means, STEPS, 0, 50, 5)),
      epsilon: thin(averageRegret('epsilon', means, STEPS, epsilon, 50, 5)),
      ucb: thin(averageRegret('ucb', means, STEPS, 0, 50, 5)),
      thompson: thin(averageRegret('thompson', means, STEPS, 0, 50, 5)),
    }
  }, [means, epsilon])
  const end = STEPS / EVERY

  return (
    <Playground
      title="Four ways to choose, and what each one costs"
      caption={
        <>
          Three arms pay off with the probabilities shown. Regret is how much reward has been given up, in total,
          by not always pulling the best arm. Each curve is an average over 50 runs. A curve that keeps climbing in
          a straight line belongs to a strategy that never stops making the same mistake.
        </>
      }
    >
      <div className="controls">
        <Slider label="Gap between neighbouring arms" value={gap} min={0.05} max={0.3} step={0.05} onChange={setGap} format={(v) => `${v.toFixed(2)}  (arms pay ${means.map((m) => m.toFixed(2)).join(', ')})`} />
        <Slider label="ε for ε-greedy" value={epsilon} min={0.01} max={0.3} step={0.01} onChange={setEpsilon} format={(v) => v.toFixed(2)} />
      </div>
      <LineChart
        series={[
          { name: STRATEGY_NAMES.greedy, values: curves.greedy, slot: 2 },
          { name: STRATEGY_NAMES.epsilon, values: curves.epsilon, slot: 4 },
          { name: STRATEGY_NAMES.ucb, values: curves.ucb, slot: 3 },
          { name: STRATEGY_NAMES.thompson, values: curves.thompson, slot: 1 },
        ]}
        xLabel="pulls"
        yLabel="total regret"
        ariaLabel={`Total regret after ${STEPS} pulls: greedy ${curves.greedy[end].toFixed(0)}, epsilon-greedy ${curves.epsilon[end].toFixed(0)}, UCB ${curves.ucb[end].toFixed(0)}, Thompson sampling ${curves.thompson[end].toFixed(0)}.`}
        yMin={0}
        height={300}
        xFormat={(k) => String(k * EVERY)}
        format={(v) => v.toFixed(1)}
        tableRows={[0, 10, 50, 100, 200, 300, 400, 500]}
      />
      <div className="stats stats-4">
        {(['greedy', 'epsilon', 'ucb', 'thompson'] as Strategy[]).map((s) => (
          <Stat key={s} label={`${STRATEGY_NAMES[s]}, after ${STEPS} pulls`} value={curves[s][end].toFixed(0)} note={`${curves[s][100].toFixed(0)} after 1000`} />
        ))}
      </div>
    </Playground>
  )
}

const MEANS = [0.7, 0.5, 0.3]
const W = 720
const H = 250
const M = { left: 44, right: 16, top: 22, bottom: 40 }
type Mode = 'ucb' | 'thompson'

/** Step through UCB or Thompson sampling one pull at a time. */
export function ArmExplorer() {
  const [mode, setMode] = useState<Mode>('ucb')
  const [stats, setStats] = useState<ArmStats>(() => emptyStats(3))
  const [last, setLast] = useState<{ arm: number; scores: number[]; reward: number } | null>(null)
  const rng = useRef(mulberry32(4))

  const reset = (next: Mode = mode) => {
    rng.current = mulberry32(4)
    setMode(next)
    setStats(emptyStats(3))
    setLast(null)
  }
  const step = (count: number) => {
    const s: ArmStats = { pulls: stats.pulls.slice(), wins: stats.wins.slice() }
    let record = last
    for (let i = 0; i < count; i++) {
      const { arm, scores } = chooseArm(mode, s, 0, rng.current)
      const reward = pull(s, arm, MEANS, rng.current)
      record = { arm, scores, reward }
    }
    setStats(s)
    setLast(record)
  }

  const total = stats.pulls.reduce((a, b) => a + b, 0)
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom
  const band = plotW / 3
  const y = (v: number) => M.top + plotH * (1 - Math.min(Math.max(v, 0), 1.5) / 1.5)
  const densities = useMemo(() => stats.pulls.map((n, a) => betaDensity(1 + stats.wins[a], 1 + n - stats.wins[a])), [stats])
  const peak = Math.max(1, ...densities.flat())

  return (
    <Playground
      title="Watching uncertainty steer the choice"
      caption={
        mode === 'ucb' ? (
          <>
            Each bar is the average payout seen so far; the line above it reaches up to the upper confidence bound.
            UCB pulls whichever arm has the highest <em>bound</em>. An arm that has hardly been tried has a tall
            whisker and gets pulled until the whisker shrinks. The short ticks are the true payout rates, which the
            algorithm never sees.
          </>
        ) : (
          <>
            Each curve is what the algorithm currently believes about one arm's payout rate: wide when it has little
            data, narrow when it has a lot. Thompson sampling draws one value from each curve (the dots) and pulls
            the arm whose draw is highest. The short ticks are the true rates.
          </>
        )
      }
    >
      <div className="button-row">
        <button type="button" className={`btn ${mode === 'ucb' ? 'btn-primary' : ''}`} onClick={() => reset('ucb')} aria-pressed={mode === 'ucb'}>
          UCB
        </button>
        <button type="button" className={`btn ${mode === 'thompson' ? 'btn-primary' : ''}`} onClick={() => reset('thompson')} aria-pressed={mode === 'thompson'}>
          Thompson sampling
        </button>
        <span className="lab-spacer" />
        <button type="button" className="btn" onClick={() => step(1)}>
          Pull once
        </button>
        <button type="button" className="btn" onClick={() => step(20)}>
          Pull 20
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => reset()}>
          Reset
        </button>
      </div>

      {mode === 'ucb' ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`After ${total} pulls the arms have been pulled ${stats.pulls.join(', ')} times.`}>
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={v === 0 ? 'axis-line' : 'grid-line'} />
              <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="tick">
                {v}
              </text>
            </g>
          ))}
          {MEANS.map((m, a) => {
            const cx = M.left + band * a + band / 2
            const est = estimate(stats, a)
            const bound = stats.pulls[a] ? est + ucbBonus(total, stats.pulls[a]) : 1.5
            const top = y(est)
            const r = Math.min(4, (y(0) - top) / 2)
            return (
              <g key={a}>
                {est > 0 && <path d={`M${cx - 12},${y(0)} L${cx - 12},${top + r} Q${cx - 12},${top} ${cx - 12 + r},${top} L${cx + 12 - r},${top} Q${cx + 12},${top} ${cx + 12},${top + r} L${cx + 12},${y(0)} Z`} className={last?.arm === a ? 'bar-1' : 'bar-3'} />}
                <line x1={cx} x2={cx} y1={y(est)} y2={y(bound)} className="marker-line" />
                <line x1={cx - 9} x2={cx + 9} y1={y(bound)} y2={y(bound)} className="marker-line" />
                <line x1={cx - 22} x2={cx + 22} y1={y(m)} y2={y(m)} className="truth-tick" />
                <text x={cx} y={H - 20} textAnchor="middle" className="tick">
                  arm {a + 1}: pulled {stats.pulls[a]}
                </text>
                <text x={cx} y={H - 4} textAnchor="middle" className="tick">
                  {stats.pulls[a] ? `average ${est.toFixed(2)}, bound ${bound.toFixed(2)}` : 'not tried yet'}
                </text>
              </g>
            )
          })}
        </svg>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`After ${total} pulls the arms have been pulled ${stats.pulls.join(', ')} times.`}>
          <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} className="axis-line" />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <text key={v} x={M.left + v * plotW} y={H - M.bottom + 16} textAnchor="middle" className="tick">
              {v}
            </text>
          ))}
          <text x={M.left + plotW / 2} y={H - 4} textAnchor="middle" className="axis-title">
            payout rate
          </text>
          {densities.map((d, a) => (
            <g key={a}>
              <path
                d={d.map((v, i) => `${i === 0 ? 'M' : 'L'}${(M.left + (i / (d.length - 1)) * plotW).toFixed(1)},${(H - M.bottom - (v / peak) * plotH).toFixed(1)}`).join(' ')}
                className={`series series-${a + 1}`}
              />
              <line x1={M.left + MEANS[a] * plotW} x2={M.left + MEANS[a] * plotW} y1={H - M.bottom - 8} y2={H - M.bottom + 4} className="truth-tick" />
              {last && <circle cx={M.left + last.scores[a] * plotW} cy={H - M.bottom - 14 - a * 12} r={last.arm === a ? 7 : 4.5} className={`dot dot-${a + 1}`} />}
            </g>
          ))}
        </svg>
      )}
      {mode === 'thompson' && (
        <ul className="legend" aria-label="Legend">
          {MEANS.map((_, a) => (
            <li key={a}>
              <span className={`key key-line key-${a + 1}`} />
              <span>
                arm {a + 1}: pulled {stats.pulls[a]}, paid {stats.wins[a]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="trace" role="status">
        {last ? (
          <>
            Last pull: arm {last.arm + 1}, which {last.reward ? 'paid out' : 'paid nothing'}.{' '}
            {mode === 'thompson' ? `Its draw, ${last.scores[last.arm].toFixed(2)}, was the highest of the three.` : total > 3 ? 'It had the highest upper bound.' : 'Every arm is tried once first.'}
          </>
        ) : (
          'Nothing pulled yet.'
        )}
      </p>
      <div className="stats">
        <Stat label="Pulls so far" value={total} />
        <Stat label="Share spent on the best arm" value={total ? `${Math.round((stats.pulls[0] / total) * 100)}%` : '–'} note="arm 1 is the best" />
        <Stat label="Pulls of the worst arm" value={stats.pulls[2]} />
      </div>
    </Playground>
  )
}
