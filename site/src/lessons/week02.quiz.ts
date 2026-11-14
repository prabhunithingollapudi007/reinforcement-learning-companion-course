import type { Question } from '../components/Quiz'

export const week02Quiz: Question[] = [
  {
    prompt: 'Which pair of ideas does TD(0) use?',
    options: ['Sampling but not bootstrapping', 'Bootstrapping but not sampling', 'Both sampling and bootstrapping', 'Neither'],
    answer: 2,
    explain: 'It samples one real transition (like Monte Carlo) and then uses its own estimate of the next state (like dynamic programming). Monte Carlo only samples; dynamic programming only bootstraps.',
  },
  {
    prompt: 'An episode visits s₃, s₂, s₂, s₁ and then ends with reward 1; all other rewards are 0. What is the first-visit Monte Carlo return credited to s₂?',
    options: ['γ', 'γ²', '(γ² + γ) / 2', '1'],
    answer: 1,
    explain: 'From the first visit to s₂ there are two more steps before the reward, so the return is γ². Every-visit Monte Carlo would average that with γ, the return from the second visit.',
  },
  {
    prompt: 'After that same single episode, with all values starting at zero and α = 1, which states has TD(0) learned a non-zero value for?',
    options: ['s₁ only', 's₁ and s₂', 's₁, s₂ and s₃', 'None'],
    answer: 0,
    explain: 'When TD passed through s₃ and s₂, the next state was still valued at zero and the reward was zero, so the target was zero. Only the final step, with its real reward of 1, changed anything. TD passes information back one state per visit.',
  },
  {
    prompt: 'Why is the TD target biased?',
    options: [
      'It uses a discount factor',
      'It depends on the current estimate of the next state, which is wrong early in learning',
      'It only uses one reward',
      'It ignores the policy',
    ],
    answer: 1,
    explain: 'If V(s′) is off by some amount, the target inherits γ times that error. The bias fades as the estimates improve, which is why TD is still consistent.',
  },
  {
    prompt: 'Why do Monte Carlo targets have higher variance than TD targets?',
    options: [
      'They use a larger learning rate',
      'A return sums the randomness of every remaining step of the episode; a TD target contains one random step',
      'They are computed backwards',
      'They assume the state is Markov',
    ],
    answer: 1,
    explain: 'In the corridor a return is either 1 or 10 depending on a long sequence of coin flips, while the TD target for the middle state is just the value of one of its two neighbours.',
  },
  {
    prompt: 'In the A/B example (one episode A, 0, B, 0; six episodes B, 1; one episode B, 0), what does batch TD(0) converge to for V(A)?',
    options: ['0', '0.5', '0.75', '1'],
    answer: 2,
    explain: 'TD learns that A always leads to B with reward 0, so V(A) = V(B) = 6/8 = 0.75. Batch Monte Carlo says 0, the only return ever observed from A.',
  },
  {
    prompt: 'Which method makes no use of the Markov assumption?',
    options: ['Dynamic programming', 'TD(0)', 'Certainty equivalence', 'Monte Carlo'],
    answer: 3,
    explain: 'Monte Carlo just averages returns that followed each state. The other three all rely on the next state summarising the future.',
  },
  {
    prompt: 'A task never terminates: the agent runs forever. Which method can still be used as described this week?',
    options: ['Monte Carlo', 'TD(0)', 'Both', 'Neither'],
    answer: 1,
    explain: 'Monte Carlo has to wait for the end of an episode to know the return. TD updates after every single step.',
  },
  {
    prompt: 'Averaging N returns exactly is the same as the incremental update with which learning rate?',
    options: ['α = 1', 'α = 1/N', 'α = N', 'A constant α below 1'],
    answer: 1,
    explain: 'V_N = V_{N−1} + (1/N)(G_N − V_{N−1}). A constant α instead weights recent returns more, which is useful when the thing being estimated is changing.',
  },
  {
    prompt: 'You have very little data and can afford a lot of computation. Which approach uses the data most efficiently?',
    options: ['One pass of Monte Carlo', 'One pass of TD(0)', 'Certainty equivalence: fit a model, then solve it', 'It makes no difference'],
    answer: 2,
    explain: 'Fitting the maximum-likelihood model and solving it squeezes the most out of each transition, at the cost of re-solving a model as data arrives. The lecture calls it very data efficient and very computationally expensive.',
  },
]
