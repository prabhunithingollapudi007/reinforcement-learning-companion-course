// Week 15: reinforcement learning for language models, on a model small enough to see.
//
// One prompt ("summarise this article") and six kinds of response the model might give.
// The "language model" is a probability for each.

import { mulberry32 } from './prediction'

export interface Response {
  name: string
  /** How often the starting model gives it. */
  ref: number
  /** What people actually think of it, 0 to 10. */
  human: number
  /** What the learned reward model scores it, 0 to 10. */
  rewardModel: number
}

export const RESPONSES: Response[] = [
  { name: 'Accurate and concise', ref: 0.2, human: 8.0, rewardModel: 7.5 },
  { name: 'Accurate but rambling', ref: 0.3, human: 6.0, rewardModel: 6.0 },
  { name: 'Vague generalities', ref: 0.25, human: 3.0, rewardModel: 3.5 },
  { name: 'Confident, one invented fact', ref: 0.1, human: 1.0, rewardModel: 2.0 },
  { name: 'Flattering and heavily formatted', ref: 0.05, human: 2.0, rewardModel: 9.5 },
  { name: 'Off topic', ref: 0.1, human: 0.5, rewardModel: 0.5 },
]
/** The response the reward model is wrong about. */
export const HACK = 4

export const REF = RESPONSES.map((r) => r.ref)
export const HUMAN = RESPONSES.map((r) => r.human)
export const REWARD_MODEL = RESPONSES.map((r) => r.rewardModel)

/** The policy that maximises expected reward minus beta times KL from the reference. */
export function regularisedOptimum(ref: number[], reward: number[], beta: number): number[] {
  const top = Math.max(...reward)
  const weights = ref.map((p, i) => p * Math.exp((reward[i] - top) / beta))
  const z = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / z)
}

export const expected = (p: number[], values: number[]) => p.reduce((s, pi, i) => s + pi * values[i], 0)
export const kl = (p: number[], q: number[]) => p.reduce((s, pi, i) => (pi > 0 ? s + pi * Math.log(pi / q[i]) : s), 0)
export const totalVariation = (p: number[], q: number[]) => 0.5 * p.reduce((s, pi, i) => s + Math.abs(pi - q[i]), 0)

/** Strengths of optimisation to sweep: beta from gentle to aggressive. */
export const BETAS = [20, 10, 6, 4, 3, 2.5, 2, 1.5, 1.2, 1, 0.8, 0.6, 0.4, 0.2]

export interface SweepPoint {
  beta: number
  policy: number[]
  rewardModelScore: number
  humanScore: number
  /** What the same optimisation would give if the reward model were exactly right. */
  humanScoreIfPerfect: number
  kl: number
}

export function sweep(): SweepPoint[] {
  return BETAS.map((beta) => {
    const policy = regularisedOptimum(REF, REWARD_MODEL, beta)
    return {
      beta,
      policy,
      rewardModelScore: expected(policy, REWARD_MODEL),
      humanScore: expected(policy, HUMAN),
      humanScoreIfPerfect: expected(regularisedOptimum(REF, HUMAN, beta), HUMAN),
      kl: kl(policy, REF),
    }
  })
}

// ---- Preferences, a reward model, and DPO ----

