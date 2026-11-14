import { describe, expect, it } from 'vitest'
import {
  CLIFF_REWARD,
  GOAL,
  START,
  averageRewards,
  emptyQ,
  epsilonGreedy,
  epsilonGreedyProbabilities,
  greedyPath,
  isCliff,
  maximisationBias,
  meanDistanceFromCliff,
  runEpisode,
  step,
  type Method,
} from './control'
import { mean, mulberry32 } from './prediction'

const h = { alpha: 0.5, epsilon: 0.1, gamma: 1 }

function trained(method: Method, seed: number, episodes = 500) {
  const Q = emptyQ()
  const rng = mulberry32(seed)
  for (let e = 0; e < episodes; e++) runEpisode(Q, method, h, rng)
  return Q
}

describe('the cliff world', () => {
  it('walking right from the start falls off the cliff and ends the episode', () => {
    const t = step(START, 1)
    expect(isCliff(t.next)).toBe(true)
    expect(t.reward).toBe(CLIFF_REWARD)
    expect(t.done).toBe(true)
  })
  it('bumping into the edge keeps the agent in place and still costs a step', () => {
    expect(step(START, 3)).toEqual({ next: START, reward: -1, done: false })
  })
  it('the goal ends the episode', () => {
    expect(step(GOAL - 10, 2)).toEqual({ next: GOAL, reward: -1, done: true })
  })
})

describe('epsilon-greedy', () => {
  it('gives the greedy action 1 - eps + eps/|A| and every other action eps/|A|', () => {
    expect(epsilonGreedyProbabilities(4, 0.2)).toEqual([0.8 + 0.05, 0.05, 0.05, 0.05])
    expect(epsilonGreedyProbabilities(4, 0.2).reduce((a, b) => a + b)).toBeCloseTo(1)
  })
  it('samples match those probabilities', () => {
    const Q = emptyQ()
    Q[0][2] = 1
    const rng = mulberry32(1)
    let greedy = 0
    for (let i = 0; i < 20000; i++) if (epsilonGreedy(Q, 0, 0.2, rng) === 2) greedy++
    expect(greedy / 20000).toBeCloseTo(0.85, 1)
  })
})

describe('SARSA and Q-learning on the cliff (numbers quoted in the lesson)', () => {
  it('Q-learning learns the 11-step route along the edge', () => {
    const { path, reachesGoal } = greedyPath(trained('qlearning', 11))
    expect(reachesGoal).toBe(true)
    expect(path.length - 1).toBe(11)
    expect(meanDistanceFromCliff(path)).toBe(1)
  })
  it('SARSA learns a longer route that keeps away from the edge', () => {
    const { path, reachesGoal } = greedyPath(trained('sarsa', 11))
    expect(reachesGoal).toBe(true)
    expect(path.length - 1).toBe(15)
    expect(meanDistanceFromCliff(path)).toBeGreaterThan(2)
  })
  it('while still exploring, SARSA collects more reward than Q-learning', () => {
    const sarsa = mean(averageRewards('sarsa', h, 500, 50, 5).slice(400))
    const q = mean(averageRewards('qlearning', h, 500, 50, 5).slice(400))
    expect(sarsa).toBeCloseTo(-22, 0)
    expect(q).toBeCloseTo(-32, -1)
    expect(sarsa - q).toBeGreaterThan(7)
  })
  it('with almost no exploration the gap closes', () => {
    const calm = { ...h, epsilon: 0.02 }
    const sarsa = mean(averageRewards('sarsa', calm, 500, 50, 5).slice(400))
    const q = mean(averageRewards('qlearning', calm, 500, 50, 5).slice(400))
    expect(Math.abs(sarsa - q)).toBeLessThan(3)
  })
})

describe('maximisation bias', () => {
  it('the max of noisy estimates is biased upward and grows with the number of actions', () => {
    const two = maximisationBias({ actions: 2, noise: 1, trials: 2000, seed: 3 })
    const ten = maximisationBias({ actions: 10, noise: 1, trials: 2000, seed: 3 })
    expect(mean(two.single)).toBeCloseTo(0.6, 1)
    expect(mean(maximisationBias({ actions: 5, noise: 1, trials: 1500, seed: 3 }).single)).toBeCloseTo(1.2, 1)
    expect(mean(ten.single)).toBeCloseTo(1.5, 1)
  })
  it('choosing with one set of estimates and evaluating with another removes it', () => {
    const b = maximisationBias({ actions: 10, noise: 1, trials: 2000, seed: 3 })
    expect(Math.abs(mean(b.double))).toBeLessThan(0.1)
  })
})
