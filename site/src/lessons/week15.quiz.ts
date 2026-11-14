import type { Question } from '../components/Quiz'

export const week15Quiz: Question[] = [
  {
    prompt: 'When a language model is treated as an RL policy, what is an action?',
    options: ['A whole conversation', 'The next token', 'A gradient step', 'A human rating'],
    answer: 1,
    explain: 'The state is the prompt plus the text so far, the action is the next token, and one response is an episode.',
  },
  {
    prompt: 'Which stage of training a chat model is behaviour cloning?',
    options: ['Collecting preferences', 'Instruction tuning on (instruction, good answer) pairs', 'Optimising a reward model with PPO', 'Majority voting'],
    answer: 1,
    explain: 'It is supervised learning on demonstrations, with the limits of imitation: it can only copy the answers it is shown.',
  },
  {
    prompt: 'Why are reward models trained on pairwise comparisons instead of numeric ratings?',
    options: [
      'Comparisons need more annotators',
      'People are inconsistent at absolute scores but fairly reliable at saying which of two is better',
      'Numeric ratings cannot be used in a loss function',
      'Comparisons make the model larger',
    ],
    answer: 1,
    explain: 'One person’s 6 is another’s 8. "A is better than B" is a much steadier signal, and the Bradley–Terry loss turns it into scores.',
  },
  {
    prompt: 'What is the KL term in the RLHF objective for?',
    options: [
      'It speeds up training',
      'It keeps the model near its starting point, where the reward model can be trusted',
      'It makes responses shorter',
      'It replaces the reward model',
    ],
    answer: 1,
    explain: 'The reward model is only reliable on responses like those it was trained on. Far from them, a high score may be an error the optimiser has found.',
  },
  {
    prompt: 'In the playground, as β is lowered from 2.5 to 0.2, what happens?',
    options: [
      'Both the reward-model score and what people think rise',
      'The reward-model score keeps rising while what people think falls from 5.47 to 2.00',
      'Both fall',
      'Nothing changes',
    ],
    answer: 1,
    explain: 'The model concentrates on the one response the reward model overrates. Training metrics improve the whole way down.',
  },
  {
    prompt: 'What is the closed-form solution of the KL-regularised objective?',
    options: [
      'π* equals the reference model',
      'π*(y) is proportional to π_ref(y) · exp(r(y) / β)',
      'π* puts all probability on the highest-reward response',
      'π*(y) is proportional to r(y)',
    ],
    answer: 1,
    explain: 'The starting model reweighted by exponentiated reward. Large β barely reweights; small β approaches winner-takes-all.',
  },
  {
    prompt: 'What does DPO train, and on what?',
    options: [
      'A reward model, on comparisons',
      'The policy directly, with a classification loss on a fixed set of comparisons',
      'A value function, on sampled rollouts',
      'The policy, by PPO on reward-model scores',
    ],
    answer: 1,
    explain: 'DPO writes the reward in terms of the policy and puts that into the Bradley–Terry loss, so no separate reward model or sampling is needed.',
  },
  {
    prompt: 'Why does the partition function Z(x) not appear in the DPO loss?',
    options: [
      'It is always 1',
      'The loss depends only on the difference of two rewards for the same prompt, and Z(x) cancels',
      'It is estimated by sampling',
      'DPO ignores it as an approximation',
    ],
    answer: 1,
    explain: 'Both responses in a comparison share the prompt x, so β log Z(x) is added to both rewards and drops out of the difference.',
  },
  {
    prompt: 'Why can optimisation be pushed much harder with verifiable rewards such as passing tests?',
    options: [
      'They are cheaper to compute',
      'There is no learned judge whose mistakes can be exploited',
      'They do not require a policy gradient',
      'They work only for small models',
    ],
    answer: 1,
    explain: 'A checker does not depend on a response resembling its training data, the way a learned judge does, though it is only as good as what it checks. Not every task has one.',
  },
  {
    prompt: 'In GRPO, where does the baseline for each answer come from?',
    options: [
      'A learned value network',
      'The average reward of the group of answers sampled for the same question',
      'The reward model',
      'A fixed constant',
    ],
    answer: 1,
    explain: 'Advantage = (reward − group mean) / group spread. A question answered all right or all wrong contributes nothing.',
  },
  {
    prompt: 'On a question where the most common sampled answer is wrong, what does majority voting with more samples do?',
    options: [
      'Slowly converges to the right answer',
      'Converges to the wrong answer',
      'Stays at single-sample accuracy',
      'Becomes random',
    ],
    answer: 1,
    explain: 'In the playground accuracy falls from 30% to 9%. Voting amplifies the mode; it cannot fix a systematic error.',
  },
]
