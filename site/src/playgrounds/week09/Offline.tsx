import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { StripHistogram } from '../../components/StripHistogram'
import {
  A_MAX,
  A_MIN,
  GRID,
  QUERY_COUNTS,
  TRUE_ANGLE,
  actionAt,
  agreement,
  angleError,
  averageOutcomes,
  chooseActions,
  collectComparisons,
  errorByQueries,
  expectile,
  fitCritic,
  fitReward,
  sampleQValues,
  trueValue,
} from '../../rl/offline'
import '../shared.css'

const W = 720
const H = 280
const M = { left: 44, right: 16, top: 24, bottom: 34 }
const Y_MIN = -1
const Y_MAX = 1.8

/** A critic that is right inside the data and arbitrary outside it. */
export function OptimismGap() {
  const [centre, setCentre] = useState(0.6)
  const [width, setWidth] = useState(0.6)
  const [seed, setSeed] = useState(1)

  const critic = useMemo(() => fitCritic(centre, width, seed), [centre, width, seed])
  const picks = chooseActions(critic, centre)
  const avg = useMemo(() => averageOutcomes(centre, width, 300), [centre, width])

  const px = (a: number) => M.left + ((a - A_MIN) / (A_MAX - A_MIN)) * (W - M.left - M.right)
  const py = (v: number) => M.top + ((Y_MAX - Math.min(Math.max(v, Y_MIN), Y_MAX)) / (Y_MAX - Y_MIN)) * (H - M.top - M.bottom)
  const path = (f: (i: number) => number) => Array.from({ length: GRID }, (_, i) => `${i === 0 ? 'M' : 'L'}${px(actionAt(i)).toFixed(1)},${py(f(i)).toFixed(1)}`).join(' ')
  const marks = [
    { c: picks.naive, name: 'highest anywhere', cls: 'dot-2' },
    { c: picks.inData, name: 'highest in the data', cls: 'dot-1' },
  ]

  return (
    <Playground
      title="Optimism where there is no data"
      caption={
        <>
          One state, a range of actions. The grey curve is what each action is really worth. The shaded band is where
          the dataset has actions. The orange curve is a critic trained on that data: accurate inside the band, and
          whatever an untrained network happens to output outside it.
        </>
      }
    >
      <div className="controls">
        <Slider label="Where the old policy acted" value={centre} min={-1.4} max={1.4} step={0.1} onChange={setCentre} format={(v) => v.toFixed(1)} />
        <Slider label="How varied its actions were" value={width} min={0.2} max={1.4} step={0.1} onChange={setWidth} format={(v) => `± ${v.toFixed(1)}`} />
      </div>
      <div className="button-row">
        <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
          Train another critic
        </button>
      </div>
      <ul className="legend" aria-label="Legend">
        <li>
          <span className="key key-line key-2" />
          <span>the critic's estimate</span>
        </li>
        <li>
          <span className="key key-line" style={{ background: 'var(--text-muted)' }} />
          <span>true value</span>
        </li>
      </ul>
      <svg viewBox={`0 0 ${W} ${H + 6}`} className="chart" role="img" aria-label={`The critic's highest-rated action is ${picks.naive.action.toFixed(2)}: it expects ${picks.naive.believed.toFixed(2)} and would get ${picks.naive.actual.toFixed(2)}. The best action within the data is ${picks.inData.action.toFixed(2)}, worth ${picks.inData.actual.toFixed(2)}.`}>
        <rect x={px(Math.max(A_MIN, centre - width))} y={M.top} width={px(Math.min(A_MAX, centre + width)) - px(Math.max(A_MIN, centre - width))} height={H - M.top - M.bottom} className="horizon-band" />
        {[-1, 0, 1].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={py(v)} y2={py(v)} className={v === 0 ? 'axis-line' : 'grid-line'} />
            <text x={M.left - 8} y={py(v) + 4} textAnchor="end" className="tick">
              {v}
            </text>
          </g>
        ))}
        <path d={path((i) => trueValue(actionAt(i)))} className="series" style={{ stroke: 'var(--text-muted)' }} />
        <path d={path((i) => critic.estimate[i])} className="series series-2" />
        {marks.map((m) => (
          <g key={m.name}>
            <line x1={px(m.c.action)} x2={px(m.c.action)} y1={py(m.c.believed)} y2={py(m.c.actual)} className="marker-line" />
            <circle cx={px(m.c.action)} cy={py(m.c.believed)} r={6} className={`dot ${m.cls}`} />
            <text x={px(m.c.action)} y={py(m.c.believed) - 12} textAnchor={m.c.action > 1.2 ? 'end' : m.c.action < -1.2 ? 'start' : 'middle'} className="marker-label">
              {m.name}
            </text>
          </g>
        ))}
        {[-2, -1, 0, 1, 2].map((v) => (
          <text key={v} x={px(v)} y={H - 14} textAnchor="middle" className="tick">
            {v}
          </text>
        ))}
        <text x={(W + M.left) / 2} y={H - 0} textAnchor="middle" className="axis-title">
          action
        </text>
      </svg>
      <div className="cards">
        <div className="card">
          <div className="card-title">Act on the critic anywhere</div>
          <div className="card-value">{avg.naive.toFixed(2)}</div>
          <div className="card-note">
            What it really gets, averaged over 300 critics. It expected {avg.naiveBelieved.toFixed(2)}. In {Math.round(avg.naiveOutside * 100)}% of them the chosen action is outside the data.
          </div>
        </div>
        <div className="card">
          <div className="card-title">Best action within the data</div>
          <div className="card-value">{avg.inData.toFixed(2)}</div>
          <div className="card-note">Uses the reward to pick out the best of what the old policy did. Its expectations are accurate.</div>
        </div>
        <div className="card">
          <div className="card-title">Imitate the old policy</div>
          <div className="card-value">{avg.imitation.toFixed(2)}</div>
          <div className="card-note">Copies the old policy's typical action. It cannot do better than its teacher.</div>
        </div>
      </div>
    </Playground>
  )
}

