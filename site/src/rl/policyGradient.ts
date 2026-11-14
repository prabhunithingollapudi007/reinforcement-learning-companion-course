// Week 5: improving a policy directly, from sampled rewards.

import { mulberry32 } from './prediction'

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

// ---- A one-step problem with a continuous action ----
//
// The agent picks a number a. The reward is highest at a = PEAK and falls off
// on both sides. The agent never sees this function: only the reward of each
// action it tries. `offset` adds the same constant to every reward.

export const PEAK = 2
export const reward = (a: number, offset = 0) => Math.exp(-((a - PEAK) ** 2) / 2) + offset

/** Expected reward of the policy a ~ N(mu, sigma^2), in closed form. */
export function expectedReward(mu: number, sigma: number, offset = 0): number {
  const v = 1 + sigma * sigma
  return Math.exp(-((mu - PEAK) ** 2) / (2 * v)) / Math.sqrt(v) + offset
}

/** The true gradient of expected reward with respect to mu. */
export function trueGradient(mu: number, sigma: number): number {
  const v = 1 + sigma * sigma
  return (expectedReward(mu, sigma) * (PEAK - mu)) / v
}

export interface Batch {
  actions: number[]
  rewards: number[]
}

export function sampleBatch(mu: number, sigma: number, n: number, offset: number, rng: () => number): Batch {
  const actions = Array.from({ length: n }, () => mu + sigma * gaussian(rng))
  return { actions, rewards: actions.map((a) => reward(a, offset)) }
}

/**
 * The score-function estimate of d/dmu E[reward]:
 * the average of (reward - baseline) * d/dmu log pi(a), where d/dmu log pi(a) = (a - mu) / sigma^2.
 */
export function gradientEstimate(batch: Batch, mu: number, sigma: number, baseline: number): number {
  let sum = 0
  for (let i = 0; i < batch.actions.length; i++) {
    sum += ((batch.rewards[i] - baseline) * (batch.actions[i] - mu)) / (sigma * sigma)
  }
  return sum / batch.actions.length
}

export interface ClimbOptions {
  sigma: number
  learningRate: number
  batchSize: number
  offset: number
  useBaseline: boolean
  steps: number
  seed: number
  start?: number
}

/** REINFORCE on the mean of the policy. Returns mu after every update. */
export function climb(o: ClimbOptions): number[] {
  const rng = mulberry32(o.seed)
  let mu = o.start ?? -1
  const path = [mu]
  for (let k = 0; k < o.steps; k++) {
    const batch = sampleBatch(mu, o.sigma, o.batchSize, o.offset, rng)
    // The baseline here is the batch's average reward: simple, and what most code does.
    const baseline = o.useBaseline ? batch.rewards.reduce((a, b) => a + b, 0) / batch.rewards.length : 0
    mu += o.learningRate * gradientEstimate(batch, mu, o.sigma, baseline)
    path.push(mu)
  }
  return path
}

export interface EstimateSpread {
  truth: number
  plain: number[] // estimates with no baseline
  withBaseline: number[] // estimates with the expected reward as baseline
}

/** Many independent gradient estimates at one fixed policy, with and without a baseline. */
export function estimateSpread(opts: { mu: number; sigma: number; batchSize: number; offset: number; trials: number; seed: number }): EstimateSpread {
  const rng = mulberry32(opts.seed)
  const baseline = expectedReward(opts.mu, opts.sigma, opts.offset)
  const plain: number[] = []
  const withBaseline: number[] = []
  for (let t = 0; t < opts.trials; t++) {
    const batch = sampleBatch(opts.mu, opts.sigma, opts.batchSize, opts.offset, rng)
    plain.push(gradientEstimate(batch, opts.mu, opts.sigma, 0))
    withBaseline.push(gradientEstimate(batch, opts.mu, opts.sigma, baseline))
  }
  return { truth: trueGradient(opts.mu, opts.sigma), plain, withBaseline }
}

// ---- The aliased corridor ----
//
// Five cells in a row with the goal below the middle one. The two cells either
// side of the middle look identical to the agent, so it must act the same way
// in both: move east with probability p, west otherwise.

/** Expected steps to reach the goal, averaged over the four possible starting cells. */
export function corridorSteps(pEast: number): number {
  if (pEast <= 0 || pEast >= 1) return Infinity
  return 1 / pEast + 1 / (1 - pEast) + 0.5
}

/** The same quantity by simulation, to check the formula. */
export function simulateCorridor(pEast: number, episodes: number, seed: number): number {
  const rng = mulberry32(seed)
  let total = 0
  for (let e = 0; e < episodes; e++) {
    let cell = [0, 1, 3, 4][Math.floor(rng() * 4)]
    let steps = 0
    while (steps < 10000) {
      steps++
      if (cell === 2) break // the middle cell steps down into the goal
      if (cell === 0) cell = 1
      else if (cell === 4) cell = 3
      else cell += rng() < pEast ? 1 : -1
    }
    total += steps
  }
  return total / episodes
}
