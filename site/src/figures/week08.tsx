import { arrow } from './arrows'
import { Figure } from './Figure'

/** Averaging two good answers gives a bad one. */
export function MeanIsWorst() {
  return (
    <Figure
      height={270}
      label="A car approaches an obstacle. Some demonstrators steer around it to the left and some to the right. A policy trained to minimise squared error outputs the average of the two, which is straight ahead, into the obstacle."
      caption="Squared-error regression predicts the average action. When the demonstrations contain two different good choices, their average can be an action nobody took. CS 224R's comment on how often this happens with human data: all the time, especially with several demonstrators."
    >
      <rect x={300} y={40} width={120} height={56} rx={10} className="fig-box" />
      <text x={360} y={74} textAnchor="middle" className="fig-strong">
        obstacle
      </text>
      <rect x={336} y={206} width={48} height={40} rx={8} className="fig-box-accent" />
      <text x={360} y={232} textAnchor="middle" className="fig-small">
        car
      </text>
      <path d="M352,204 C330,160 250,130 220,50" className="fig-line-s1" markerEnd={arrow('s1')} />
      <path d="M368,204 C390,160 470,130 500,50" className="fig-line-s1" markerEnd={arrow('s1')} />
      <line x1={360} y1={204} x2={360} y2={104} className="fig-line-s2" markerEnd={arrow('s2')} />
      <text x={196} y={40} textAnchor="middle" className="fig-text">
        some go left
      </text>
      <text x={524} y={40} textAnchor="middle" className="fig-text">
        some go right
      </text>
      <text x={376} y={156} className="fig-strong">
        the average
      </text>
      <text x={376} y={174} className="fig-small">
        what regression learns
      </text>
    </Figure>
  )
}

/** The training recipe and the sampling recipe for a flow-matching policy. */
export function FlowRecipe() {
  return (
    <Figure
      height={250}
      label="Training: take a demonstrated action and a random noise sample, blend them at a random time between zero and one, and train a network to predict the direction from the noise to the action. Sampling: start from noise and take small steps along the predicted direction until time one."
      caption="Flow matching, the kind of diffusion CS 224R teaches. Training is plain regression on a blended point. Generating an action takes several small steps, and because each step can go a different way depending on where the sample is, different noise can end at different demonstrated actions."
    >
      <text x={20} y={28} className="fig-label">
        Training
      </text>
      <circle cx={90} cy={86} r={20} className="fig-node" />
      <text x={90} y={91} textAnchor="middle" className="fig-math-small">
        noise
      </text>
      <circle cx={420} cy={86} r={24} className="fig-node-accent" />
      <text x={420} y={91} textAnchor="middle" className="fig-math-small">
        action
      </text>
      <line x1={112} y1={86} x2={392} y2={86} className="fig-line-muted" />
      <circle cx={222} cy={86} r={8} className="fig-dot-s1" />
      <text x={222} y={64} textAnchor="middle" className="fig-small">
        blend at a random time t
      </text>
      <line x1={232} y1={86} x2={300} y2={86} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={270} y={112} textAnchor="middle" className="fig-small">
        predict this direction
      </text>
      <text x={480} y={80} className="fig-text">
        loss: squared error between the
      </text>
      <text x={480} y={100} className="fig-text">
        prediction and (action − noise)
      </text>

      <line x1={20} y1={140} x2={700} y2={140} className="fig-line-muted" />

      <text x={20} y={168} className="fig-label">
        Generating an action
      </text>
      <circle cx={90} cy={206} r={20} className="fig-node" />
      <text x={90} y={211} textAnchor="middle" className="fig-math-small">
        noise
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1={114 + i * 72} y1={206 - i * 4} x2={174 + i * 72} y2={202 - i * 4} className="fig-line-s1" markerEnd={arrow('s1')} />
          <circle cx={182 + i * 72} cy={202 - i * 4} r={5} className="fig-dot-s1" />
        </g>
      ))}
      <circle cx={438} cy={186} r={24} className="fig-node-accent" />
      <text x={438} y={191} textAnchor="middle" className="fig-math-small">
        action
      </text>
      <text x={480} y={200} className="fig-text">
        a few small steps along the
      </text>
      <text x={480} y={220} className="fig-text">
        predicted direction, t = 0 to 1
      </text>
    </Figure>
  )
}