/** The mean of the in-data Q-values against a higher expectile of them. */
export function ExpectileDial() {
  const [tau, setTau] = useState(0.9)
  const q = useMemo(() => sampleQValues(200, 2), [])
  const value = expectile(q, tau)
  const average = expectile(q, 0.5)

  return (
    <Playground
      title="The value of the better actions in the data"
      caption={
        <>
          Q-values of the 200 actions an old policy took in one state: mostly mediocre, a few good. An ordinary
          squared-error fit of V lands on their average, the value of the old policy. An asymmetric loss that
          penalises underestimates more than overestimates lands higher, toward the best actions that are actually
          in the data.
        </>
      }
    >
      <div className="controls">
        <Slider label="Expectile τ" value={tau} min={0.5} max={0.99} step={0.01} onChange={setTau} format={(v) => v.toFixed(2)} hint={tau === 0.5 ? 'ordinary squared error: the mean' : undefined} />
      </div>
      <StripHistogram
        rows={[{ name: 'Q-values in the data', sub: 'one state, 200 actions', values: q, slot: 1 }]}
        min={0}
        max={1.05}
        bin={0.025}
        ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        truth={{ value, label: `fitted V = ${value.toFixed(2)}` }}
        ariaLabel={`The mean of the Q-values is ${average.toFixed(2)}. The expectile at tau ${tau.toFixed(2)} is ${value.toFixed(2)}. The largest value in the data is ${Math.max(...q).toFixed(2)}.`}
      />
      <div className="stats">
        <Stat label="Value of the old policy (mean)" value={average.toFixed(2)} />
        <Stat label={`Fitted V at τ = ${tau.toFixed(2)}`} value={value.toFixed(2)} />
        <Stat label="Best action in the data" value={Math.max(...q).toFixed(2)} note="never exceeded: no action outside the data is consulted" />
      </div>
    </Playground>
  )
}

const PW = 300

