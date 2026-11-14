import { arrow } from './arrows'
import { Figure } from './Figure'

/** Why control without a model works on Q, not V. */
export function WhyQ() {
  const row = [
    { a: 'up', q: '0.2' },
    { a: 'right', q: '0.7', best: true },
    { a: 'down', q: '−0.4' },
    { a: 'left', q: '0.1' },
  ]
  return (
    <Figure
      height={266}
      label="Two ways to choose an action. From state values, you must look one step ahead through the model to compare actions. From action values, you just read the row for the current state and take the largest."
      caption="To act greedily on V you have to ask where each action leads, and only the model can answer that. Q has already folded that question into its numbers, so choosing is a table lookup."
    >
      <text x={180} y={24} textAnchor="middle" className="fig-strong">
        Choosing from V: needs the model
      </text>
      <circle cx={180} cy={62} r={16} className="fig-node-accent" />
      <text x={180} y={67} textAnchor="middle" className="fig-math">
        s
      </text>
      {[110, 250].map((ax, i) => (
        <g key={ax}>
          <line x1={180} y1={78} x2={ax} y2={126} className="fig-line" />
          <circle cx={ax} cy={132} r={6} className="fig-dot" />
          {[ax - 36, ax + 36].map((lx) => (
            <g key={lx}>
              <line x1={ax} y1={138} x2={lx} y2={186} className="fig-line" />
              <circle cx={lx} cy={200} r={14} className="fig-node" />
              <text x={lx} y={205} textAnchor="middle" className="fig-math-small">
                V
              </text>
            </g>
          ))}
          <text x={ax + (i === 0 ? -16 : 16)} y={136} textAnchor={i === 0 ? 'end' : 'start'} className="fig-small">
            {i === 0 ? 'action 1' : 'action 2'}
          </text>
        </g>
      ))}
      <text x={180} y={166} textAnchor="middle" className="fig-math-small">
        P(s′ | s, a) ?
      </text>
      <text x={180} y={244} textAnchor="middle" className="fig-small">
        which next states, and how likely? unknown
      </text>

      <line x1={360} y1={14} x2={360} y2={252} className="fig-line-muted" />

      <text x={540} y={24} textAnchor="middle" className="fig-strong">
        Choosing from Q: read the row
      </text>
      <text x={400} y={74} className="fig-math-small">
        Q(s, ·)
      </text>
      {row.map((cell, i) => (
        <g key={cell.a}>
          <rect x={400 + i * 72} y={88} width={66} height={60} rx={8} className={cell.best ? 'fig-box-accent' : 'fig-box'} />
          <text x={433 + i * 72} y={110} textAnchor="middle" className="fig-small">
            {cell.a}
          </text>
          <text x={433 + i * 72} y={134} textAnchor="middle" className="fig-big">
            {cell.q}
          </text>
        </g>
      ))}
      <line x1={505} y1={196} x2={505} y2={156} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={505} y={214} textAnchor="middle" className="fig-text">
        take the largest
      </text>
      <text x={540} y={244} textAnchor="middle" className="fig-small">
        no model needed
      </text>
    </Figure>
  )
}

/** The learning loop once exploration is part of the policy. */
export function ControlLoop() {
  const boxes = [
    { x: 40, title: 'Act', sub: 'ε-greedy on current Q' },
    { x: 270, title: 'Observe', sub: 's, a, r, s′' },
    { x: 500, title: 'Update Q', sub: 'toward a target' },
  ]
  return (
    <Figure
      height={176}
      label="A loop of three steps: act epsilon-greedily on the current Q, observe the state, action, reward and next state, update Q toward a target, and repeat. Updating Q changes the policy, because the policy is defined by Q."
      caption="Evaluation and improvement are no longer separate phases. Every update to Q changes the ε-greedy policy a little, and the next action already uses it."
    >
      {boxes.map((b, i) => (
        <g key={b.title}>
          <rect x={b.x} y={30} width={180} height={64} rx={12} className={i === 2 ? 'fig-box-accent' : 'fig-box'} />
          <text x={b.x + 90} y={58} textAnchor="middle" className="fig-big">
            {b.title}
          </text>
          <text x={b.x + 90} y={80} textAnchor="middle" className="fig-small">
            {b.sub}
          </text>
          {i < 2 && <line x1={b.x + 182} y1={62} x2={b.x + 228} y2={62} className="fig-line" markerEnd={arrow('ink')} />}
        </g>
      ))}
      <path d="M590,96 L590,134 L130,134 L130,98" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={156} textAnchor="middle" className="fig-small">
        the policy is defined by Q, so it has just changed too
      </text>
    </Figure>
  )
}

function ControlBackup({ ox, title, tag, mode }: { ox: number; title: string; tag: string; mode: 'sarsa' | 'q' }) {
  const cx = ox + 180
  const actions = [cx - 70, cx, cx + 70]
  return (
    <g>
      <text x={cx} y={24} textAnchor="middle" className="fig-strong">
        {title}
      </text>
      <text x={cx} y={42} textAnchor="middle" className="fig-label">
        {tag}
      </text>
      <circle cx={cx} cy={72} r={7} className="fig-dot" />
      <text x={cx + 16} y={76} className="fig-math-small">
        (s, a)
      </text>
      <line x1={cx} y1={79} x2={cx} y2={124} className="fig-line-s1" />
      <text x={cx + 10} y={106} className="fig-math-small">
        r
      </text>
      <circle cx={cx} cy={138} r={14} className="fig-node" />
      <text x={cx} y={143} textAnchor="middle" className="fig-math-small">
        s′
      </text>
      {actions.map((ax, i) => {
        const chosen = mode === 'q' || i === 2
        return (
          <g key={ax} opacity={chosen ? 1 : 0.3}>
            <line x1={cx} y1={152} x2={ax} y2={206} className={mode === 'sarsa' && i === 2 ? 'fig-line-s1' : 'fig-line'} />
            <circle cx={ax} cy={212} r={7} className="fig-dot" />
          </g>
        )
      })}
      {mode === 'q' ? (
        <>
          <path d={`M${cx - 34},180 Q${cx},196 ${cx + 34},180`} className="fig-line-s1" />
          <text x={cx} y={246} textAnchor="middle" className="fig-text">
            the best next action, whatever is done
          </text>
        </>
      ) : (
        <text x={cx} y={246} textAnchor="middle" className="fig-text">
          the next action actually taken
        </text>
      )}
      <text x={cx} y={272} textAnchor="middle" className="fig-math-small">
        {mode === 'q' ? 'r + γ max Q(s′, a′)' : 'r + γ Q(s′, a′)'}
      </text>
    </g>
  )
}

/** SARSA and Q-learning differ only in which next action the target uses. */
export function SarsaAndQ() {
  return (
    <Figure
      height={290}
      label="Two backup diagrams starting from a state-action pair. SARSA's target uses the value of the next action the agent actually takes. Q-learning's target uses the maximum over next actions."
      caption="Both start from a state-action pair and take one real step. They differ in one place: which next action supplies the value. That single choice is what makes SARSA on-policy and Q-learning off-policy."
    >
      <ControlBackup ox={0} title="SARSA" tag="on-policy" mode="sarsa" />
      <line x1={360} y1={14} x2={360} y2={280} className="fig-line-muted" />
      <ControlBackup ox={360} title="Q-learning" tag="off-policy" mode="q" />
    </Figure>
  )
}
