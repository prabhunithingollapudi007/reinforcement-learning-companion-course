// Week 2: estimating the value of a policy from experience.
// A seven-state corridor in the spirit of the lecture's Mars rover: reward +1 for
// leaving at the left end, +10 at the right end, and a coin flip moves the rover
// one step left or right everywhere in between.

export interface Step {
  state: number
  reward: number
  next: number | null // null: the episode ended
}
export type Episode = Step[]

export const N_STATES = 7
export const START = 3 // the middle state, s4
export const LEFT_REWARD = 1
export const RIGHT_REWARD = 10

/** Small seeded generator so tests and playgrounds are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One episode of the random walk from `start`. */
export function sampleEpisode(rng: () => number, start = START): Episode {
  const episode: Episode = []
  let s = start
  for (;;) {
    if (s === 0) {
      episode.push({ state: s, reward: LEFT_REWARD, next: null })
      return episode
    }
    if (s === N_STATES - 1) {
      episode.push({ state: s, reward: RIGHT_REWARD, next: null })
      return episode
    }
    const next = rng() < 0.5 ? s - 1 : s + 1
    episode.push({ state: s, reward: 0, next })
    s = next
  }
}

/** Exact values, by repeating the Bellman backup with the known model. */
export function trueValues(gamma: number): number[] {
  let V = new Array<number>(N_STATES).fill(0)
  for (let k = 0; k < 20000; k++) {
    const next = V.map((_, s) =>
      s === 0 ? LEFT_REWARD : s === N_STATES - 1 ? RIGHT_REWARD : gamma * 0.5 * (V[s - 1] + V[s + 1]),
    )
    const delta = Math.max(...next.map((v, s) => Math.abs(v - V[s])))
    V = next
    if (delta < 1e-13) break
  }
  return V
}

/** G_t for every step of an episode, computed backwards: G_t = r_t + gamma G_{t+1}. */
export function returns(episode: Episode, gamma: number): number[] {
  const G = new Array<number>(episode.length)
  let running = 0
  for (let t = episode.length - 1; t >= 0; t--) {
    running = episode[t].reward + gamma * running
    G[t] = running
  }
  return G
}

/** Monte Carlo: move each visited state's estimate toward the return that followed. */
export function mcUpdate(V: number[], episode: Episode, gamma: number, alpha: number, firstVisit = false): number[] {
  const next = V.slice()
  const G = returns(episode, gamma)
  const seen = new Set<number>()
  episode.forEach((step, t) => {
    if (firstVisit && seen.has(step.state)) return
    seen.add(step.state)
    next[step.state] += alpha * (G[t] - next[step.state])
  })
  return next
}

/** TD(0): after every step, move the estimate toward r + gamma V(next). */
export function tdUpdate(V: number[], episode: Episode, gamma: number, alpha: number): number[] {
  const next = V.slice()
  for (const step of episode) {
    const target = step.reward + (step.next === null ? 0 : gamma * next[step.next])
    next[step.state] += alpha * (target - next[step.state])
  }
  return next
}

export function rmsError(V: number[], truth: number[]): number {
  return Math.sqrt(V.reduce((sum, v, s) => sum + (v - truth[s]) ** 2, 0) / V.length)
}

export interface Curves {
  mc: number[] // RMS error after 0, 1, 2, ... episodes, averaged over runs
  td: number[]
}

/** Average learning curves for both methods on the same episodes. */
export function learningCurves(opts: { episodes: number; runs: number; alpha: number; gamma: number; seed: number }): Curves {
  const truth = trueValues(opts.gamma)
  const mc = new Array<number>(opts.episodes + 1).fill(0)
  const td = new Array<number>(opts.episodes + 1).fill(0)
  const rng = mulberry32(opts.seed)
  for (let run = 0; run < opts.runs; run++) {
    let vMc = new Array<number>(N_STATES).fill(0)
    let vTd = new Array<number>(N_STATES).fill(0)
    mc[0] += rmsError(vMc, truth)
    td[0] += rmsError(vTd, truth)
    for (let e = 1; e <= opts.episodes; e++) {
      const episode = sampleEpisode(rng)
      vMc = mcUpdate(vMc, episode, opts.gamma, opts.alpha)
      vTd = tdUpdate(vTd, episode, opts.gamma, opts.alpha)
      mc[e] += rmsError(vMc, truth)
      td[e] += rmsError(vTd, truth)
    }
  }
  return { mc: mc.map((v) => v / opts.runs), td: td.map((v) => v / opts.runs) }
}

