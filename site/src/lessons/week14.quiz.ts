import type { Question } from '../components/Quiz'

export const week14Quiz: Question[] = [
  {
    prompt: 'If each step of a task goes right 99% of the time and one wrong step spoils it, roughly how often does a 200-step task succeed in one attempt?',
    options: ['99%', '50%', '13%', '1%'],
    answer: 2,
    explain: '0.99 to the power 200 is about 0.134. Reliability per step has to be extraordinarily high for long unbroken tasks.',
  },
  {
    prompt: 'In the "Long tasks are fragile" playground, what happens when the task is cut into pieces but no retries are allowed?',
    options: [
      'Success improves a lot',
      'Nothing changes: the two lines coincide',
      'Success gets worse',
      'The task gets shorter',
    ],
    answer: 1,
    explain: 'Cutting changes nothing by itself. The gain comes from a higher level that notices a failed piece and asks for it again.',
  },
  {
    prompt: 'In a two-level policy, what does the low-level policy take as input?',
    options: [
      'Only the overall task description',
      'The observation and the current subgoal',
      'Only the subgoal',
      'The reward of the overall task',
    ],
    answer: 1,
    explain: 'The low level is a goal-conditioned policy π(a | o, g). It does not need to know the overall task at all.',
  },
  {
    prompt: 'In four rooms, why did the agent with door-seeking skills take longer than the flat agent in its first episode?',
    options: [
      'Its skills were too slow to execute',
      'Random use of the skills kept pulling it to doorways, and the goal is not at a doorway',
      'It had fewer choices',
      'It could not make single moves',
    ],
    answer: 1,
    explain: 'Skills shape exploration. These ones concentrate the agent where the goal is not: 4,529 steps on average against 784.',
  },
  {
    prompt: 'Why does the subgoal agent learn so much faster than the flat agent once the goal has been found?',
    options: [
      'It uses a larger learning rate',
      'The goal is three decisions away instead of seventeen, so reward propagates back in far fewer updates',
      'It receives more reward',
      'It does not need to explore',
    ],
    answer: 1,
    explain: 'One-step Q-learning moves value back one decision per visit. Fewer, longer decisions shorten the chain.',
  },
  {
    prompt: 'In the SMDP Q-learning update for a skill that ran for k steps, how is the value of the state where it ended discounted?',
    options: ['By γ', 'By γ to the power k', 'By k times γ', 'It is not discounted'],
    answer: 1,
    explain: 'k steps of time passed, so the future is worth γ^k of its value. With k = 1 this is ordinary Q-learning.',
  },
  {
    prompt: 'Why not make the subgoal a learned latent vector and train both levels end to end on the task reward?',
    options: [
      'It is impossible to backpropagate through two networks',
      'Nothing forces the vector to carry meaning, so the result is effectively a flat policy without the benefits',
      'Latent vectors cannot be used as inputs',
      'It would require too little data',
    ],
    answer: 1,
    explain: 'The gains of hierarchy come from supervision or structure placed on the subgoal. Remove that and you have one network with a bottleneck.',
  },
  {
    prompt: 'Which rule for switching subgoals is more forgiving of errors?',
    options: [
      'Switch only when the subgoal is detected as complete',
      'Replan every n steps',
      'Never switch',
      'Switch at random',
    ],
    answer: 1,
    explain: 'A wrong "not done" verdict can leave the agent stuck indefinitely. With fixed-interval replanning a bad subgoal costs at most n steps.',
  },
  {
    prompt: 'A person tells a robot "no, pour into the bag" while it works. In the hierarchical imitation system described, what is that correction used for?',
    options: [
      'Retraining the low-level policy from scratch',
      'DAgger-style data for the high-level policy, with the low level frozen',
      'Changing the reward function',
      'Nothing: it is discarded',
    ],
    answer: 1,
    explain: 'The correction is the right subgoal for that situation, exactly the label the high level needs. No new robot demonstrations are required.',
  },
  {
    prompt: 'What is one advantage of image subgoals over language subgoals?',
    options: [
      'They are always easier for the low level to reach',
      'The high level can be trained on unlabelled video, including video of people',
      'They need no high-level policy',
      'They remove the need for a low-level policy',
    ],
    answer: 1,
    explain: 'Predicting a future frame needs neither action labels nor language annotations, so far more data qualifies.',
  },
]
