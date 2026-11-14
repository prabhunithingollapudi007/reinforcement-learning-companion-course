import { useEffect, useMemo, useRef, useState } from 'react'
import { Playground, Slider, Stat } from '../components/Playground'
import {
  ACTION_NAMES,
  DEFAULT_GRID,
  DEFAULT_PARAMS,
  NO_ACTION,
  bellmanBackup,
  greedyPolicy,
  intendedPath,
  isDecisionState,
  isTerminal,
  maxNormDiff,
  qValue,
  valueIteration,
  zeros,
  type Cell,
  type GridSpec,
  type Params,
} from '../rl/gridworld'

const SIZE = 92
const NEXT_CELL: Record<Cell, Cell> = { empty: 'wall', wall: 'pit', pit: 'goal', goal: 'empty' }
const CONVERGED = 1e-4

type Mode = 'manual' | 'running' | 'solved'

interface Sim {
  V: number[]
  sweeps: number
  residual: number | null
}

const fresh = (spec: GridSpec): Sim => ({ V: zeros(spec), sweeps: 0, residual: null })

function solve(spec: GridSpec, params: Params): Sim {
  const r = valueIteration(spec, params, CONVERGED)
  return { V: r.V, sweeps: r.sweeps, residual: 0 }
}

export function GridworldPlanner() {
  const [spec, setSpec] = useState<GridSpec>(DEFAULT_GRID)
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS)
  const [mode, setMode] = useState<Mode>('manual')
  const [sim, setSim] = useState<Sim>(() => fresh(DEFAULT_GRID))
  const [focus, setFocus] = useState<number | null>(null)
  const timer = useRef<number | null>(null)
  // The running timer reads the latest values from here.
  const simRef = useRef(sim)
  useEffect(() => {
    simRef.current = sim
  }, [sim])

  const stop = () => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])

  // When the world changes: stay solved if we were solved, otherwise start over.
  const applyWorld = (nextSpec: GridSpec, nextParams: Params) => {
    stop()
    setSpec(nextSpec)
    setParams(nextParams)
    if (mode === 'solved') setSim(solve(nextSpec, nextParams))
    else {
      setMode('manual')
      setSim(fresh(nextSpec))
    }
  }

  // One backup from the latest values. Returns the size of the change.
  const step = (): number => {
    const s = simRef.current
    const next = bellmanBackup(spec, params, s.V)
    const residual = maxNormDiff(next, s.V)
    const updated = { V: next, sweeps: s.sweeps + 1, residual }
    simRef.current = updated
    setSim(updated)
    return residual
  }

  const sweepOnce = () => {
    stop()
    setMode('manual')
    step()
  }

  const run = () => {
    stop()
    setMode('running')
    timer.current = window.setInterval(() => {
      if (step() < CONVERGED) {
        stop()
        setMode('solved')
      }
    }, 130)
  }

  const reset = () => {
    stop()
    setMode('manual')
    setSim(fresh(spec))
  }

  const restoreLayout = () => {
    stop()
    setSpec(DEFAULT_GRID)
    setParams(DEFAULT_PARAMS)
    setMode('manual')
    setSim(fresh(DEFAULT_GRID))
  }

  const cycleCell = (s: number) => {
    if (s === spec.start) return
    const cells = spec.cells.slice()
    cells[s] = NEXT_CELL[cells[s]]
    applyWorld({ ...spec, cells }, params)
  }

  const policy = useMemo(() => greedyPolicy(spec, params, sim.V), [spec, params, sim.V])
  const path = useMemo(() => intendedPath(spec, policy), [spec, policy])
  // A cell where every action is worth the same has no preference yet: draw no arrow.
  const undecided = useMemo(
    () =>
      spec.cells.map((_, s) => {
        if (!isDecisionState(spec, s)) return true
        const qs = [0, 1, 2, 3].map((a) => qValue(spec, params, sim.V, s, a))
        return Math.max(...qs) - Math.min(...qs) < 1e-12
      }),
    [spec, params, sim.V],
  )
  const pathEnd = path[path.length - 1]
  const showPolicy = sim.sweeps > 0
  const scale = Math.max(1, ...sim.V.map(Math.abs))

  const routeNote = !showPolicy
    ? 'Run a sweep to see a policy.'
    : spec.cells[pathEnd] === 'goal'
      ? `Intended route from S: ${path.length - 1} moves, ending at the goal.`
      : spec.cells[pathEnd] === 'pit'
        ? `Intended route from S: ${path.length - 1} move${path.length === 2 ? '' : 's'}, straight into a pit. Ending the episode is the best option left.`
        : policy[spec.start] !== NO_ACTION && path.length === 1
          ? 'At S the agent pushes into the wall on purpose and waits for a safe sideways slip.'
          : 'The intended route from S does not reach an end state yet.'

  const focusQ =
    focus !== null && isDecisionState(spec, focus)
      ? ACTION_NAMES.map((name, a) => ({ name, q: qValue(spec, params, sim.V, focus, a) }))
      : null

  const cx = (s: number) => (s % spec.cols) * SIZE + SIZE / 2
  const cy = (s: number) => Math.floor(s / spec.cols) * SIZE + SIZE / 2

  return (
    <Playground
      title="Value iteration on a gridworld"
      caption={
        <>
          Entering the goal pays +1 and entering a pit pays −1; both end the episode. With probability{' '}
          <em>slip</em> a move goes sideways instead. Each sweep applies one Bellman backup to every cell at once,
          so after <em>k</em> sweeps a cell shows the best you can do with <em>k</em> moves left. Click any cell to
          change it: empty → wall → pit → goal.
        </>
      }
    >
      <div className="controls controls-3">
        <Slider
          label={<>Discount γ</>}
          value={params.gamma}
          min={0.5}
          max={0.99}
          step={0.01}
          onChange={(gamma) => applyWorld(spec, { ...params, gamma })}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="Slip probability"
          value={params.slip}
          min={0}
          max={0.4}
          step={0.05}
          onChange={(slip) => applyWorld(spec, { ...params, slip })}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="Reward per step"
          value={params.stepReward}
          min={-0.5}
          max={0}
          step={0.02}
          onChange={(stepReward) => applyWorld(spec, { ...params, stepReward })}
          format={(v) => (v === 0 ? '0' : v.toFixed(2))}
        />
      </div>

      <div className="button-row">
        <button type="button" className="btn" onClick={sweepOnce} disabled={mode === 'running'}>
          Sweep once
        </button>
        <button type="button" className="btn btn-primary" onClick={run} disabled={mode === 'running'}>
          {mode === 'running' ? 'Running…' : 'Run to convergence'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={reset}>
          Reset values
        </button>
        <button type="button" className="btn btn-quiet" onClick={restoreLayout}>
          Restore layout
        </button>
      </div>

      <div className="grid-wrap">
        <svg
          viewBox={`0 0 ${spec.cols * SIZE} ${spec.rows * SIZE}`}
          className="grid"
          role="group"
          aria-label="Gridworld. Each cell shows its value and the best action."
          onMouseLeave={() => setFocus(null)}
        >
          {spec.cells.map((cell, s) => {
            const v = sim.V[s]
            const strength = Math.round((Math.abs(v) / scale) * 100)
            const fill =
              cell === 'wall'
                ? 'var(--cell-wall)'
                : cell === 'goal'
                  ? 'var(--cell-pos)'
                  : cell === 'pit'
                    ? 'var(--cell-neg)'
                    : `color-mix(in oklab, ${v >= 0 ? 'var(--cell-pos)' : 'var(--cell-neg)'} ${strength}%, var(--cell-mid))`
            const label =
              cell === 'wall'
                ? 'wall'
                : cell === 'goal'
                  ? 'goal, reward +1'
                  : cell === 'pit'
                    ? 'pit, reward −1'
                    : `value ${v.toFixed(2)}${showPolicy && !undecided[s] ? `, best action ${ACTION_NAMES[policy[s]]}` : ''}`
            return (
              <g
                key={s}
                transform={`translate(${(s % spec.cols) * SIZE}, ${Math.floor(s / spec.cols) * SIZE})`}
                className={`cell ${s === spec.start ? 'is-start' : 'is-editable'} ${focus === s ? 'is-focus' : ''}`}
                tabIndex={0}
                role="button"
                aria-label={`Row ${Math.floor(s / spec.cols) + 1}, column ${(s % spec.cols) + 1}: ${label}`}
                onMouseEnter={() => setFocus(s)}
                onFocus={() => setFocus(s)}
                onClick={() => cycleCell(s)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    cycleCell(s)
                  }
                }}
              >
                <rect x={1} y={1} width={SIZE - 2} height={SIZE - 2} rx={8} fill={fill} className="cell-rect" />
                {cell === 'goal' && (
                  <text x={SIZE / 2} y={SIZE / 2 + 6} textAnchor="middle" className="cell-terminal">
                    +1 goal
                  </text>
                )}
                {cell === 'pit' && (
                  <text x={SIZE / 2} y={SIZE / 2 + 6} textAnchor="middle" className="cell-terminal">
                    −1 pit
                  </text>
                )}
                {cell === 'empty' && (
                  <text x={SIZE / 2} y={SIZE - 12} textAnchor="middle" className="cell-value">
                    {v.toFixed(2)}
                  </text>
                )}
                {s === spec.start && (
                  <text x={10} y={20} className="cell-start">
                    S
                  </text>
                )}
              </g>
            )
          })}

          {showPolicy && path.length > 1 && isTerminal(spec, pathEnd) && (
            <polyline
              points={path.map((s) => `${cx(s)},${cy(s) - 8}`).join(' ')}
              className="route"
              fill="none"
            />
          )}

          {showPolicy &&
            spec.cells.map((cell, s) =>
              cell === 'empty' && !undecided[s] ? (
                <g
                  key={`a${s}`}
                  transform={`translate(${cx(s)}, ${cy(s) - 8}) rotate(${policy[s] * 90})`}
                  className="arrow"
                >
                  <path d="M0,13 L0,-13 M-7,-5 L0,-13 L7,-5" />
                </g>
              ) : null,
            )}
        </svg>
      </div>

      <p className="readout" role="status">
        {focusQ ? (
          <>
            <strong>
              Q-values at row {Math.floor(focus! / spec.cols) + 1}, column {(focus! % spec.cols) + 1}:
            </strong>{' '}
            {focusQ.map((q, a) => (
              <span key={q.name} className={`q ${showPolicy && !undecided[focus!] && policy[focus!] === a ? 'q-best' : ''}`}>
                {q.name} {q.q.toFixed(3)}
                {showPolicy && !undecided[focus!] && policy[focus!] === a ? ' ✓' : ''}
              </span>
            ))}
          </>
        ) : (
          <>Hover or focus a cell to see the value of each action there. {routeNote}</>
        )}
      </p>
      {focusQ && <p className="readout readout-sub">{routeNote}</p>}

      <div className="stats">
        <Stat label="Sweeps" value={sim.sweeps} note={mode === 'solved' ? 'converged; sliders now re-solve instantly' : undefined} />
        <Stat
          label="Largest change in the last sweep"
          value={sim.residual === null ? '–' : sim.residual < CONVERGED ? `< ${CONVERGED}` : sim.residual.toFixed(4)}
          note="the stopping rule watches this number"
        />
        <Stat label="Value at S" value={sim.V[spec.start].toFixed(3)} />
      </div>
    </Playground>
  )
}
