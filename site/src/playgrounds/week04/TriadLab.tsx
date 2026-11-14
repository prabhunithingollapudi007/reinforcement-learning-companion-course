import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import { divergenceThreshold, triadTrace } from '../../rl/approx'
import '../shared.css'

const STEPS = 200

function Toggle({ label, on, onChange, hint }: { label: string; on: boolean; onChange: (v: boolean) => void; hint: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="toggle-label">{label}</span>
        <span className="toggle-hint">{hint}</span>
      </span>
    </label>
  )
}

export function TriadLab() {
  const [shared, setShared] = useState(true)
  const [bootstrap, setBootstrap] = useState(true)
  const [shareA, setShareA] = useState(1)
  const [gamma, setGamma] = useState(0.99)
  const [freeze, setFreeze] = useState(1)

  const trace = useMemo(
    () => triadTrace({ gamma, alpha: 0.1, shareA, bootstrap, shared, freeze, steps: STEPS }),
    [gamma, shareA, bootstrap, shared, freeze],
  )
  const threshold = divergenceThreshold(gamma)
  const final = trace.values[STEPS]

  return (
    <Playground
      title="Three ingredients, one explosion"
      caption={
        <>
          Two states. A leads to B, B ends the episode, and every reward is 0, so every true value is 0. With function
          approximation the two states share one weight: A is valued at w and B at 2w. The chart shows the size of
          A's value estimate, starting from 1. It should shrink to nothing.
        </>
      }
    >
      <div className="toggles">
        <Toggle label="Function approximation" on={shared} onChange={setShared} hint={shared ? 'A and B share one weight' : 'a separate table entry for each state'} />
        <Toggle label="Bootstrapping" on={bootstrap} onChange={setBootstrap} hint={bootstrap ? 'target is r + γ × estimate of B' : 'target is the actual return (Monte Carlo)'} />
      </div>
      <div className="controls controls-3">
        <Slider
          label="Share of updates on A"
          value={shareA}
          min={0.5}
          max={1}
          step={0.02}
          onChange={setShareA}
          format={(v) => `${Math.round(v * 100)}%`}
          hint={shareA === 0.5 ? 'on-policy: each state as often as it is visited' : 'off-policy: A is over-represented'}
        />
        <Slider label="Discount γ" value={gamma} min={0.3} max={0.99} step={0.01} onChange={setGamma} format={(v) => v.toFixed(2)} />
        <Slider
          label="Freeze the target for"
          value={freeze}
          min={1}
          max={50}
          step={1}
          onChange={setFreeze}
          format={(v) => (v === 1 ? 'no freeze' : `${v} updates`)}
        />
      </div>

      <LineChart
        series={[{ name: 'size of the value estimate for A', values: trace.values, slot: trace.diverges ? 2 : 1 }]}
        xLabel="updates"
        yLabel="|estimate| (log scale)"
        ariaLabel={`The estimate ${trace.diverges ? 'grows without bound' : 'shrinks toward zero'}, reaching ${final.toExponential(1)} after ${STEPS} updates.`}
        log
        floor={1e-6}
        yMax={1e9}
        height={280}
        format={(v) => (v >= 1000 || v < 0.01 ? v.toExponential(1) : v.toFixed(2))}
        tableRows={[0, 10, 25, 50, 100, 150, 200]}
      />

      <div className="stats">
        <Stat label="Verdict" value={trace.diverges ? '✕ diverges' : '✓ converges'} note={`estimate after ${STEPS} updates: ${final >= 1000 || final < 0.01 ? final.toExponential(1) : final.toFixed(2)}`} />
        <Stat
          label="Tipping point at this γ"
          value={threshold <= 1 ? `${Math.round(threshold * 100)}% on A` : 'none'}
          note={threshold <= 1 ? 'with a shared weight and bootstrapping' : 'γ is too small to diverge'}
        />
      </div>
    </Playground>
  )
}
