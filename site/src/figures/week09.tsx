import { arrow } from './arrows'
import { Figure } from './Figure'

/** Online RL keeps collecting data; offline RL gets one fixed dataset. */
export function OnlineOrOffline() {
  return (
    <Figure
      height={228}
      label="Online RL: the policy acts in the environment, the new data updates the policy, and the loop repeats. Offline RL: a fixed dataset, collected earlier by some other policy, is used to train a policy, which is then deployed. There is no loop back to collect more."
      caption="Online, a wrong belief gets corrected: the policy acts on it and sees what happens. Offline, there is no second look. Whatever the method believes about actions the dataset does not contain, it can never check."
    >
      <text x={180} y={24} textAnchor="middle" className="fig-strong">
        Online RL
      </text>
      <rect x={40} y={50} width={120} height={56} rx={10} className="fig-box-accent" />
      <text x={100} y={83} textAnchor="middle" className="fig-text">
        policy
      </text>
      <rect x={200} y={50} width={120} height={56} rx={10} className="fig-box" />
      <text x={260} y={83} textAnchor="middle" className="fig-text">
        environment
      </text>
      <path d="M100,48 C130,18 230,18 258,46" className="fig-line" markerEnd={arrow('ink')} />
      <text x={180} y={44} textAnchor="middle" className="fig-small">
        acts
      </text>
      <path d="M260,108 C230,140 130,140 102,110" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={180} y={152} textAnchor="middle" className="fig-small">
        new data, again and again
      </text>

      <line x1={360} y1={14} x2={360} y2={214} className="fig-line-muted" />

      <text x={540} y={24} textAnchor="middle" className="fig-strong">
        Offline RL
      </text>
      <rect x={384} y={50} width={104} height={56} rx={10} className="fig-box" />
      <text x={436} y={76} textAnchor="middle" className="fig-text">
        dataset
      </text>
      <text x={436} y={94} textAnchor="middle" className="fig-small">
        fixed
      </text>
      <rect x={516} y={50} width={84} height={56} rx={10} className="fig-box-accent" />
      <text x={558} y={83} textAnchor="middle" className="fig-text">
        policy
      </text>
      <rect x={628} y={50} width={76} height={56} rx={10} className="fig-box" />
      <text x={666} y={83} textAnchor="middle" className="fig-text">
        deploy
      </text>
      <line x1={490} y1={78} x2={512} y2={78} className="fig-line" markerEnd={arrow('ink')} />
      <line x1={602} y1={78} x2={624} y2={78} className="fig-line" markerEnd={arrow('ink')} />
      <text x={436} y={132} textAnchor="middle" className="fig-small">
        collected earlier by
      </text>
      <text x={436} y={150} textAnchor="middle" className="fig-small">
        people or other policies
      </text>
      <text x={600} y={150} textAnchor="middle" className="fig-small">
        no way back to collect more
      </text>
    </Figure>
  )
}

/** Two mediocre trajectories contain one good one. */
export function Stitching() {
  return (
    <Figure
      height={250}
      label="Two recorded trajectories cross at a shared state. The first starts where we care about and ends badly, with reward minus one. The second starts somewhere else and ends well, with reward plus one. Following the first up to the shared state and the second after it gives a good trajectory that was never recorded."
      caption="CS 224R's stitching example. Neither recording goes from the start to the good ending. Imitation at the crossing copies both, half and half. A method that propagates reward backwards learns that the crossing is worth what the better continuation is worth, and joins the two."
    >
      <path d="M60,60 C160,60 240,90 340,124" className="fig-line" />
      <path d="M340,124 C440,158 540,190 650,196" className="fig-line" />
      <path d="M60,190 C160,190 240,160 340,124" className="fig-line" />
      <path d="M340,124 C440,90 540,58 650,52" className="fig-line" />
      <path d="M60,60 C160,60 240,90 340,124 C440,90 540,58 642,52" className="fig-line-s1" style={{ strokeWidth: 4, opacity: 0.55 }} markerEnd={arrow('s1')} />
      <circle cx={60} cy={60} r={12} className="fig-node-accent" />
      <circle cx={60} cy={190} r={12} className="fig-node" />
      <circle cx={340} cy={124} r={13} className="fig-node" />
      <rect x={650} y={36} width={56} height={32} rx={8} className="fig-box-accent" />
      <text x={678} y={57} textAnchor="middle" className="fig-strong">
        +1
      </text>
      <rect x={650} y={180} width={56} height={32} rx={8} className="fig-box" />
      <text x={678} y={201} textAnchor="middle" className="fig-strong">
        −1
      </text>
      <text x={60} y={36} textAnchor="middle" className="fig-text">
        start
      </text>
      <text x={60} y={222} textAnchor="middle" className="fig-small">
        another start
      </text>
      <text x={340} y={160} textAnchor="middle" className="fig-text">
        shared state
      </text>
      <text x={190} y={56} className="fig-small">
        recording 1
      </text>
      <text x={190} y={200} className="fig-small">
        recording 2
      </text>
      <text x={480} y={44} textAnchor="middle" className="fig-strong">
        stitched
      </text>
    </Figure>
  )
}

/** Reinforcement learning from human feedback, as a pipeline. */
export function RlhfPipeline() {
  const boxes = [
    { x: 20, title: 'Collect comparisons', lines: ['show people two outputs,', 'ask which is better'] },
    { x: 258, title: 'Train a reward model', lines: ['so that preferred outputs', 'score higher'] },
    { x: 496, title: 'Run RL on that reward', lines: ['for example with PPO,', 'staying close to the start'] },
  ]
  return (
    <Figure
      height={176}
      label="Three steps. Collect comparisons by showing people two outputs and asking which is better. Train a reward model so that preferred outputs score higher. Run reinforcement learning to maximise that learned reward, for example with PPO."
      caption="Reinforcement learning from human feedback. For a language model these three steps come after pre-training and supervised fine-tuning. The learned reward stands in for the judgement nobody could write down as a formula."
    >
      {boxes.map((b, i) => (
        <g key={b.title}>
          <rect x={b.x} y={34} width={204} height={96} rx={12} className={i === 1 ? 'fig-box-accent' : 'fig-box'} />
          <text x={b.x + 102} y={62} textAnchor="middle" className="fig-strong">
            {b.title}
          </text>
          {b.lines.map((line, j) => (
            <text key={line} x={b.x + 102} y={88 + j * 18} textAnchor="middle" className="fig-small">
              {line}
            </text>
          ))}
          {i < 2 && <line x1={b.x + 206} y1={82} x2={b.x + 234} y2={82} className="fig-line" markerEnd={arrow('ink')} />}
        </g>
      ))}
      <path d="M598,132 L598,156 L122,156 L122,134" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={150} textAnchor="middle" className="fig-small">
        optionally repeat with the improved model's outputs
      </text>
    </Figure>
  )
}
