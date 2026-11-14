// Week 4: what changes when values come from a function instead of a table.

import { mulberry32 } from './prediction'

// ---- The two-state example behind the "deadly triad" ----
//
// State A has value w, state B has value 2w: one weight shared by both.
// A leads to B with reward 0, B ends the episode with reward 0, so every true value is 0.

export interface TriadOptions {
  gamma: number
  alpha: number
  /** Share of updates applied to state A. Following the policy gives 0.5; 1 means B is never updated. */
  shareA: number
  /** Bootstrapped TD target, or the Monte Carlo return (which is 0 here). */
  bootstrap: boolean
  /** One shared weight, or a separate table entry per state. */
  shared: boolean
  /** Copy the weight into the target every `freeze` updates (1 = no separate target). */
  freeze: number
  steps: number
}

export interface TriadTrace {
  /** Size of the value estimate for A after each update, starting from 1. */
  values: number[]
  diverges: boolean
}

export function triadTrace(o: TriadOptions): TriadTrace {
  const values = [1]
  if (o.shared) {
    let w = 1
    let target = 1
    for (let k = 1; k <= o.steps; k++) {
      const errorA = (o.bootstrap ? o.gamma * 2 * target : 0) - w // feature of A is 1
      const errorB = 0 - 2 * w // feature of B is 2
      w += o.alpha * (o.shareA * errorA * 1 + (1 - o.shareA) * errorB * 2)
      if (k % o.freeze === 0) target = w
      values.push(Math.abs(w))
    }
  } else {
    let vA = 1
    let vB = 2
    let targetB = vB
    for (let k = 1; k <= o.steps; k++) {
      vA += o.alpha * o.shareA * ((o.bootstrap ? o.gamma * targetB : 0) - vA)
      vB += o.alpha * (1 - o.shareA) * (0 - vB)
      if (k % o.freeze === 0) targetB = vB
      values.push(Math.abs(vA))
    }
  }
  const last = values[values.length - 1]
  return { values, diverges: last > values[Math.floor(values.length / 2)] * 1.0001 && last > 1 }
}

/** With one shared weight and bootstrapping, updates diverge once more than this share of them land on A. */
export const divergenceThreshold = (gamma: number) => 4 / (2 * gamma + 3)

// ---- Fitting a limited model from ordered or shuffled samples ----
//
// The model is a straight line; the thing it is fitting is a curve, so it cannot
// be right everywhere. The samples arrive either in the order a trajectory
// produces them, or drawn at random from everything seen so far.

export const curve = (x: number) => 0.5 + 0.4 * Math.sin(2 * Math.PI * x)

export interface Line {
  a: number
  b: number
}

export interface FitRun {
  lines: Line[] // the fit after every step
  error: number[] // mean squared error over the whole range after every step
  samples: number[] // the x used at each step
}

function lineError(line: Line): number {
  let sum = 0
  for (let i = 0; i <= 50; i++) {
    const x = i / 50
    sum += (line.a + line.b * x - curve(x)) ** 2
  }
  return sum / 51
}

export function fitLine(opts: { order: 'trajectory' | 'replay'; alpha: number; steps: number; sweep: number; seed: number }): FitRun {
  const rng = mulberry32(opts.seed)
  let line: Line = { a: 0, b: 0 }
  const lines = [line]
  const error = [lineError(line)]
  const samples: number[] = []
  for (let t = 0; t < opts.steps; t++) {
    const fresh = (t % opts.sweep) / (opts.sweep - 1) // the trajectory moves left to right, again and again
    // Replay draws from everything the trajectory has produced so far.
    const x = opts.order === 'trajectory' ? fresh : (Math.floor(rng() * Math.min(t + 1, opts.sweep)) % opts.sweep) / (opts.sweep - 1)
    const err = curve(x) - (line.a + line.b * x)
    line = { a: line.a + opts.alpha * err, b: line.b + opts.alpha * err * x }
    lines.push(line)
    error.push(lineError(line))
    samples.push(x)
  }
  return { lines, error, samples }
}

/** The best any straight line can do: the least-squares fit over the whole range. */
export function bestLineError(): number {
  // Closed form on the 51 evaluation points.
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  const n = 51
  for (let i = 0; i < n; i++) {
    const x = i / 50
    sx += x
    sy += curve(x)
    sxx += x * x
    sxy += x * curve(x)
  }
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const a = (sy - b * sx) / n
  return lineError({ a, b })
}

export const meanOf = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length
