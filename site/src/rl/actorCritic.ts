// Week 7: a policy (the actor) trained with the help of a learned value estimate (the critic).

import { mulberry32 } from './prediction'

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

// ---- A corridor with a noisy prize ----
//
// Seven cells. The agent starts in the middle and chooses left or right in each cell.
// Leaving on the left pays 0. Leaving on the right pays 1 on average, but the
// payout is noisy. Each step costs a little, so dithering is bad.

export const CELLS = 7
export const START_CELL = 3
export const STEP_COST = 0.02
export const MAX_LEN = 60

export interface Agent {
  theta: number[] // one logit per cell: preference for moving right
  V: number[] // the critic: one value per cell
}
export const newAgent = (): Agent => ({ theta: new Array<number>(CELLS).fill(0), V: new Array<number>(CELLS).fill(0) })

export interface Options {
  mode: 'reinforce' | 'actor-critic'
  actorRate: number
  criticRate: number
  rewardNoise: number
}

export interface EpisodeOutcome {
  reward: number
  wentRight: boolean
  steps: number
}

/** Play one episode and learn from it. The agent is updated in place. */
export function learnEpisode(agent: Agent, o: Options, rng: () => number): EpisodeOutcome {
  const states: number[] = []
  const actions: number[] = []
  const rewards: number[] = []
  let s = START_CELL
  let wentRight = false
  for (let t = 0; t < MAX_LEN; t++) {
    const right = rng() < sigmoid(agent.theta[s])
    const next = s + (right ? 1 : -1)
    let r = -STEP_COST
    const done = next < 0 || next >= CELLS
    if (next >= CELLS) {
      r += 1 + o.rewardNoise * gaussian(rng)
      wentRight = true
    }
    states.push(s)
    actions.push(right ? 1 : 0)
    rewards.push(r)

    if (o.mode === 'actor-critic') {
      // Learn after every step, judging the action by the one-step TD error.
      const target = r + (done ? 0 : agent.V[next])
      const advantage = target - agent.V[s]
      agent.V[s] += o.criticRate * advantage
      // d/dtheta log pi(a|s) for a logistic policy is (a - p).
      agent.theta[s] += o.actorRate * advantage * ((right ? 1 : 0) - sigmoid(agent.theta[s]))
    }
    if (done) break
    s = next
  }

  if (o.mode === 'reinforce') {
    // Learn at the end, judging each action by the reward that followed it.
    // The baseline is the same learned value, so the comparison is fair.
    let G = 0
    for (let t = states.length - 1; t >= 0; t--) {
      G += rewards[t]
      const st = states[t]
      const advantage = G - agent.V[st]
      agent.V[st] += o.criticRate * advantage
      agent.theta[st] += o.actorRate * advantage * (actions[t] - sigmoid(agent.theta[st]))
    }
  }
  return { reward: rewards.reduce((a, b) => a + b, 0), wentRight, steps: states.length }
}

/** Probability of heading right from the start cell: a simple measure of how good the policy is. */
export const rightProbability = (agent: Agent) => sigmoid(agent.theta[START_CELL])

/** Average over many runs of the chance of leaving on the right, after each episode. */
export function learningCurve(o: Options, episodes: number, runs: number, seed: number): number[] {
  const sums = new Array<number>(episodes).fill(0)
  const rng = mulberry32(seed)
  for (let run = 0; run < runs; run++) {
    const agent = newAgent()
    for (let e = 0; e < episodes; e++) sums[e] += learnEpisode(agent, o, rng).wentRight ? 1 : 0
  }
  return sums.map((v) => v / runs)
}

// ---- Why a state-value critic cannot be trained from old data ----
//
// One state, two actions. Action 0 pays about `payA`, action 1 about `payB`.
// The buffer was filled by an old policy; we want the value of the current one.

export interface BufferStudy {
  truth: number // value of the current policy
  vFromBuffer: number // average reward in the buffer: what fitting V to the buffer gives
  qEstimates: (number | null)[] // per-action average reward in the buffer (null: never tried)
  vFromQ: number | null // sum over actions of current policy probability times Q
  counts: number[]
}

export function bufferStudy(opts: { oldP: number; newP: number; payA: number; payB: number; noise: number; size: number; seed: number }): BufferStudy {
  const rng = mulberry32(opts.seed)
  const sum = [0, 0]
  const counts = [0, 0]
  for (let i = 0; i < opts.size; i++) {
    const a = rng() < opts.oldP ? 1 : 0
    sum[a] += (a === 1 ? opts.payB : opts.payA) + opts.noise * gaussian(rng)
    counts[a] += 1
  }
  const qEstimates = counts.map((c, a) => (c > 0 ? sum[a] / c : null))
  const probs = [1 - opts.newP, opts.newP]
  const usable = qEstimates.every((q, a) => q !== null || probs[a] === 0)
  return {
    truth: probs[0] * opts.payA + probs[1] * opts.payB,
    vFromBuffer: (sum[0] + sum[1]) / opts.size,
    qEstimates,
    vFromQ: usable ? probs[0] * (qEstimates[0] ?? 0) + probs[1] * (qEstimates[1] ?? 0) : null,
    counts,
  }
}
