import { arrow } from './arrows'
import { Figure } from './Figure'

/** The two learners and what passes between them. */
export function ActorCriticLoop() {
  return (
    <Figure
      height={268}
      label="The actor chooses actions in the environment. The environment returns a reward and the next state. The critic uses them to estimate how much better or worse the action was than expected, the advantage, and passes that to the actor. The actor makes actions with positive advantage more likely. The critic updates its own estimates from the same rewards."
      caption="Policy gradients watched what happened and did more of what turned out well. Actor-critic adds a second learner whose job is to predict how well things turn out, so each action can be judged against an informed expectation and not one noisy outcome."
    >
      <rect x={40} y={36} width={190} height={78} rx={12} className="fig-box-accent" />
      <text x={135} y={66} textAnchor="middle" className="fig-big">
        Actor
      </text>
      <text x={135} y={88} textAnchor="middle" className="fig-small">
        the policy π(a | s)
      </text>

      <rect x={490} y={36} width={190} height={78} rx={12} className="fig-box" />
      <text x={585} y={66} textAnchor="middle" className="fig-big">
        Environment
      </text>
      <text x={585} y={88} textAnchor="middle" className="fig-small">
        returns r and s′
      </text>

      <rect x={265} y={168} width={190} height={78} rx={12} className="fig-box-accent" />
      <text x={360} y={198} textAnchor="middle" className="fig-big">
        Critic
      </text>
      <text x={360} y={220} textAnchor="middle" className="fig-small">
        a value estimate V(s)
      </text>

      <line x1={232} y1={64} x2={486} y2={64} className="fig-line" markerEnd={arrow('ink')} />
      <text x={360} y={54} textAnchor="middle" className="fig-text">
        action
      </text>
      <path d="M585,116 L585,206 L459,206" className="fig-line" markerEnd={arrow('ink')} />
      <text x={596} y={166} className="fig-text">
        reward, next state
      </text>
      <path d="M263,206 L135,206 L135,118" className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={124} y={166} textAnchor="end" className="fig-text">
        advantage
      </text>
      <text x={124} y={184} textAnchor="end" className="fig-small">
        better or worse
      </text>
      <text x={124} y={200} textAnchor="end" className="fig-small">
        than expected?
      </text>
    </Figure>
  )
}

/** How much old data each family of methods reuses. */
export function OffPolicySpectrum() {
  const items = [
    { x: 30, title: 'Policy gradient', data: 'one batch, one step', fit: 'no critic', week: 'Week 5' },
    { x: 202, title: 'PPO', data: 'one batch, many steps', fit: 'V, importance weights', week: 'Week 6' },
    { x: 374, title: 'Off-policy actor-critic', data: 'replay buffer', fit: 'Q of the current policy', week: 'SAC, this week' },
    { x: 546, title: 'Q-learning', data: 'replay buffer', fit: 'Q of the best policy', week: 'Week 4' },
  ]
  return (
    <Figure
      height={228}
      label="Four families ordered by how much old data they reuse. Policy gradient: one batch, one step, no critic. PPO: one batch, many steps, a state-value critic and importance weights. Off-policy actor-critic such as SAC: a replay buffer and a Q critic for the current policy. Q-learning: a replay buffer and a Q function for the best policy. Moving right is more data-efficient; moving left is more stable."
      caption="CS 224R's summary of the online methods so far, as a spectrum. The further right, the more each interaction with the world is reused, and the more care training needs."
    >
      {items.map((it, i) => (
        <g key={it.title}>
          <rect x={it.x} y={54} width={152} height={104} rx={12} className={i === 2 ? 'fig-box-accent' : 'fig-box'} />
          <text x={it.x + 76} y={78} textAnchor="middle" className="fig-strong">
            {it.title}
          </text>
          <text x={it.x + 76} y={102} textAnchor="middle" className="fig-small">
            {it.data}
          </text>
          <text x={it.x + 76} y={122} textAnchor="middle" className="fig-small">
            {it.fit}
          </text>
          <text x={it.x + 76} y={146} textAnchor="middle" className="fig-label">
            {it.week}
          </text>
        </g>
      ))}
      <line x1={30} y1={30} x2={694} y2={30} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={20} textAnchor="middle" className="fig-text">
        reuses more old data: more data-efficient
      </text>
      <line x1={698} y1={186} x2={34} y2={186} className="fig-line-s2" markerEnd={arrow('s2')} />
      <text x={360} y={208} textAnchor="middle" className="fig-text">
        closer to on-policy: more stable, easier to tune
      </text>
    </Figure>
  )
}

/** Building the critic's target from a buffer transition and a fresh action. */
export function QTarget() {
  return (
    <Figure
      height={236}
      label="A stored transition supplies state, action, reward and next state. The stored action is an input to Q, so it does not matter that an old policy chose it. The next action is not taken from the buffer: it is sampled fresh from the current policy. The target is reward plus gamma times Q of the next state and that fresh action."
      caption="The one place the old policy could contaminate the target is the next action, so that is the one thing not read from the buffer. It is drawn from the current policy instead."
    >
      <text x={30} y={28} className="fig-label">
        From the replay buffer
      </text>
      {['s', 'a', 'r', 's′'].map((t, i) => (
        <g key={t}>
          <rect x={30 + i * 74} y={40} width={64} height={48} rx={10} className="fig-box" />
          <text x={62 + i * 74} y={70} textAnchor="middle" className="fig-math">
            {t}
          </text>
        </g>
      ))}
      <text x={136} y={108} textAnchor="middle" className="fig-small">
        chosen by an old policy:
      </text>
      <text x={136} y={124} textAnchor="middle" className="fig-small">
        fine, it is an input to Q
      </text>

      <text x={430} y={28} className="fig-label">
        From the current policy
      </text>
      <rect x={430} y={40} width={130} height={48} rx={10} className="fig-box-accent" />
      <text x={495} y={70} textAnchor="middle" className="fig-math">
        ā′ ~ π(· | s′)
      </text>
      <line x1={318} y1={64} x2={426} y2={64} className="fig-line" markerEnd={arrow('ink')} />
      <text x={372} y={56} textAnchor="middle" className="fig-small">
        sample
      </text>

      <path d="M210,90 L210,168 L250,168" className="fig-line" markerEnd={arrow('ink')} />
      <path d="M495,90 L495,168 L472,168" className="fig-line-s1" markerEnd={arrow('s1')} />
      <rect x={252} y={144} width={218} height={50} rx={10} className="fig-box-accent" />
      <text x={361} y={174} textAnchor="middle" className="fig-math">
        y = r + γ Q(s′, ā′)
      </text>
      <text x={361} y={218} textAnchor="middle" className="fig-small">
        the target for Q(s, a)
      </text>
    </Figure>
  )
}
