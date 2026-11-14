// The merged 16-week course: CS 234 supplies the theory spine,
// CS 224R the deep methods and applications.

export interface Source {
  course: 'CS 234' | 'CS 224R' | 'Book'
  label: string
  url: string
}

export interface Week {
  n: number
  title: string
  summary: string
  topics: string[]
  playgrounds: string[]
  sources: Source[]
}

export interface Part {
  n: number
  title: string
  blurb: string
  weeks: Week[]
}

const cs234 = (lecture: number, label: string): Source => ({
  course: 'CS 234',
  label: `Lecture ${lecture}: ${label}`,
  url: `https://web.stanford.edu/class/cs234/slides/lecture${lecture}post.pdf`,
})

const cs224r = (file: string, lecture: number, label: string): Source => ({
  course: 'CS 224R',
  label: `Lecture ${lecture}: ${label}`,
  url: `https://cs224r.stanford.edu/slides/${file}.pdf`,
})

const book = (label: string): Source => ({
  course: 'Book',
  label: `Sutton & Barto, ${label}`,
  url: 'http://incompleteideas.net/book/RLbook2020.pdf',
})

export const COURSE_LINKS = [
  { label: 'CS 234 modules page (Winter 2026)', url: 'https://web.stanford.edu/class/cs234/modules.html' },
  { label: 'CS 224R course page (Spring 2026)', url: 'https://cs224r.stanford.edu/' },
  { label: 'Sutton & Barto, Reinforcement Learning: An Introduction (2nd ed.)', url: 'http://incompleteideas.net/book/RLbook2020.pdf' },
]

