// Week 9: learning from a fixed dataset, and learning the reward itself.

import { mulberry32 } from './prediction'

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

// ---- Optimism where there is no data ----
//
// One state, a continuous action in [-2, 2]. The best action is at 1.2.
// The dataset only contains actions near wherever the old policy liked to act.

export const A_MIN = -2
export const A_MAX = 2
export const GRID = 81
export const BEST_ACTION = 1.2
export const actionAt = (i: number) => A_MIN + (i / (GRID - 1)) * (A_MAX - A_MIN)
export const trueValue = (a: number) => Math.exp(-((a - BEST_ACTION) ** 2) / 0.5)

export interface Critic {
  estimate: number[] // the learned Q for each action on the grid
  inData: boolean[] // whether the dataset contains actions near this one
}

/**
 * A caricature of a critic trained on the dataset: accurate where there is data,
 * and whatever the untrained network happens to output everywhere else.
 */
export function fitCritic(centre: number, width: number, seed: number): Critic {
  const rng = mulberry32(seed)
  const waves = Array.from({ length: 3 }, () => ({ amp: 0.25 + 0.35 * rng(), freq: 1 + 3 * rng(), phase: 2 * Math.PI * rng() }))
  const offset = 0.35
  const estimate: number[] = []
  const inData: boolean[] = []
  for (let i = 0; i < GRID; i++) {
    const a = actionAt(i)
    const distance = Math.max(0, Math.abs(a - centre) - width)
    const blend = Math.min(1, distance / 0.2) // 0 inside the data, 1 well outside it
    const arbitrary = offset + waves.reduce((s, w) => s + w.amp * Math.sin(w.freq * a + w.phase), 0)
    estimate.push((1 - blend) * (trueValue(a) + 0.02 * gaussian(rng)) + blend * arbitrary)
    inData.push(distance === 0)
  }
  return { estimate, inData }
}

export interface Choice {
  action: number
  believed: number
  actual: number
}

export interface OfflineChoices {
  naive: Choice // the action the critic rates highest anywhere
  inData: Choice // the action the critic rates highest among those in the data
  imitation: Choice // the old policy's typical action
}

export function chooseActions(critic: Critic, centre: number): OfflineChoices {
  let naive = 0
  let best = -1
  for (let i = 0; i < GRID; i++) {
    if (critic.estimate[i] > critic.estimate[naive]) naive = i
    if (critic.inData[i] && (best < 0 || critic.estimate[i] > critic.estimate[best])) best = i
  }
  const middle = Math.round(((centre - A_MIN) / (A_MAX - A_MIN)) * (GRID - 1))
  const pick = (i: number): Choice => ({ action: actionAt(i), believed: critic.estimate[i], actual: trueValue(actionAt(i)) })
  return { naive: pick(naive), inData: pick(best), imitation: pick(middle) }
}

/** The three choices' real outcomes, averaged over many differently-initialised critics. */
export function averageOutcomes(centre: number, width: number, trials: number): { naive: number; naiveBelieved: number; inData: number; imitation: number; naiveOutside: number } {
  let naive = 0
  let naiveBelieved = 0
  let inData = 0
  let imitation = 0
  let outside = 0
  for (let seed = 1; seed <= trials; seed++) {
    const critic = fitCritic(centre, width, seed)
    const c = chooseActions(critic, centre)
    naive += c.naive.actual
    naiveBelieved += c.naive.believed
    inData += c.inData.actual
    imitation += c.imitation.actual
    if (Math.abs(c.naive.action - centre) > width) outside++
  }
  return { naive: naive / trials, naiveBelieved: naiveBelieved / trials, inData: inData / trials, imitation: imitation / trials, naiveOutside: outside / trials }
}

// ---- Expectiles: the value of the better actions in the data ----

/**
 * The tau-expectile of a set of numbers: the m minimising
 * sum of |tau - 1(v < m)| (v - m)^2.  tau = 0.5 is the mean; tau near 1 approaches the maximum.
 */
