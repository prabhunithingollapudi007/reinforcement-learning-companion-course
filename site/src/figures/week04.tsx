import { arrow } from './arrows'
import { Figure } from './Figure'

/** A table stores one number per state; a function shares weights between states. */
export function TableOrFunction() {
  const cells = ['0.2', '0.5', '0.1', '0.9', '0.4', '0.7']
  return (
    <Figure
      height={250}
      label="Left: a table with one independent value per state; updating one cell changes nothing else. Right: a function with shared weights maps any state to a value; updating the weights for one state also moves the values of similar states."
      caption="A table cannot generalise: it knows nothing about a state it has not visited. A function can, because states share weights. The same sharing is what makes learning unstable: an update meant for one state changes the values of others."
    >
      <text x={180} y={24} textAnchor="middle" className="fig-strong">
        Table
      </text>
      <text x={180} y={42} textAnchor="middle" className="fig-label">
        one number per state
      </text>
      {cells.map((v, i) => (
        <g key={i}>
          <rect x={48 + i * 44} y={70} width={40} height={46} rx={7} className={i === 3 ? 'fig-box-accent' : 'fig-box'} />
          <text x={68 + i * 44} y={99} textAnchor="middle" className="fig-text">
            {v}
          </text>
        </g>
      ))}
      <line x1={200} y1={160} x2={200} y2={122} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={180} y={180} textAnchor="middle" className="fig-text">
        update one state
      </text>
      <text x={180} y={200} textAnchor="middle" className="fig-small">
        the other cells do not move
      </text>

      <line x1={360} y1={14} x2={360} y2={236} className="fig-line-muted" />

      <text x={540} y={24} textAnchor="middle" className="fig-strong">
        Function
      </text>
      <text x={540} y={42} textAnchor="middle" className="fig-label">
        shared weights w
      </text>
      <rect x={390} y={72} width={76} height={42} rx={8} className="fig-box" />
      <text x={428} y={98} textAnchor="middle" className="fig-text">
        state s
      </text>
      <line x1={468} y1={93} x2={500} y2={93} className="fig-line" markerEnd={arrow('ink')} />
      <rect x={502} y={62} width={96} height={62} rx={10} className="fig-box-accent" />
      <text x={550} y={90} textAnchor="middle" className="fig-math">
        Q(s, a; w)
      </text>
      <text x={550} y={110} textAnchor="middle" className="fig-small">
        network
      </text>
      <line x1={600} y1={93} x2={632} y2={93} className="fig-line" markerEnd={arrow('ink')} />
      <rect x={634} y={72} width={66} height={42} rx={8} className="fig-box" />
      <text x={667} y={98} textAnchor="middle" className="fig-text">
        value
      </text>
      <line x1={550} y1={160} x2={550} y2={130} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={540} y={180} textAnchor="middle" className="fig-text">
        update the weights for one state
      </text>
      <text x={540} y={200} textAnchor="middle" className="fig-small">
        every state that shares them moves too
      </text>
    </Figure>
  )
}

/** The deadly triad as a triangle. */
export function TriadTriangle() {
  const top = { x: 360, y: 54 }
  const left = { x: 150, y: 226 }
  const right = { x: 570, y: 226 }
  const corners = [
    { ...top, title: 'Function approximation', sub: 'states share weights', anchor: 'middle' as const, dy: -22 },
    { ...left, title: 'Bootstrapping', sub: 'targets built from estimates', anchor: 'middle' as const, dy: 30 },
    { ...right, title: 'Off-policy data', sub: 'not the states the policy visits', anchor: 'middle' as const, dy: 30 },
  ]
  return (
    <Figure
      height={290}
      label="A triangle whose corners are function approximation, bootstrapping and off-policy data. With any one removed, instability can be avoided. All three together can make value estimates diverge."
      caption="Each corner is something we want: generalisation, learning from single steps, and reusing old data. Give up any one and learning can be kept stable. Q-learning with a neural network uses all three."
    >
      <path d={`M${top.x},${top.y} L${left.x},${left.y} L${right.x},${right.y} Z`} className="fig-box" />
      <text x={360} y={164} textAnchor="middle" className="fig-strong">
        all three:
      </text>
      <text x={360} y={184} textAnchor="middle" className="fig-text">
        values can diverge
      </text>
      {corners.map((c) => (
        <g key={c.title}>
          <circle cx={c.x} cy={c.y} r={9} className="fig-dot-s2" />
          <text x={c.x} y={c.y + c.dy} textAnchor={c.anchor} className="fig-strong">
            {c.title}
          </text>
          <text x={c.x} y={c.y + c.dy + 18} textAnchor={c.anchor} className="fig-small">
            {c.sub}
          </text>
        </g>
      ))}
    </Figure>
  )
}

