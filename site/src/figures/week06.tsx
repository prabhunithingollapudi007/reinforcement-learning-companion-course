import { arrow } from './arrows'
import { Figure } from './Figure'

/** The true objective, the surrogate built from old data, and the lower bound that makes steps safe. */
export function SurrogateBound() {
  const x0 = 250
  const X = (t: number) => 80 + t * 560
  // Curves as functions of t in [0, 1]; all three touch at t0.
  const t0 = (x0 - 80) / 560
  const J = (t: number) => 205 - 130 * Math.sin((t - 0.05) * 2.4) * Math.exp(-1.2 * Math.max(0, t - 0.75))
  const slope = (J(t0 + 0.001) - J(t0 - 0.001)) / 0.002
  const L = (t: number) => J(t0) + slope * (t - t0)
  const bound = (t: number) => L(t) + 520 * (t - t0) ** 2
  const path = (f: (t: number) => number, from: number, to: number) =>
    Array.from({ length: 61 }, (_, i) => from + (i / 60) * (to - from))
      .map((t, i) => `${i === 0 ? 'M' : 'L'}${X(t).toFixed(1)},${Math.min(236, Math.max(20, f(t))).toFixed(1)}`)
      .join(' ')
  // Maximum of the bound (smallest y).
  let best = t0
  for (let t = t0; t < 1; t += 0.002) if (bound(t) < bound(best)) best = t
  return (
    <Figure
      height={280}
      label="Three curves over policy parameters that touch at the current policy. The true objective J. A surrogate L estimated from the current policy's data, which matches J nearby and drifts away further out. A lower bound, L minus a penalty for moving away, which stays below J. Maximising the lower bound gives a new policy that is guaranteed to be at least as good."
      caption="The surrogate L is all we can compute from the data we have, and it is only trustworthy near the current policy. Subtracting a penalty for distance gives a curve that never rises above the true objective. Climb to the top of that curve, and the true objective must have gone up too."
    >
      <line x1={60} y1={240} x2={680} y2={240} className="fig-line-muted" />
      <path d={path(J, 0, 1)} className="fig-line" style={{ strokeWidth: 2.2 }} />
      <path d={path(L, 0.08, 0.72)} className="fig-line-s1" />
      <path d={path(bound, 0.1, 0.56)} className="fig-line-s2" />
      <line x1={X(t0)} y1={J(t0)} x2={X(t0)} y2={240} className="fig-line-muted" />
      <circle cx={X(t0)} cy={J(t0)} r={6} className="fig-dot" />
      <text x={X(t0)} y={258} textAnchor="middle" className="fig-text">
        current policy
      </text>
      <line x1={X(best)} y1={bound(best)} x2={X(best)} y2={240} className="fig-line-muted" />
      <circle cx={X(best)} cy={bound(best)} r={6} className="fig-dot-s2" />
      <circle cx={X(best)} cy={J(best)} r={6} className="fig-dot" />
      <text x={X(best)} y={258} textAnchor="middle" className="fig-text">
        next policy
      </text>
      <line x1={X(t0) + 8} y1={270} x2={X(best) - 8} y2={270} className="fig-line" markerEnd={arrow('ink')} />
      <text x={600} y={J(0.93) - 12} textAnchor="middle" className="fig-strong">
        true objective J
      </text>
      <text x={X(0.6) + 10} y={Math.max(34, L(0.6) + 4)} className="fig-text">
        surrogate L
      </text>
      <text x={X(0.12) - 6} y={Math.min(232, bound(0.12)) - 8} textAnchor="end" className="fig-text">
        L − penalty
      </text>
    </Figure>
  )
}