export function expectile(values: number[], tau: number): number {
  let m = values.reduce((a, b) => a + b, 0) / values.length
  for (let k = 0; k < 200; k++) {
    let num = 0
    let den = 0
    for (const v of values) {
      const w = v > m ? tau : 1 - tau
      num += w * v
      den += w
    }
    const next = num / den
    if (Math.abs(next - m) < 1e-12) break
    m = next
  }
  return m
}

/** Q-values of the actions an old policy took in one state: mostly mediocre, a few good. */
export function sampleQValues(n: number, seed: number): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, () => (rng() < 0.8 ? 0.3 + 0.12 * gaussian(rng) : 0.8 + 0.06 * gaussian(rng)))
}

// ---- Learning a reward from comparisons ----
//
// Each trajectory is summarised by two numbers (say, speed and smoothness).
// A person prefers trajectories with higher w* . x, and sometimes misjudges.

export const TRUE_ANGLE = 35 // degrees: the direction of the hidden reward in feature space
const trueWeights = () => [Math.cos((TRUE_ANGLE * Math.PI) / 180), Math.sin((TRUE_ANGLE * Math.PI) / 180)]
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

export interface Comparison {
  winner: number[]
  loser: number[]
}

/** Ask a simulated person to compare `n` random pairs. `noise` is how often close calls go the wrong way. */
export function collectComparisons(n: number, noise: number, seed: number): Comparison[] {
  const rng = mulberry32(seed)
  const w = trueWeights()
  const out: Comparison[] = []
  for (let i = 0; i < n; i++) {
    const a = [2 * rng() - 1, 2 * rng() - 1]
    const b = [2 * rng() - 1, 2 * rng() - 1]
    const gap = w[0] * (a[0] - b[0]) + w[1] * (a[1] - b[1])
    const prefersA = rng() < sigmoid(gap / Math.max(noise, 1e-6))
    out.push(prefersA ? { winner: a, loser: b } : { winner: b, loser: a })
  }
  return out
}

/** Fit reward weights by maximising the log-probability of the observed preferences. */
export function fitReward(data: Comparison[], steps = 300, rate = 0.5): number[] {
  const w = [0, 0]
  for (let k = 0; k < steps; k++) {
    const grad = [0, 0]
    for (const c of data) {
      const d = [c.winner[0] - c.loser[0], c.winner[1] - c.loser[1]]
      const p = sigmoid(w[0] * d[0] + w[1] * d[1])
      grad[0] += (1 - p) * d[0]
      grad[1] += (1 - p) * d[1]
    }
    // A little weight decay keeps the weights finite when the data are perfectly separable.
    w[0] += rate * (grad[0] / data.length - 0.01 * w[0])
    w[1] += rate * (grad[1] / data.length - 0.01 * w[1])
  }
  return w
}

/** Angle in degrees between the learned reward direction and the true one. */
export function angleError(w: number[]): number {
  const t = trueWeights()
  const norm = Math.hypot(w[0], w[1])
  if (norm < 1e-9) return 90
  const cos = (w[0] * t[0] + w[1] * t[1]) / norm
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI
}

/** How often the learned reward ranks a fresh pair the same way as the true reward. */
export function agreement(w: number[], seed = 999, pairs = 2000): number {
  const rng = mulberry32(seed)
  const t = trueWeights()
  let same = 0
  for (let i = 0; i < pairs; i++) {
    const d = [2 * rng() - 1 - (2 * rng() - 1), 2 * rng() - 1 - (2 * rng() - 1)]
    if (w[0] * d[0] + w[1] * d[1] > 0 === t[0] * d[0] + t[1] * d[1] > 0) same++
  }
  return same / pairs
}

export const QUERY_COUNTS = [5, 10, 20, 50, 100, 200, 500]

/** Average angle error for each number of comparisons, over several simulated people. */
export function errorByQueries(noise: number, repeats: number): number[] {
  return QUERY_COUNTS.map((n) => {
    let total = 0
    for (let seed = 1; seed <= repeats; seed++) total += angleError(fitReward(collectComparisons(n, noise, seed)))
    return total / repeats
  })
}
