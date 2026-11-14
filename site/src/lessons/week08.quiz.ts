import type { Question } from '../components/Quiz'

export const week08Quiz: Question[] = [
  {
    prompt: 'What does behaviour cloning need that the methods of Weeks 2 to 7 did not, and what does it not need?',
    options: [
      'Needs a model; does not need data',
      'Needs expert demonstrations; does not need a reward function or data from the learned policy',
      'Needs a reward; does not need demonstrations',
      'Needs a replay buffer; does not need a policy',
    ],
    answer: 1,
    explain: 'It is supervised learning on (state, expert action) pairs, done entirely offline.',
  },
  {
    prompt: 'Demonstrators pass an obstacle on the left or on the right. What does a policy trained with squared error output?',
    options: ['Left', 'Right', 'Something near straight ahead, the average', 'It alternates'],
    answer: 2,
    explain: 'Squared-error regression predicts the conditional mean. The mean of two good actions can be an action no demonstrator took.',
  },
  {
    prompt: 'Would a much larger network with the same single-action output fix that?',
    options: [
      'Yes, with enough capacity',
      'No: the limitation is the output distribution, not the network’s capacity',
      'Only with more data',
      'Only with a smaller learning rate',
    ],
    answer: 1,
    explain: 'The lecture stresses that network expressivity and distribution expressivity are different things. A perfect fit to the conditional mean is still the mean.',
  },
  {
    prompt: 'In flow matching, what is the network trained to predict from a blend of noise and a data point?',
    options: [
      'The reward',
      'The direction from the noise sample to the data point',
      'The time t',
      'The next state',
    ],
    answer: 1,
    explain: 'Blend x_t = t·x₁ + (1−t)·x₀ and regress the network’s output onto x₁ − x₀. Sampling follows that direction in small steps from noise.',
  },
  {
    prompt: 'In the playground, generating an action with a single step gave the same answer as regression. Why?',
    options: [
      'A bug in the sampler',
      'At the very start the sample is pure noise and says nothing about which mode it belongs to, so the best direction points at the mean',
      'One step is always exact',
      'The noise was too small',
    ],
    answer: 1,
    explain: 'The first step heads for the average of the data. Later steps, taken from where the sample has got to, can commit to one side.',
  },
  {
    prompt: 'What is covariate shift in imitation learning?',
    options: [
      'The expert changes policy over time',
      'The learned policy visits states that differ from the ones in the demonstrations',
      'The reward changes between training and testing',
      'The action space changes',
    ],
    answer: 1,
    explain: 'Unlike ordinary supervised learning, the policy’s own outputs determine its future inputs. Small errors move it off the training distribution.',
  },
  {
    prompt: 'With a per-step error probability ε, how does the expected number of mistakes over T steps grow in the worst case for a cloned policy?',
    options: ['Like ε', 'Like εT', 'Like εT²', 'Like ε²T'],
    answer: 2,
    explain: 'Once off the demonstrated states the policy may keep erring. Summing over when the first mistake happens gives roughly εT²/2.',
  },
  {
    prompt: 'What data does DAgger add at each round?',
    options: [
      'More expert demonstrations from the start state',
      'The states the learned policy visited, labelled with the expert’s actions for them',
      'The learned policy’s own actions',
      'Random states and random actions',
    ],
    answer: 1,
    explain: 'The states come from the learner, the labels from the expert. That puts the new data exactly where the learner needs it.',
  },
  {
    prompt: 'In the lane playground a perfect copy of the expert never failed, even with no corrections. What does that show?',
    options: [
      'Covariate shift does not exist',
      'The drift out of the data starts from the clone’s own small errors',
      'DAgger is unnecessary in practice',
      'The lane was too wide',
    ],
    answer: 1,
    explain: 'A perfect clone stays on the expert’s state distribution. Real clones are never perfect, and the gap compounds.',
  },
  {
    prompt: 'If an expert’s policy is optimal for some reward, how many reward functions are consistent with its behaviour?',
    options: ['Exactly one', 'A handful', 'Infinitely many', 'None'],
    answer: 2,
    explain: 'This is the lecture’s check. Scaling a reward keeps the same optimal policy, and the all-zero reward makes every policy optimal. Inverse RL needs an extra principle to choose.',
  },
]
