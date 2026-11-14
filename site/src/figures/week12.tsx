import { arrow } from './arrows'
import { Figure } from './Figure'

interface Box {
  title: string
  lines: string[]
}

function Loop({ boxes, accent, back, label, caption }: { boxes: Box[]; accent: number; back: string; label: string; caption: string }) {
  const n = boxes.length
  const gap = n === 4 ? 24 : 42
  const width = (680 - gap * (n - 1)) / n
  const xs = boxes.map((_, i) => 20 + i * (width + gap))
  return (
    <Figure height={190} label={label} caption={caption}>
      {boxes.map((b, i) => (
        <g key={b.title}>
          <rect x={xs[i]} y={30} width={width} height={86} rx={12} className={i === accent ? 'fig-box-accent' : 'fig-box'} />
          <text x={xs[i] + width / 2} y={56} textAnchor="middle" className="fig-big">
            {b.title}
          </text>
          {b.lines.map((line, j) => (
            <text key={line} x={xs[i] + width / 2} y={80 + j * 17} textAnchor="middle" className="fig-small">
              {line}
            </text>
          ))}
          {i < n - 1 && <line x1={xs[i] + width + 2} y1={73} x2={xs[i] + width + gap - 4} y2={73} className="fig-line" markerEnd={arrow('ink')} />}
        </g>
      ))}
      <path d={`M${xs[n - 1] + width / 2},118 L${xs[n - 1] + width / 2},152 L${xs[0] + width / 2},152 L${xs[0] + width / 2},120`} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={174} textAnchor="middle" className="fig-small">
        {back}
      </text>
    </Figure>
  )
}

/** One simulation of Monte Carlo tree search. */
export function MctsLoop() {
  return (
    <Loop
      accent={0}
      back="next simulation"
      boxes={[
        { title: 'Select', lines: ['walk down the tree,', 'picking by a bandit rule'] },
        { title: 'Expand', lines: ['add one new node', 'where the tree ends'] },
        { title: 'Simulate', lines: ['play out the rest', 'quickly and crudely'] },
        { title: 'Back up', lines: ['update every node', 'on the path taken'] },
      ]}
      label="Four steps in a loop. Select: walk down the tree built so far, choosing at each node by a bandit rule. Expand: add one new node where the tree ends. Simulate: play out the rest of the episode with a fast, crude policy. Back up: update the visit count and average result of every node on the path. Then run the next simulation."
      caption="One simulation of Monte Carlo tree search. Each node keeps two numbers: how often it was visited and the average result of simulations through it. The selection step is where the intelligence is: every node is treated as a small bandit problem."
    />
  )
}

/** AlphaZero: search improves the network, the network improves the search. */
export function AlphaZeroLoop() {
  return (
    <Loop
      accent={1}
      back="a stronger network makes the next search stronger"
      boxes={[
        { title: 'Play yourself', lines: ['choosing every move', 'by tree search'] },
        { title: 'Train one network', lines: ['to predict the move counts', 'of the search, and who won'] },
        { title: 'Search with it', lines: ['priors say where to look,', 'values replace playouts'] },
      ]}
      label="Three steps in a loop. Play games against yourself, choosing every move by tree search. Train one network to predict two things: which moves the search preferred, and who won the game. Use that network inside the search: its move probabilities say where to look and its value estimate replaces random playouts. A stronger network makes the next search stronger."
      caption="AlphaZero is policy iteration with search as the improvement step. Search turns the rough opinion of the network into a better one; training makes that better opinion its new instinct. Playing against itself supplies an opponent that is always exactly as good as it is."
    />
  )
}

/** Model-based RL in the Dyna style. */
export function DynaLoop() {
  return (
    <Loop
      accent={2}
      back="the improved policy collects new real data"
      boxes={[
        { title: 'Act for real', lines: ['a little; store every', 'transition'] },
        { title: 'Fit a model', lines: ['predict next state and', 'reward from the data'] },
        { title: 'Imagine', lines: ['short rollouts in the', 'model from real states'] },
        { title: 'Improve', lines: ['train policy and critic', 'on real plus imagined'] },
      ]}
      label="Four steps in a loop. Act in the real world a little and store every transition. Fit a model that predicts the next state and reward. Imagine: generate short rollouts inside the model, starting from real stored states. Improve: train the policy and critic on real and imagined data together. The improved policy then collects new real data."
      caption="The Dyna recipe, in its modern form (MBPO). The model is a data multiplier: each real transition seeds many imagined ones. Everything from Week 7 still does the learning; it just gets far more to learn from per real step."
    />
  )
}

/** Planning by sampling action sequences and executing only the first action. */
export function ShootAndReplan() {
  const fans = [
    { end: [300, 44], cls: 'fig-line-muted' },
    { end: [318, 82], cls: 'fig-line-muted' },
    { end: [326, 118], cls: 'fig-line-s1' },
    { end: [318, 156], cls: 'fig-line-muted' },
    { end: [296, 190], cls: 'fig-line-muted' },
  ]
  return (
    <Figure
      height={236}
      label="Planning by shooting. From the current state, several candidate action sequences are rolled out in the model, drawn as a fan of imagined paths. The one with the highest predicted return is highlighted. Only its first action is executed in the real world. Then the whole process repeats from the new real state."
      caption="No policy network at all: the plan is the policy. Sample many action sequences, score each by rolling it out in the model, and take the first action of the best. Then throw the rest of the plan away and plan again from wherever you really ended up, so model errors never get the chance to pile up."
    >
      <circle cx={90} cy={118} r={9} className="fig-dot" />
      <text x={90} y={150} textAnchor="middle" className="fig-small">
        real state
      </text>
      {fans.map((f, i) => (
        <path key={i} d={`M100,118 Q${(100 + f.end[0]) / 2},${118 + (f.end[1] - 118) * 0.25} ${f.end[0]},${f.end[1]}`} className={f.cls} markerEnd={i === 2 ? arrow('s1') : undefined} />
      ))}
      <text x={340} y={48} className="fig-small">
        imagined: predicted return 2.1
      </text>
      <text x={340} y={122} className="fig-strong">
        best imagined plan: 6.4
      </text>
      <text x={340} y={194} className="fig-small">
        imagined: 0.7
      </text>
      <rect x={520} y={78} width={180} height={80} rx={12} className="fig-box-accent" />
      <text x={610} y={106} textAnchor="middle" className="fig-big">
        Do its first action
      </text>
      <text x={610} y={128} textAnchor="middle" className="fig-small">
        only that one, for real
      </text>
      <text x={610} y={145} textAnchor="middle" className="fig-small">
        then plan again
      </text>
      <path d="M610,160 L610,214 L90,214 L90,160" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={230} textAnchor="middle" className="fig-small">
        replan from the new real state
      </text>
    </Figure>
  )
}
