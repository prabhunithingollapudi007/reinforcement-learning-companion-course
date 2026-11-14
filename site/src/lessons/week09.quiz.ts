import type { Question } from '../components/Quiz'

export const week09Quiz: Question[] = [
  {
    prompt: 'What can offline RL do that behaviour cloning on the same dataset cannot?',
    options: [
      'Run without any data',
      'Use the rewards to do better than the policy that collected the data, including stitching parts of different trajectories',
      'Explore new actions safely',
      'Avoid needing a policy network',
    ],
    answer: 1,
    explain: 'Cloning reproduces the data’s behaviour, good and bad alike. With rewards, the good parts can be told apart and recombined.',
  },
  {
    prompt: 'Two recorded trajectories cross at one state; the first ends badly, the second well. What does plain imitation do at the crossing?',
    options: [
      'Always follows the better continuation',
      'Copies both continuations, in proportion to how often each appears',
      'Refuses to act',
      'Follows the first trajectory',
    ],
    answer: 1,
    explain: 'It has no notion of better. A method that propagates reward backwards values the crossing by its better continuation.',
  },
  {
    prompt: 'Why does a standard off-policy actor-critic tend to fail on a fixed dataset?',
    options: [
      'The dataset is too small to fit a network',
      'The critic is queried on actions not in the data, some of those estimates are too high, and the policy moves toward them',
      'Rewards are missing',
      'The discount factor is too large',
    ],
    answer: 1,
    explain: 'The target uses the current policy’s action at the next state. Online, new data would correct an overestimate; offline, nothing does.',
  },
  {
    prompt: 'In the playground, acting on the critic’s highest-rated action anywhere expected about 1.2 and received about 0.5. What explains the gap?',
    options: [
      'The reward was noisy',
      'The highest rating was usually for an action outside the data, where the estimate is unrelated to the truth',
      'The critic was underfitted inside the data',
      'The discount was wrong',
    ],
    answer: 1,
    explain: 'Taking a maximum over many unreliable estimates selects for the ones that are wrong upward: maximisation bias, with no data to rein it in.',
  },
  {
    prompt: 'What is filtered behaviour cloning?',
    options: [
      'Cloning with a smaller network',
      'Keeping only the highest-return trajectories and imitating those',
      'Cloning with noise added to the actions',
      'Imitating only the first step of each trajectory',
    ],
    answer: 1,
    explain: 'It is the most basic use of reward information, and a baseline any offline RL method should beat.',
  },
  {
    prompt: 'In advantage-weighted regression, which actions is the policy trained on?',
    options: [
      'Actions sampled from the current policy',
      'Only actions in the dataset, each weighted by exp(advantage / α)',
      'Random actions',
      'The critic’s argmax',
    ],
    answer: 1,
    explain: 'Because every training action comes from the data, the policy is never pushed toward something untested.',
  },
  {
    prompt: 'What does expectile regression with τ = 0.9 give you, compared with ordinary squared error?',
    options: [
      'The mean',
      'A value above the mean, weighted toward the higher targets, without exceeding the largest',
      'The median',
      'The minimum',
    ],
    answer: 1,
    explain: 'In IQL this estimates the value of acting better than the data’s policy, using only actions that are in the data.',
  },
  {
    prompt: 'The old policy only ever acted far from the best action. What can an offline method achieve?',
    options: [
      'It finds the best action anyway by generalising',
      'At most the best that can be assembled from the actions that appear in the data',
      'Nothing at all',
      'The same as online RL',
    ],
    answer: 1,
    explain: 'Coverage sets the ceiling. Conservative methods are safe exactly because they do not venture where the data is silent.',
  },
  {
    prompt: 'A person prefers trajectory A to trajectory B. How does preference-based reward learning model this?',
    options: [
      'r(A) = 1 and r(B) = 0',
      'P(A preferred) = σ(r(A) − r(B)), fit by maximum likelihood',
      'r(A) − r(B) must equal exactly 1',
      'By regressing r onto the person’s numeric score',
    ],
    answer: 1,
    explain: 'It is logistic regression on reward differences (the Bradley–Terry model). Only comparisons are needed, never absolute scores.',
  },
  {
    prompt: 'Why can a reward classifier trained once in advance be exploited by RL?',
    options: [
      'Classifiers cannot output rewards',
      'The policy seeks out states the classifier rates highly, including ones it was never trained on and rates highly by mistake',
      'RL ignores learned rewards',
      'The classifier is too slow',
    ],
    answer: 1,
    explain: 'The same failure as with an offline critic. The fix is to keep training the classifier with the policy’s visited states as negatives.',
  },
]