export interface TargetSamples {
  truth: number
  mc: number[] // sampled returns from the state
  td: number[] // sampled one-step targets r + gamma * estimate(next)
}

/**
 * Many learning targets for one state, of each kind. The TD targets use value
 * estimates that are off by `estimateError` everywhere, to show where TD's bias comes from.
 */
export function sampleTargets(opts: { state: number; gamma: number; estimateError: number; samples: number; seed: number }): TargetSamples {
  const truth = trueValues(opts.gamma)
  const estimate = truth.map((v) => v + opts.estimateError)
  const rng = mulberry32(opts.seed)
  const mc: number[] = []
  const td: number[] = []
  for (let i = 0; i < opts.samples; i++) {
    const episode = sampleEpisode(rng, opts.state)
    mc.push(returns(episode, opts.gamma)[0])
    const first = episode[0]
    td.push(first.reward + (first.next === null ? 0 : opts.gamma * estimate[first.next]))
  }
  return { truth: truth[opts.state], mc, td }
}

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
export const variance = (xs: number[]) => {
  const m = mean(xs)
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length
}

// ---- Batch evaluation on a fixed dataset (the A/B example) ----

/** Batch Monte Carlo: the average return observed from each state. */
export function batchMonteCarlo(episodes: Episode[], nStates: number, gamma: number): number[] {
  const total = new Array<number>(nStates).fill(0)
  const count = new Array<number>(nStates).fill(0)
  for (const episode of episodes) {
    const G = returns(episode, gamma)
    episode.forEach((step, t) => {
      total[step.state] += G[t]
      count[step.state] += 1
    })
  }
  return total.map((g, s) => (count[s] ? g / count[s] : 0))
}

/**
 * Certainty equivalence: fit the maximum-likelihood model to the data, then
 * evaluate it exactly. Batch TD(0) converges to the same answer.
 */
export function certaintyEquivalence(episodes: Episode[], nStates: number, gamma: number): number[] {
  const count = new Array<number>(nStates).fill(0)
  const rewardSum = new Array<number>(nStates).fill(0)
  const transitions = Array.from({ length: nStates }, () => new Array<number>(nStates).fill(0))
  for (const episode of episodes) {
    for (const step of episode) {
      count[step.state] += 1
      rewardSum[step.state] += step.reward
      if (step.next !== null) transitions[step.state][step.next] += 1
    }
  }
  let V = new Array<number>(nStates).fill(0)
  for (let k = 0; k < 10000; k++) {
    const next = V.map((_, s) => {
      if (!count[s]) return 0
      let future = 0
      for (let s2 = 0; s2 < nStates; s2++) future += (transitions[s][s2] / count[s]) * V[s2]
      return rewardSum[s] / count[s] + gamma * future
    })
    const delta = Math.max(...next.map((v, s) => Math.abs(v - V[s])))
    V = next
    if (delta < 1e-12) break
  }
  return V
}

/** The A/B dataset: one episode A -> B -> 0, then `ones` episodes B -> 1 and `zeros` episodes B -> 0. */
export function abDataset(ones: number, zeros: number): Episode[] {
  const A = 0
  const B = 1
  const episodes: Episode[] = [
    [
      { state: A, reward: 0, next: B },
      { state: B, reward: 0, next: null },
    ],
  ]
  for (let i = 0; i < ones; i++) episodes.push([{ state: B, reward: 1, next: null }])
  for (let i = 0; i < zeros; i++) episodes.push([{ state: B, reward: 0, next: null }])
  return episodes
}
