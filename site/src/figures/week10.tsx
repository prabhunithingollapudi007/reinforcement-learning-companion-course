import { arrow } from './arrows'
import { Figure } from './Figure'

/** The explore-exploit dilemma on three arms. */
export function ThreeArms() {
  const arms = [
    { x: 70, name: 'Arm 1', pulls: 'pulled 40 times', avg: 'average 0.55', note: 'looks best', kind: 'exploit' },
    { x: 280, name: 'Arm 2', pulls: 'pulled 40 times', avg: 'average 0.30', note: 'looks poor', kind: 'none' },
    { x: 490, name: 'Arm 3', pulls: 'pulled twice', avg: 'average 0.50', note: 'barely known', kind: 'explore' },
  ]
  return (
    <Figure
      height={236}
      label="Three arms. The first has been pulled forty times and averages 0.55. The second, forty times, averages 0.30. The third has been pulled only twice and averages 0.50. Pulling the first exploits what is known. Pulling the third explores: its true value could easily be higher than the first's."
      caption="A bandit is the exploration problem with everything else removed: no states, no delayed consequences, just a choice repeated. Pulling arm 1 uses what you know. Pulling arm 3 might reveal something better, and costs reward if it does not."
    >
      {arms.map((a) => (
        <g key={a.name}>
          <rect x={a.x} y={30} width={160} height={120} rx={14} className={a.kind === 'none' ? 'fig-box' : 'fig-box-accent'} />
          <text x={a.x + 80} y={60} textAnchor="middle" className="fig-big">
            {a.name}
          </text>
          <text x={a.x + 80} y={88} textAnchor="middle" className="fig-small">
            {a.pulls}
          </text>
          <text x={a.x + 80} y={108} textAnchor="middle" className="fig-text">
            {a.avg}
          </text>
          <text x={a.x + 80} y={134} textAnchor="middle" className="fig-label">
            {a.note}
          </text>
        </g>
      ))}
      <line x1={150} y1={196} x2={150} y2={156} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={150} y={216} textAnchor="middle" className="fig-strong">
        exploit: take the best so far
      </text>
      <line x1={570} y1={196} x2={570} y2={156} className="fig-line-s2" markerEnd={arrow('s2')} />
      <text x={570} y={216} textAnchor="middle" className="fig-strong">
        explore: find out more
      </text>
    </Figure>
  )
}

/** Why acting optimistically is safe either way. */
export function OptimismPays() {
  return (
    <Figure
      height={236}
      label="Pull the arm that might be best. Either it really is good, and you collect high reward. Or it is not, in which case its average falls and its uncertainty shrinks, so you stop pulling it. Both outcomes are acceptable."
      caption="Optimism in the face of uncertainty. Acting as though each arm is as good as it plausibly could be has two possible outcomes, and neither is bad: you are right and collect, or you are wrong and learn exactly what you needed to stop."
    >
      <rect x={30} y={84} width={200} height={66} rx={12} className="fig-box-accent" />
      <text x={130} y={112} textAnchor="middle" className="fig-strong">
        Pull the arm that
      </text>
      <text x={130} y={132} textAnchor="middle" className="fig-strong">
        might be the best
      </text>
      <path d="M232,104 C290,90 320,62 386,56" className="fig-line" markerEnd={arrow('ink')} />
      <path d="M232,130 C290,144 320,172 386,178" className="fig-line" markerEnd={arrow('ink')} />
      <rect x={390} y={22} width={300} height={70} rx={12} className="fig-box" />
      <text x={406} y={50} className="fig-strong">
        It really is good
      </text>
      <text x={406} y={72} className="fig-small">
        you collect high reward
      </text>
      <rect x={390} y={144} width={300} height={70} rx={12} className="fig-box" />
      <text x={406} y={172} className="fig-strong">
        It is not
      </text>
      <text x={406} y={194} className="fig-small">
        its average drops, its uncertainty shrinks
      </text>
      <text x={302} y={50} textAnchor="middle" className="fig-small">
        either
      </text>
      <text x={302} y={196} textAnchor="middle" className="fig-small">
        or
      </text>
    </Figure>
  )
}
