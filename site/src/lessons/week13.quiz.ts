import type { Question } from '../components/Quiz'

export const week13Quiz: Question[] = [
  {
    prompt: 'How does multi-task RL reduce to ordinary RL?',
    options: [
      'By training a separate policy for each task',
      'By appending a task identifier to the state, giving one larger MDP',
      'By averaging the reward functions of all the tasks',
      'By ignoring the differences between tasks',
    ],
    answer: 1,
    explain: 'With state (s, z), the collection of tasks is a single MDP, and any standard algorithm applies. The policy becomes π(a | s, z).',
  },
  {
    prompt: 'What is the point of building each minibatch with data from every task?',
    options: [
      'It makes the network smaller',
      'It lowers the variance of the gradient and stops any task from being neglected',
      'It removes the need for a task identifier',
      'It is required for on-policy learning',
    ],
    answer: 1,
    explain: 'This is stratified sampling. A batch drawn at random might contain little or nothing from some tasks.',
  },
  {
    prompt: 'Why is a sparse goal-reaching reward hard to learn from?',
    options: [
      'It is not a valid reward function',
      'Until the agent happens to reach the goal it was given, every reward it sees is zero',
      'It cannot be used with neural networks',
      'It makes the dynamics stochastic',
    ],
    answer: 1,
    explain: 'In the playground, only 8.7% of updates carried any signal after 200 episodes without relabelling.',
  },
  {
    prompt: 'What does hindsight relabelling do with an episode that failed to reach its goal?',
    options: [
      'Discards it',
      'Stores it again as if a state it did reach had been the goal, with rewards recomputed',
      'Repeats it until it succeeds',
      'Lowers the learning rate for it',
    ],
    answer: 1,
    explain: 'The same steps become a successful demonstration of reaching somewhere else. No new experience is needed.',
  },
  {
    prompt: 'Which of these is NOT required for relabelling to be valid?',
    options: [
      'The dynamics are the same across tasks',
      'The reward of the other task can be computed for stored transitions',
      'The learning algorithm is off-policy',
      'The original episode succeeded at its own task',
    ],
    answer: 3,
    explain: 'Relabelling is most useful precisely when the original attempt failed. The other three are the real requirements.',
  },
  {
    prompt: 'What is the difference between a multi-task policy and a meta-RL agent at test time?',
    options: [
      'The multi-task policy is told the task; the meta-RL agent has to work it out from a little experience',
      'The meta-RL agent is retrained from scratch on each new task',
      'The multi-task policy cannot use neural networks',
      'There is no difference',
    ],
    answer: 0,
    explain: 'A multi-task policy is conditioned on a given z. A meta-RL agent effectively has to infer z from its own first interactions.',
  },
  {
    prompt: 'What two changes turn an ordinary recurrent policy into a black-box meta-learner?',
    options: [
      'A larger hidden state and a lower learning rate',
      'Rewards are fed in as inputs, and memory is carried across episodes of the same task',
      'It is trained with supervised learning and evaluated with RL',
      'The action space is enlarged and the discount is removed',
    ],
    answer: 1,
    explain: 'With rewards as input and memory that persists, the network can notice what worked in episode 1 and act on it in episode 2.',
  },
  {
    prompt: 'In the lever playground, the practised agent pulls the clue first although it never pays. How was that learned?',
    options: [
      'It was programmed in',
      'The return credited to that pull includes the nine paying pulls it makes possible',
      'The clue has a hidden reward',
      'By imitation of UCB',
    ],
    answer: 1,
    explain: 'Immediate reward 0, return 9. Trying a lever at random has a higher immediate expected reward and a lower return.',
  },
  {
    prompt: 'Why does UCB score only 2 of 10 on the lever tasks?',
    options: [
      'UCB is a poor algorithm',
      'It knows nothing about the family, so it spends nine pulls trying each lever once',
      'It cannot handle deterministic rewards',
      'It was given fewer pulls',
    ],
    answer: 1,
    explain: 'UCB is built to do reasonably on any bandit. The practised agent is specialised to this family, which is the entire source of its advantage.',
  },
  {
    prompt: 'What is the main limitation of meta-RL?',
    options: [
      'It is slow on new tasks',
      'Meta-training is costly, and the result only helps on tasks resembling the training family',
      'It cannot explore',
      'It requires a known model',
    ],
    answer: 1,
    explain: 'The fast learner is paid for by slow learning over many tasks, and it has learned the structure of that family, not of every problem.',
  },
]
