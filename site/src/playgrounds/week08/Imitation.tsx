import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { GAP, LANE, compoundingMistakes, crashes, dagger, expertRun, generate, independentMistakes, makeDemos, regressionAction } from '../../rl/imitation'
import '../shared.css'

const W = 720
const H = 300
const M = { left: 60, right: 60, top: 26, bottom: 30 }
const A_MIN = -2.4
const A_MAX = 2.4

/** A generative policy turning noise into one of the demonstrated actions. */
export function NoiseToActions() {
  const [steps, setSteps] = useState(10)
  const [shareLeft, setShareLeft] = useState(0.6)
  const demos = useMemo(() => makeDemos(200, shareLeft, 1), [shareLeft])
  const flow = useMemo(() => generate(demos, 400, steps, 5), [demos, steps])
  const mean = regressionAction(demos)
  const ends = flow.paths.map((p) => p[p.length - 1])
  const crashShare = ends.filter(crashes).length / ends.length

  const px = (t: number) => M.left + t * (W - M.left - M.right)
  const py = (a: number) => M.top + ((A_MAX - Math.min(Math.max(a, A_MIN), A_MAX)) / (A_MAX - A_MIN)) * (H - M.top - M.bottom)

  return (
    <Playground
      title="Noise becomes actions"
      caption={
        <>
          An obstacle is straight ahead. Some demonstrators steered left (about −1), the rest right (about +1); the
          shaded band is the collision course nobody chose. Each blue line is one action being generated: it starts
          as random noise on the left and is carried, step by step, toward the demonstrations. The orange line is
          what squared-error regression outputs. 120 of the 400 generated actions are drawn.
        </>
      }
    >
      <div className="controls">
        <Slider label="Generation steps" value={steps} min={1} max={30} step={1} onChange={setSteps} />
        <Slider label="Demonstrators who went left" value={shareLeft} min={0.1} max={0.9} step={0.1} onChange={setShareLeft} format={(v) => `${Math.round(v * 100)}%`} />
      </div>
      <ul className="legend" aria-label="Legend">
        <li>
          <span className="key key-line key-1" />
          <span>generated actions</span>
        </li>
        <li>
          <span className="key key-line key-2" />
          <span>regression to the mean</span>
        </li>
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`With ${steps} generation steps, ${Math.round(crashShare * 100)}% of generated actions fall on the collision course. Regression outputs ${mean.toFixed(2)}, which is on it.`}>
        <rect x={M.left} y={py(GAP)} width={W - M.left - M.right} height={py(-GAP) - py(GAP)} className="horizon-band" />
        {[-2, -1, 0, 1, 2].map((a) => (
          <g key={a}>
            <line x1={M.left} x2={W - M.right} y1={py(a)} y2={py(a)} className="grid-line" />
            <text x={M.left - 8} y={py(a) + 4} textAnchor="end" className="tick">
              {a}
            </text>
          </g>
        ))}
        <text x={W - M.right + 8} y={py(-1) + 4} className="tick">
          left
        </text>
        <text x={W - M.right + 8} y={py(1) + 4} className="tick">
          right
        </text>
        <text x={W - M.right + 8} y={py(0) + 4} className="tick">
          crash
        </text>
        {flow.paths.slice(0, 120).map((path, i) => (
          <polyline
            key={i}
            points={path.map((a, k) => `${px(k / steps).toFixed(1)},${py(a).toFixed(1)}`).join(' ')}
            className="series series-1"
            style={{ strokeWidth: 1, opacity: 0.4 }}
          />
        ))}
        <line x1={px(0)} x2={px(1)} y1={py(mean)} y2={py(mean)} className="series series-2" style={{ strokeWidth: 3 }} />
        <text x={px(0)} y={H - 8} className="tick">
          noise
        </text>
        <text x={px(1)} y={H - 8} textAnchor="end" className="tick">
          action
        </text>
        <text x={14} y={M.top + (H - M.top - M.bottom) / 2} textAnchor="middle" className="axis-title" transform={`rotate(-90 14 ${M.top + (H - M.top - M.bottom) / 2})`}>
          steering
        </text>
      </svg>
      <div className="stats">
        <Stat label="Generated actions that crash" value={`${Math.round(crashShare * 100)}%`} note={`${ends.filter((a) => a < -GAP).length} left, ${ends.filter((a) => a > GAP).length} right, of ${ends.length}`} />
        <Stat label="Regression's action" value={mean.toFixed(2)} note={crashes(mean) ? 'on the collision course' : 'clear of the obstacle'} />
      </div>
    </Playground>
  )
}

const LW = 340
const LH = 220
const LM = { left: 30, right: 8, top: 24, bottom: 22 }
const HORIZON = 100

