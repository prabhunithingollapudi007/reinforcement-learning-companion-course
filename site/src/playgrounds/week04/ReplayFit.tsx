import { useEffect, useMemo, useRef, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { bestLineError, curve, fitLine, meanOf, type FitRun } from '../../rl/approx'
import '../shared.css'

const SWEEP = 120
const STEPS = 960
const PW = 340
const PH = 220
const M = { left: 34, right: 10, top: 26, bottom: 26 }

const px = (x: number) => M.left + x * (PW - M.left - M.right)
const py = (v: number) => M.top + (1 - Math.min(Math.max(v, -0.1), 1.1) / 1.0) * (PH - M.top - M.bottom) * 0.9 + 6

function Panel({ title, run, t, slot }: { title: string; run: FitRun; t: number; slot: 1 | 2 }) {
  const line = run.lines[t]
  const recent = run.samples.slice(Math.max(0, t - 12), t)
  const curvePath = Array.from({ length: 51 }, (_, i) => `${i === 0 ? 'M' : 'L'}${px(i / 50).toFixed(1)},${py(curve(i / 50)).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} className="chart" role="img" aria-label={`${title}: the line's error at this step is ${run.error[t].toFixed(3)}.`}>
      <text x={M.left} y={16} className="strip-label">
        {title}
      </text>
      <line x1={M.left} x2={PW - M.right} y1={py(0)} y2={py(0)} className="axis-line" />
      <path d={curvePath} className="series" style={{ stroke: 'var(--text-muted)' }} />
      <line x1={px(0)} y1={py(line.a)} x2={px(1)} y2={py(line.a + line.b)} className={`series series-${slot}`} style={{ strokeWidth: 3 }} />
      {recent.map((x, i) => (
        <circle key={i} cx={px(x)} cy={py(curve(x))} r={4} className={`dot dot-${slot}`} opacity={0.35 + (0.65 * (i + 1)) / recent.length} />
      ))}
      <text x={px(0)} y={PH - 6} className="tick">
        state 0
      </text>
      <text x={px(1)} y={PH - 6} textAnchor="end" className="tick">
        state 1
      </text>
    </svg>
  )
}

export function ReplayFit() {
  const [alpha, setAlpha] = useState(0.3)
  const [t, setT] = useState(STEPS)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | null>(null)

  const runs = useMemo(
    () => ({
      ordered: fitLine({ order: 'trajectory', alpha, steps: STEPS, sweep: SWEEP, seed: 1 }),
      replayed: fitLine({ order: 'replay', alpha, steps: STEPS, sweep: SWEEP, seed: 1 }),
    }),
    [alpha],
  )
  const best = useMemo(() => bestLineError(), [])

  useEffect(() => {
    if (!playing) return
    timer.current = window.setInterval(() => {
      setT((prev) => {
        if (prev + 4 >= STEPS) {
          setPlaying(false)
          return STEPS
        }
        return prev + 4
      })
    }, 30)
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current)
    }
  }, [playing])

  const play = () => {
    setT(0)
    setPlaying(true)
  }

  return (
    <Playground
      title="Why the order of the data matters"
      caption={
        <>
          The grey curve is the true value across a range of states. The model is a straight line, so it cannot be
          right everywhere: it has to compromise. Dots are the most recent training samples. Left, samples arrive in
          the order a trajectory visits them. Right, each sample is drawn at random from everything seen so far.
        </>
      }
    >
      <div className="controls">
        <Slider label="Learning rate α" value={alpha} min={0.05} max={0.5} step={0.05} onChange={setAlpha} format={(v) => v.toFixed(2)} />
        <Slider label="Training step" value={t} min={0} max={STEPS} step={4} onChange={(v) => { setPlaying(false); setT(v) }} />
      </div>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={play} disabled={playing}>
          {playing ? 'Playing…' : 'Play from the start'}
        </button>
      </div>
      <div className="panels-2">
        <Panel title="Samples in trajectory order" run={runs.ordered} t={t} slot={2} />
        <Panel title="Samples from a replay buffer" run={runs.replayed} t={t} slot={1} />
      </div>
      <div className="chart-title">Error of each line over the whole range</div>
      <LineChart
        series={[
          { name: 'Replay buffer', values: runs.replayed.error, slot: 1 },
          { name: 'Trajectory order', values: runs.ordered.error, slot: 2 },
        ]}
        xLabel="training steps"
        yLabel="mean squared error"
        ariaLabel={`Error over training. In trajectory order the error keeps swinging; with replay it settles near ${best.toFixed(3)}.`}
        yMin={0}
        yMax={0.3}
        height={240}
        marker={{ x: t, label: `step ${t}` }}
        format={(v) => v.toFixed(3)}
        tableRows={[0, 120, 240, 480, 720, 960]}
      />
      <div className="stats">
        <Stat label="Trajectory order, last sweep" value={meanOf(runs.ordered.error.slice(-SWEEP)).toFixed(3)} note="the line keeps swinging" />
        <Stat label="Replay buffer, last sweep" value={meanOf(runs.replayed.error.slice(-SWEEP)).toFixed(3)} />
        <Stat label="Best any line can do" value={best.toFixed(3)} />
      </div>
    </Playground>
  )
}