/** Why a cloned policy leaves its training data, and what DAgger adds. */
export function DriftAndCorrect() {
  return (
    <Figure
      height={250}
      label="The expert's demonstrations stay in a narrow band of states. The cloned policy makes a small error, which takes it slightly outside that band, where it has no data and makes a larger error, and so on. DAgger asks the expert for the right action in the states the clone actually reached, and adds them to the data."
      caption="In supervised learning the inputs do not depend on your predictions. Here they do: each action chooses the next state. A small error moves the policy toward states the expert never showed it, which is where it is least reliable. DAgger collects labels exactly there."
    >
      <path d="M40,150 C200,110 400,150 680,110 L680,150 C400,190 200,150 40,190 Z" className="fig-box-accent" fillOpacity={0.6} />
      <text x={56} y={206} className="fig-small">
        states the expert demonstrated
      </text>
      <path d="M40,170 C200,130 400,170 680,130" className="fig-line" />
      <text x={676} y={176} textAnchor="end" className="fig-text">
        expert
      </text>
      <path d="M40,170 C160,140 250,128 330,108 C400,90 470,62 560,28" className="fig-line-s2" markerEnd={arrow('s2')} />
      <text x={470} y={40} textAnchor="end" className="fig-strong">
        clone
      </text>
      <text x={306} y={92} textAnchor="end" className="fig-small">
        small error
      </text>
      <text x={436} y={64} textAnchor="end" className="fig-small">
        unfamiliar state, bigger error
      </text>
      {[
        { x: 380, y: 92 },
        { x: 450, y: 68 },
        { x: 520, y: 42 },
      ].map((p) => (
        <line key={p.x} x1={p.x} y1={p.y + 4} x2={p.x + 14} y2={p.y + 54} className="fig-line-s1" markerEnd={arrow('s1')} />
      ))}
      <text x={548} y={84} className="fig-text">
        DAgger: the expert labels
      </text>
      <text x={548} y={104} className="fig-text">
        these states
      </text>
    </Figure>
  )
}

/** Deciding every step, or deciding a chunk at a time. */
export function ActionChunks() {
  const x = (i: number) => 150 + i * 88
  return (
    <Figure
      height={196}
      label="Two rows of six time steps. In the first, the policy makes a new decision at every step. In the second, it decides once and outputs the next three actions, which are executed without looking again, then decides again."
      caption="Action chunking: predict the next k actions at once and execute them before looking again. The lecture's two reasons for it: it often works much better, and it leaves more time to compute each decision."
    >
      <text x={20} y={58} className="fig-strong">
        Every step
      </text>
      <text x={20} y={76} className="fig-small">
        π(aₜ | sₜ)
      </text>
      <text x={20} y={138} className="fig-strong">
        In chunks
      </text>
      <text x={20} y={156} className="fig-small">
        π(aₜ … aₜ₊₂ | sₜ)
      </text>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <text x={x(i) + 30} y={24} textAnchor="middle" className="fig-label">
            t = {i + 1}
          </text>
          <rect x={x(i)} y={40} width={60} height={40} rx={8} className="fig-box-accent" />
          <text x={x(i) + 30} y={65} textAnchor="middle" className="fig-small">
            decide
          </text>
          <rect x={x(i)} y={120} width={60} height={40} rx={8} className={i % 3 === 0 ? 'fig-box-accent' : 'fig-box'} />
          <text x={x(i) + 30} y={145} textAnchor="middle" className="fig-small">
            {i % 3 === 0 ? 'decide' : 'execute'}
          </text>
          {i % 3 === 0 && <path d={`M${x(i) + 30},162 L${x(i) + 30},176 L${x(i + 2) + 30},176 L${x(i + 2) + 30},164`} className="fig-line-s1" markerEnd={arrow('s1')} />}
        </g>
      ))}
    </Figure>
  )
}