function LanePanel({ title, paths, failures, covered, slot }: { title: string; paths: number[][]; failures: number; covered: number; slot: 1 | 2 }) {
  const px = (t: number) => LM.left + (t / HORIZON) * (LW - LM.left - LM.right)
  const py = (x: number) => LM.top + ((1.25 - Math.min(Math.max(x, -1.25), 1.25)) / 2.5) * (LH - LM.top - LM.bottom)
  return (
    <svg viewBox={`0 0 ${LW} ${LH}`} className="chart" role="img" aria-label={`${title}: ${failures} of ${paths.length} runs leave the lane.`}>
      <text x={LM.left} y={15} className="strip-label">
        {title}
      </text>
      <rect x={LM.left} y={py(covered)} width={LW - LM.left - LM.right} height={py(-covered) - py(covered)} className="horizon-band" />
      {[LANE, -LANE].map((edge) => (
        <line key={edge} x1={LM.left} x2={LW - LM.right} y1={py(edge)} y2={py(edge)} className="marker-line" />
      ))}
      <text x={LM.left - 6} y={py(LANE) + 4} textAnchor="end" className="tick">
        edge
      </text>
      <text x={LM.left - 6} y={py(-LANE) + 4} textAnchor="end" className="tick">
        edge
      </text>
      {paths.slice(0, 40).map((path, i) => (
        <polyline key={i} points={path.map((x, t) => `${px(t).toFixed(1)},${py(x).toFixed(1)}`).join(' ')} className={`series series-${slot}`} style={{ strokeWidth: 1, opacity: 0.45 }} />
      ))}
      <text x={LW - LM.right} y={LH - 6} textAnchor="end" className="tick">
        time →
      </text>
    </svg>
  )
}

/** Behaviour cloning drifting out of its data, and DAgger pulling it back. */
export function LaneKeeping() {
  const [cloneError, setCloneError] = useState(0.1)
  const [round, setRound] = useState(0)
  const opts = useMemo(() => ({ wobble: 0.1, cloneError, demos: 3, horizon: HORIZON, rollouts: 200, seed: 3 }), [cloneError])
  const runs = useMemo(() => dagger(opts, 4), [opts])
  const expert = useMemo(() => expertRun(opts), [opts])
  const run = runs[round]

  return (
    <Playground
      title="Drifting out of the data"
      caption={
        <>
          Each line is one drive down a lane; up and down is the car's sideways position. The expert always steers
          back to the centre. The clone copies the expert's steering, slightly imperfectly, wherever it has data
          (the shaded band), and has no idea what to do outside it. The first 40 of 200 drives are drawn.
        </>
      }
    >
      <div className="controls">
        <Slider label="How imperfectly the clone copies" value={cloneError} min={0} max={0.2} step={0.05} onChange={setCloneError} format={(v) => (v === 0 ? 'perfect copy' : v.toFixed(2))} />
        <Slider label="Rounds of expert corrections (DAgger)" value={round} min={0} max={4} step={1} onChange={setRound} format={(v) => (v === 0 ? 'none: cloning only' : String(v))} />
      </div>
      <div className="panels-2">
        <LanePanel title="Expert" paths={expert.paths} failures={expert.failures} covered={LANE} slot={1} />
        <LanePanel title={round === 0 ? 'Clone' : `Clone after ${round} round${round === 1 ? '' : 's'}`} paths={run.paths} failures={run.failures} covered={run.covered} slot={2} />
      </div>
      <div className="stats">
        <Stat label="Expert leaves the lane" value={`${expert.failures} of 200`} />
        <Stat label="Clone leaves the lane" value={`${run.failures} of 200`} note={run.failures === 0 ? '✓ as safe as the expert' : `${Math.round(run.failures / 2)}% of drives`} />
        <Stat label="Clone has data out to" value={`${Math.round(run.covered * 100)}% of the lane`} />
      </div>
    </Playground>
  )
}

/** How mistakes add up over a long task, with and without compounding. */
export function MistakeGrowth() {
  const [eps, setEps] = useState(0.01)
  const horizons = Array.from({ length: 201 }, (_, T) => T)
  const flat = horizons.map((T) => independentMistakes(eps, T))
  const compounding = horizons.map((T) => compoundingMistakes(eps, T))

  return (
    <Playground
      title="Why long tasks are hard for a clone"
      caption={
        <>
          Expected number of mistakes in a task of length T. The lower line is ordinary supervised learning, where
          one wrong answer does not affect the next question. The upper line assumes the worst case for a policy: a
          mistake puts it somewhere it has never seen, and it keeps making mistakes from then on.
        </>
      }
    >
      <div className="controls">
        <Slider label="Chance of a mistake at each step" value={eps} min={0.002} max={0.05} step={0.002} onChange={setEps} format={(v) => `${(v * 100).toFixed(1)}%`} />
      </div>
      <LineChart
        series={[
          { name: 'Mistakes are independent: grows like T', values: flat, slot: 1 },
          { name: 'Mistakes compound: grows like T²', values: compounding, slot: 2 },
        ]}
        xLabel="length of the task T (steps)"
        yLabel="expected mistakes"
        ariaLabel={`At 100 steps: ${flat[100].toFixed(1)} independent mistakes against ${compounding[100].toFixed(1)} compounding ones.`}
        yMin={0}
        height={260}
        format={(v) => v.toFixed(1)}
        tableRows={[0, 25, 50, 100, 150, 200]}
      />
      <div className="stats">
        <Stat label="At 100 steps, independent" value={flat[100].toFixed(1)} />
        <Stat label="At 100 steps, compounding" value={compounding[100].toFixed(1)} />
      </div>
    </Playground>
  )
}
