import { useMemo, useState } from 'react'
import { Playground, Slider, Stat } from '../../components/Playground'
import { StripHistogram } from '../../components/StripHistogram'
import { corridorSteps, estimateSpread } from '../../rl/policyGradient'
import { mean, variance } from '../../rl/prediction'
import '../shared.css'

/** The same gradient estimated many times, with and without a baseline. */
export function BaselineSpread() {
  const [offset, setOffset] = useState(2)
  const [batchSize, setBatchSize] = useState(10)
  const [seed, setSeed] = useState(4)
  const s = useMemo(() => estimateSpread({ mu: 0, sigma: 1, batchSize, offset, trials: 1500, seed }), [offset, batchSize, seed])
  const sdPlain = Math.sqrt(variance(s.plain))
  const sdBase = Math.sqrt(variance(s.withBaseline))

  return (
    <Playground
      title="What a baseline does to the gradient estimate"
      caption={
        <>
          Each bar counts gradient estimates from separate batches at one fixed policy. The green line is the true
          gradient. Both rows are centred on it: subtracting a baseline does not change what the estimate is aiming
          at, only how widely it scatters. The baseline here is the policy's expected reward.
        </>
      }
    >
      <div className="controls">
        <Slider label="Constant added to every reward" value={offset} min={0} max={5} step={0.5} onChange={setOffset} format={(v) => `+${v.toFixed(1)}`} />
        <Slider label="Actions sampled per estimate" value={batchSize} min={2} max={50} step={1} onChange={setBatchSize} />
      </div>
      <div className="button-row">
        <button type="button" className="btn" onClick={() => setSeed((v) => v + 1)}>
          Draw new samples
        </button>
      </div>
      <StripHistogram
        rows={[
          { name: 'No baseline', sub: 'reward × score', values: s.plain, slot: 2 },
          { name: 'With a baseline', sub: '(reward − b) × score', values: s.withBaseline, slot: 1 },
        ]}
        min={-3}
        max={3.5}
        bin={0.1}
        ticks={[-3, -2, -1, 0, 1, 2, 3]}
        truth={{ value: s.truth, label: `true gradient ${s.truth.toFixed(2)}` }}
        ariaLabel={`Without a baseline the estimates have standard deviation ${sdPlain.toFixed(2)}; with one, ${sdBase.toFixed(2)}. Both average close to the true gradient ${s.truth.toFixed(2)}.`}
      />
      <div className="stats stats-4">
        <Stat label="Spread without a baseline" value={sdPlain.toFixed(2)} note={`mean ${mean(s.plain).toFixed(2)}`} />
        <Stat label="Spread with a baseline" value={sdBase.toFixed(2)} note={`mean ${mean(s.withBaseline).toFixed(2)}`} />
        <Stat label="Noise reduced by" value={`${(sdPlain / sdBase).toFixed(1)}×`} note="ratio of the two spreads" />
      </div>
    </Playground>
  )
}

const CELL = 96

/** A world where the best policy has to be random. */
export function AliasedCorridor() {
  const [pEast, setPEast] = useState(0.5)
  const steps = corridorSteps(pEast)
  const labels = ['corner', 'grey', 'above goal', 'grey', 'corner']

  return (
    <Playground
      title="When the best policy is a coin flip"
      caption={
        <>
          The goal is below the middle cell. The two grey cells look identical to the agent (a wall above, a wall
          below), so whatever it does in one it must do in the other. A value-based agent settles on one direction
          and gets trapped on one side. A policy that can be random does not.
        </>
      }
    >
      <div className="controls">
        <Slider
          label="In a grey cell, move east with probability"
          value={pEast}
          min={0}
          max={1}
          step={0.05}
          onChange={setPEast}
          format={(v) => v.toFixed(2)}
          hint={pEast === 0 || pEast === 1 ? 'a deterministic policy' : undefined}
        />
      </div>
      <svg viewBox={`0 0 ${CELL * 5 + 40} 240`} className="chart" role="img" aria-label={`A five-cell corridor with the goal below the middle. Moving east with probability ${pEast.toFixed(2)} in the grey cells takes ${Number.isFinite(steps) ? steps.toFixed(1) : 'infinitely many'} steps on average.`}>
        {labels.map((label, i) => {
          const x = 20 + i * CELL
          const grey = i === 1 || i === 3
          return (
            <g key={i}>
              <rect x={x + 2} y={30} width={CELL - 4} height={CELL - 4} rx={8} fill={grey ? 'var(--text-muted)' : 'var(--cell-mid)'} opacity={grey ? 0.45 : 1} className="cell-rect" />
              <text x={x + CELL / 2} y={24} textAnchor="middle" className="tick">
                {label}
              </text>
              {i === 0 && <path d={`M${x + 30},78 L${x + 66},78 M${x + 56},70 L${x + 66},78 L${x + 56},86`} className="arrow-path" />}
              {i === 4 && <path d={`M${x + 66},78 L${x + 30},78 M${x + 40},70 L${x + 30},78 L${x + 40},86`} className="arrow-path" />}
              {i === 2 && <path d={`M${x + 48},60 L${x + 48},98 M${x + 40},88 L${x + 48},98 L${x + 56},88`} className="arrow-path" />}
              {grey && (
                <>
                  <path d={`M${x + 52},66 L${x + 80},66 M${x + 72},60 L${x + 80},66 L${x + 72},72`} className="arrow-path" style={{ opacity: 0.15 + 0.85 * pEast, strokeWidth: 1.5 + 3 * pEast }} />
                  <path d={`M${x + 44},92 L${x + 16},92 M${x + 24},86 L${x + 16},92 L${x + 24},98`} className="arrow-path" style={{ opacity: 0.15 + 0.85 * (1 - pEast), strokeWidth: 1.5 + 3 * (1 - pEast) }} />
                </>
              )}
            </g>
          )
        })}
        <rect x={20 + 2 * CELL + 2} y={30 + CELL} width={CELL - 4} height={CELL - 14} rx={8} fill="var(--cell-pos)" className="cell-rect" />
        <text x={20 + 2 * CELL + CELL / 2} y={30 + CELL + 48} textAnchor="middle" className="cell-terminal">
          goal
        </text>
      </svg>
      <div className="stats">
        <Stat
          label="Average steps to reach the goal"
          value={Number.isFinite(steps) ? steps.toFixed(1) : 'never'}
          note={Number.isFinite(steps) ? 'averaged over the four starting cells' : 'starts on one side loop forever'}
        />
        <Stat label="Best possible" value="4.5" note="at exactly 0.50" />
      </div>
    </Playground>
  )
}