export interface Pair {
  winner: number
  loser: number
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

/** People compare two responses; the better one usually, not always, wins (Bradley-Terry). */
export function samplePairs(n: number, seed: number, quality: number[] = HUMAN): Pair[] {
  const rng = mulberry32(seed)
  const pairs: Pair[] = []
  for (let k = 0; k < n; k++) {
    const i = Math.floor(rng() * quality.length)
    let j = Math.floor(rng() * (quality.length - 1))
    if (j >= i) j += 1
    const iWins = rng() < sigmoid((quality[i] - quality[j]) / 2)
    pairs.push(iWins ? { winner: i, loser: j } : { winner: j, loser: i })
  }
  return pairs
}

/** Fit one score per response so that winners outscore losers. Scores are centred on zero. */
export function fitRewardModel(pairs: Pair[], n: number, steps = 4000, rate = 0.5): number[] {
  const r = new Array<number>(n).fill(0)
  for (let s = 0; s < steps; s++) {
    const grad = new Array<number>(n).fill(0)
    for (const { winner, loser } of pairs) {
      const push = 1 - sigmoid(r[winner] - r[loser])
      grad[winner] += push / pairs.length
      grad[loser] -= push / pairs.length
    }
    for (let i = 0; i < n; i++) r[i] += rate * grad[i]
  }
  const mean = r.reduce((a, b) => a + b, 0) / n
  return r.map((v) => v - mean)
}

const softmax = (logits: number[]) => {
  const top = Math.max(...logits)
  const e = logits.map((l) => Math.exp(l - top))
  const z = e.reduce((a, b) => a + b, 0)
  return e.map((v) => v / z)
}

export function dpoLoss(policy: number[], ref: number[], pairs: Pair[], beta: number): number {
  let loss = 0
  for (const { winner, loser } of pairs) {
    const margin = beta * (Math.log(policy[winner] / ref[winner]) - Math.log(policy[loser] / ref[loser]))
    loss -= Math.log(sigmoid(margin)) / pairs.length
  }
  return loss
}

export interface DpoRun {
  policies: number[][] // after 0, 1, 2, ... recorded steps
  losses: number[]
  recordedAt: number[]
}

/** Gradient descent on the DPO loss, starting from the reference model. No reward model, no sampling. */
export function runDpo(pairs: Pair[], ref: number[], beta: number, steps: number, rate = 0.3, every = 1): DpoRun {
  const logits = ref.map((p) => Math.log(p))
  const out: DpoRun = { policies: [], losses: [], recordedAt: [] }
  for (let s = 0; s <= steps; s++) {
    const policy = softmax(logits)
    if (s % every === 0) {
      out.policies.push(policy)
      out.losses.push(dpoLoss(policy, ref, pairs, beta))
      out.recordedAt.push(s)
    }
    // d loss / d log p(y): -beta (1 - sigma(margin)) for the winner, + for the loser.
    const gradLogP = new Array<number>(ref.length).fill(0)
    for (const { winner, loser } of pairs) {
      const margin = beta * (Math.log(policy[winner] / ref[winner]) - Math.log(policy[loser] / ref[loser]))
      const push = (beta * (1 - sigmoid(margin))) / pairs.length
      gradLogP[winner] -= push
      gradLogP[loser] += push
    }
    // Chain through the softmax: d log p_i / d logit_j = [i = j] - p_j.
    const total = gradLogP.reduce((a, b) => a + b, 0)
    for (let j = 0; j < logits.length; j++) logits[j] -= rate * (gradLogP[j] - policy[j] * total)
  }
  return out
}

// ---- Thinking by sampling: majority vote ----

export interface VoteQuestion {
  name: string
  /** Probability of each distinct answer on one sample; index 0 is the correct one. */
  answers: number[]
}

export const VOTE_QUESTIONS: VoteQuestion[] = [
  { name: 'Right answer is the most common one', answers: [0.4, 0.2, 0.15, 0.1, 0.1, 0.05] },
  { name: 'A tempting wrong answer is more common', answers: [0.3, 0.4, 0.1, 0.1, 0.05, 0.05] },
]
export const VOTE_SIZES = [1, 3, 5, 9, 17, 33, 65, 129]

/** How often the most common of n sampled answers is the correct one. Ties are split at random. */
export function voteAccuracy(answers: number[], n: number, trials: number, seed: number): number {
  const rng = mulberry32(seed)
  let correct = 0
  for (let t = 0; t < trials; t++) {
    const counts = new Array<number>(answers.length).fill(0)
    for (let k = 0; k < n; k++) {
      let u = rng()
      let a = 0
      while (a < answers.length - 1 && u >= answers[a]) {
        u -= answers[a]
        a += 1
      }
      counts[a] += 1
    }
    const top = Math.max(...counts)
    const winners = counts.flatMap((c, a) => (c === top ? [a] : []))
    if (winners[Math.floor(rng() * winners.length)] === 0) correct += 1
  }
  return correct / trials
}

export const voteCurve = (answers: number[]) => VOTE_SIZES.map((n) => voteAccuracy(answers, n, 4000, 11))

// ---- GRPO: scoring a group of answers to the same question against each other ----

/** Each answer's advantage is its reward relative to the group: (r - mean) / standard deviation. */
export function groupAdvantages(rewards: number[]): number[] {
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length
  const std = Math.sqrt(rewards.reduce((s, r) => s + (r - mean) ** 2, 0) / rewards.length)
  return rewards.map((r) => (r - mean) / (std + 1e-8))
}
