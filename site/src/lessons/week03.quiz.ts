import type { Question } from '../components/Quiz'

export const week03Quiz: Question[] = [
  {
    prompt: 'Why does model-free control learn Q(s, a) instead of V(s)?',
    options: [
      'Q is cheaper to store',
      'Acting greedily on V needs a one-step look-ahead through the model; acting greedily on Q is a lookup',
      'V cannot be learned from experience',
      'Q has lower variance',
    ],
    answer: 1,
    explain: 'Last week showed V can be learned from experience. The problem is using it: to compare actions from V you need to know where each one leads, and that is the model.',
  },
  {
    prompt: 'With 4 actions and ε = 0.2, how likely is an ε-greedy policy to choose the greedy action?',
    options: ['0.80', '0.85', '0.20', '0.95'],
    answer: 1,
    explain: '1 − ε + ε/|A| = 0.8 + 0.05 = 0.85. The random pick lands on the greedy action a quarter of the time.',
  },
  {
    prompt: 'What does GLIE require?',
    options: [
      'ε is fixed at a small value forever',
      'Every state-action pair is visited infinitely often, and the policy becomes greedy in the limit',
      'The agent explores only in the first episode',
      'The learning rate is constant',
    ],
    answer: 1,
    explain: 'Both halves matter. Infinite visits make the estimates accurate; becoming greedy makes the policy actually use them. ε = 1/k over episodes satisfies both.',
  },
  {
    prompt: 'What is the only difference between the SARSA and Q-learning updates?',
    options: [
      'SARSA uses a return, Q-learning uses one step',
      'The value used for the next state: Q of the action actually taken next, or the max over actions',
      'SARSA has no learning rate',
      'Q-learning does not use the reward',
    ],
    answer: 1,
    explain: 'SARSA: r + γ Q(s′, a′) with a′ the next action taken. Q-learning: r + γ max Q(s′, ·). Everything else is identical.',
  },
  {
    prompt: 'Q-learning is off-policy. What does that mean?',
    options: [
      'It does not need a policy',
      'It learns about the greedy policy while its data comes from a different, exploring policy',
      'It only works offline on stored data',
      'It ignores rewards from random actions',
    ],
    answer: 1,
    explain: 'The max in the target is the greedy policy’s choice, whatever the behaviour policy went on to do. That separation is what later makes replay buffers and learning from old data possible.',
  },
  {
    prompt: 'On the cliff with ε = 0.1, Q-learning learns the shorter route yet collects less reward per episode than SARSA while learning. Why?',
    options: [
      'Its Q-values have not converged',
      'It walks the cliff edge, and its own random exploratory steps keep knocking it off',
      'SARSA uses a larger learning rate',
      'The shorter route has lower reward',
    ],
    answer: 1,
    explain: 'The edge route is optimal for an agent that never missteps. An ε-greedy agent missteps one time in ten, and SARSA’s values account for that because they describe the policy actually being followed.',
  },
  {
    prompt: 'What happens to the gap between SARSA and Q-learning on the cliff as ε shrinks toward zero?',
    options: ['It grows', 'It stays the same', 'It closes: with no random steps the edge route is safe for both', 'SARSA stops learning'],
    answer: 2,
    explain: 'The ε-greedy policy approaches the greedy one, so the policy SARSA evaluates and the policy Q-learning evaluates become the same.',
  },
  {
    prompt: 'Ten actions are all truly worth 0, and each estimate has independent noise with standard deviation 1. What is the expected value of the largest estimate?',
    options: ['0', 'About 0.5', 'About 1.5', 'About 10'],
    answer: 2,
    explain: 'About +1.5: the maximum of ten noisy numbers is reliably positive even though none of the true values is. This is the maximisation bias in Q-learning’s target.',
  },
  {
    prompt: 'How does double Q-learning remove that bias?',
    options: [
      'It averages two estimates',
      'It chooses the action with one table and evaluates that action with the other',
      'It uses a smaller learning rate',
      'It takes the minimum instead of the maximum',
    ],
    answer: 1,
    explain: 'The chosen action is still the lucky one according to the first table, but the second table’s noise is independent, so its estimate of that action is not inflated.',
  },
  {
    prompt: 'Which statement about Q-learning’s convergence in a finite MDP is right?',
    options: [
      'It always converges with any constant learning rate',
      'It converges to Q* given GLIE behaviour and step sizes that sum to infinity while their squares do not',
      'It converges only if the behaviour policy is greedy',
      'It never converges because the target keeps moving',
    ],
    answer: 1,
    explain: 'Those are the conditions the lecture states. The argument rests on the Bellman backup being a contraction, as in Week 1, plus stochastic approximation for the sampling.',
  },
]
