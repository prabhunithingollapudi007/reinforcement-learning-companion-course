import type { Question } from '../components/Quiz'

export const week01Quiz: Question[] = [
  {
    prompt: 'An agent uses a discount factor close to 1. Compared with a small γ, what does it care about more?',
    options: ['Immediate rewards', 'Rewards far in the future', 'Only the final reward of the episode', 'Nothing changes; γ only affects convergence speed'],
    answer: 1,
    explain: 'The weight on a reward t steps away is γᵗ, so a large γ keeps distant rewards relevant. γ = 0 would count only the immediate reward. (γ does also affect convergence speed, but that is a side effect.)',
  },
  {
    prompt: 'A world has 7 states and 2 actions. How many deterministic policies are there?',
    options: ['14', '49', '128', '5040'],
    answer: 2,
    explain: 'A deterministic policy picks one of 2 actions in each of 7 states independently: 2⁷ = 128. In general |A| to the power |S|, which is why enumerating policies is hopeless.',
  },
  {
    prompt: 'You fix a policy π in an MDP. What kind of object is left?',
    options: ['A Markov chain with no rewards', 'A Markov reward process', 'A smaller MDP', 'A bandit problem'],
    answer: 1,
    explain: 'With the action choice fixed, the dynamics become P^π and the rewards R^π: a Markov reward process. That is why policy evaluation needs no new machinery.',
  },
  {
    prompt: 'Value iteration starts from V₀ = 0. What does V_k(s) mean after k sweeps?',
    options: [
      'The value of the greedy policy at sweep k',
      'The best expected return achievable from s with exactly k decisions left',
      'A lower bound on V* with no other meaning',
      'The value of a uniformly random policy over k steps',
    ],
    answer: 1,
    explain: 'Each sweep extends the horizon by one step, so V_k is the optimal k-step value. It is generally not the value of the greedy policy read off V_k, which is one reason that policy is not guaranteed to improve every sweep.',
  },
  {
    prompt: 'In policy iteration, a round ends with the policy unchanged. What follows?',
    options: [
      'It may still change in a later round',
      'The policy is optimal and will never change again',
      'The evaluation step must have been inaccurate',
      'Nothing can be concluded without checking the values',
    ],
    answer: 1,
    explain: 'If improvement returns the same policy, that policy is greedy with respect to its own value function, which is exactly the Bellman optimality condition. The next round would compute the same Q-values and the same argmax.',
  },
  {
    prompt: 'With γ = 0.9, how much is the worst-case error of value iteration guaranteed to shrink over 10 sweeps?',
    options: ['By a factor of 0.9', 'By a factor of about 0.35', 'By a factor of 10', 'There is no guarantee'],
    answer: 1,
    explain: 'The Bellman backup is a γ-contraction in the max norm, so 10 sweeps multiply the error bound by 0.9¹⁰ ≈ 0.35. In the convergence playground the measured error often falls faster; the bound is a worst case.',
  },
  {
    prompt: 'In a finite-horizon problem, is the optimal policy stationary (the same at every time step)?',
    options: ['Yes, always', 'In general no: the best action can depend on how many steps remain', 'Only if γ = 1', 'Only if the dynamics are deterministic'],
    answer: 1,
    explain: 'With two steps left, a reward ten steps away is unreachable and should be ignored; with twenty left it may be worth walking to. Infinite-horizon discounted problems are the ones with a stationary optimal policy.',
  },
  {
    prompt: 'In the gridworld, raising the slip probability from 0 to 0.1 flips the route from 7 moves to 9. Why?',
    options: [
      'Value iteration has not converged at higher slip',
      'The long route collects more reward',
      'Each move beside a pit now risks −1, which outweighs discounting two extra moves',
      'Slipping changes the discount factor',
    ],
    answer: 2,
    explain: 'The reward at the goal is the same on both routes. The short route makes three moves along the row above the pits, each now carrying a 5% chance of slipping in; the long route pays only γ² ≈ 0.81 on the final reward.',
  },
  {
    prompt: 'Which statement about state and observation is right?',
    options: [
      'They are the same thing by definition',
      'The Markov property holds for any observation the agent receives',
      'An observation may omit information; the Markov property is assumed of the state',
      'Observations are only needed in continuous problems',
    ],
    answer: 2,
    explain: 'A single camera frame does not show velocity, for example. The usual fixes are to treat a short history of observations as the state, or to model partial observability explicitly.',
  },
  {
    prompt: 'What do value iteration and policy iteration, as presented this week, both require that an RL agent usually lacks?',
    options: ['A discount factor below 1', 'The transition probabilities and reward function', 'A deterministic environment', 'A neural network'],
    answer: 1,
    explain: 'Every backup sums over next states weighted by P(s′|s,a). Without the model that sum cannot be computed, only sampled. Replacing the sum with samples is next week.',
  },
]
