// Week 16: from a simulator to a real robot, and improving a pretrained policy.

import { mulberry32 } from './prediction'

// ---- Sliding a puck to a target, when the simulator has the friction wrong ----
//
// The robot gives a puck one shove. The puck slides and stops. The policy is a
// single number, the launch speed. Physics: distance = speed^2 / (2 * friction * g).

export const G = 10
export const TARGET = 1 // metres

export const slideDistance = (speed: number, friction: number) => (speed * speed) / (2 * friction * G)

/** The launch speed that lands exactly on the target for one known friction. */
export const speedFor = (friction: number) => Math.sqrt(2 * friction * G * TARGET)

/** Evenly spaced frictions across a range: what a randomised simulator trains on. */
export function frictionRange(low: number, high: number, count = 41): number[] {
  if (high <= low) return [low]
  return Array.from({ length: count }, (_, i) => low + ((high - low) * i) / (count - 1))
}

/**
 * One launch speed for a whole range of frictions: the one with the smallest
 * average squared miss. With s = speed^2 / (2g), the miss is s / friction - target,
 * and the best s is E[1/friction] / E[1/friction^2] times the target.
 */
export function robustSpeed(frictions: number[]): number {
  const inv = frictions.reduce((a, f) => a + 1 / f, 0)
  const inv2 = frictions.reduce((a, f) => a + 1 / (f * f), 0)
  return Math.sqrt(2 * G * TARGET * (inv / inv2))
}

/**
 * Adapting: give the puck a small test nudge first, see how far it slides, and
 * work out the friction from that. `error` is the relative error in measuring the slide.
 */
export function estimateFriction(trueFriction: number, error: number, nudgeSpeed = 1): number {
  const measured = slideDistance(nudgeSpeed, trueFriction) * (1 + error)
  return (nudgeSpeed * nudgeSpeed) / (2 * G * measured)
}

export const REAL_FRICTIONS = Array.from({ length: 31 }, (_, i) => Math.round((0.2 + i * 0.02) * 100) / 100) // 0.20 .. 0.80

export interface GapCurves {
  nominalSpeed: number
  robustSpeed: number
  /** Where the puck stops, for each real friction. */
  nominal: number[]
  robust: number[]
  adaptive: number[]
}

export function gapCurves(assumed: number, spread: number, measurementError: number): GapCurves {
  const nominalSpeed = speedFor(assumed)
  const robust = robustSpeed(frictionRange(Math.max(0.1, assumed - spread), assumed + spread))
  return {
    nominalSpeed,
    robustSpeed: robust,
    nominal: REAL_FRICTIONS.map((f) => slideDistance(nominalSpeed, f)),
    robust: REAL_FRICTIONS.map((f) => slideDistance(robust, f)),
    adaptive: REAL_FRICTIONS.map((f) => slideDistance(speedFor(estimateFriction(f, measurementError)), f)),
  }
}

/** Average miss over a range of real frictions, in metres. */
export const averageMiss = (landings: number[]) => landings.reduce((a, d) => a + Math.abs(d - TARGET), 0) / landings.length
export const worstMiss = (landings: number[]) => Math.max(...landings.map((d) => Math.abs(d - TARGET)))

// ---- Improving a pretrained policy from its own experience ----
//
// A pretrained policy chooses among a few ways of doing a task. Each way has a
// success rate the policy does not know.

export interface Strategy {
  name: string
  share: number // how often the pretrained policy uses it
  success: number
}

export const STRATEGIES: Strategy[] = [
  { name: 'Careful grasp from above', share: 0.3, success: 0.99 },
  { name: 'Quick grasp from above', share: 0.4, success: 0.85 },
  { name: 'Grasp from the side', share: 0.2, success: 0.7 },
  { name: 'Push, then grasp', share: 0.1, success: 0.3 },
]
export const START_SHARES = STRATEGIES.map((s) => s.share)

export const successRate = (shares: number[]) => shares.reduce((s, p, i) => s + p * STRATEGIES[i].success, 0)

export type Rule = 'successes' | 'advantage'

/**
 * One round with unlimited data.
 *  successes  imitate every attempt that succeeded: each strategy is reweighted by its success rate
 *  advantage  imitate the attempts whose strategy is better than the policy's average
 */
export function improveOnce(shares: number[], rule: Rule): number[] {
  const average = successRate(shares)
  let weights = shares.map((p, i) => (rule === 'successes' ? p * STRATEGIES[i].success : STRATEGIES[i].success > average + 1e-12 ? p : 0))
  if (weights.every((w) => w === 0)) weights = shares.slice() // nothing beats the average: the policy has converged
  const z = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / z)
}

export interface Improvement {
  shares: number[][] // after each round, starting with the pretrained policy
  success: number[]
}

export function improveExactly(rounds: number, rule: Rule): Improvement {
  let shares = START_SHARES
  const out: Improvement = { shares: [shares], success: [successRate(shares)] }
  for (let r = 0; r < rounds; r++) {
    shares = improveOnce(shares, rule)
    out.shares.push(shares)
    out.success.push(successRate(shares))
  }
  return out
}

/** The same loop with a finite number of attempts per round, so success rates have to be estimated. */
export function improveFromData(rounds: number, attempts: number, rule: Rule, seed: number): Improvement {
  const rng = mulberry32(seed)
  let shares = START_SHARES
  const out: Improvement = { shares: [shares], success: [successRate(shares)] }
  for (let r = 0; r < rounds; r++) {
    const tried = new Array<number>(STRATEGIES.length).fill(0)
    const worked = new Array<number>(STRATEGIES.length).fill(0)
    for (let i = 0; i < attempts; i++) {
      let u = rng()
      let a = 0
      while (a < shares.length - 1 && u >= shares[a]) {
        u -= shares[a]
        a += 1
      }
      tried[a] += 1
      if (rng() < STRATEGIES[a].success) worked[a] += 1
    }
    const average = worked.reduce((a, b) => a + b, 0) / attempts
    let weights = rule === 'successes' ? worked.slice() : tried.map((n, a) => (n > 0 && worked[a] / n > average + 1e-12 ? n : 0))
    if (weights.every((w) => w === 0)) weights = tried.slice()
    const z = weights.reduce((a, b) => a + b, 0)
    shares = weights.map((w) => w / z)
    out.shares.push(shares)
    out.success.push(successRate(shares))
  }
  return out
}

export function averageImprovement(rounds: number, attempts: number, rule: Rule, runs: number): number[] {
  const out = new Array<number>(rounds + 1).fill(0)
  for (let seed = 1; seed <= runs; seed++) improveFromData(rounds, attempts, rule, seed).success.forEach((v, i) => (out[i] += v / runs))
  return out
}

/** Chance that a task of several stages, each done with the given reliability, succeeds end to end. */
export const chained = (reliability: number, stages: number) => reliability ** stages
