import { arrow } from './arrows'
import { Figure } from './Figure'

/** Value-based, policy-based and actor-critic methods as two overlapping sets. */
export function MethodFamilies() {
  return (
    <Figure
      height={250}
      label="Two overlapping circles. One is methods that learn a value function, the other methods that learn a policy. Value-based methods such as Q-learning and DQN are in the first only. Policy gradient methods are in the second only. Actor-critic methods are in the overlap."
      caption="Weeks 2 to 4 learned values and read a policy off them. This week learns the policy and nothing else. Week 7 does both at once."
    >
      <circle cx={270} cy={124} r={104} className="fig-box" />
      <circle cx={450} cy={124} r={104} className="fig-box-accent" fillOpacity={0.55} />
      <text x={200} y={104} textAnchor="middle" className="fig-strong">
        Value-based
      </text>
      <text x={200} y={124} textAnchor="middle" className="fig-small">
        learn Q, act greedily
      </text>
      <text x={200} y={144} textAnchor="middle" className="fig-label">
        Weeks 2–4
      </text>
      <text x={360} y={104} textAnchor="middle" className="fig-strong">
        Actor-critic
      </text>
      <text x={360} y={124} textAnchor="middle" className="fig-small">
        learn both
      </text>
      <text x={360} y={144} textAnchor="middle" className="fig-label">
        Week 7
      </text>
      <text x={520} y={104} textAnchor="middle" className="fig-strong">
        Policy-based
      </text>
      <text x={520} y={124} textAnchor="middle" className="fig-small">
        learn the policy directly
      </text>
      <text x={520} y={144} textAnchor="middle" className="fig-label">
        this week
      </text>
    </Figure>
  )
}

/** The probability of a trajectory, and which factors depend on the policy. */
export function TrajectoryFactors() {
  const terms: { text: string; kind: 'policy' | 'world' }[] = [
    { text: 'μ(s₀)', kind: 'world' },
    { text: 'π(a₀ | s₀)', kind: 'policy' },
    { text: 'P(s₁ | s₀, a₀)', kind: 'world' },
    { text: 'π(a₁ | s₁)', kind: 'policy' },
    { text: 'P(s₂ | s₁, a₁)', kind: 'world' },
  ]
  const widths = [80, 110, 134, 110, 134]
  let x = 26
  const placed = terms.map((t, i) => {
    const item = { ...t, x, w: widths[i] }
    x += widths[i] + 8
    return item
  })
  return (
    <Figure
      height={232}
      label="The probability of a trajectory is a product of the start-state probability, the policy's probability of each action, and the dynamics' probability of each next state. Only the policy factors depend on the policy parameters, so the gradient of the log probability contains only those."
      caption="Taking the log turns the product into a sum, and the gradient with respect to θ kills every term that does not contain θ. The dynamics vanish. That is why policy gradients need no model."
    >
      <text x={26} y={28} className="fig-label">
        Probability of one trajectory
      </text>
      {placed.map((t) => (
        <g key={t.text} opacity={t.kind === 'world' ? 0.55 : 1}>
          <rect x={t.x} y={44} width={t.w} height={44} rx={9} className={t.kind === 'policy' ? 'fig-box-accent' : 'fig-box'} />
          <text x={t.x + t.w / 2} y={72} textAnchor="middle" className="fig-math-small">
            {t.text}
          </text>
        </g>
      ))}
      <text x={x + 4} y={72} className="fig-math">
        ⋯
      </text>
      {placed
        .filter((t) => t.kind === 'policy')
        .map((t) => (
          <line key={t.text} x1={t.x + t.w / 2} y1={92} x2={t.x + t.w / 2} y2={134} className="fig-line-s1" markerEnd={arrow('s1')} />
        ))}
      <text x={26} y={126} className="fig-small">
        the world: no θ in these
      </text>
      <rect x={150} y={138} width={420} height={48} rx={10} className="fig-box-accent" />
      <text x={360} y={168} textAnchor="middle" className="fig-math">
        ∇θ log P(τ; θ) = Σₜ ∇θ log π(aₜ | sₜ)
      </text>
      <text x={360} y={214} textAnchor="middle" className="fig-small">
        each term is a score function: how to change θ to make that action more likely
      </text>
    </Figure>
  )
}

