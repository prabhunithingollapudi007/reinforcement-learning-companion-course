import type { Question } from '../components/Quiz'

export const week04Quiz: Question[] = [
  {
    prompt: 'What does a function approximator give you that a table cannot?',
    options: [
      'Guaranteed convergence',
      'Generalisation: a sensible value for states never visited',
      'Exact values for every state',
      'Freedom from needing rewards',
    ],
    answer: 1,
    explain: 'States share weights, so learning about one says something about similar ones. That same sharing is what breaks the convergence guarantees.',
  },
  {
    prompt: 'In the Q-learning update with function approximation, the target r + γ max Q(s′, a′; w) depends on w. How does the update treat it?',
    options: ['It differentiates through it', 'As a fixed number: only Q(s, a; w) is differentiated', 'It ignores the target', 'It replaces it with the return'],
    answer: 1,
    explain: 'This is the semi-gradient. It is simpler and works better in practice than the full gradient, but it means the update is not true gradient descent on any fixed loss.',
  },
  {
    prompt: 'Which three ingredients make up the deadly triad?',
    options: [
      'Exploration, exploitation, discounting',
      'Function approximation, bootstrapping, off-policy learning',
      'Replay, target networks, double Q',
      'Sampling, bootstrapping, Monte Carlo',
    ],
    answer: 1,
    explain: 'Any two together are safe. Q-learning with a neural network uses all three.',
  },
  {
    prompt: 'In the two-state example, why does switching to a Monte Carlo target stop the divergence?',
    options: [
      'Monte Carlo has lower variance',
      'The target becomes the actual return, which does not depend on the weights being updated',
      'It uses a smaller learning rate',
      'It visits state B more often',
    ],
    answer: 1,
    explain: 'Divergence needs the target to move when the weights move. A return is a fixed number, so the feedback loop is cut.',
  },
  {
    prompt: 'What problem does the replay buffer mainly address?',
    options: ['Maximisation bias', 'Correlation between consecutive training samples', 'The cost of computing the max', 'Sparse rewards'],
    answer: 1,
    explain: 'Consecutive steps look alike, and training on them in order drags the function toward the current region. Random minibatches from a buffer break that, and also reuse each transition many times.',
  },
  {
    prompt: 'What does the target network do?',
    options: [
      'Chooses actions during exploration',
      'Holds the weights used to compute targets fixed for C steps',
      'Stores past transitions',
      'Predicts the next state',
    ],
    answer: 1,
    explain: 'Between refreshes the regression targets stand still, so the optimiser is not chasing something that moves with every step.',
  },
  {
    prompt: 'In the two-state playground, freezing the target for 20 updates changed the blow-up from over 100 million to a few hundred. What does that show?',
    options: [
      'Target networks make Q-learning provably convergent',
      'Target networks slow the feedback loop without removing its cause',
      'Target networks only help with correlated samples',
      'Freezing the target is equivalent to Monte Carlo',
    ],
    answer: 1,
    explain: 'The estimate still grows each time the target is refreshed. DQN’s fixes make training stable enough in practice; they are not a convergence proof.',
  },
  {
    prompt: 'In the Atari ablation the lecture shows, which single addition helped most?',
    options: ['A deeper network', 'Fixed Q-targets', 'Experience replay', 'A linear function approximator'],
    answer: 2,
    explain: 'On Breakout: 3 with a deep network alone, 10 with fixed targets, 241 with replay, 317 with both. The deep network by itself was no better than linear.',
  },
  {
    prompt: 'How does Double DQN compute its target?',
    options: [
      'It averages the two networks',
      'The online network picks the next action; the target network supplies its value',
      'It uses two replay buffers',
      'It takes the minimum over actions',
    ],
    answer: 1,
    explain: 'This is double Q-learning from Week 3 using the two networks DQN already has: selection and evaluation use different weights, so a lucky overestimate is less likely to be chosen and believed.',
  },
  {
    prompt: 'For a transition that ends the episode, what is the DQN target?',
    options: ['r + γ max Q(s′, a′; w⁻)', 'Just r', '0', 'The return of the whole episode'],
    answer: 1,
    explain: 'Nothing follows a terminal state, so there is no future value to add. Forgetting this is one of the most common DQN bugs.',
  },
]
