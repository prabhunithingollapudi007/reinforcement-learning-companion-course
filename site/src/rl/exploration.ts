// Week 11: exploring when rewards are many deliberate steps away.
//
// A corridor of n cells. The agent starts at the left end. "Retreat" jumps back
// to the start and pays a small, certain reward. "Advance" moves one cell right
// and pays nothing, except at the far end, where it pays 1 every step.
// The agent is told none of this.

import { mulberry32 } from './prediction'

export const RETREAT = 0
export const ADVANCE = 1
export const SMALL = 0.05
export const GAMMA = 0.9
export const EXTRA_STEPS = 5 // steps available at the far end once reached

export type Explorer = 'epsilon' | 'bonus' | 'posterior'
export const EXPLORER_NAMES: Record<Explorer, string> = {
  epsilon: 'ε-greedy Q-learning',
  bonus: 'Optimism: exploration bonus',
  posterior: 'Posterior sampling',
}

export const horizon = (n: number) => n - 1 + EXTRA_STEPS

export function corridorStep(n: number, s: number, a: number): { next: number; reward: number } {
  if (a === RETREAT) return { next: 0, reward: SMALL }
  if (s === n - 1) return { next: s, reward: 1 }
  return { next: s + 1, reward: 0 }
}

/** The best possible return in one episode: walk to the end, then collect. */
export const bestReturn = () => EXTRA_STEPS
/** What always retreating earns in one episode. */
export const safeReturn = (n: number) => SMALL * horizon(n)

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

interface Model {
  count: number[][] // visits to each (state, action)
  next: number[][] // where it led (the world is deterministic; the agent just remembers)
  rewardSum: number[][]
}
const newModel = (n: number): Model => ({
  count: Array.from({ length: n }, () => [0, 0]),
  next: Array.from({ length: n }, () => [0, 0]),
  rewardSum: Array.from({ length: n }, () => [0, 0]),
})

/** Plan with value iteration on a model given as reward and next-state tables. */
function plan(n: number, reward: number[][], next: (number | null)[][], unknownValue: number): number[][] {
  let Q = Array.from({ length: n }, () => [0, 0])
  for (let k = 0; k < 60; k++) {
    Q = Q.map((_, s) =>
      [0, 1].map((a) => {
        const s2 = next[s][a]
        // A pair never tried is assumed to be as good as anything could be.
        if (s2 === null) return unknownValue
        return reward[s][a] + GAMMA * Math.max(Q[s2][0], Q[s2][1])
      }),
    )
  }
  return Q
}

export interface RunOptions {
  n: number
  episodes: number
  epsilon: number
  bonus: number
  seed: number
}

export interface ExplorationRun {
  returns: number[] // total reward of each episode
  foundAt: number | null // first episode in which the far reward was collected
  visits: number[] // how many times each cell was entered
}

export function runExplorer(kind: Explorer, o: RunOptions): ExplorationRun {
  const rng = mulberry32(o.seed)
  const n = o.n
  const H = horizon(n)
  const vMax = 1 / (1 - GAMMA)
  const Qlearn = Array.from({ length: n }, () => [0, 0])
  const model = newModel(n)
  const returns: number[] = []
  const visits = new Array<number>(n).fill(0)
  let foundAt: number | null = null

  for (let e = 0; e < o.episodes; e++) {
    // Model-based explorers re-plan once per episode.
    let Q: number[][] = Qlearn
    if (kind === 'bonus') {
      const reward = model.count.map((row, s) => row.map((c, a) => (c ? model.rewardSum[s][a] / c + o.bonus / Math.sqrt(c) : 0)))
      const next = model.count.map((row, s) => row.map((c, a) => (c ? model.next[s][a] : null)))
      Q = plan(n, reward, next, vMax)
    } else if (kind === 'posterior') {
      // Sample one plausible world: known pairs get their observed outcome with a little
      // reward uncertainty; unknown pairs get a reward and destination drawn from the prior.
      const reward = model.count.map((row, s) => row.map((c, a) => (c ? model.rewardSum[s][a] / c + (0.3 * gaussian(rng)) / Math.sqrt(c) : 0.5 + 0.5 * gaussian(rng))))
      const next = model.count.map((row, s) => row.map((c, a) => (c ? model.next[s][a] : Math.floor(rng() * n))))
      Q = plan(n, reward, next, vMax)
    }

    let s = 0
    let total = 0
    for (let t = 0; t < H; t++) {
      let a: number
      if (kind === 'epsilon' && rng() < o.epsilon) a = rng() < 0.5 ? RETREAT : ADVANCE
      else if (Math.abs(Q[s][0] - Q[s][1]) < 1e-12) a = rng() < 0.5 ? RETREAT : ADVANCE
      else a = Q[s][1] > Q[s][0] ? ADVANCE : RETREAT

      const { next, reward } = corridorStep(n, s, a)
      total += reward
      if (reward === 1 && foundAt === null) foundAt = e + 1
      visits[next] += 1

      model.count[s][a] += 1
      model.next[s][a] = next
      model.rewardSum[s][a] += reward
      if (kind === 'epsilon') Qlearn[s][a] += 0.5 * (reward + GAMMA * Math.max(Qlearn[next][0], Qlearn[next][1]) - Qlearn[s][a])
      s = next
    }
    returns.push(total)
  }
  return { returns, foundAt, visits }
}

export interface ExplorationSummary {
  averageReturns: number[] // by episode, averaged over runs
  foundShare: number // share of runs that ever found the far reward
  medianFoundAt: number | null // among all runs; null if fewer than half found it
  farthest: number // average of the farthest cell reached
}

export function summarise(kind: Explorer, o: Omit<RunOptions, 'seed'>, runs: number): ExplorationSummary {
  const sums = new Array<number>(o.episodes).fill(0)
  const found: number[] = []
  let farthest = 0
  for (let r = 0; r < runs; r++) {
    const run = runExplorer(kind, { ...o, seed: 100 + r })
    run.returns.forEach((v, e) => (sums[e] += v))
    found.push(run.foundAt ?? Infinity)
    let far = 0
    run.visits.forEach((v, s) => {
      if (v > 0) far = s
    })
    farthest += far
  }
  found.sort((a, b) => a - b)
  const median = found[Math.floor(runs / 2)]
  return {
    averageReturns: sums.map((v) => v / runs),
    foundShare: found.filter((f) => Number.isFinite(f)).length / runs,
    medianFoundAt: Number.isFinite(median) ? median : null,
    farthest: farthest / runs,
  }
}

/**
 * A rough count of episodes ε-greedy needs to walk the whole corridor once the
 * retreat reward has been learned everywhere: each of the n - 1 advances must be
 * an exploratory step that happens to choose "advance", probability ε / 2 each.
 */
export const epsilonEpisodesNeeded = (n: number, epsilon: number) => (2 / epsilon) ** (n - 1)
