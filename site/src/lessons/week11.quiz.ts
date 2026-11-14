import type { Question } from '../components/Quiz'

export const week11Quiz: Question[] = [
  {
    prompt: 'Why is exploration harder in an MDP than in a bandit?',
    options: [
      'MDPs have more actions',
      'What is uncertain are states, and reaching one can take many specific actions in a row with no reward along the way',
      'Rewards are noisier',
      'There is no optimal policy',
    ],
    answer: 1,
    explain: 'In a bandit every arm is one pull away. In the corridor the informative state is seven deliberate steps away.',
  },
  {
    prompt: 'In the corridor, why does ε-greedy stall about halfway?',
    options: [
      'Its learning rate is too small',
      'Having learned that retreating pays a little, it advances only on random steps, and needs a long unbroken run of them',
      'It cannot represent the value function',
      'The reward is too large',
    ],
    answer: 1,
    explain: 'Each extra cell multiplies the tries needed by about 2/ε. At eight cells and ε = 0.1 that is over a billion episodes.',
  },
  {
    prompt: 'What does a PAC guarantee promise?',
    options: [
      'Zero regret',
      'With high probability, the number of steps with a worse-than-ε mistake is at most polynomial in the problem size',
      'Convergence in the limit',
      'That every action is optimal',
    ],
    answer: 1,
    explain: 'Polynomial is the key word. An exponential count, as for ε-greedy on the corridor, does not qualify.',
  },
  {
    prompt: 'Two agents have the same total regret. One made many small mistakes, the other three large ones. Which framework tells them apart?',
    options: ['Regret', 'PAC', 'Neither', 'Both equally'],
    answer: 1,
    explain: 'PAC counts steps whose mistake exceeds ε, so the first agent may have many such steps or none depending on ε, and the second has three.',
  },
  {
    prompt: 'In MBIE-EB, what value is given to a state-action pair that has never been tried?',
    options: ['Zero', 'The average of the others', 'The largest possible value, 1/(1−γ)', 'A random value'],
    answer: 2,
    explain: 'Optimism: assume the unknown is as good as it could be. If it is not, trying it will show that.',
  },
  {
    prompt: 'Why does putting the bonus into the model before planning matter?',
    options: [
      'It makes planning faster',
      'Value iteration carries the bonus backwards, so states that lead toward unexplored ones become attractive too',
      'It removes the need for rewards',
      'It guarantees zero regret',
    ],
    answer: 1,
    explain: 'That is the difference between directed and undirected exploration: the plan itself routes through what is unknown.',
  },
  {
    prompt: 'What does the simulation lemma bound?',
    options: [
      'The number of episodes needed',
      'The difference in a policy’s value between two MDPs, in terms of how much their rewards and transitions differ',
      'The regret of Thompson sampling',
      'The size of the exploration bonus',
    ],
    answer: 1,
    explain: 'Value error ≤ (ε_R + γ V_max ε_T) / (1 − γ). An accurate model yields an accurate evaluation, with errors amplified by the horizon (rewards) or the horizon squared (transitions).',
  },
  {
    prompt: 'What does PSRL do at the start of each episode?',
    options: [
      'Picks a random policy',
      'Samples one complete MDP from its posterior and solves it',
      'Adds a bonus to every reward',
      'Resets its beliefs',
    ],
    answer: 1,
    explain: 'It then follows that MDP’s optimal policy for the whole episode. Committing for an episode is what gives deep exploration.',
  },
  {
    prompt: 'How do MBIE-EB and PSRL differ in what they need?',
    options: [
      'MBIE-EB needs a prior; PSRL needs counts',
      'PSRL needs a prior over models; MBIE-EB needs a bonus coefficient',
      'Neither learns a model',
      'Only PSRL needs rewards',
    ],
    answer: 1,
    explain: 'Optimism turns confidence intervals into bonuses; posterior sampling turns a prior and data into a belief to sample from.',
  },
  {
    prompt: 'How does a contextual bandit learn faster than treating every context separately?',
    options: [
      'It ignores the context',
      'A model of reward as a function of context features lets experience in one context inform similar ones',
      'It pulls every arm in every context',
      'It uses a larger ε',
    ],
    answer: 1,
    explain: 'Generalisation and exploration together: uncertainty is tracked over the model’s parameters, not over each context.',
  },
]
