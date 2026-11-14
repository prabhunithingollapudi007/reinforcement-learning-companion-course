import type { Question } from '../components/Quiz'

export const week05Quiz: Question[] = [
  {
    prompt: 'In the aliased corridor, why can a policy-based method do better than a value-based one?',
    options: [
      'It learns faster',
      'The best policy is stochastic, and a greedy policy is deterministic',
      'It has access to the model',
      'It uses a larger network',
    ],
    answer: 1,
    explain: 'The two grey cells look the same, so the agent must behave the same in both. Any fixed direction traps it on one side; a coin flip reaches the goal in 4.5 steps on average.',
  },
  {
    prompt: 'In V(θ) = Σ P(τ; θ) R(τ), where does θ appear?',
    options: ['Only in R(τ)', 'Only in P(τ; θ)', 'In both', 'In neither'],
    answer: 1,
    explain: 'The policy changes how likely each trajectory is, not what a given trajectory is worth. That is why the reward function never needs to be differentiated.',
  },
  {
    prompt: 'Why does the policy gradient not need the dynamics model?',
    options: [
      'The dynamics are assumed deterministic',
      'In log P(τ; θ) the dynamics terms do not contain θ, so their gradient is zero',
      'The dynamics are learned separately',
      'It uses a value function instead',
    ],
    answer: 1,
    explain: 'log P(τ; θ) is a sum of log μ(s₀), log π terms and log P(s′|s,a) terms. Only the π terms depend on θ.',
  },
  {
    prompt: 'What is the score function?',
    options: ['The return of an episode', '∇θ log πθ(a | s)', 'The baseline', 'The TD error'],
    answer: 1,
    explain: 'It is the direction in parameter space that makes the action a more likely in state s.',
  },
  {
    prompt: 'The score-function gradient estimator requires which of these?',
    options: [
      'A differentiable reward function',
      'A Markov state',
      'An infinite horizon',
      'None of the above',
    ],
    answer: 3,
    explain: 'This is the lecture’s check. The estimator needs only sampled episodes and a differentiable policy. The reward can be discontinuous or unknown, and nothing in the derivation used the Markov property.',
  },
  {
    prompt: 'Why is it valid to weight an action by its reward-to-go instead of the whole episode’s return?',
    options: [
      'Earlier rewards are always zero',
      'An action cannot influence rewards that came before it, so those terms only add noise',
      'It makes the estimate biased but cheaper',
      'It removes the need for a baseline',
    ],
    answer: 1,
    explain: 'The earlier rewards contribute zero in expectation to that action’s gradient term, so dropping them leaves the estimate unbiased with lower variance.',
  },
  {
    prompt: 'Subtracting a baseline b(s) from the return changes the gradient estimate how?',
    options: [
      'It changes the mean and the variance',
      'It leaves the mean unchanged and can reduce the variance',
      'It introduces bias but reduces variance',
      'It has no effect',
    ],
    answer: 1,
    explain: 'E[∇ log π(a|s) b(s)] = b(s) ∇ Σ π(a|s) = b(s) ∇1 = 0, as long as b does not depend on the action.',
  },
  {
    prompt: 'In the playground, adding +5 to every reward with no baseline made learning erratic. Why, when the best action had not changed?',
    options: [
      'The learning rate became too small',
      'Every sampled action now gets a large positive weight, so the update is dominated by which actions happened to be sampled',
      'The policy gradient became biased',
      'The reward function became non-differentiable',
    ],
    answer: 1,
    explain: 'The estimator is still unbiased, but its spread grew about tenfold. Signal about which actions are better is swamped by a term that would cancel only on average.',
  },
  {
    prompt: 'What does the policy gradient theorem say the gradient is?',
    options: [
      'E[∇θ log πθ(a|s) Q^π(s,a)]',
      'E[∇θ Q^π(s,a)]',
      'E[Q^π(s,a)]',
      'E[∇θ log πθ(a|s)]',
    ],
    answer: 0,
    explain: 'The score weighted by the action value. REINFORCE estimates Q with the sampled reward-to-go.',
  },
  {
    prompt: 'Why is plain policy gradient sample-hungry?',
    options: [
      'It needs a replay buffer',
      'The expectation is over the current policy, so each update needs fresh episodes from it',
      'It needs the model',
      'It can only use one episode per update',
    ],
    answer: 1,
    explain: 'Episodes collected with an older θ come from a different distribution. Reusing them takes a correction, which is where next week starts.',
  },
]