/** How DQN arranges its parts. */
export function DqnLoop() {
  return (
    <Figure
      height={300}
      label="The DQN loop. The agent acts epsilon-greedily in the environment and stores each transition in a replay buffer. Random minibatches from the buffer train the Q-network toward targets computed by a separate target network, whose weights are copied from the Q-network every C steps."
      caption="Two additions to Q-learning. The replay buffer breaks the link between what the agent just did and what it trains on. The target network holds the targets still for C steps at a time."
    >
      <rect x={30} y={34} width={150} height={60} rx={12} className="fig-box" />
      <text x={105} y={60} textAnchor="middle" className="fig-big">
        Environment
      </text>
      <text x={105} y={80} textAnchor="middle" className="fig-small">
        act ε-greedily
      </text>

      <line x1={182} y1={64} x2={258} y2={64} className="fig-line" markerEnd={arrow('ink')} />
      <text x={220} y={54} textAnchor="middle" className="fig-math-small">
        s, a, r, s′
      </text>

      <rect x={260} y={34} width={170} height={60} rx={12} className="fig-box-accent" />
      <text x={345} y={60} textAnchor="middle" className="fig-big">
        Replay buffer
      </text>
      <text x={345} y={80} textAnchor="middle" className="fig-small">
        stores past transitions
      </text>

      <line x1={345} y1={96} x2={345} y2={146} className="fig-line" markerEnd={arrow('ink')} />
      <text x={355} y={126} className="fig-small">
        random minibatch
      </text>

      <rect x={260} y={148} width={170} height={64} rx={12} className="fig-box" />
      <text x={345} y={174} textAnchor="middle" className="fig-strong">
        Loss
      </text>
      <text x={345} y={196} textAnchor="middle" className="fig-math-small">
        (target − Q(s, a; w))²
      </text>

      <rect x={510} y={148} width={180} height={64} rx={12} className="fig-box-accent" />
      <text x={600} y={174} textAnchor="middle" className="fig-strong">
        Target network w⁻
      </text>
      <text x={600} y={196} textAnchor="middle" className="fig-math-small">
        r + γ max Q(s′, a′; w⁻)
      </text>
      <line x1={508} y1={180} x2={434} y2={180} className="fig-line" markerEnd={arrow('ink')} />

      <rect x={30} y={148} width={150} height={64} rx={12} className="fig-box" />
      <text x={105} y={174} textAnchor="middle" className="fig-strong">
        Q-network w
      </text>
      <text x={105} y={196} textAnchor="middle" className="fig-small">
        gradient step
      </text>
      <line x1={258} y1={180} x2={184} y2={180} className="fig-line-s1" markerEnd={arrow('s1')} />
      <line x1={105} y1={146} x2={105} y2={98} className="fig-line" markerEnd={arrow('ink')} />
      <text x={115} y={126} className="fig-small">
        chooses actions
      </text>

      <path d="M105,214 L105,262 L600,262 L600,216" className="fig-line-s2" markerEnd={arrow('s2')} />
      <text x={352} y={282} textAnchor="middle" className="fig-text">
        every C steps: copy w into w⁻
      </text>
    </Figure>
  )
}
