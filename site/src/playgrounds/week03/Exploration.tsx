import { useMemo, useState } from 'react'
import { Playground, Slider, Stat } from '../../components/Playground'
import { StripHistogram } from '../../components/StripHistogram'
import { epsilonGreedyProbabilities, maximisationBias } from '../../rl/control'
import { mean } from '../../rl/prediction'
import '../shared.css'

const W = 720
const H = 190
const M = { left: 44, right: 12, top: 26, bottom: 34 }

/** How epsilon-greedy splits probability between the greedy action and the rest. */
export function EpsilonGreedyBars() {
  const [epsilon, setEpsilon] = useState(0.2)
  const [actions, setActions] = useState(4)
  const probs = epsilonGreedyProbabilities(actions, epsilon)
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom
  const band = plotW / actions
  const barW = Math.min(24, band - 12)
  const y = (p: number) => M.top + plotH * (1 - p)

  return (
    <Playground
      title="What ε-greedy actually does"
      caption={
        <>
          With probability ε the agent picks uniformly at random, and that random pick can land on the greedy action
          too. So the greedy action gets 1 − ε + ε/|A|, and every other action gets ε/|A|. No action ever has
          probability zero, which is the point.
        </>
      }
    >
      <div className="controls">
        <Slider label="Exploration ε" value={epsilon} min={0} max={1} step={0.05} onChange={setEpsilon} format={(v) => v.toFixed(2)} />
        <Slider label="Number of actions |A|" value={actions} min={2} max={8} step={1} onChange={setActions} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Action probabilities: the greedy action has ${probs[0].toFixed(2)}, each other action ${probs[1].toFixed(3)}.`}>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={v === 0 ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="tick">
              {v}
            </text>
          </g>
        ))}
        {probs.map((p, a) => {
          const cx = M.left + band * a + band / 2
          const top = y(p)
          const r = Math.min(4, (y(0) - top) / 2)
          return (
            <g key={a}>
              <path
                d={`M${cx - barW / 2},${y(0)} L${cx - barW / 2},${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} L${cx + barW / 2 - r},${top} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} L${cx + barW / 2},${y(0)} Z`}
                className={a === 0 ? 'bar-1' : 'bar-2'}
              />
              <text x={cx} y={top - 6} textAnchor="middle" className="tick">
                {p.toFixed(2)}
              </text>
              <text x={cx} y={H - 10} textAnchor="middle" className="tick">
                {a === 0 ? 'greedy action' : `other ${a}`}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="stats">
        <Stat label="Greedy action chosen" value={`${(probs[0] * 100).toFixed(0)}%`} note="1 − ε + ε/|A|" />
        <Stat label="Each other action" value={`${(probs[1] * 100).toFixed(1)}%`} note="ε/|A|" />
      </div>
    </Playground>
  )
}

/** Why the max over noisy estimates overstates the best value. */
export function MaxBias() {
  const [actions, setActions] = useState(5)
  const [noise, setNoise] = useState(1)
  const [seed, setSeed] = useState(3)
  const samples = useMemo(() => maximisationBias({ actions, noise, trials: 1500, seed }), [actions, noise, seed])

  return (
    <Playground
      title="The best-looking action is usually the luckiest"
      caption={
        <>
          Every action here is truly worth exactly 0. Each estimate is that truth plus random noise. The top row takes
          the largest estimate, as the max in Q-learning does. The bottom row picks the best-looking action from one
          set of estimates and reads its value from a second, independent set.
        </>
      }
    >
      <div className="controls">
        <Slider label="Number of actions" value={actions} min={2} max={10} step={1} onChange={setActions} />
        <Slider label="Noise in each estimate (σ)" value={noise} min={0.2} max={2} step={0.2} onChange={setNoise} format={(v) => v.toFixed(1)} />
      </div>
      <div className="button-row">
        <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
          Draw new samples
        </button>
      </div>
      <StripHistogram
        rows={[
          { name: 'Max of the estimates', sub: 'one set of estimates', values: samples.single, slot: 1 },
          { name: 'Double estimate', sub: 'choose with one, read another', values: samples.double, slot: 2 },
        ]}
        min={-6}
        max={6}
        bin={0.4}
        ticks={[-6, -4, -2, 0, 2, 4, 6]}
        truth={{ value: 0, label: 'true value of every action: 0' }}
        ariaLabel={`The max of the estimates averages ${mean(samples.single).toFixed(2)}; the double estimate averages ${mean(samples.double).toFixed(2)}. The true value is 0.`}
      />
      <div className="stats">
        <Stat label="Bias of the max" value={`+${mean(samples.single).toFixed(2)}`} note="grows with more actions and more noise" />
        <Stat label="Bias of the double estimate" value={mean(samples.double).toFixed(2)} note="zero, up to sampling noise" />
      </div>
    </Playground>
  )
}
