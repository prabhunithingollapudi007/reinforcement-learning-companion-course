import type { Question } from '../components/Quiz'

export const week12Quiz: Question[] = [
  {
    prompt: 'How does search differ from value iteration?',
    options: [
      'Search does not need a model',
      'Search works out a good action for the current state only, instead of values for every state',
      'Search only works with deterministic rewards',
      'Search needs a neural network',
    ],
    answer: 1,
    explain: 'Both use a model. Value iteration sweeps the whole state space; search spends its effort on the part reachable from where you are now.',
  },
  {
    prompt: 'In the playground, flat Monte Carlo search picks B more reliably as its budget grows, although A is the best move. Why?',
    options: [
      'Its estimates are too noisy',
      'It grades each move by random play afterwards, and under random play A really is worse than B',
      'It does not run enough simulations',
      'It has a bug in the backup step',
    ],
    answer: 1,
    explain: 'It estimates the value of each move under the rollout policy. More samples make that estimate more exact, and it is an exact answer to the wrong question.',
  },
  {
    prompt: 'What does UCT add to plain Monte Carlo tree search?',
    options: [
      'A neural network for evaluating leaves',
      'A rule for choosing actions inside the tree: the upper confidence bound from bandits, applied at every node',
      'A learned model of the world',
      'Discounting of future rewards',
    ],
    answer: 1,
    explain: 'Each node is treated as a bandit: average result plus a bonus that shrinks as the action is tried more.',
  },
  {
    prompt: 'What happens in the playground when the exploration constant c is set too low?',
    options: [
      'The search explores every branch equally',
      'The search commits early to whatever looked good first, and is slow to find the best line',
      'The tree stops growing',
      'Nothing changes',
    ],
    answer: 1,
    explain: 'With c = 0.3 the search picks A in only half the runs at 200 simulations, against 90% with c = 0.5.',
  },
  {
    prompt: 'In AlphaZero, what replaces the random playout from a newly reached position?',
    options: [
      'A longer search',
      'The value output of the network',
      'A lookup in a database of human games',
      'Nothing: playouts are still used',
    ],
    answer: 1,
    explain: 'The network returns a value estimate for the position, so the search does not need to play to the end of the game.',
  },
  {
    prompt: 'What is the policy head of the AlphaZero network trained to predict?',
    options: [
      'The moves of human experts',
      'The distribution of visit counts the search produced at that position',
      'A uniform distribution over legal moves',
      'The move with the highest immediate reward',
    ],
    answer: 1,
    explain: 'Search is the improvement step. Its visit counts are a better policy than the prior it started from, and the network is trained toward them.',
  },
  {
    prompt: 'A model has a one-step error of about 1%. Why can a 60-step rollout still be badly wrong?',
    options: [
      'The model forgets its training data',
      'Each step starts from the slightly wrong output of the one before, so errors accumulate',
      'Rollouts use a different model',
      'The reward function changes over time',
    ],
    answer: 1,
    explain: 'In the playground, a 0.0099 error after one step becomes 0.32 after sixty. The model was only ever trained to get single steps right.',
  },
  {
    prompt: 'Why does MBPO start its imagined rollouts from real states in the replay buffer and keep them short?',
    options: [
      'To save memory',
      'So imagined data stays close to where the model was trained and its errors have little room to compound',
      'Because long rollouts are slower to compute',
      'Because the policy cannot be evaluated far from the start state',
    ],
    answer: 1,
    explain: 'Many short branches from real states cover the same ground as one long rollout, without the accumulated drift.',
  },
  {
    prompt: 'What is an ensemble of models used for in model-based RL?',
    options: [
      'To make each prediction faster',
      'To estimate where the model is unreliable: the members disagree where data was thin',
      'To increase the number of actions',
      'To avoid collecting real data altogether',
    ],
    answer: 1,
    explain: 'Disagreement can be measured without knowing the truth, and it grows where the true error grows. Rollouts can be stopped or penalised there.',
  },
  {
    prompt: 'In model predictive control, why is only the first action of the best plan executed?',
    options: [
      'The other actions are random',
      'Replanning from the real next state corrects for model error before it can build up',
      'Executing more would be too slow',
      'The model only predicts one step',
    ],
    answer: 1,
    explain: 'The plan is made in imagination. After one real step you know where you actually are, so you plan again from there.',
  },
]