/** The ladder of k-step advantage estimators that GAE averages. */
export function EstimatorLadder() {
  const rows = [
    { name: '1-step', real: 1 },
    { name: '2-step', real: 2 },
    { name: '3-step', real: 3 },
    { name: 'all the way', real: 6 },
  ]
  const x = (i: number) => 196 + i * 62
  return (
    <Figure
      height={256}
      label="Four rows. The one-step estimator uses one real reward and then the critic's value. The two-step uses two real rewards and then the critic. The three-step uses three. The last uses only real rewards to the end of the episode. Going down the rows, bias falls and variance rises."
      caption="Each row is a valid estimate of the same advantage. Blue boxes are real rewards; the grey box is the critic's guess for everything after. GAE does not choose a row: it averages all of them, with weights that shrink by a factor λ per row."
    >
      {rows.map((row, r) => {
        const y = 40 + r * 46
        return (
          <g key={row.name}>
            <text x={20} y={y + 20} className="fig-strong">
              {row.name}
            </text>
            {Array.from({ length: 6 }, (_, i) =>
              i < row.real ? (
                <g key={i}>
                  <rect x={x(i)} y={y} width={56} height={30} rx={7} className="fig-box-accent" />
                  <text x={x(i) + 28} y={y + 20} textAnchor="middle" className="fig-math-small">
                    r{'ₜ₊'[0]}
                    {i === 0 ? '' : `₊${'₀₁₂₃₄₅'[i]}`}
                  </text>
                </g>
              ) : i === row.real ? (
                <g key={i}>
                  <rect x={x(i)} y={y} width={(6 - i) * 62 - 6} height={30} rx={7} className="fig-box" />
                  <text x={x(i) + ((6 - i) * 62 - 6) / 2} y={y + 20} textAnchor="middle" className="fig-math-small">
                    V(s{'ₜ'}
                    {`₊${'₀₁₂₃₄₅₆'[i]}`})
                  </text>
                </g>
              ) : null,
            )}
            <text x={584} y={y + 20} className="fig-small">
              {r === 0 ? 'most bias' : r === rows.length - 1 ? 'most variance' : ''}
            </text>
          </g>
        )
      })}
      <line x1={692} y1={48} x2={692} y2={200} className="fig-line" markerEnd={arrow('ink')} />
      <text x={20} y={240} className="fig-small">
        every row then subtracts V(sₜ), the value of where the action was taken
      </text>
    </Figure>
  )
}

/** One iteration of PPO. */
export function PpoLoop() {
  const boxes = [
    { x: 20, title: 'Collect', lines: ['run the current policy', 'for T steps'] },
    { x: 196, title: 'Score', lines: ['advantages with GAE', 'using the critic'] },
    { x: 372, title: 'Improve', lines: ['K epochs of minibatch', 'steps on the clipped objective'] },
    { x: 548, title: 'Refit critic', lines: ['regress V toward', 'the observed returns'] },
  ]
  return (
    <Figure
      height={186}
      label="One PPO iteration in four steps: collect data with the current policy, compute advantages with GAE, take several epochs of minibatch gradient steps on the clipped objective, and refit the critic. Then repeat with the new policy."
      caption="The step that sets PPO apart is the third: it reuses one batch of data for many gradient steps. The clip is what makes that safe."
    >
      {boxes.map((b, i) => (
        <g key={b.title}>
          <rect x={b.x} y={30} width={152} height={84} rx={12} className={i === 2 ? 'fig-box-accent' : 'fig-box'} />
          <text x={b.x + 76} y={56} textAnchor="middle" className="fig-big">
            {b.title}
          </text>
          {b.lines.map((line, j) => (
            <text key={line} x={b.x + 76} y={78 + j * 17} textAnchor="middle" className="fig-small">
              {line}
            </text>
          ))}
          {i < boxes.length - 1 && <line x1={b.x + 154} y1={72} x2={b.x + 174} y2={72} className="fig-line" markerEnd={arrow('ink')} />}
        </g>
      ))}
      <path d="M624,116 L624,150 L96,150 L96,118" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={172} textAnchor="middle" className="fig-small">
        repeat with the improved policy
      </text>
    </Figure>
  )
}
