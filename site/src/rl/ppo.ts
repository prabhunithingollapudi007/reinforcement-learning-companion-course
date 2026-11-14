// Week 6: taking the largest policy step that is still safe.

import { N_STATES, START, mulberry32, sampleEpisode, trueValues } from './prediction'

// ---- The clipped objective ----

/** PPO's per-sample objective: min(r A, clip(r, 1 - eps, 1 + eps) A). */
export function clipObjective(ratio: number, advantage: number, epsilon: number): number {
  const clipped = Math.min(Math.max(ratio, 1 - epsilon), 1 + epsilon)
  return Math.min(ratio * advantage, clipped * advantage)
}

/** Whether the objective still rewards moving the ratio further in the direction the advantage points. */
export function clipIsActive(ratio: number, advantage: number, epsilon: number): boolean {
  return advantage > 0 ? ratio >= 1 + epsilon : advantage < 0 ? ratio <= 1 - epsilon : false
}

// ---- Step size on a ridge beside a cliff ----
//
// A one-number policy: actions are drawn from a narrow bell centred on mu.
// Reward rises steadily up to action 2, falls a little, then drops off a cliff at 2.6.

export const RIDGE_SIGMA = 0.3
export const RIDGE_PEAK = 2
export const CLIFF_AT = 2.6
const SLOPE = 1 / 3

/** Reward for one action: a tent peaking at 2, with a drop to -1 beyond the cliff edge. */
export const ridgeReward = (a: number) => (a > CLIFF_AT ? -1 : 1 - Math.abs(a - RIDGE_PEAK) * SLOPE)

// Standard normal density and cumulative distribution.
const pdf = (z: number) => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI)
function cdf(z: number): number {
  // Abramowitz and Stegun 7.1.26, accurate to about 1e-7.
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2)
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const erf = 1 - poly * Math.exp((-z * z) / 2)
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf)
}

/** Expected reward of the policy a ~ N(mu, sigma^2), in closed form. */
export function ridgeValue(mu: number): number {
  const s = RIDGE_SIGMA
  const zPeak = (RIDGE_PEAK - mu) / s
  const zCliff = (CLIFF_AT - mu) / s
  // E[|a - 2|; a <= cliff] splits at the peak.
  const below = (RIDGE_PEAK - mu) * cdf(zPeak) + s * pdf(zPeak) // E[(2 - a); a < 2]
  const between = (mu - RIDGE_PEAK) * (cdf(zCliff) - cdf(zPeak)) + s * (pdf(zPeak) - pdf(zCliff)) // E[(a - 2); 2 < a < cliff]
  return cdf(zCliff) - SLOPE * (below + between) - (1 - cdf(zCliff))
}

/** d/dmu of the expected reward: the slope on each side of the peak, plus the drop at the cliff. */
export function ridgeGradient(mu: number): number {
  const s = RIDGE_SIGMA
  const zPeak = (RIDGE_PEAK - mu) / s
  const zCliff = (CLIFF_AT - mu) / s
  const jump = -1 - ridgeReward(CLIFF_AT) // how far reward falls at the edge
  return SLOPE * cdf(zPeak) - SLOPE * (cdf(zCliff) - cdf(zPeak)) + (jump * pdf(zCliff)) / s
}

/** KL divergence between two policies centred mu apart (same width). */
export const ridgeKL = (delta: number) => (delta * delta) / (2 * RIDGE_SIGMA * RIDGE_SIGMA)

export interface RidgeRun {
  mus: number[]
  values: number[]
  collapsed: boolean
}

/** Gradient ascent on mu with the exact gradient. `maxKL` caps how far the policy may move per step. */
export function ridgeAscent(opts: { learningRate: number; maxKL: number | null; steps: number; start?: number }): RidgeRun {
  let mu = opts.start ?? -0.5
  const mus = [mu]
  const values = [ridgeValue(mu)]
  const limit = opts.maxKL === null ? Infinity : RIDGE_SIGMA * Math.sqrt(2 * opts.maxKL)
  for (let k = 0; k < opts.steps; k++) {
    const step = opts.learningRate * ridgeGradient(mu)
    mu += Math.max(-limit, Math.min(limit, step))
    mus.push(mu)
    values.push(ridgeValue(mu))
  }
  return { mus, values, collapsed: values[values.length - 1] < -0.5 }
}

// ---- Generalised advantage estimation ----

/**
 * GAE for one trajectory: A_t = sum over l of (gamma lambda)^l delta_{t+l},
 * with delta_t = r_t + gamma V(s_{t+1}) - V(s_t). `values` has one entry per step;
 * the value after the last step is taken as 0 (the episode ended).
 */
export function gae(rewards: number[], values: number[], gamma: number, lambda: number): number[] {
  const out = new Array<number>(rewards.length)
  let running = 0
  for (let t = rewards.length - 1; t >= 0; t--) {
    const next = t + 1 < rewards.length ? values[t + 1] : 0
    const delta = rewards[t] + gamma * next - values[t]
    running = delta + gamma * lambda * running
    out[t] = running
  }
  return out
}

/** Weight GAE puts on the k-step estimator, for k = 1..n: (1 - lambda) lambda^(k-1). */
export const kStepWeights = (lambda: number, n: number) =>
  Array.from({ length: n }, (_, i) => (lambda >= 1 ? (i === n - 1 ? 1 : 0) : (1 - lambda) * lambda ** i))

export interface LambdaStats {
  lambdas: number[]
  bias: number[] // of the advantage estimate for the middle state (its true advantage is 0)
  spread: number[] // standard deviation
  rmse: number[]
}

/**
 * Bias and spread of the GAE estimate at the corridor's middle state, when the
 * critic's values are wrong by `valueError` (multiplicatively: V_hat = V * (1 + valueError)).
 */
export function lambdaSweep(opts: { valueError: number; gamma: number; samples: number; seed: number }): LambdaStats {
  const truth = trueValues(opts.gamma)
  const estimate = truth.map((v) => v * (1 + opts.valueError))
  const rng = mulberry32(opts.seed)
  const episodes = Array.from({ length: opts.samples }, () => sampleEpisode(rng, START))
  const lambdas = Array.from({ length: 21 }, (_, i) => i / 20)
  const bias: number[] = []
  const spread: number[] = []
  const rmse: number[] = []
  for (const lambda of lambdas) {
    let sum = 0
    let sumSq = 0
    for (const episode of episodes) {
      const a = gae(
        episode.map((s) => s.reward),
        episode.map((s) => estimate[s.state]),
        opts.gamma,
        lambda,
      )[0]
      // What the estimate should be: the advantage measured against the critic's own (wrong) value.
      const error = a - (truth[START] - estimate[START])
      sum += error
      sumSq += error * error
    }
    const m = sum / episodes.length
    bias.push(m)
    spread.push(Math.sqrt(Math.max(0, sumSq / episodes.length - m * m)))
    rmse.push(Math.sqrt(sumSq / episodes.length))
  }
  return { lambdas, bias, spread, rmse }
}

export const N_CORRIDOR = N_STATES