/** Recovering a hidden reward from pairwise choices. */
export function PreferenceLearner() {
  const [queries, setQueries] = useState(50)
  const [noise, setNoise] = useState(0.3)
  const [seed, setSeed] = useState(1)

  const weights = useMemo(() => fitReward(collectComparisons(queries, noise, seed)), [queries, noise, seed])
  const curve = useMemo(() => errorByQueries(noise, 30), [noise])
  const err = angleError(weights)
  const agree = agreement(weights)
  const learned = Math.atan2(weights[1], weights[0])
  const truth = (TRUE_ANGLE * Math.PI) / 180
  const c = PW / 2
  const R = 110
  const tip = (angle: number) => `${(c + R * Math.cos(angle)).toFixed(1)},${(c - R * Math.sin(angle)).toFixed(1)}`

  return (
    <Playground
      title="Learning a reward from comparisons"
      caption={
        <>
          Each trajectory is summarised by two numbers. A person secretly values them in some proportion: the grey
          arrow. We never see that arrow. We only show the person pairs of trajectories and record which they prefer.
          The blue arrow is the reward recovered from those choices.
        </>
      }
    >
      <div className="controls">
        <Slider label="Comparisons collected" value={queries} min={5} max={500} step={5} onChange={setQueries} />
        <Slider label="How inconsistent the person is" value={noise} min={0.05} max={1} step={0.05} onChange={setNoise} format={(v) => v.toFixed(2)} />
      </div>
      <div className="button-row">
        <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
          Ask a different set of questions
        </button>
      </div>
      <div className="panels-2">
        <svg viewBox={`0 0 ${PW} ${PW}`} className="chart" role="img" aria-label={`The learned reward direction is ${err.toFixed(1)} degrees from the true one.`}>
          <circle cx={c} cy={c} r={R} fill="none" className="grid-line" />
          <line x1={c - R} y1={c} x2={c + R} y2={c} className="grid-line" />
          <line x1={c} y1={c - R} x2={c} y2={c + R} className="grid-line" />
          <line x1={c} y1={c} x2={tip(truth).split(',')[0]} y2={tip(truth).split(',')[1]} className="series" style={{ stroke: 'var(--text-muted)', strokeWidth: 4 }} />
          <line x1={c} y1={c} x2={tip(learned).split(',')[0]} y2={tip(learned).split(',')[1]} className="series series-1" style={{ strokeWidth: 3 }} />
          <circle cx={tip(learned).split(',')[0]} cy={tip(learned).split(',')[1]} r={6} className="dot dot-1" />
          <text x={c + R - 4} y={c + 18} textAnchor="end" className="tick">
            feature 1
          </text>
          <text x={c + 8} y={c - R + 4} className="tick">
            feature 2
          </text>
        </svg>
        <div>
          <ul className="legend" aria-label="Legend">
            <li>
              <span className="key key-line" style={{ background: 'var(--text-muted)' }} />
              <span>the person's true reward</span>
            </li>
            <li>
              <span className="key key-line key-1" />
              <span>learned reward</span>
            </li>
          </ul>
          <div className="stats">
            <Stat label="Direction error" value={`${err.toFixed(1)}°`} />
            <Stat label="Agrees with the person on new pairs" value={`${(agree * 100).toFixed(1)}%`} />
          </div>
        </div>
      </div>
      <div className="chart-title">Direction error against comparisons collected, averaged over 30 sets of questions</div>
      <LineChart
        series={[{ name: 'direction error', values: curve, slot: 1, dots: true }]}
        xLabel="comparisons"
        yLabel="error (degrees)"
        ariaLabel={`Average direction error falls from ${curve[0].toFixed(0)} degrees with 5 comparisons to ${curve[6].toFixed(1)} with 500.`}
        yMin={0}
        height={230}
        xFormat={(k) => String(QUERY_COUNTS[k] ?? '')}
        format={(v) => `${v.toFixed(1)}°`}
        tableRows={[0, 1, 2, 3, 4, 5, 6]}
      />
    </Playground>
  )
}
