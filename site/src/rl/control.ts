// Week 3: learning to act without a model.
// A cliff world: every step costs 1, stepping off the cliff costs 100 and ends
// the episode. The shortest route to the goal runs along the cliff edge.

import { mulberry32 } from './prediction'

export const ROWS = 4
export const COLS = 10
export const N_STATES = ROWS * COLS
export const N_ACTIONS = 4
export const START = (ROWS - 1) * COLS
export const GOAL = ROWS * COLS - 1
export const STEP_REWARD = -1
export const CLIFF_REWARD = -100
export const MAX_STEPS = 400

// up, right, down, left
const MOVES: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
]

export const isCliff = (s: number) => Math.floor(s / COLS) === ROWS - 1 && s % COLS > 0 && s % COLS < COLS - 1

export interface Transition {
  next: number
  reward: number
  done: boolean
}

export function step(s: number, a: number): Transition {
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor(s / COLS) + MOVES[a][0]))
  const c = Math.min(COLS - 1, Math.max(0, (s % COLS) + MOVES[a][1]))
  const next = r * COLS + c
  if (isCliff(next)) return { next, reward: CLIFF_REWARD, done: true }
  return { next, reward: STEP_REWARD, done: next === GOAL }
}

export type QTable = number[][]
export const emptyQ = (): QTable => Array.from({ length: N_STATES }, () => new Array<number>(N_ACTIONS).fill(0))

/** The best action in a state. Ties go to a random best action so early behaviour is not skewed. */
export function greedyAction(Q: QTable, s: number, rng?: () => number): number {
  let best = -Infinity
  let ties: number[] = []
  for (let a = 0; a < N_ACTIONS; a++) {
    if (Q[s][a] > best + 1e-12) {
      best = Q[s][a]
      ties = [a]
    } else if (Math.abs(Q[s][a] - best) <= 1e-12) ties.push(a)
  }
  return rng ? ties[Math.floor(rng() * ties.length)] : ties[0]
}

/** With probability epsilon act at random, otherwise act greedily. */
export function epsilonGreedy(Q: QTable, s: number, epsilon: number, rng: () => number): number {
  return rng() < epsilon ? Math.floor(rng() * N_ACTIONS) : greedyAction(Q, s, rng)
}

export type Method = 'sarsa' | 'qlearning'

export interface Hyper {
  alpha: number
  epsilon: number
  gamma: number
}

export interface EpisodeResult {
  reward: number
  fell: boolean
  steps: number
}

/** One episode of learning. Q is updated in place. */
export function runEpisode(Q: QTable, method: Method, h: Hyper, rng: () => number): EpisodeResult {
  let s = START
  let a = epsilonGreedy(Q, s, h.epsilon, rng)
  let total = 0
  for (let t = 0; t < MAX_STEPS; t++) {
    const { next, reward, done } = step(s, a)
    total += reward
    // The action the agent will actually take next. SARSA learns from it; Q-learning ignores it.
    const nextAction = done ? 0 : epsilonGreedy(Q, next, h.epsilon, rng)
    const future = done ? 0 : method === 'sarsa' ? Q[next][nextAction] : Math.max(...Q[next])
    Q[s][a] += h.alpha * (reward + h.gamma * future - Q[s][a])
    if (done) return { reward: total, fell: isCliff(next), steps: t + 1 }
    s = next
    a = nextAction
  }
  return { reward: total, fell: false, steps: MAX_STEPS }
}

/** The route from the start when always taking the best-looking action. */
export function greedyPath(Q: QTable): { path: number[]; reachesGoal: boolean } {
  const path = [START]
  const seen = new Set(path)
  let s = START
  for (let t = 0; t < N_STATES; t++) {
    const { next, done } = step(s, greedyAction(Q, s))
    if (seen.has(next)) break
    path.push(next)
    seen.add(next)
    s = next
    if (done) return { path, reachesGoal: next === GOAL }
  }
  return { path, reachesGoal: false }
}

/** Average reward per episode while learning, over several independent runs. */
export function averageRewards(method: Method, h: Hyper, episodes: number, runs: number, seed: number): number[] {
  const sums = new Array<number>(episodes).fill(0)
  const rng = mulberry32(seed)
  for (let run = 0; run < runs; run++) {
    const Q = emptyQ()
    for (let e = 0; e < episodes; e++) sums[e] += runEpisode(Q, method, h, rng).reward
  }
  return sums.map((v) => v / runs)
}

/** Smooth a curve with a trailing window, so the trend is visible through the noise. */
export function smooth(values: number[], window: number): number[] {
  let sum = 0
  return values.map((v, i) => {
    sum += v
    if (i >= window) sum -= values[i - window]
    return sum / Math.min(i + 1, window)
  })
}

/** How far the greedy route stays from the cliff, in rows, averaged over its length. */
export function meanDistanceFromCliff(path: number[]): number {
  const middle = path.filter((s) => s !== START && s !== GOAL)
  if (!middle.length) return 0
  return middle.reduce((sum, s) => sum + (ROWS - 1 - Math.floor(s / COLS)), 0) / middle.length
}

// ---- Maximisation bias ----

function gaussian(rng: () => number): number {
  // Box-Muller
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

export interface BiasSamples {
  single: number[] // max over one set of noisy estimates
  double: number[] // pick the action with one set, read its value from another
}

/**
 * Every action is truly worth 0. Each estimate is the truth plus noise.
 * The max of the estimates is biased upward; the double estimate is not.
 */
export function maximisationBias(opts: { actions: number; noise: number; trials: number; seed: number }): BiasSamples {
  const rng = mulberry32(opts.seed)
  const single: number[] = []
  const double: number[] = []
  for (let t = 0; t < opts.trials; t++) {
    const first = Array.from({ length: opts.actions }, () => opts.noise * gaussian(rng))
    const second = Array.from({ length: opts.actions }, () => opts.noise * gaussian(rng))
    let best = 0
    for (let a = 1; a < opts.actions; a++) if (first[a] > first[best]) best = a
    single.push(first[best])
    double.push(second[best])
  }
  return { single, double }
}

/** Probability of each action under epsilon-greedy when `best` is the greedy action. */
export function epsilonGreedyProbabilities(actions: number, epsilon: number, best = 0): number[] {
  return Array.from({ length: actions }, (_, a) => epsilon / actions + (a === best ? 1 - epsilon : 0))
}