export const PARTS: Part[] = [
  {
    n: 1,
    title: 'Tabular foundations',
    blurb: 'Small worlds where everything can be written in a table. The ideas here never go away.',
    weeks: [
      {
        n: 1,
        title: 'MDPs and planning',
        summary: 'The language of RL, and how to find the best behaviour when the rules of the world are known.',
        topics: ['The agent-environment loop and the Markov assumption', 'Returns and discounting', 'Markov reward and decision processes', 'Policy evaluation, policy iteration, value iteration', 'Why the Bellman backup converges'],
        playgrounds: ['Discounting: sooner or larger?', 'Value iteration on a gridworld', 'Watching the error contract'],
        sources: [
          cs234(1, 'Introduction to RL'),
          cs234(2, 'Making good decisions given a model of the world'),
          cs224r('01_cs224r_intro_2026', 1, 'Course intro and modelling behaviour'),
          book('chapters 1, 3 and 4.1-4.4'),
        ],
      },
      {
        n: 2,
        title: 'Learning values from experience',
        summary: 'Evaluating a policy when the model is unknown: Monte Carlo and temporal-difference learning.',
        topics: ['First-visit and every-visit Monte Carlo', 'TD(0) and bootstrapping', 'Bias, variance and data efficiency', 'Batch MC vs batch TD, certainty equivalence'],
        playgrounds: ['Monte Carlo vs TD on a random walk', 'Bias and variance of the two targets'],
        sources: [cs234(3, 'Model-free policy evaluation'), book('sections 5.1, 5.5, 6.1-6.3')],
      },
      {
        n: 3,
        title: 'Learning to act: SARSA and Q-learning',
        summary: 'Model-free control: improving a policy while still learning what it is worth.',
        topics: ['Epsilon-greedy exploration and GLIE', 'Monte Carlo control', 'SARSA (on-policy) and Q-learning (off-policy)', 'Maximisation bias and double Q-learning'],
        playgrounds: ['Q-learning vs SARSA on a cliff', 'Why max over noisy estimates is biased'],
        sources: [cs234(4, 'Model-free control and function approximation (first half)'), book('sections 5.2, 5.4, 6.4-6.5, 6.7')],
      },
    ],
  },
  {
    n: 2,
    title: 'Value-based deep RL',
    blurb: 'Replacing the table with a neural network, and what breaks when you do.',
    weeks: [
      {
        n: 4,
        title: 'Function approximation and DQN',
        summary: 'Q-learning with a neural network: the deadly triad, replay buffers and target networks.',
        topics: ['Value function approximation', 'The deadly triad', 'DQN: experience replay and target networks', 'Double DQN and other refinements'],
        playgrounds: ['The deadly triad', 'Target networks and stability'],
        sources: [
          cs234(4, 'Model-free control and function approximation (second half)'),
          cs224r('06_cs224r_qlearning_2026', 6, 'Q-learning'),
        ],
      },
    ],
  },
  {
    n: 3,
    title: 'Policy optimization',
    blurb: 'Optimising the policy directly, and the tricks that make it stable.',
    weeks: [
      {
        n: 5,
        title: 'Policy gradients',
        summary: 'Differentiating expected return with respect to the policy, from reward alone.',
        topics: ['The policy gradient theorem', 'REINFORCE and the score-function estimator', 'Baselines and variance reduction'],
        playgrounds: ['A policy climbing a reward landscape', 'What a baseline does to variance'],
        sources: [cs234(5, 'Policy gradient I'), cs224r('03_cs224r_policy_gradients_2026', 3, 'Policy gradients'), book('chapter 13')],
      },
      {
        n: 6,
        title: 'Trust regions, GAE and PPO',
        summary: 'Taking the largest safe step: monotonic improvement theory and the algorithm built on it.',
        topics: ['Why naive policy gradient steps fail', 'Monotonic improvement bounds', 'N-step returns and generalised advantage estimation', 'Proximal policy optimization'],
        playgrounds: ['The PPO clip', 'The GAE lambda dial'],
        sources: [cs234(6, 'Policy gradient II'), cs234(7, 'Policy gradients and imitation learning (first half)')],
      },
      {
        n: 7,
        title: 'Actor-critic methods',
        summary: 'Learning a critic to guide the actor, on-policy and off-policy.',
        topics: ['Advantage actor-critic', 'Off-policy actor-critic and replay', 'Deterministic and soft actor-critic (DDPG, TD3, SAC)'],
        playgrounds: ['Actor and critic learning together', 'On-policy vs off-policy sample use'],
        sources: [
          cs224r('04_cs224r_actor_critic_2026', 4, 'Actor-critic methods'),
          cs224r('05_cs224r_offpolicy_actor_critic_2026', 5, 'Off-policy actor-critic methods'),
        ],
      },
    ],
  },
  {
    n: 4,
    title: 'Learning from data and humans',
    blurb: 'When you have demonstrations, logged data or human judgement instead of a simulator.',
    weeks: [
      {
        n: 8,
        title: 'Imitation learning',
        summary: 'Copying an expert, why small errors compound, and how to fix it.',
        topics: ['Behaviour cloning', 'Compounding errors and DAgger', 'Expressive policies: mixtures and diffusion policies'],
        playgrounds: ['Compounding errors', 'Why regression to the mean fails on multimodal data'],
        sources: [
          cs224r('02_cs224r_imitation_2026', 2, 'Imitation learning'),
          cs234(7, 'Policy gradients and imitation learning (second half)'),
          cs234(8, 'Imitation learning and human feedback'),
        ],
      },
      {
        n: 9,
        title: 'Offline RL and reward learning',
        summary: 'Learning from a fixed dataset, and learning the reward itself from human preferences.',
        topics: ['Distribution shift in offline RL', 'Conservative and implicit Q-learning', 'Learning rewards from pairwise preferences', 'Human feedback in the loop'],
        playgrounds: ['Distribution shift', 'Learning a reward from comparisons'],
        sources: [
          cs224r('07_cs224r_offline_rl_2026', 7, 'Offline reinforcement learning'),
          cs224r('08_cs224r_reward_learning_2026', 8, 'Reward learning'),
          cs234(8, 'Imitation learning and human feedback'),
        ],
      },
    ],
  },
  {
    n: 5,
    title: 'Exploration',
    blurb: 'How to gather data efficiently, with guarantees.',
    weeks: [
      {
        n: 10,
        title: 'Bandits and regret',
        summary: 'The cleanest setting for exploration: greedy, epsilon-greedy, optimism and Thompson sampling.',
        topics: ['Multi-armed bandits and regret', 'Why greedy and epsilon-greedy have linear regret', 'Optimism: upper confidence bounds', 'Bayesian bandits and Thompson sampling'],
        playgrounds: ['Regret curves for four strategies', 'Thompson sampling posteriors'],
        sources: [
          cs234(9, 'Data-efficient reinforcement learning'),
          cs234(10, 'Fast reinforcement learning'),
          cs234(11, 'Fast reinforcement learning: Bayesian bandits'),
        ],
      },
      {
        n: 11,
        title: 'Exploration in MDPs',
        summary: 'Carrying optimism and posterior sampling from bandits to full sequential problems.',
        topics: ['Regret and PAC frameworks', 'Optimism with exploration bonuses (MBIE-EB)', 'Posterior sampling for RL', 'Contextual bandits and generalisation'],
        playgrounds: ['Exploration bonuses on a chain'],
        sources: [cs234(12, 'Fast RL continued')],
      },
    ],
  },
  {
    n: 6,
    title: 'Planning and models',
    blurb: 'Using a model of the world, given or learned, to look ahead.',
    weeks: [
      {
        n: 12,
        title: 'Tree search and model-based RL',
        summary: 'Monte Carlo tree search and AlphaZero, then learning the model itself.',
        topics: ['Monte Carlo tree search and UCT', 'AlphaGo and AlphaZero: search plus self-play', 'Learning dynamics models', 'Planning and policy learning inside a model'],
        playgrounds: ['A search tree growing', 'Model error compounding over a rollout'],
        sources: [
          cs234(13, 'Monte Carlo tree search'),
          cs234(14, 'Monte Carlo tree search and Go'),
          cs224r('11_cs224r_mbrl_2026', 11, 'Model-based reinforcement learning'),
        ],
      },
    ],
  },
  {
    n: 7,
    title: 'Generalization',
    blurb: 'One agent, many tasks.',
    weeks: [
      {
        n: 13,
        title: 'Multi-task, goal-conditioned and meta-RL',
        summary: 'Sharing experience across tasks, and learning to learn new ones quickly.',
        topics: ['Multi-task RL', 'Goal-conditioned policies and hindsight relabelling', 'Meta-RL as learning to adapt'],
        playgrounds: ['Hindsight relabelling'],
        sources: [
          cs224r('12_cs224r_mtrl_gcrl_2026', 12, 'Multi-task and goal-conditioned RL'),
          cs224r('13_cs224r_metarl_2026', 13, 'Meta reinforcement learning'),
        ],
      },
      {
        n: 14,
        title: 'Hierarchy',
        summary: 'Breaking long tasks into skills, in both imitation and reinforcement learning.',
        topics: ['Why long horizons are hard', 'Skills, options and high-level policies', 'Hierarchy in imitation learning'],
        playgrounds: ['Flat vs hierarchical exploration'],
        sources: [cs224r('15_cs224r_hierarchy_2026', 15, 'Hierarchy in imitation and reinforcement learning')],
      },
    ],
  },
  {
    n: 8,
    title: 'Applications',
    blurb: 'Where these methods are used today.',
    weeks: [
      {
        n: 15,
        title: 'RL for language models',
        summary: 'Post-training with human preferences, and RL for reasoning.',
        topics: ['RLHF and direct preference optimization', 'Modern preference optimization', 'RL for reasoning models'],
        playgrounds: ['Preference optimization on a toy model'],
        sources: [
          cs224r('09_cs224r_rlhf_2026', 9, 'RLHF, DPO and preference optimization'),
          cs224r('10_cs224r_rl_for_llms_reasoning_2026', 10, 'RL for LLMs: reasoning'),
        ],
      },
      {
        n: 16,
        title: 'RL for robots, and the frontier',
        summary: 'Sim-to-real transfer, RL for robot foundation models, and open problems.',
        topics: ['Sim-to-real transfer', 'RL for vision-language-action models', 'Open problems and how to do research'],
        playgrounds: ['Domain randomization'],
        sources: [
          cs224r('16_cs224r_sim2real_robot_learning_2026', 16, 'Sim-to-real robot learning'),
          cs224r('17_cs224r_rl_vlas_2026', 17, 'RL for robot foundation models'),
          cs224r('18_cs224r_frontiers_how_to_research_2026', 18, 'Frontiers and how to do research'),
        ],
      },
    ],
  },
]

export const WEEKS: Week[] = PARTS.flatMap((p) => p.weeks)

export function findWeek(n: number): { week: Week; part: Part } | undefined {
  for (const part of PARTS) {
    const week = part.weeks.find((w) => w.n === n)
    if (week) return { week, part }
  }
  return undefined
}
