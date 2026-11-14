// Week 8: learning a policy from demonstrations.

import { mulberry32 } from './prediction'

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

// ---- Demonstrations with two different good answers ----
//
// One state, one continuous action (think: steering angle at an obstacle).
// Some demonstrators go left (about -1), the rest go right (about +1).
// Anything near 0 hits the obstacle.

export const LEFT = -1
export const RIGHT = 1
export const GAP = 0.5 // |action| below this is a crash

export function makeDemos(n: number, shareLeft: number, seed: number): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, () => (rng() < shareLeft ? LEFT : RIGHT) + 0.15 * gaussian(rng))
}

/** What squared-error regression learns for a single state: the mean of the demonstrated actions. */
export const regressionAction = (demos: number[]) => demos.reduce((a, b) => a + b, 0) / demos.length

export const crashes = (action: number) => Math.abs(action) < GAP

/**
 * The ideal flow-matching velocity for this dataset, in closed form.
 * A noisy point x at time t was made as x = t * demo + (1 - t) * noise; the best
 * prediction of (demo - noise) is (expected demo given x - x) / (1 - t).
 */
export function velocity(x: number, t: number, demos: number[]): number {
  const s = Math.max(1 - t, 1e-3)
  let total = 0
  let weighted = 0
  // Subtract the largest exponent for numerical stability.
  let best = -Infinity
  const exps = demos.map((d) => {
    const e = -((x - t * d) ** 2) / (2 * s * s)
    if (e > best) best = e
    return e
  })
  for (let i = 0; i < demos.length; i++) {
    const w = Math.exp(exps[i] - best)
    total += w
    weighted += w * demos[i]
  }
  return (weighted / total - x) / s
}

export interface Flow {
  /** paths[i][k] is sample i after k Euler steps; the last entry is the generated action. */
  paths: number[][]
}

/** Turn Gaussian noise into actions by following the velocity field in `steps` Euler steps. */
export function generate(demos: number[], samples: number, steps: number, seed: number): Flow {
  const rng = mulberry32(seed)
  const paths: number[][] = []
  for (let i = 0; i < samples; i++) {
    let x = gaussian(rng)
    const path = [x]
    for (let k = 0; k < steps; k++) {
      x += velocity(x, k / steps, demos) / steps
      path.push(x)
    }
    paths.push(path)
  }
  return { paths }
}

// ---- Compounding errors: staying in a lane ----
//
// The state is the car's sideways offset. The expert steers back toward the
// centre. The clone copies the expert wherever it has seen data, and does
// nothing useful anywhere else.

export const LANE = 1 // leaving |offset| > LANE is a failure
export const GAIN = 0.5 // the expert removes this share of the offset each step

export interface LaneOptions {
  wobble: number // random push from the road each step
  cloneError: number // how imperfectly the clone copies the expert's steering
  demos: number // expert demonstrations collected up front
  horizon: number
  rollouts: number // evaluation runs
  seed: number
}

export interface LaneRun {
  paths: number[][]
  failures: number
  covered: number // the clone has data for |offset| up to this
}

function rollout(covered: number | null, o: LaneOptions, rng: () => number): { path: number[]; failed: boolean } {
  let x = 0
  const path = [x]
  for (let t = 0; t < o.horizon; t++) {
    let steer: number
    if (covered === null) steer = -GAIN * x // the expert always corrects
    else if (Math.abs(x) <= covered) steer = -GAIN * x + o.cloneError * gaussian(rng) // a slightly imperfect copy
    else steer = 0 // never saw a state like this: no idea what to do
    x += steer + o.wobble * gaussian(rng)
    path.push(x)
    if (Math.abs(x) > LANE) return { path, failed: true }
  }
  return { path, failed: false }
}

/** The widest offset the expert's own demonstrations contain. */
export function expertCoverage(o: LaneOptions): number {
  const rng = mulberry32(o.seed)
  let widest = 0
  for (let i = 0; i < o.demos; i++) for (const x of rollout(null, o, rng).path) widest = Math.max(widest, Math.abs(x))
  return widest
}

/**
 * Behaviour cloning followed by `rounds` rounds of DAgger. Each round runs the
 * current clone, asks the expert what it would have done in every state the
 * clone visited inside the lane, and adds those to the data.
 */
export function dagger(o: LaneOptions, rounds: number): LaneRun[] {
  let covered = expertCoverage(o)
  const runs: LaneRun[] = []
  for (let r = 0; r <= rounds; r++) {
    const rng = mulberry32(o.seed + 100 + r)
    const paths: number[][] = []
    let failures = 0
    let widest = covered
    for (let i = 0; i < o.rollouts; i++) {
      const { path, failed } = rollout(covered, o, rng)
      paths.push(path)
      if (failed) failures++
      // Only the first few runs of a round are sent to the expert for labelling.
      if (i < o.demos) for (const x of path) if (Math.abs(x) <= LANE) widest = Math.max(widest, Math.abs(x))
    }
    runs.push({ paths, failures, covered })
    covered = widest
  }
  return runs
}

export function expertRun(o: LaneOptions): LaneRun {
  const rng = mulberry32(o.seed + 100)
  const paths: number[][] = []
  let failures = 0
  for (let i = 0; i < o.rollouts; i++) {
    const { path, failed } = rollout(null, o, rng)
    paths.push(path)
    if (failed) failures++
  }
  return { paths, failures, covered: LANE }
}

// ---- Counting mistakes over a long task ----

/** Expected mistakes in T steps when each step goes wrong independently with probability eps. */
export const independentMistakes = (eps: number, T: number) => eps * T

/**
 * Expected mistakes when the first mistake takes the learner somewhere it has
 * never seen, after which every step is a mistake. Grows like eps * T^2 / 2.
 */
export function compoundingMistakes(eps: number, T: number): number {
  let total = 0
  for (let t = 1; t <= T; t++) total += 1 - (1 - eps) ** t
  return total
}
