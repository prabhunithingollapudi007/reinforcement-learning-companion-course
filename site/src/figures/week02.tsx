import { arrow } from './arrows'
import { Figure } from './Figure'

/** Dynamic programming, Monte Carlo and TD as three shapes of backup. */
export function ThreeBackups() {
  const panels = [
    { ox: 0, title: 'Dynamic programming', needs: 'needs the model', how: 'every next state, one step deep' },
    { ox: 240, title: 'Monte Carlo', needs: 'needs whole episodes', how: 'one sampled path, to the end' },
    { ox: 480, title: 'TD learning', needs: 'needs one step', how: 'one sampled step, then a guess' },
  ]
  const node = (x: number, y: number, kind: 'state' | 'root' | 'faded' = 'state') => (
    <circle cx={x} cy={y} r={kind === 'root' ? 15 : 12} className={kind === 'root' ? 'fig-node-accent' : 'fig-node'} opacity={kind === 'faded' ? 0.35 : 1} />
  )
  return (
    <Figure
      height={330}
      label="Three backup diagrams. Dynamic programming looks one step ahead at every possible next state, using the model. Monte Carlo follows one sampled path all the way to the end of the episode. TD follows one sampled step and then uses the current estimate of the next state."
      caption="All three estimate the value of the top state. Blue is what was actually sampled; faded branches are what could have happened but was not seen. Squares are the end of an episode."
    >
      {panels.map((p, i) => {
        const cx = p.ox + 120
        return (
          <g key={p.title}>
            {i > 0 && <line x1={p.ox} y1={14} x2={p.ox} y2={316} className="fig-line-muted" />}
            <text x={cx} y={24} textAnchor="middle" className="fig-strong">
              {p.title}
            </text>
            <text x={cx} y={298} textAnchor="middle" className="fig-small">
              {p.how}
            </text>
            <text x={cx} y={316} textAnchor="middle" className="fig-label">
              {p.needs}
            </text>

            {i === 0 && (
              <>
                {[cx - 70, cx, cx + 70].map((lx) => (
                  <g key={lx}>
                    <line x1={cx} y1={113} x2={lx} y2={166} className="fig-line" />
                    {node(lx, 178)}
                  </g>
                ))}
                <line x1={cx} y1={71} x2={cx} y2={103} className="fig-line" />
                <circle cx={cx} cy={108} r={5.5} className="fig-dot" />
                <text x={cx} y={214} textAnchor="middle" className="fig-math-small">
                  V(s′) for all s′
                </text>
              </>
            )}

            {i === 1 && (
              <>
                {[cx - 60, cx + 60].map((lx) => (
                  <g key={lx} opacity={0.35}>
                    <line x1={cx} y1={103} x2={lx} y2={136} className="fig-line" />
                    {node(lx, 146)}
                  </g>
                ))}
                <path d={`M${cx},71 L${cx},136 M${cx},160 L${cx},200 M${cx},224 L${cx},254`} className="fig-line-s1" />
                <circle cx={cx} cy={100} r={5.5} className="fig-dot" />
                {node(cx, 148)}
                <circle cx={cx} cy={180} r={5.5} className="fig-dot" />
                {node(cx, 212)}
                <circle cx={cx} cy={238} r={5.5} className="fig-dot" />
                <rect x={cx - 10} y={254} width={20} height={20} rx={3} className="fig-box" />
                <text x={cx + 26} y={184} className="fig-math-small">
                  Gₜ
                </text>
              </>
            )}

            {i === 2 && (
              <>
                {[cx - 60, cx + 60].map((lx) => (
                  <g key={lx} opacity={0.35}>
                    <line x1={cx} y1={113} x2={lx} y2={166} className="fig-line" />
                    {node(lx, 178)}
                  </g>
                ))}
                <path d={`M${cx},71 L${cx},166`} className="fig-line-s1" />
                <circle cx={cx} cy={108} r={5.5} className="fig-dot" />
                {node(cx, 178)}
                <text x={cx} y={214} textAnchor="middle" className="fig-math-small">
                  rₜ + γ V(sₜ₊₁)
                </text>
              </>
            )}

            {node(cx, 56, 'root')}
            <text x={cx} y={61} textAnchor="middle" className="fig-math">
              s
            </text>
          </g>
        )
      })}
    </Figure>
  )
}

