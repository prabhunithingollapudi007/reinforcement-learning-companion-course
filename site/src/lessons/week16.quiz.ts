import type { Question } from '../components/Quiz'

export const week16Quiz: Question[] = [
  {
    prompt: 'Which of these is a non-parametric mismatch between a simulator and reality?',
    options: [
      'The simulated robot is 10% lighter than the real one',
      'The simulator does not model air flow around the robot at all',
      'The friction coefficient is set too high',
      'The motor strength is slightly off',
    ],
    answer: 1,
    explain: 'Parametric errors are wrong numbers in the right equations. A missing effect cannot be fixed by tuning any number.',
  },
  {
    prompt: 'What does domain randomisation train?',
    options: [
      'A separate policy for each possible value of the physics',
      'A single policy that works across a range of simulated physics',
      'A more accurate simulator',
      'A policy on the real robot only',
    ],
    answer: 1,
    explain: 'It is robust control by sampling: one policy, many worlds. The real world is hoped to be one of them.',
  },
  {
    prompt: 'In the puck playground, why is the range-tuned policy worse than the single-simulator policy on a floor of friction 0.60?',
    options: [
      'It was trained for fewer steps',
      'It chose a cautious speed to limit big overshoots on slippery floors, which falls short on sticky ones',
      'It measures friction incorrectly',
      'It has a bug',
    ],
    answer: 1,
    explain: 'One fixed behaviour for many worlds is a compromise. It is 46 cm short there, against 33 cm for the policy tuned to 0.40.',
  },
  {
    prompt: 'In teacher-student training, what does the student receive as input?',
    options: [
      'The same privileged information as the teacher',
      'Only what a real robot can sense, such as a recent history of its own sensor readings',
      'The reward signal',
      'Human demonstrations',
    ],
    answer: 1,
    explain: 'The student has to infer friction, payload and terrain from how the robot has been responding, because nobody will tell it on the real robot.',
  },
  {
    prompt: 'How is the student trained?',
    options: [
      'By RL on the real robot',
      'By imitating the teacher’s actions in simulation',
      'By system identification',
      'By domain randomisation alone',
    ],
    answer: 1,
    explain: 'It is an imitation-learning problem with a perfect expert that can be queried in any state, so DAgger applies directly.',
  },
  {
    prompt: 'A pretrained policy succeeds at each stage of a five-stage task 80% of the time. Roughly how often does the whole task succeed?',
    options: ['80%', '64%', '33%', '5%'],
    answer: 2,
    explain: '0.8 to the fifth power is about 0.33. At 99% per stage it would be 95%. This is why the last few points of reliability matter so much.',
  },
  {
    prompt: 'Why does retraining a policy on its own successful attempts improve it?',
    options: [
      'Successes contain more data',
      'Options with higher success rates are over-represented among the successes, so the refit policy favours them',
      'It increases the learning rate',
      'It removes the need for a reward',
    ],
    answer: 1,
    explain: 'The new share of an option is its old share times its success rate, renormalised. The gain equals the variance of success rates divided by the mean.',
  },
  {
    prompt: 'Why is that rule slow once the policy is already fairly good?',
    options: [
      'The dataset gets too large',
      'When the remaining options have similar success rates, their variance, and so the improvement, is small',
      'The policy forgets earlier rounds',
      'Successes become impossible to detect',
    ],
    answer: 1,
    explain: 'A success with an 85% method still counts as a success. Telling 85% from 99% needs a comparison with what the policy usually achieves: an advantage.',
  },
  {
    prompt: 'What makes the advantage-conditioned recipe suit very large models?',
    options: [
      'It needs no data',
      'Every step is supervised learning on stored data: fit a value function by regression, label, retrain',
      'It requires a perfect simulator',
      'It uses policy gradients through the whole model at every robot step',
    ],
    answer: 1,
    explain: 'Supervised learning on a fixed batch is what large models are easiest to train with, and a mistake costs a retraining run, not a new round of robot time.',
  },
  {
    prompt: 'What is the idea behind training a small policy beside a frozen large one?',
    options: [
      'The small policy replaces the large one',
      'The small policy steers the large one, for example by choosing its starting noise or correcting its action, and only the small one is trained by RL',
      'The large policy trains the small one by imitation',
      'It removes the need for rewards',
    ],
    answer: 1,
    explain: 'It sidesteps the size of the model, its lack of a critic and its awkward action head, and can learn in tens of episodes.',
  },
]
