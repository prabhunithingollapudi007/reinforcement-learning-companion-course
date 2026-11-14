import { useMemo, useRef, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { CELLS, START_CELL, bufferStudy, learnEpisode, learningCurve, newAgent, type Agent } from '../../rl/actorCritic'
import { mulberry32 } from '../../rl/prediction'
import { smooth } from '../../rl/control'
import '../shared.css'

const W = 720
const H = 230
const M = { left: 44, right: 12, top: 18, bottom: 38 }
const plotW = W - M.left - M.right
const plotH = H - M.top - M.bottom
const band = plotW / CELLS
const BAR = 22
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const y = (v: number) => M.top + plotH * (1 - Math.min(Math.max(v, 0), 1))

function bar(x: number, v: number) {
  const top = y(v)
  const base = y(0)
  const r = Math.min(4, (base - top) / 2)
  return `M${x},${base} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + BAR - r},${top} Q${x + BAR},${top} ${x + BAR},${top + r} L${x + BAR},${base} Z`
}

/** An actor and a critic learning the same corridor, with a noisy prize at the right end. */
export function ActorCriticCorridor() {
  const [rewardNoise, setRewardNoise] = useState(2)
  const [actorRate, setActorRate] = useState(0.2)
  const [episodes, setEpisodes] = useState(0)
  const agent = useRef<Agent>(newAgent())
  const rng = useRef(mulberry32(7))
  const [snapshot, setSnapshot] = useState<Agent>(newAgent())

  const reset = () => {
    agent.current = newAgent()
    rng.current = mulberry32(7)
    setSnapshot(newAgent())
    setEpisodes(0)
  }
  const train = (count: number) => {
    for (let e = 0; e < count; e++) learnEpisode(agent.current, { mode: 'actor-critic', actorRate, criticRate: 0.2, rewardNoise }, rng.current)
    setSnapshot({ theta: agent.current.theta.slice(), V: agent.current.V.slice() })
    setEpisodes((n) => n + count)
  }

  const curves = useMemo(() => {
    const base = { actorRate, criticRate: 0.2, rewardNoise }
    return {
      ac: smooth(learningCurve({ ...base, mode: 'actor-critic' }, 300, 200, 7), 10),
      rf: smooth(learningCurve({ ...base, mode: 'reinforce' }, 300, 200, 7), 10),
    }
  }, [actorRate, rewardNoise])

  return (
    <Playground
      title="An actor and a critic learning together"
      caption={
        <>
          Seven cells; the agent starts in the middle. Leaving on the left pays nothing. Leaving on the right pays 1
          on average, but each payout is that plus random noise. Blue bars are the actor: the chance of moving right
          in each cell. Orange bars are the critic: its estimate of each cell's value.
        </>
      }
    >
      <div className="controls">
        <Slider label="Noise in the payout" value={rewardNoise} min={0} max={3} step={0.5} onChange={(v) => { setRewardNoise(v); reset() }} format={(v) => (v === 0 ? 'none' : `± ${v.toFixed(1)}`)} />
        <Slider label="Actor learning rate" value={actorRate} min={0.05} max={0.5} step={0.05} onChange={(v) => { setActorRate(v); reset() }} format={(v) => v.toFixed(2)} />
      </div>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={() => train(50)}>
          Train 50 episodes
        </button>
        <button type="button" className="btn" onClick={() => train(1)}>
          Train 1
        </button>
        <button type="button" className="btn btn-quiet" onClick={reset}>
          Reset
        </button>
      </div>
      <ul className="swatches" aria-label="Legend">
        <li>
          <span className="swatch swatch-1" />
          actor: chance of moving right
        </li>
        <li>
          <span className="swatch swatch-2" />
          critic: estimated value
        </li>
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`After ${episodes} episodes the actor moves right from the start cell with probability ${sigmoid(snapshot.theta[START_CELL]).toFixed(2)}.`}>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={v === 0 ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="tick">
              {v}
            </text>
          </g>
        ))}
        {Array.from({ length: CELLS }, (_, s) => {
          const cx = M.left + band * s + band / 2
          return (
            <g key={s}>
              <path d={bar(cx - BAR - 1, sigmoid(snapshot.theta[s]))} className="bar-1" />
              <path d={bar(cx + 1, snapshot.V[s])} className="bar-2" />
              <text x={cx} y={H - 16} textAnchor="middle" className="tick">
                {s === 0 ? 'left exit side' : s === CELLS - 1 ? 'right exit side' : s === START_CELL ? 'start' : `cell ${s + 1}`}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="stats">
        <Stat label="Episodes" value={episodes} />
        <Stat label="Chance of heading right from the start" value={sigmoid(snapshot.theta[START_CELL]).toFixed(2)} />
        <Stat label="Critic's value of the start" value={snapshot.V[START_CELL].toFixed(2)} />
      </div>

      <div className="chart-title">Share of episodes that reach the prize, averaged over 200 fresh runs at these settings</div>
      <LineChart
        series={[
          { name: 'Actor-critic: judged by the critic after every step', values: curves.ac, slot: 1 },
          { name: 'Plain policy gradient: judged by the sampled return', values: curves.rf, slot: 2 },
        ]}
        xLabel="episodes"
        yLabel="reach the prize"
        ariaLabel={`Share of episodes reaching the prize. After 300 episodes: actor-critic ${curves.ac[299].toFixed(2)}, plain policy gradient ${curves.rf[299].toFixed(2)}.`}
        yMin={0}
        yMax={1}
        height={250}
        format={(v) => v.toFixed(2)}
        tableRows={[0, 25, 50, 100, 150, 200, 250, 299]}
      />
    </Playground>
  )
}

/** Why averaging a replay buffer evaluates the wrong policy, and how Q avoids it. */
export function BufferValues() {
  const [oldP, setOldP] = useState(0.2)
  const [newP, setNewP] = useState(0.9)
  const s = useMemo(() => bufferStudy({ oldP, newP, payA: 0.2, payB: 1, noise: 0.3, size: 500, seed: 3 }), [oldP, newP])
  const q = (v: number | null) => (v === null ? 'no data' : v.toFixed(2))

  return (
    <Playground
      title="Whose value is in the buffer?"
      caption={
        <>
          One state, two actions: A pays about 0.2 and B pays about 1.0. A replay buffer holds 500 transitions
          collected by an old policy. The task is to estimate the value of the current policy, which behaves
          differently, without collecting anything new.
        </>
      }
    >
      <div className="controls">
        <Slider label="Old policy chose B" value={oldP} min={0} max={1} step={0.05} onChange={setOldP} format={(v) => `${Math.round(v * 100)}% of the time`} />
        <Slider label="Current policy chooses B" value={newP} min={0} max={1} step={0.05} onChange={setNewP} format={(v) => `${Math.round(v * 100)}% of the time`} />
      </div>
      <div className="chips">
        <span className="chip">buffer: {s.counts[0]} × action A</span>
        <span className="chip">{s.counts[1]} × action B</span>
        <span className="chip chip-accent">Q(A) ≈ {q(s.qEstimates[0])}</span>
        <span className="chip chip-accent">Q(B) ≈ {q(s.qEstimates[1])}</span>
      </div>
      <div className="cards">
        <div className="card">
          <div className="card-title">True value of the current policy</div>
          <div className="card-value">{s.truth.toFixed(2)}</div>
          <div className="card-note">What we are trying to estimate.</div>
        </div>
        <div className="card">
          <div className="card-title">Fit V to the buffer</div>
          <div className="card-value">{s.vFromBuffer.toFixed(2)}</div>
          <div className="card-note">The average reward in the buffer. This is the value of the old policy, whatever the current one does.</div>
        </div>
        <div className="card">
          <div className="card-title">Fit Q, then ask the current policy</div>
          <div className="card-value">{s.vFromQ === null ? 'cannot say' : s.vFromQ.toFixed(2)}</div>
          <div className="card-note">
            {s.vFromQ === null
              ? 'The current policy takes an action the buffer never contains, so there is nothing to learn its value from.'
              : 'Average Q over the actions the current policy would take. Who collected the data no longer matters.'}
          </div>
        </div>
      </div>
    </Playground>
  )
}
