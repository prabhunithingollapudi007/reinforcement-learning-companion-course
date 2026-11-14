// Week 10: choosing what to try. Multi-armed bandits with yes/no rewards.

import { mulberry32 } from './prediction'

export type Strategy = 'greedy' | 'epsilon' | 'ucb' | 'thompson'

export const STRATEGY_NAMES: Record<Strategy, string> = {
  greedy: 'Greedy',
  epsilon: 'ε-greedy',
  ucb: 'UCB',
  thompson: 'Thompson sampling',
}

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

/** Gamma(shape, 1) for shape >= 1 (Marsaglia and Tsang). */
function gamma(shape: number, rng: () => number): number {
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    const x = gaussian(rng)
    const v = (1 + c * x) ** 3
    if (v <= 0) continue
    const u = Math.max(rng(), 1e-12)
    if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v
  }
}

/** A draw from Beta(a, b), for a, b >= 1. */
export function sampleBeta(a: number, b: number, rng: () => number): number {
  const x = gamma(a, rng)
  return x / (x + gamma(b, rng))
}

export interface ArmStats {
  pulls: number[]
  wins: number[]
}
export const emptyStats = (arms: number): ArmStats => ({ pulls: new Array<number>(arms).fill(0), wins: new Array<number>(arms).fill(0) })

export const estimate = (s: ArmStats, a: number) => (s.pulls[a] ? s.wins[a] / s.pulls[a] : 0)

/** The exploration bonus of UCB1 after t pulls in total: sqrt(2 ln t / N). */
export const ucbBonus = (t: number, pulls: number) => Math.sqrt((2 * Math.log(Math.max(t, 1))) / pulls)

function argmax(values: number[], rng: () => number): number {
  let best = -Infinity
  let ties: number[] = []
  values.forEach((v, i) => {
    if (v > best + 1e-12) {
      best = v
      ties = [i]
    } else if (Math.abs(v - best) <= 1e-12) ties.push(i)
  })
  return ties[Math.floor(rng() * ties.length)]
}

/** Which arm a strategy pulls next. Every strategy except Thompson tries each arm once first. */
export function chooseArm(strategy: Strategy, s: ArmStats, epsilon: number, rng: () => number): { arm: number; scores: number[] } {
  const arms = s.pulls.length
  const t = s.pulls.reduce((a, b) => a + b, 0)
  if (strategy !== 'thompson') {
    const untried = s.pulls.findIndex((n) => n === 0)
    if (untried >= 0) return { arm: untried, scores: s.pulls.map((_, a) => estimate(s, a)) }
  }
  if (strategy === 'thompson') {
    // One plausible value per arm, drawn from what is currently believed about it.
    const scores = s.pulls.map((n, a) => sampleBeta(1 + s.wins[a], 1 + n - s.wins[a], rng))
    return { arm: argmax(scores, rng), scores }
  }
  if (strategy === 'ucb') {
    const scores = s.pulls.map((n, a) => estimate(s, a) + ucbBonus(t, n))
    return { arm: argmax(scores, rng), scores }
  }
  const scores = s.pulls.map((_, a) => estimate(s, a))
  if (strategy === 'epsilon' && rng() < epsilon) return { arm: Math.floor(rng() * arms), scores }
  return { arm: argmax(scores, rng), scores }
}

export function pull(s: ArmStats, arm: number, means: number[], rng: () => number): number {
  const reward = rng() < means[arm] ? 1 : 0
  s.pulls[arm] += 1
  s.wins[arm] += reward
  return reward
}

/** Total regret after each pull: the sum of (best mean - mean of the arm pulled). */
export function regretCurve(strategy: Strategy, means: number[], steps: number, epsilon: number, rng: () => number): number[] {
  const best = Math.max(...means)
  const s = emptyStats(means.length)
  const out = [0]
  let total = 0
  for (let t = 0; t < steps; t++) {
    const { arm } = chooseArm(strategy, s, epsilon, rng)
    pull(s, arm, means, rng)
    total += best - means[arm]
    out.push(total)
  }
  return out
}

export function averageRegret(strategy: Strategy, means: number[], steps: number, epsilon: number, runs: number, seed: number): number[] {
  const rng = mulberry32(seed)
  const sum = new Array<number>(steps + 1).fill(0)
  for (let r = 0; r < runs; r++) {
    const curve = regretCurve(strategy, means, steps, epsilon, rng)
    for (let t = 0; t <= steps; t++) sum[t] += curve[t]
  }
  return sum.map((v) => v / runs)
}

/** Share of runs in which a strategy is still pulling the wrong arm most of the time at the end. */
export function stuckShare(strategy: Strategy, means: number[], steps: number, epsilon: number, runs: number, seed: number): number {
  const rng = mulberry32(seed)
  const best = means.indexOf(Math.max(...means))
  let stuck = 0
  for (let r = 0; r < runs; r++) {
    const s = emptyStats(means.length)
    for (let t = 0; t < steps; t++) pull(s, chooseArm(strategy, s, epsilon, rng).arm, means, rng)
    if (s.pulls[best] < steps / 2) stuck++
  }
  return stuck / runs
}

/** Density of Beta(a, b) on a grid, for drawing. */
export function betaDensity(a: number, b: number, points = 101): number[] {
  const logs = Array.from({ length: points }, (_, i) => {
    const x = Math.min(Math.max(i / (points - 1), 1e-4), 1 - 1e-4)
    return (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)
  })
  const peak = Math.max(...logs)
  const raw = logs.map((l) => Math.exp(l - peak))
  const area = raw.reduce((s, v) => s + v, 0) / (points - 1)
  return raw.map((v) => v / area)
}
