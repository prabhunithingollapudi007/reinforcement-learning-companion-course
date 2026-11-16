import { useDeferredValue, useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import {
  BUDGETS,
  DEPTH,
  accuracyByBudget,
  bestValue,
  ensembleErrorAfter,
  ensembleErrors,
  ensembleSpreadAfter,
  errorAfter,
  flatSearch,
  leafValue,
  modelRollout,
  realTrajectory,
  shortRollouts,
  uct,
  type Point,
} from '../../rl/planning'
import '../shared.css'

const W = 720
const LETTERS = ['A', 'B', 'C']
const SIM_STEPS = [1, 2, 3, 4, 5, 10, 20, 50, 100, 200, 500, 1000]
const LEVEL_Y = [26, 84, 140, 192, 238]

/** Every node of the tree, as the list of choices that leads to it. */
const ALL_PATHS: number[][] = (() => {
  const out: number[][] = [[]]
  for (let i = 0; i < out.length; i++) {
    if (out[i].length < DEPTH) for (let a = 0; a < 3; a++) out.push([...out[i], a])
  }
  return out
})()

function nodeX(path: number[]): number {
  let start = 0
  path.forEach((a, d) => {
    start += a * 3 ** (DEPTH - 1 - d)
  })
  const span = 3 ** (DEPTH - path.length)
  return 24 + (start + (span - 1) / 2) * (672 / 80)
}

const pathName = (path: number[]) => (path.length ? path.map((a) => LETTERS[a]).join(' → ') : 'now')

/** Monte Carlo tree search growing a lopsided tree toward the good outcomes. */
export function TreeSearch() {
  const [simIndex, setSimIndex] = useState(10)
  const [c, setC] = useState(0.5)
  const [seed, setSeed] = useState(1001)
  const sims = SIM_STEPS[simIndex]
  const slowC = useDeferredValue(c)

  const search = useMemo(() => uct(sims, c, seed), [sims, c, seed])
  const flat = useMemo(() => flatSearch(sims, seed), [sims, seed])
  const accuracy = useMemo(() => accuracyByBudget(slowC, 100), [slowC])

  const visitsOf = (path: number[]) => search.tree.get(path.join(''))?.visits ?? 0
  const built = search.tree.size - 1

  return (
    <Playground
      title="Tree search: spend the simulations where they matter"
      caption={
        <>
          Four choices in a row, three options each, 81 outcomes. The bars along the bottom are the true payoff of each
          outcome, which the search cannot see: it can only try a line of play and get a noisy result. Blue circles
          are the nodes the search has built, larger the more often it went through them. Hover a node for its count
          and average.
        </>
      }
    >
      <div className="controls controls-3">
        <Slider label="Simulations" value={simIndex} min={0} max={SIM_STEPS.length - 1} step={1} onChange={setSimIndex} format={() => `${sims}`} />
        <Slider label="Exploration constant c" value={c} min={0.1} max={2} step={0.1} onChange={setC} format={(v) => v.toFixed(1)} />
        <div className="button-row">
          <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
            Run again with new luck
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} 300`}
        className="chart"
        role="img"
        aria-label={`The search tree after ${sims} simulations. Visits under the three first choices: A ${search.rootVisits[0]}, B ${search.rootVisits[1]}, C ${search.rootVisits[2]}. ${built} of 120 nodes built.`}
      >
        {ALL_PATHS.filter((p) => p.length > 0).map((p) => {
          const v = visitsOf(p)
          const parent = p.slice(0, -1)
          return (
            <line
              key={`e${p.join('')}`}
              x1={nodeX(parent)}
              y1={LEVEL_Y[parent.length]}
              x2={nodeX(p)}
              y2={LEVEL_Y[p.length]}
              className={v > 0 ? 'series series-1' : 'grid-line'}
              style={v > 0 ? { strokeWidth: 1 + 6 * (v / sims), opacity: 0.85 } : undefined}
            />
          )
        })}
        {ALL_PATHS.map((p) => {
          const node = search.tree.get(p.join(''))
          const v = node?.visits ?? 0
          const r = v > 0 ? 3 + 9 * Math.sqrt(v / sims) : 2
          return (
            <circle key={`n${p.join('')}`} cx={nodeX(p)} cy={LEVEL_Y[p.length]} r={p.length === 0 ? 9 : r} className={v > 0 ? 'dot dot-1' : 'tree-empty'}>
              <title>{`${pathName(p)}: ${v > 0 ? `${v} visits, average result ${(node!.total / v).toFixed(2)}` : 'not built yet'}`}</title>
            </circle>
          )
        })}
        {LETTERS.map((letter, a) => (
          <text key={letter} x={nodeX([a]) + 18} y={LEVEL_Y[1] - 12} className="strip-label">
            {letter}
          </text>
        ))}
        <text x={nodeX([]) + 16} y={LEVEL_Y[0] + 5} className="tick">
          now
        </text>
        {ALL_PATHS.filter((p) => p.length === DEPTH).map((p) => {
          const value = leafValue(p)
          return (
            <rect key={`l${p.join('')}`} x={nodeX(p) - 3} y={292 - value * 38} width={6} height={value * 38} rx={2} className={value >= 0.8 ? 'bar-3' : 'tree-payoff'}>
              <title>{`${pathName(p)}: true payoff ${value.toFixed(2)}`}</title>
            </rect>
          )
        })}
        <text x={0} y={262} className="tick">
          true payoff
        </text>
      </svg>
      <ul className="swatches">
        <li>
          <i className="swatch swatch-1" /> built by the search
        </li>
        <li>
          <i className="swatch swatch-3" /> the few excellent outcomes, all under A
        </li>
      </ul>

      <div className="stats stats-4">
        <Stat
          label="Tree search chooses"
          value={LETTERS[search.choice]}
          note={`visits A ${search.rootVisits[0]}, B ${search.rootVisits[1]}, C ${search.rootVisits[2]}`}
        />
        <Stat label="Flat Monte Carlo chooses" value={LETTERS[flat.choice]} note={`estimates ${flat.rootValues.map((v, a) => `${LETTERS[a]} ${v.toFixed(2)}`).join(', ')}`} />
        <Stat label="Nodes built" value={`${built} of 120`} note="the rest were never worth a look" />
        <Stat label="True worth of A, B, C" value={[0, 1, 2].map((a) => bestValue(a).toFixed(1)).join(', ')} note="with good later choices: A is best, if followed up correctly" />
      </div>

      <div className="chart-title">How often each method picks A, over 100 runs</div>
      <LineChart
        series={[
          { name: 'Tree search (UCT)', values: accuracy.uct, slot: 1, dots: true },
          { name: 'Flat Monte Carlo', values: accuracy.flat, slot: 2, dots: true },
        ]}
        xLabel="simulations"
        yLabel="share choosing A"
        ariaLabel={`Share of 100 runs in which each method picks A, for budgets from 10 to 1000 simulations. Tree search rises from ${accuracy.uct[0].toFixed(2)} to ${accuracy.uct[BUDGETS.length - 1].toFixed(2)}. Flat Monte Carlo falls from ${accuracy.flat[0].toFixed(2)} to ${accuracy.flat[BUDGETS.length - 1].toFixed(2)}.`}
        yMin={0}
        yMax={1}
        height={240}
        format={(v) => `${Math.round(v * 100)}%`}
        xFormat={(k) => `${BUDGETS[k]}`}
        tableRows={BUDGETS.map((_, i) => i)}
      />
    </Playground>
  )
}

const TOTAL = 60
const TX0 = 70
const TX1 = 700
const AMP = 50
const PANELS = [
  { name: 'Position', index: 0 as const, mid: 78 },
  { name: 'Velocity', index: 1 as const, mid: 208 },
]
const tx = (t: number) => TX0 + (t / TOTAL) * (TX1 - TX0)
/** The second coordinate is drawn with its sign flipped, so that it reads as the velocity of the first. */
const shown = (p: Point, index: 0 | 1) => (index === 0 ? p[0] : -p[1])
/** One coordinate of a path against time, as SVG points. */
const series = (points: Point[], index: 0 | 1, from: number, mid: number) =>
  points.map((p, i) => `${tx(from + i).toFixed(1)},${(mid - AMP * shown(p, index)).toFixed(1)}`).join(' ')

/** A learned model drifting away from the real system, and two ways to live with it. */
export function ModelDrift() {
  const [errorPct, setErrorPct] = useState(5)
  const [k, setK] = useState(5)
  const error = errorPct / 100

  const real = useMemo(() => realTrajectory(TOTAL), [])
  const long = useMemo(() => modelRollout([1, 0], TOTAL, error), [error])
  const short = useMemo(() => shortRollouts(TOTAL, k, error), [k, error])
  const curves = useMemo(() => {
    const members = ensembleErrors(error)
    const steps = Array.from({ length: TOTAL + 1 }, (_, t) => t)
    return {
      single: steps.map((t) => errorAfter(t, error)),
      mean: steps.map((t) => ensembleErrorAfter(t, members)),
      spread: steps.map((t) => ensembleSpreadAfter(t, members)),
    }
  }, [error])

  return (
    <Playground
      title="A model that is slightly wrong"
      caption={
        <>
          A weight on a spring, swinging and slowly settling. The learned model has one number wrong: how fast it
          swings. The orange line is one long imagined rollout from the start. The blue pieces are short imagined
          rollouts, each restarted from a state the real system actually reached. Errors are distances in position
          and velocity together.
        </>
      }
    >
      <div className="controls">
        <Slider label="Error in the model" value={errorPct} min={0} max={10} step={1} onChange={setErrorPct} format={(v) => `${v}%`} />
        <Slider label="Length of the short rollouts" value={k} min={1} max={30} step={1} onChange={setK} format={(v) => `${v} steps`} />
      </div>

      <svg
        viewBox={`0 0 ${W} 300`}
        className="chart"
        role="img"
        aria-label={`Position and velocity of the real system over ${TOTAL} steps, with one long model rollout that ends ${errorAfter(TOTAL, error).toFixed(2)} away from it, and short rollouts of ${k} steps that end at most ${errorAfter(k, error).toFixed(3)} away.`}
      >
        {PANELS.map((panel) => (
          <g key={panel.name}>
            <line x1={TX0} x2={TX1} y1={panel.mid} y2={panel.mid} className="axis-line" />
            <line x1={TX0} x2={TX1} y1={panel.mid - AMP} y2={panel.mid - AMP} className="grid-line" />
            <line x1={TX0} x2={TX1} y1={panel.mid + AMP} y2={panel.mid + AMP} className="grid-line" />
            <text x={TX0 - 8} y={panel.mid - AMP + 4} textAnchor="end" className="tick">
              1
            </text>
            <text x={TX0 - 8} y={panel.mid + 4} textAnchor="end" className="tick">
              0
            </text>
            <text x={TX0 - 8} y={panel.mid + AMP + 4} textAnchor="end" className="tick">
              −1
            </text>
            <text x={0} y={panel.mid - AMP - 8} className="strip-label">
              {panel.name}
            </text>
            <polyline points={series(long, panel.index, 0, panel.mid)} className="series series-2" fill="none" />
            {short.map((segment, i) => (
              <polyline key={i} points={series(segment, panel.index, i * k, panel.mid)} className="series series-1" fill="none" />
            ))}
            <polyline points={series(real, panel.index, 0, panel.mid)} className="trace-real" />
            {short.map((segment, i) => (
              <circle key={`s${i}`} cx={tx(i * k)} cy={panel.mid - AMP * shown(segment[0], panel.index)} r={3} className="dot dot-1">
                <title>{`a short rollout starts here, from the real state at step ${i * k}`}</title>
              </circle>
            ))}
          </g>
        ))}
        {[0, 10, 20, 30, 40, 50, 60].map((t) => (
          <text key={t} x={tx(t)} y={282} textAnchor="middle" className="tick">
            {t}
          </text>
        ))}
        <text x={(TX0 + TX1) / 2} y={298} textAnchor="middle" className="axis-title">
          steps
        </text>
      </svg>
      <ul className="swatches">
        <li>
          <i className="swatch swatch-truth" /> the real system (dotted)
        </li>
        <li>
          <i className="swatch swatch-2" /> one long model rollout
        </li>
        <li>
          <i className="swatch swatch-1" /> short model rollouts from real states
        </li>
      </ul>

      <div className="chart-title">Prediction error against rollout length, and what five models can tell you</div>
      <LineChart
        series={[
          { name: 'Error of one model', values: curves.single, slot: 2 },
          { name: 'Disagreement among five models', values: curves.spread, slot: 3 },
          { name: 'Error of their average', values: curves.mean, slot: 1 },
        ]}
        xLabel="steps rolled out in the model"
        yLabel="distance from the truth"
        ariaLabel={`Error against rollout length. After 25 steps one model is off by ${curves.single[25].toFixed(3)}, five models disagree by ${curves.spread[25].toFixed(3)}, and their average is off by ${curves.mean[25].toFixed(3)}.`}
        yMin={0}
        height={250}
        marker={{ x: k, label: `${k} steps` }}
        format={(v) => v.toFixed(3)}
        tableRows={[0, 1, 5, 10, 25, 50, 60]}
      />
      <div className="stats stats-4">
        <Stat label="Error after 1 step" value={errorAfter(1, error).toFixed(4)} note="what the model was trained to make small" />
        <Stat label={`Error after ${k} steps`} value={errorAfter(k, error).toFixed(3)} note={error > 0 ? `${(errorAfter(k, error) / errorAfter(1, error)).toFixed(1)} times the one-step error` : 'a perfect model does not drift'} />
        <Stat label={`Long rollout, after ${TOTAL} steps`} value={errorAfter(TOTAL, error).toFixed(2)} note="the swing starts with size 1" />
        <Stat label="Five models disagree by" value={ensembleSpreadAfter(k, ensembleErrors(error)).toFixed(3)} note={`after ${k} steps; measurable without knowing the truth`} />
      </div>
    </Playground>
  )
}
