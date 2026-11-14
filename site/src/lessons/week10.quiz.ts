import type { Question } from '../components/Quiz'

export const week10Quiz: Question[] = [
  {
    prompt: 'How does a multi-armed bandit differ from an MDP?',
    options: [
      'It has no rewards',
      'It has no states: an action affects only its own immediate reward',
      'It has a known model',
      'It has continuous actions',
    ],
    answer: 1,
    explain: 'That removes delayed consequences and leaves the exploration problem on its own.',
  },
  {
    prompt: 'What is regret?',
    options: [
      'The variance of the reward',
      'The total reward given up by not always choosing the best arm',
      'The number of arms not yet tried',
      'The difference between two arms’ estimates',
    ],
    answer: 1,
    explain: 'It can be written as the sum over arms of (expected pulls of the arm) × (its gap to the best arm).',
  },
  {
    prompt: 'Why can the greedy algorithm have linear regret?',
    options: [
      'It explores too much',
      'An unlucky early result can make it abandon the best arm and never try it again',
      'It cannot compute averages',
      'It needs a prior',
    ],
    answer: 1,
    explain: 'In the playground about a third of greedy runs were still mostly pulling a worse arm after 1000 pulls.',
  },
  {
    prompt: 'ε-greedy with a fixed ε = 0.1 never locks on to a bad arm. Why is its regret still linear?',
    options: [
      'It forgets its estimates',
      'It keeps pulling a random arm 10% of the time forever, even once it knows which arms are bad',
      'Its estimates are biased',
      'It never pulls the best arm',
    ],
    answer: 1,
    explain: 'Each random pull costs the average gap. That constant cost per step adds up to a straight line.',
  },
  {
    prompt: 'What does the UCB1 rule pull at each step?',
    options: [
      'The arm with the highest average',
      'The arm with the highest average plus a bonus that is larger for arms pulled less often',
      'A random arm',
      'The arm pulled least often',
    ],
    answer: 1,
    explain: 'The bonus √(2 log t / N) is an upper confidence bound on how far the true mean could be above the average.',
  },
  {
    prompt: 'Why is acting optimistically a safe way to explore?',
    options: [
      'Optimistic estimates are always correct',
      'If the optimistic arm is good you gain reward; if not, pulling it lowers its bound so you stop',
      'It avoids uncertain arms',
      'It needs no data',
    ],
    answer: 1,
    explain: 'Either outcome is acceptable. Pessimism has no such property: an arm believed bad is never pulled, so the belief is never corrected.',
  },
  {
    prompt: 'In Thompson sampling with Beta beliefs, what happens at each step?',
    options: [
      'The arm with the highest posterior mean is pulled',
      'One value is sampled from each arm’s belief and the arm with the highest sample is pulled',
      'Every arm is pulled once',
      'The arm with the widest belief is pulled',
    ],
    answer: 1,
    explain: 'Sampling makes each arm’s chance of being pulled match the probability that it is the best one.',
  },
  {
    prompt: 'An arm has paid out 3 times in 10 pulls, starting from a Beta(1, 1) belief. What is the belief now?',
    options: ['Beta(3, 7)', 'Beta(4, 8)', 'Beta(3, 10)', 'Beta(10, 3)'],
    answer: 1,
    explain: 'Add successes to the first parameter and failures to the second: Beta(1 + 3, 1 + 7).',
  },
  {
    prompt: 'In the playground UCB was behind ε-greedy after 1000 pulls but ahead after 3000. What does that illustrate?',
    options: [
      'UCB is incorrect for short runs',
      'A guarantee on how regret grows does not say which method leads early; UCB explores more up front and is repaid later',
      'ε-greedy has logarithmic regret',
      'The simulation was wrong',
    ],
    answer: 1,
    explain: 'ε-greedy’s line keeps a constant slope while UCB’s flattens, so UCB must overtake it eventually. How long that takes depends on the problem.',
  },
  {
    prompt: 'What is the best possible growth rate of regret for any bandit algorithm?',
    options: ['Constant', 'Logarithmic in the number of steps', 'Square root', 'Linear'],
    answer: 1,
    explain: 'The Lai–Robbins lower bound. The constant in front grows as the arms become harder to tell apart.',
  },
]
