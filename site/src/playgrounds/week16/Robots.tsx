import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import {
  REAL_FRICTIONS,
  START_SHARES,
  STRATEGIES,
  TARGET,
  averageImprovement,
  chained,
  gapCurves,
  improveExactly,
  successRate,
} from '../../rl/robots'
import '../shared.css'

const TRACK_X = 190
const TRACK_W = 510
const TRACK_MAX = 2.2
const tx = (metres: number) => TRACK_X + (Math.min(metres, TRACK_MAX) / TRACK_MAX) * TRACK_W
const cm = (metres: number) => `${Math.round(Math.abs(metres - TARGET) * 100)} cm ${metres < TARGET ? 'short' : 'long'}`

/** A policy tuned in a simulator, deployed where the friction is different. */
export function FromSimToReal() {
  const [assumed, setAssumed] = useState(0.4)
  const [spread, setSpread] = useState(0.2)
  const [realIndex, setRealIndex] = useState(REAL_FRICTIONS.indexOf(0.3))
  const [errorPct, setErrorPct] = useState(5)
  const real = REAL_FRICTIONS[realIndex]

  const g = useMemo(() => gapCurves(assumed, spread, errorPct / 100), [assumed, spread, errorPct])
  const rows = [
    { name: 'Tuned in one simulator', lands: g.nominal[realIndex], slot: 2 },
    { name: 'Tuned across a range', lands: g.robust[realIndex], slot: 3 },
    { name: 'Nudge, measure, then push', lands: g.adaptive[realIndex], slot: 1 },
  ]
  const low = Math.max(0.1, assumed - spread)

  return (
    <Playground
      title="The simulator has the friction wrong"
      caption={
        <>
          A robot gives a puck one shove so that it stops on the line, 1 m away. The whole policy is one number, the
          launch speed, chosen in simulation. The first policy was tuned for a single assumed friction. The second for
          a range of frictions at once. The third gives the puck a small test nudge, measures how far it slides, and
          sets its speed from that.
        </>
      }
    >
      <div className="controls">
        <Slider label="Friction the simulator assumes" value={assumed} min={0.3} max={0.7} step={0.05} onChange={setAssumed} format={(v) => v.toFixed(2)} />
        <Slider label="Randomisation in simulation" value={spread} min={0} max={0.3} step={0.05} onChange={setSpread} format={(v) => (v === 0 ? 'none' : `${low.toFixed(2)} to ${(assumed + v).toFixed(2)}`)} />
        <Slider label="Friction of the real floor" value={realIndex} min={0} max={REAL_FRICTIONS.length - 1} step={1} onChange={setRealIndex} format={() => real.toFixed(2)} />
        <Slider label="Error in measuring the test nudge" value={errorPct} min={0} max={20} step={1} onChange={setErrorPct} format={(v) => `${v}%`} />
      </div>

      <svg
        viewBox="0 0 720 158"
        className="chart"
        role="img"
        aria-label={`Where the puck stops on a real floor of friction ${real.toFixed(2)}. ${rows.map((r) => `${r.name}: ${r.lands.toFixed(2)} metres, ${cm(r.lands)}`).join('. ')}.`}
      >
        <line x1={tx(TARGET)} x2={tx(TARGET)} y1={8} y2={134} className="truth-line" />
        <text x={tx(TARGET)} y={152} textAnchor="middle" className="tick">
          target, 1 m
        </text>
        <text x={TRACK_X} y={152} textAnchor="middle" className="tick">
          0
        </text>
        <text x={tx(2)} y={152} textAnchor="middle" className="tick">
          2 m
        </text>
        {rows.map((r, i) => {
          const y = 30 + i * 40
          const off = r.lands > TRACK_MAX
          return (
            <g key={r.name}>
              <text x={0} y={y + 5} className="strip-label">
                {r.name}
              </text>
              <line x1={TRACK_X} x2={TRACK_X + TRACK_W} y1={y} y2={y} className="axis-line" />
              <line x1={TRACK_X} x2={tx(r.lands)} y1={y} y2={y} className={`series series-${r.slot}`} />
              <circle cx={tx(r.lands)} cy={y} r={9} className={`dot dot-${r.slot}`}>
                <title>
                  stops at {r.lands.toFixed(2)} m: {cm(r.lands)}
                </title>
              </circle>
              <text x={tx(r.lands) + (r.lands > 1.7 ? -16 : 16)} y={y - 12} textAnchor={r.lands > 1.7 ? 'end' : 'start'} className="tick">
                {off ? `off the end, at ${r.lands.toFixed(2)} m` : cm(r.lands)}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="chart-title">Where the puck stops, for every floor the robot might meet</div>
      <LineChart
        series={[
          { name: 'Tuned in one simulator', values: g.nominal.map((d) => Math.min(d, 2.5)), slot: 2 },
          { name: 'Tuned across a range', values: g.robust.map((d) => Math.min(d, 2.5)), slot: 3 },
          { name: 'Nudge, measure, then push', values: g.adaptive, slot: 1 },
        ]}
        xLabel="friction of the real floor"
        yLabel="stops at (metres)"
        ariaLabel={`Stopping distance against real friction from 0.2 to 0.8. Tuned for ${assumed.toFixed(2)}: from ${g.nominal[0].toFixed(2)} m down to ${g.nominal[g.nominal.length - 1].toFixed(2)} m. Tuned across a range: from ${g.robust[0].toFixed(2)} to ${g.robust[g.robust.length - 1].toFixed(2)} m. Nudge first: ${g.adaptive[0].toFixed(2)} m throughout. The target is 1 m.`}
        yMin={0}
        yMax={2.5}
        height={250}
        marker={{ x: realIndex, label: `real floor ${real.toFixed(2)}` }}
        format={(v) => `${v.toFixed(2)} m`}
        xFormat={(k) => REAL_FRICTIONS[k].toFixed(2)}
        tableRows={[0, 5, 10, 15, 20, 25, 30]}
        legendNote="target: 1.00 m"
      />
      <div className="stats">
        {rows.map((r) => (
          <Stat key={r.name} label={r.name} value={cm(r.lands)} note={`stops at ${r.lands.toFixed(2)} m`} />
        ))}
      </div>
    </Playground>
  )
}

const ROUNDS = 8

/** A pretrained policy improving from its own attempts, by two rules. */
export function KeepWhatWorked() {
  const [round, setRound] = useState(0)
  const [attempts, setAttempts] = useState(100)

  const exact = useMemo(() => ({ successes: improveExactly(ROUNDS, 'successes'), advantage: improveExactly(ROUNDS, 'advantage') }), [])
  const noisy = useMemo(
    () => ({ successes: averageImprovement(ROUNDS, attempts, 'successes', 200), advantage: averageImprovement(ROUNDS, attempts, 'advantage', 200) }),
    [attempts],
  )
  const a = exact.successes.shares[round]
  const b = exact.advantage.shares[round]
  const barX = 250
  const barW = 300

  return (
    <Playground
      title="From 80% to 99%: learning from its own attempts"
      caption={
        <>
          A policy pretrained by imitation knows four ways to pick up an object and does not know which is best. Each
          round it makes some attempts and is then retrained on a selection of them. Orange: retrain on every attempt
          that succeeded. Blue: estimate how good each way is, and retrain only on attempts that used a
          better-than-average way.
        </>
      }
    >
      <div className="controls">
        <Slider label="Rounds of improvement" value={round} min={0} max={ROUNDS} step={1} onChange={setRound} format={(v) => `${v}`} />
        <Slider label="Attempts per round" value={attempts} min={20} max={500} step={20} onChange={setAttempts} format={(v) => `${v}`} />
      </div>

      <svg
        viewBox={`0 0 720 ${STRATEGIES.length * 40 + 8}`}
        className="chart"
        role="img"
        aria-label={`How often each way is used after ${round} rounds. ${STRATEGIES.map((s, i) => `${s.name} (succeeds ${Math.round(s.success * 100)}%): ${Math.round(a[i] * 100)}% when imitating successes, ${Math.round(b[i] * 100)}% when imitating better-than-average attempts`).join('. ')}.`}
      >
        {STRATEGIES.map((s, i) => {
          const y = 4 + i * 40
          return (
            <g key={s.name}>
              <text x={0} y={y + 22} className="tick">
                {s.name}
              </text>
              <rect x={barX} y={y + 4} width={Math.max(1, a[i] * barW)} height={12} rx={4} className="bar-2">
                <title>imitating successes: {(a[i] * 100).toFixed(1)}%</title>
              </rect>
              <rect x={barX} y={y + 19} width={Math.max(1, b[i] * barW)} height={12} rx={4} className="bar-1">
                <title>imitating better-than-average attempts: {(b[i] * 100).toFixed(1)}%</title>
              </rect>
              <text x={720} y={y + 22} textAnchor="end" className="tick">
                succeeds {Math.round(s.success * 100)}% of the time
              </text>
            </g>
          )
        })}
      </svg>
      <ul className="swatches">
        <li>
          <i className="swatch swatch-2" /> share when imitating every success
        </li>
        <li>
          <i className="swatch swatch-1" /> share when imitating better-than-average attempts
        </li>
      </ul>

      <div className="chart-title">Success rate after each round, averaged over 200 runs</div>
      <LineChart
        series={[
          { name: 'Imitate better-than-average attempts', values: noisy.advantage, slot: 1, dots: true },
          { name: 'Imitate every success', values: noisy.successes, slot: 2, dots: true },
        ]}
        xLabel="rounds of improvement"
        yLabel="success rate"
        ariaLabel={`Success rate against rounds with ${attempts} attempts per round. Imitating better-than-average attempts: ${noisy.advantage.map((v) => v.toFixed(2)).join(', ')}. Imitating every success: ${noisy.successes.map((v) => v.toFixed(2)).join(', ')}.`}
        yMin={0.75}
        yMax={1}
        height={240}
        marker={{ x: round, label: `round ${round}` }}
        format={(v) => `${(v * 100).toFixed(1)}%`}
        tableRows={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
      />
      <div className="stats stats-4">
        <Stat label="Pretrained policy" value={`${(successRate(START_SHARES) * 100).toFixed(1)}%`} note={`a five-stage task: ${(chained(successRate(START_SHARES), 5) * 100).toFixed(0)}% end to end`} />
        <Stat label="Imitating every success" value={`${(noisy.successes[round] * 100).toFixed(1)}%`} note={`five stages: ${(chained(noisy.successes[round], 5) * 100).toFixed(0)}%`} />
        <Stat label="Imitating better-than-average" value={`${(noisy.advantage[round] * 100).toFixed(1)}%`} note={`five stages: ${(chained(noisy.advantage[round], 5) * 100).toFixed(0)}%`} />
        <Stat label="Best single way" value="99.0%" note="the ceiling for this policy" />
      </div>
    </Playground>
  )
}