/** The lecture's episode, with the return from each step computed backwards. */
export function ReturnsBackward() {
  const states = ['s₃', 's₂', 's₂', 's₁']
  const rewards = ['0', '0', '0', '1']
  const G = ['γ³', 'γ²', 'γ', '1']
  const x = (i: number) => 110 + i * 150
  return (
    <Figure
      height={252}
      label="An episode visits state three, then state two twice, then state one, and ends with reward one. Working backwards, the returns are one, gamma, gamma squared and gamma cubed. First-visit Monte Carlo credits state two with gamma squared. Every-visit averages gamma squared and gamma."
      caption="The episode CS 234 works by hand. Returns are filled in from the end backwards: each is the reward on that step plus γ times the return after it. State s₂ appears twice, which is where first-visit and every-visit Monte Carlo part ways."
    >
      <text x={20} y={30} className="fig-label">
        Episode
      </text>
      <text x={20} y={118} className="fig-label">
        Reward
      </text>
      <text x={20} y={172} className="fig-label">
        Return Gₜ
      </text>
      {states.map((s, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={56} r={22} className={i === 1 || i === 2 ? 'fig-node-accent' : 'fig-node'} />
          <text x={x(i)} y={62} textAnchor="middle" className="fig-math">
            {s}
          </text>
          {i < states.length - 1 ? (
            <line x1={x(i) + 24} y1={56} x2={x(i + 1) - 26} y2={56} className="fig-line" markerEnd={arrow('ink')} />
          ) : (
            <>
              <line x1={x(i) + 24} y1={56} x2={x(i) + 66} y2={56} className="fig-line" markerEnd={arrow('ink')} />
              <rect x={x(i) + 68} y={45} width={22} height={22} rx={3} className="fig-box" />
              <text x={x(i) + 79} y={90} textAnchor="middle" className="fig-small">
                end
              </text>
            </>
          )}
          <text x={x(i)} y={118} textAnchor="middle" className="fig-text">
            {rewards[i]}
          </text>
          <rect x={x(i) - 30} y={152} width={60} height={30} rx={8} className={i === 1 || i === 2 ? 'fig-chip-accent' : 'fig-chip'} />
          <text x={x(i)} y={173} textAnchor="middle" className="fig-math">
            {G[i]}
          </text>
          {i > 0 && <line x1={x(i) - 34} y1={167} x2={x(i - 1) + 36} y2={167} className="fig-line-s1" markerEnd={arrow('s1')} />}
        </g>
      ))}
      <text x={x(1) + 75} y={148} textAnchor="middle" className="fig-small">
        work backwards
      </text>
      <text x={110} y={218} className="fig-text">
        First-visit: V(s₂) = γ²
      </text>
      <text x={110} y={240} className="fig-small">
        only the first time s₂ appears counts
      </text>
      <text x={410} y={218} className="fig-text">
        Every-visit: V(s₂) = (γ² + γ) / 2
      </text>
      <text x={410} y={240} className="fig-small">
        both appearances count
      </text>
    </Figure>
  )
}

/** The one update rule behind both methods. */
export function UpdateAnatomy() {
  const old = 190
  const target = 560
  const alpha = 0.3
  const next = old + alpha * (target - old)
  return (
    <Figure
      height={236}
      label="A number line. The old estimate sits on the left and the target on the right. The update moves the estimate a fraction alpha of the way toward the target."
      caption="Almost every learning rule in this course has this shape: a target, an error, and a step size α. Monte Carlo and TD differ only in what they use as the target."
    >
      <line x1={90} y1={96} x2={650} y2={96} className="fig-line-muted" />
      <path d={`M${old},64 L${old},56 L${target},56 L${target},64`} className="fig-line" />
      <text x={(old + target) / 2} y={46} textAnchor="middle" className="fig-text">
        error = target − old estimate
      </text>
      <line x1={old + 9} y1={96} x2={next - 10} y2={96} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={(old + next) / 2} y={84} textAnchor="middle" className="fig-small">
        step: α × error
      </text>
      <circle cx={old} cy={96} r={8} className="fig-dot" />
      <text x={old} y={126} textAnchor="middle" className="fig-text">
        old estimate
      </text>
      <text x={old} y={146} textAnchor="middle" className="fig-math-small">
        V(s)
      </text>
      <circle cx={next} cy={96} r={8} className="fig-dot-s1" />
      <text x={next + 18} y={126} textAnchor="middle" className="fig-text">
        new estimate
      </text>
      <circle cx={target} cy={96} r={8} className="fig-dot-s2" />
      <text x={target} y={126} textAnchor="middle" className="fig-text">
        target
      </text>
      <rect x={90} y={170} width={270} height={52} rx={10} className="fig-box" />
      <text x={104} y={192} className="fig-strong">
        Monte Carlo target
      </text>
      <text x={104} y={211} className="fig-small">
        the whole return that followed, Gₜ
      </text>
      <rect x={380} y={170} width={270} height={52} rx={10} className="fig-box" />
      <text x={394} y={192} className="fig-strong">
        TD target
      </text>
      <text x={394} y={211} className="fig-small">
        one reward plus a guess, rₜ + γ V(sₜ₊₁)
      </text>
    </Figure>
  )
}
