import type { Question } from '../components/Quiz'

export const week06Quiz: Question[] = [
  {
    prompt: 'Why is plain policy gradient sample-inefficient?',
    options: [
      'It needs a model of the environment',
      'Each batch is used for one gradient step and then discarded, because the gradient is an expectation under the current policy',
      'It can only use one episode at a time',
      'It requires a replay buffer',
    ],
    answer: 1,
    explain: 'After a step the policy has changed, so the old batch is no longer a sample from it. Using it again needs a correction, which is what the surrogate objective provides.',
  },
  {
    prompt: 'In the ridge playground, a learning rate of 10 left performance stuck at −1. Why could the policy not recover?',
    options: [
      'The learning rate decayed to zero',
      'It landed where performance is flat, so the gradient was zero and its own data gave no direction',
      'The gradient pointed the wrong way',
      'The critic diverged',
    ],
    answer: 1,
    explain: 'In supervised learning a bad step can be undone on the next batch. Here the policy generates its own data, and a bad policy generates uninformative data.',
  },
  {
    prompt: 'Why limit the KL divergence between old and new policies instead of the size of the parameter change?',
    options: [
      'KL is cheaper to compute',
      'Distance in parameter space is not distance in policy space: a small parameter change can be a large change in behaviour',
      'KL is symmetric',
      'Parameter changes cannot be measured',
    ],
    answer: 1,
    explain: 'What needs to stay small is the change in what the policy does, since that is what determines whether the old data still describes it.',
  },
  {
    prompt: 'The surrogate objective replaces the new policy’s state distribution with the old one. When is that a good approximation?',
    options: [
      'Always',
      'When the two policies are close in KL divergence',
      'When γ is small',
      'When the advantage is positive',
    ],
    answer: 1,
    explain: 'The error is bounded by a constant times the square root of the expected KL divergence. Close policies visit similar states.',
  },
  {
    prompt: 'For an action with positive advantage, what does the clipped objective do once the ratio exceeds 1 + ε?',
    options: [
      'Penalises the policy',
      'Goes flat: making the action even more likely earns nothing further',
      'Keeps increasing linearly',
      'Becomes negative',
    ],
    answer: 1,
    explain: 'The incentive to move further from the old policy is removed. The gradient from that sample is zero.',
  },
  {
    prompt: 'For an action with positive advantage, what if the ratio falls well below 1 − ε?',
    options: [
      'The objective is clipped at 1 − ε',
      'The objective keeps falling: the min picks the unclipped term, so the mistake is penalised in full',
      'The objective is zero',
      'The objective goes flat',
    ],
    answer: 1,
    explain: 'The clip only ever removes reward for moving in the good direction. It never hides a move in the bad direction. That is what the min is for.',
  },
  {
    prompt: 'What is GAE with λ = 0?',
    options: [
      'The full return minus the value',
      'The one-step TD error δ = r + γV(s′) − V(s)',
      'The reward alone',
      'Zero',
    ],
    answer: 1,
    explain: 'Only the l = 0 term of Σ (γλ)^l δ survives. It has low variance and inherits all of the critic’s bias.',
  },
  {
    prompt: 'Compared with λ = 1, how do the bias and variance of GAE with λ = 0 differ?',
    options: [
      'Higher bias, lower variance',
      'Lower bias, higher variance',
      'Both higher',
      'Both lower',
    ],
    answer: 0,
    explain: 'This is the lecture’s check. λ = 0 trusts the critic after one step (bias); λ = 1 uses the whole noisy return (variance).',
  },
  {
    prompt: 'In the λ playground, what happened to the best λ as the critic became less accurate?',
    options: ['It moved toward 0', 'It moved toward 1', 'It stayed at 0.5', 'It became undefined'],
    answer: 1,
    explain: 'With an exact critic the best λ was 0. With a critic 60% too low it was about 0.8. The less the critic can be trusted, the more real reward is worth its noise.',
  },
  {
    prompt: 'What does PPO do with one batch of data that plain policy gradient does not?',
    options: [
      'Stores it in a replay buffer forever',
      'Takes several epochs of minibatch gradient steps on it',
      'Uses it to learn a model',
      'Discards it without using it',
    ],
    answer: 1,
    explain: 'The clip keeps those repeated steps from carrying the policy too far from the one that collected the data.',
  },
]
