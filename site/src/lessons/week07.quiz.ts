import type { Question } from '../components/Quiz'

export const week07Quiz: Question[] = [
  {
    prompt: 'What does the advantage A(s, a) measure?',
    options: [
      'The total reward of the episode',
      'How much better taking a in s is than what the policy does there on average',
      'The probability of the action',
      'The value of the next state',
    ],
    answer: 1,
    explain: 'A = Q − V. Positive means the action beat the policy’s usual behaviour in that state, so it should become more likely.',
  },
  {
    prompt: 'Given only a state-value critic V̂, how is the advantage of one step estimated?',
    options: ['V̂(s)', 'r + γ V̂(s′) − V̂(s)', 'r − V̂(s′)', 'It cannot be: a Q critic is required'],
    answer: 1,
    explain: 'One real reward plus the critic’s estimate of where you landed, minus its estimate of where you were. This is the TD error.',
  },
  {
    prompt: 'A critic trained on bootstrapped labels r + γ V̂(s′), compared with Monte Carlo labels, is…',
    options: [
      'less biased and noisier',
      'steadier but biased by its own errors',
      'identical in expectation',
      'unusable without a model',
    ],
    answer: 1,
    explain: 'The same trade as TD against Monte Carlo in Week 2. n-step labels sit in between and often work best.',
  },
  {
    prompt: 'In the corridor playground with a very noisy payout, why did plain policy gradient end up worse than chance while actor-critic did not?',
    options: [
      'It used a smaller learning rate',
      'It judged each action by one noisy return; a few unlucky payouts pushed the policy away from the prize for good',
      'It had no baseline',
      'It could not explore',
    ],
    answer: 1,
    explain: 'Both used the same learned baseline. The difference is the target: a single sampled return against the critic’s average over many.',
  },
  {
    prompt: 'With clean, noise-free rewards, which was quicker in the first 50 episodes?',
    options: ['Actor-critic, clearly', 'Plain policy gradient, slightly', 'They were identical', 'Neither learned'],
    answer: 1,
    explain: 'When returns are already reliable, a critic that is still learning adds bias without removing much noise. The critic pays off when returns are noisy.',
  },
  {
    prompt: 'You fit a state-value function V̂ to a replay buffer filled by many past policies. Whose value function is it?',
    options: [
      'The current policy’s',
      'The optimal policy’s',
      'A mixture of the old policies that collected the data',
      'A random policy’s',
    ],
    answer: 2,
    explain: 'The rewards in the buffer followed the old policies’ actions. V has no input through which to say "but I would act differently".',
  },
  {
    prompt: 'Why does fitting Q(s, a) fix that?',
    options: [
      'Q has more parameters',
      'The action is an input, so a stored transition is a valid example for that action whoever chose it',
      'Q does not use rewards',
      'Q is always unbiased',
    ],
    answer: 1,
    explain: 'What still has to come from the current policy is the next action in the target, which is sampled fresh.',
  },
  {
    prompt: 'How does the off-policy actor-critic target differ from Q-learning’s?',
    options: [
      'It has no discount',
      'It uses Q(s′, ā′) with ā′ sampled from the current policy, where Q-learning uses the max over actions',
      'It uses the return',
      'It ignores the next state',
    ],
    answer: 1,
    explain: 'One evaluates the current policy, the other the greedy one. The lab’s second "things to try" swaps one for the other.',
  },
  {
    prompt: 'What does "coverage" mean for off-policy learning?',
    options: [
      'The buffer must be very large',
      'The data must contain the actions the current policy would take',
      'Every state must be visited equally often',
      'The policy must be deterministic',
    ],
    answer: 1,
    explain: 'Q for an action that never appears in the data is a guess. This problem becomes the whole subject in offline RL, Week 9.',
  },
  {
    prompt: 'According to the lecture’s guidance, when is PPO the better choice over SAC?',
    options: [
      'When real-world data is expensive',
      'When stability and ease of use matter more than data efficiency, for example with a cheap simulator',
      'When actions are continuous',
      'Never',
    ],
    answer: 1,
    explain: 'PPO is stable and close to plug-and-play but data-hungry. SAC is far more data-efficient and needs more tuning.',
  },
]
