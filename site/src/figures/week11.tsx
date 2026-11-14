import { arrow } from './arrows'
import { Figure } from './Figure'

/** Optimism in an MDP: bonuses go into the plan, so the plan heads for the unknown. */
export function BonusThenPlan() {
  const boxes = [
    { x: 20, title: 'Count', lines: ['how often each', 'state-action was tried'] },
    { x: 196, title: 'Add a bonus', lines: ['to its reward:', 'large if rarely tried'] },
    { x: 372, title: 'Plan', lines: ['value iteration on the', 'model plus bonuses'] },
    { x: 548, title: 'Act greedily', lines: ['on that optimistic', 'plan; observe; repeat'] },
  ]
  return (
    <Figure
      height={190}
      label="Four steps in a loop. Count how often each state-action pair has been tried. Add a bonus to its estimated reward, larger the less it has been tried. Plan with value iteration on the estimated model plus bonuses. Act greedily on that plan, observe the result, and repeat."
      caption="The step that matters is the third. Because the bonus goes into the model before planning, value iteration carries it backwards: a state becomes attractive if it leads toward somewhere unexplored, even several steps away. That is what random exploration cannot do."
    >
      {boxes.map((b, i) => (
        <g key={b.title}>
          <rect x={b.x} y={30} width={152} height={86} rx={12} className={i === 2 ? 'fig-box-accent' : 'fig-box'} />
          <text x={b.x + 76} y={56} textAnchor="middle" className="fig-big">
            {b.title}
          </text>
          {b.lines.map((line, j) => (
            <text key={line} x={b.x + 76} y={80 + j * 17} textAnchor="middle" className="fig-small">
              {line}
            </text>
          ))}
          {i < boxes.length - 1 && <line x1={b.x + 154} y1={73} x2={b.x + 174} y2={73} className="fig-line" markerEnd={arrow('ink')} />}
        </g>
      ))}
      <path d="M624,118 L624,152 L96,152 L96,120" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={174} textAnchor="middle" className="fig-small">
        new counts
      </text>
    </Figure>
  )
}

/** Posterior sampling for RL: commit to one plausible world per episode. */
export function SampleThenSolve() {
  const boxes = [
    { x: 30, title: 'Belief', lines: ['a distribution over', 'possible worlds'] },
    { x: 264, title: 'Sample one world', lines: ['and solve it exactly', 'for its best policy'] },
    { x: 498, title: 'Follow that policy', lines: ['for a whole episode;', 'update the belief'] },
  ]
  return (
    <Figure
      height={190}
      label="Three steps in a loop. Keep a belief, a distribution over possible worlds. Sample one world from it and solve it exactly for its best policy. Follow that policy for a whole episode and update the belief with what was seen."
      caption="Posterior sampling for RL is Thompson sampling with an MDP in place of an arm. Committing to one sampled world for a whole episode is what makes the exploration deep: if the sampled world has a reward at the end of the corridor, the agent walks all the way there to check."
    >
      {boxes.map((b, i) => (
        <g key={b.title}>
          <rect x={b.x} y={30} width={192} height={86} rx={12} className={i === 1 ? 'fig-box-accent' : 'fig-box'} />
          <text x={b.x + 96} y={56} textAnchor="middle" className="fig-big">
            {b.title}
          </text>
          {b.lines.map((line, j) => (
            <text key={line} x={b.x + 96} y={80 + j * 17} textAnchor="middle" className="fig-small">
              {line}
            </text>
          ))}
          {i < boxes.length - 1 && <line x1={b.x + 194} y1={73} x2={b.x + 230} y2={73} className="fig-line" markerEnd={arrow('ink')} />}
        </g>
      ))}
      <path d="M594,118 L594,152 L126,152 L126,120" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={174} textAnchor="middle" className="fig-small">
        a sharper belief
      </text>
    </Figure>
  )
}

/** Two ways to grade an exploring agent. */
export function RegretOrPac() {
  const xs = Array.from({ length: 24 }, (_, i) => 60 + i * 26)
  const small = [5, 4, 6, 4, 5, 3, 4, 5, 4, 3, 4, 4, 3, 4, 3, 3, 4, 3, 3, 3, 3, 3, 3, 3]
  const big = [22, 0, 0, 0, 18, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const row = (values: number[], base: number, cls: string) =>
    values.map((v, i) => (v > 0 ? <rect key={i} x={xs[i]} y={base - v * 2.6} width={16} height={v * 2.6} rx={3} className={cls} /> : null))
  return (
    <Figure
      height={230}
      label="Two agents over the same number of steps. The first makes a small mistake on almost every step. The second makes three large mistakes early and none afterwards. Their total regret is similar. A PAC guarantee counts only the steps with a mistake larger than a threshold, so it distinguishes them."
      caption="Regret adds up the size of every mistake, so many small ones and a few large ones can score the same. A PAC guarantee counts the steps on which the agent was worse than near-optimal by more than ε, and promises that count is small. Which you want depends on whether occasional large errors are tolerable."
    >
      <text x={20} y={30} className="fig-strong">
        Many small mistakes
      </text>
      <line x1={50} y1={96} x2={700} y2={96} className="fig-line-muted" />
      {row(small, 96, 'fig-fill-s2')}
      <text x={20} y={136} className="fig-strong">
        A few large ones, then none
      </text>
      <line x1={50} y1={200} x2={700} y2={200} className="fig-line-muted" />
      {row(big, 200, 'fig-fill-s1')}
      <text x={700} y={218} textAnchor="end" className="fig-small">
        time →
      </text>
    </Figure>
  )
}
