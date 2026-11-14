import { arrow } from './arrows'
import { Figure } from './Figure'

/** The stages a chat model goes through. */
export function PostTraining() {
  const boxes = [
    { title: 'Pre-train', lines: ['predict the next word', 'on a vast amount of text'], tag: 'knows a lot' },
    { title: 'Instruction-tune', lines: ['imitate good answers', 'to instructions'], tag: 'follows requests' },
    { title: 'Collect preferences', lines: ['people compare two', 'answers and pick one'], tag: 'a signal for “better”' },
    { title: 'Reinforce', lines: ['make preferred answers', 'more likely'], tag: 'does what people want' },
  ]
  const width = 152
  const gap = 24
  return (
    <Figure
      height={190}
      label="Four stages in a row. Pre-train: predict the next word on a vast amount of text, which gives knowledge. Instruction-tune: imitate good answers to instructions, so the model follows requests. Collect preferences: people compare two answers and pick one, a signal for which is better. Reinforce: make preferred answers more likely."
      caption="The first two stages are imitation: Week 8 with text. The last two are this week. They are needed because imitation can only copy the answers it was shown, and “what people prefer” is not something anyone can write down as a list of correct answers."
    >
      {boxes.map((b, i) => {
        const x = 20 + i * (width + gap)
        return (
          <g key={b.title}>
            <rect x={x} y={26} width={width} height={90} rx={12} className={i >= 2 ? 'fig-box-accent' : 'fig-box'} />
            <text x={x + width / 2} y={54} textAnchor="middle" className="fig-big">
              {b.title}
            </text>
            {b.lines.map((line, j) => (
              <text key={line} x={x + width / 2} y={78 + j * 17} textAnchor="middle" className="fig-small">
                {line}
              </text>
            ))}
            <text x={x + width / 2} y={144} textAnchor="middle" className="fig-label">
              {b.tag}
            </text>
            {i < boxes.length - 1 && <line x1={x + width + 2} y1={71} x2={x + width + gap - 4} y2={71} className="fig-line" markerEnd={arrow('ink')} />}
          </g>
        )
      })}
      <text x={184} y={176} textAnchor="middle" className="fig-small">
        imitation
      </text>
      <text x={536} y={176} textAnchor="middle" className="fig-small">
        reinforcement learning
      </text>
    </Figure>
  )
}

/** A language model seen as an RL agent. */
export function TokensAsActions() {
  const tokens = ['An', 'earthquake', 'hit', 'the', 'city', '.']
  return (
    <Figure
      height={230}
      label="A language model as a policy. The state is the prompt plus the words written so far. Each action is the next word. The episode is the whole response. A reward arrives only at the end, from a person or a learned judge."
      caption="Nothing about a language model needs changing to call it a policy. The state is the text so far, the action is the next token, and the probability the network gives each token is π(a | s). What is unusual is the scale: tens of thousands of actions at every step, and a reward that says something only about the finished response."
    >
      <rect x={20} y={40} width={150} height={56} rx={12} className="fig-box" />
      <text x={95} y={64} textAnchor="middle" className="fig-strong">
        prompt
      </text>
      <text x={95} y={82} textAnchor="middle" className="fig-small">
        “Summarise this…”
      </text>
      {tokens.map((t, i) => {
        const x = 196 + i * 70
        return (
          <g key={i}>
            <rect x={x} y={48} width={62} height={40} rx={10} className="fig-chip-accent" />
            <text x={x + 31} y={73} textAnchor="middle" className="fig-small">
              {t}
            </text>
            <text x={x + 31} y={112} textAnchor="middle" className="fig-math-small">
              a
            </text>
          </g>
        )
      })}
      <line x1={172} y1={68} x2={192} y2={68} className="fig-line" markerEnd={arrow('ink')} />
      <text x={406} y={30} textAnchor="middle" className="fig-label">
        one action per token
      </text>
      <rect x={624} y={40} width={80} height={56} rx={12} className="fig-box-accent" />
      <text x={664} y={64} textAnchor="middle" className="fig-strong">
        reward
      </text>
      <text x={664} y={82} textAnchor="middle" className="fig-small">
        at the end
      </text>
      <path d="M20,150 L604,150" className="fig-line-muted" />
      <text x={20} y={172} className="fig-small">
        state = prompt + everything written so far
      </text>
      <text x={20} y={200} className="fig-small">
        episode = one response
      </text>
      <text x={704} y={172} textAnchor="end" className="fig-small">
        return = that single reward
      </text>
    </Figure>
  )
}

/** A group of answers to one question, graded and compared with each other. */
export function GroupOfAnswers() {
  const answers = [
    { ok: true, adv: '+1.73' },
    { ok: false, adv: '−0.58' },
    { ok: false, adv: '−0.58' },
    { ok: true, adv: '+1.73' },
    { ok: false, adv: '−0.58' },
    { ok: false, adv: '−0.58' },
    { ok: false, adv: '−0.58' },
    { ok: false, adv: '−0.58' },
  ]
  return (
    <Figure
      height={240}
      label="One question is answered eight times. A checker marks two answers right and six wrong. Each answer's advantage is its reward minus the group's average, divided by the group's spread: plus 1.73 for the two right answers and minus 0.58 for the six wrong ones. The model is updated to make the right answers' reasoning more likely."
      caption="Group-relative policy optimisation (GRPO). The baseline that policy gradients need comes from the other answers to the same question, so no value network is required. A question the model always gets right, or always gets wrong, gives every answer an advantage of zero: learning happens on questions at the edge of its ability."
    >
      <rect x={20} y={78} width={130} height={60} rx={12} className="fig-box" />
      <text x={85} y={104} textAnchor="middle" className="fig-strong">
        one question
      </text>
      <text x={85} y={122} textAnchor="middle" className="fig-small">
        checkable answer
      </text>
      <line x1={152} y1={108} x2={176} y2={108} className="fig-line" markerEnd={arrow('ink')} />
      <text x={180} y={34} className="fig-label">
        eight sampled answers, each with its reasoning
      </text>
      {answers.map((a, i) => {
        const x = 180 + i * 66
        return (
          <g key={i}>
            <rect x={x} y={48} width={58} height={50} rx={10} className={a.ok ? 'fig-box-accent' : 'fig-box'} />
            <text x={x + 29} y={79} textAnchor="middle" className="fig-big">
              {a.ok ? '✓' : '✗'}
            </text>
            <text x={x + 29} y={124} textAnchor="middle" className="fig-small">
              reward {a.ok ? 1 : 0}
            </text>
            <text x={x + 29} y={156} textAnchor="middle" className={a.ok ? 'fig-strong' : 'fig-small'}>
              {a.adv}
            </text>
          </g>
        )
      })}
      <text x={20} y={156} className="fig-label">
        advantage
      </text>
      <text x={360} y={196} textAnchor="middle" className="fig-math">
        advantage = (reward − group mean) / group spread
      </text>
      <text x={360} y={224} textAnchor="middle" className="fig-small">
        then a clipped policy-gradient step, as in PPO
      </text>
    </Figure>
  )
}