/** Try, score, shift: what the estimator does. */
export function TryScoreShift() {
  const bell = (cx: number, base: number, h: number, w: number) => {
    const pts: string[] = []
    for (let i = -30; i <= 30; i++) {
      const t = i / 10
      pts.push(`${i === -30 ? 'M' : 'L'}${(cx + t * w).toFixed(1)},${(base - h * Math.exp(-t * t / 2)).toFixed(1)}`)
    }
    return pts.join(' ')
  }
  const samples = [
    { dx: -44, good: 0.15 },
    { dx: -18, good: 0.35 },
    { dx: 6, good: 0.6 },
    { dx: 30, good: 0.9 },
    { dx: 54, good: 1 },
  ]
  const panels = [
    { ox: 0, title: '1. Try', sub: 'sample actions from the policy' },
    { ox: 240, title: '2. Score', sub: 'see how each one turned out' },
    { ox: 480, title: '3. Shift', sub: 'make the good ones more likely' },
  ]
  return (
    <Figure
      height={236}
      label="Three steps. Sample several actions from the current policy. Observe the reward of each. Shift the policy so that the actions with higher reward become more likely."
      caption="The estimator in one picture. It is maximum likelihood, the same as imitation learning, except each sample is weighted by how well it did. Nothing here requires the reward to be differentiable, or even known as a formula."
    >
      {panels.map((p, i) => {
        const cx = p.ox + 110 + (i === 2 ? 26 : 0)
        return (
          <g key={p.title}>
            {i > 0 && <line x1={p.ox} y1={14} x2={p.ox} y2={222} className="fig-line-muted" />}
            <text x={p.ox + 120} y={26} textAnchor="middle" className="fig-strong">
              {p.title}
            </text>
            <text x={p.ox + 120} y={214} textAnchor="middle" className="fig-small">
              {p.sub}
            </text>
            {i === 2 && <path d={bell(p.ox + 110, 160, 86, 26)} className="fig-line" opacity={0.35} />}
            <path d={bell(cx, 160, 86, 26)} className="fig-line-s1" />
            <line x1={p.ox + 20} y1={160} x2={p.ox + 220} y2={160} className="fig-line-muted" />
            {samples.map((s) => (
              <circle
                key={s.dx}
                cx={p.ox + 110 + s.dx}
                cy={i === 0 ? 172 : 172}
                r={i === 0 ? 5 : 3 + 6 * s.good}
                className={i === 0 ? 'fig-dot' : 'fig-dot-s2'}
                opacity={i === 0 ? 1 : 0.35 + 0.65 * s.good}
              />
            ))}
            {i === 1 && (
              <text x={p.ox + 120} y={196} textAnchor="middle" className="fig-small">
                bigger dot = higher reward
              </text>
            )}
            {i === 2 && <line x1={p.ox + 112} y1={60} x2={p.ox + 134} y2={60} className="fig-line-s1" markerEnd={arrow('s1')} />}
          </g>
        )
      })}
    </Figure>
  )
}

/** An action can only be credited with rewards that come after it. */
export function RewardToGo() {
  const rewards = [1, 0, 2, 0, 1, 3]
  const t = 2
  const x = (i: number) => 90 + i * 100
  return (
    <Figure
      height={224}
      label="A timeline of six steps with a reward at each. For the action taken at step two, only the rewards from step two onward are used; the rewards before it are ignored because the action could not have caused them."
      caption="An action cannot change rewards that were already collected. Weighting each action by its reward-to-go, in place of the whole episode's return, keeps the estimate unbiased and removes noise that has nothing to do with the action."
    >
      <line x1={60} y1={96} x2={670} y2={96} className="fig-line-muted" />
      {rewards.map((r, i) => (
        <g key={i} opacity={i < t ? 0.35 : 1}>
          <circle cx={x(i)} cy={96} r={18} className={i === t ? 'fig-node-accent' : 'fig-node'} />
          <text x={x(i)} y={101} textAnchor="middle" className="fig-math-small">
            a{'₀₁₂₃₄₅'[i]}
          </text>
          <rect x={x(i) - 20} y={128} width={40} height={24} rx={12} className={i >= t ? 'fig-chip-accent' : 'fig-chip'} />
          <text x={x(i)} y={145} textAnchor="middle" className="fig-small">
            r = {r}
          </text>
        </g>
      ))}
      <path d={`M${x(t) - 24},62 L${x(t) - 24},52 L${x(5) + 24},52 L${x(5) + 24},62`} className="fig-line-s1" />
      <text x={(x(t) + x(5)) / 2} y={40} textAnchor="middle" className="fig-text">
        counts toward a₂: reward-to-go = 2 + 0 + 1 + 3 = 6
      </text>
      <path d={`M${x(0) - 24},178 L${x(0) - 24},188 L${x(1) + 24},188 L${x(1) + 24},178`} className="fig-line" opacity={0.5} />
      <text x={(x(0) + x(1)) / 2} y={208} textAnchor="middle" className="fig-small">
        already happened: ignored
      </text>
    </Figure>
  )
}
