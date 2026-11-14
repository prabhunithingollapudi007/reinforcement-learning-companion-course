// Week 13: many tasks at once, goals, and learning to learn.

import { mulberry32 } from './prediction'

// ---- Goal-conditioned Q-learning on a grid, with and without hindsight relabelling ----
//
// The agent is told a goal cell and is paid 1 only on the step that reaches it.
// Q is a table over (cell, goal, action), so nothing learned for one goal carries
// over to another by itself. All sharing has to come from relabelling.

export const MOVES: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

export interface GoalOptions {
  size: number
  episodes: number
  /** Extra goals each step is replayed with: 0 turns hindsight relabelling off. */
  hindsight: number
  seed: number
  steps?: number
  gamma?: number
  alpha?: number
  epsilon?: number
}

export function moveCell(size: number, s: number, a: number): number {
  const x = Math.min(size - 1, Math.max(0, (s % size) + MOVES[a][0]))
  const y = Math.min(size - 1, Math.max(0, Math.floor(s / size) + MOVES[a][1]))
  return y * size + x
}

export interface Episode {
  start: number
  goal: number
  states: number[] // visited cells, including the start
  actions: number[]
  reached: boolean
}

export class GoalLearner {
  readonly size: number
  readonly n: number
  readonly steps: number
  private q: Float32Array
  private rng: () => number
  private gamma: number
  private alpha: number
  private epsilon: number
  private hindsight: number
  /** How many learning updates had a non-zero target: the amount of useful signal so far. */
  usefulUpdates = 0
  totalUpdates = 0

  constructor(o: Omit<GoalOptions, 'episodes'>) {
    this.size = o.size
    this.n = o.size * o.size
    this.steps = o.steps ?? 2 * o.size
    this.gamma = o.gamma ?? 0.9
    this.alpha = o.alpha ?? 0.5
    this.epsilon = o.epsilon ?? 0.2
    this.hindsight = o.hindsight
    this.q = new Float32Array(this.n * this.n * 4)
    this.rng = mulberry32(o.seed)
  }

  private at(s: number, g: number, a: number) {
    return (s * this.n + g) * 4 + a
  }

  best(s: number, g: number): number {
    let top = -Infinity
    for (let a = 0; a < 4; a++) top = Math.max(top, this.q[this.at(s, g, a)])
    return top
  }

  /** The greedy action, with ties broken at random. */
  greedy(s: number, g: number, rng: () => number): number {
    const top = this.best(s, g)
    const ties = [0, 1, 2, 3].filter((a) => this.q[this.at(s, g, a)] >= top - 1e-9)
    return ties[Math.floor(rng() * ties.length)]
  }

  private update(s: number, a: number, s2: number, g: number) {
    const target = s2 === g ? 1 : this.gamma * this.best(s2, g)
    const i = this.at(s, g, a)
    this.q[i] += this.alpha * (target - this.q[i])
    this.totalUpdates += 1
    if (target > 0) this.usefulUpdates += 1
  }

  /** Run one training episode and learn from it. */
  episode(): Episode {
    const rng = this.rng
    const start = Math.floor(rng() * this.n)
    let goal = Math.floor(rng() * (this.n - 1))
    if (goal >= start) goal += 1
    const states = [start]
    const actions: number[] = []
    let s = start
    for (let t = 0; t < this.steps && s !== goal; t++) {
      const a = rng() < this.epsilon ? Math.floor(rng() * 4) : this.greedy(s, goal, rng)
      s = moveCell(this.size, s, a)
      states.push(s)
      actions.push(a)
    }
    // Learn from the last step backwards, so that what the end of the episode
    // teaches is already known when the earlier steps are replayed.
    for (let t = actions.length - 1; t >= 0; t--) {
      // What was asked for.
      this.update(states[t], actions[t], states[t + 1], goal)
      // Hindsight: replay the same step as if a cell reached later had been the goal.
      for (let k = 0; k < this.hindsight; k++) {
        const later = states[t + 1 + Math.floor(rng() * (actions.length - t))]
        if (later !== states[t]) this.update(states[t], actions[t], states[t + 1], later)
      }
    }
    return { start, goal, states, actions, reached: s === goal }
  }

  /** Can the greedy policy get from `start` to `goal` in time? */
  reaches(start: number, goal: number, rng: () => number): boolean {
    let s = start
    for (let t = 0; t < this.steps && s !== goal; t++) s = moveCell(this.size, s, this.greedy(s, goal, rng))
    return s === goal
  }

  /** Share of random start-goal pairs the greedy policy solves. */
  successRate(pairs: number, seed: number): number {
    const rng = mulberry32(seed)
    let ok = 0
    for (let i = 0; i < pairs; i++) {
      const start = Math.floor(rng() * this.n)
      let goal = Math.floor(rng() * (this.n - 1))
      if (goal >= start) goal += 1
      if (this.reaches(start, goal, rng)) ok += 1
    }
    return ok / pairs
  }

  /** For one start cell: which goals can the greedy policy reach? */
  reachable(start: number, seed: number): boolean[] {
    const rng = mulberry32(seed)
    return Array.from({ length: this.n }, (_, g) => g === start || this.reaches(start, g, rng))
  }
}

export const CHECKPOINTS = [0, 25, 50, 100, 200, 400, 800, 1600]

export interface GoalRun {
  success: number[] // at each checkpoint
  usefulShare: number
  learner: GoalLearner
}

/** Train to `episodes`, measuring success at every checkpoint on the way. */
export function trainGoals(o: GoalOptions): GoalRun {
  const learner = new GoalLearner(o)
  const success: number[] = []
  let done = 0
  for (const checkpoint of CHECKPOINTS) {
    if (checkpoint > o.episodes) break
    while (done < checkpoint) {
      learner.episode()
      done += 1
    }
    success.push(learner.successRate(300, 99))
  }
  while (done < o.episodes) {
    learner.episode()
    done += 1
  }
  return { success, usefulShare: learner.totalUpdates ? learner.usefulUpdates / learner.totalUpdates : 0, learner }
}

// ---- Learning to learn: a family of bandit tasks with a clue ----
//
// Every task has ARMS levers, exactly one of which pays 1 each time. Which one
// changes from task to task. A further lever, the clue, never pays, but pulling
// it reveals which lever does. An agent gets PULLS pulls per task.
//
// The agent remembers a summary of the task so far: how many pulls it has made,
// how many levers have failed, and whether it knows a lever that pays. It has
// three moves. What it learns, slowly and across many tasks, is which move to
// make for each memory.

export const ARMS = 8
export const PULLS = 10
export const CLUE = ARMS // the index of the clue lever
export const MOVE_NAMES = ['try a new lever', 'pull the clue', 'pull the best lever known']
// Move 0 is trying a new lever.
const ASK = 1
const BEST = 2
const MEMORIES = PULLS * ARMS * 2

export interface Pull {
  arm: number
  paid: boolean
  move: number
}

/** What has happened in this task so far. */
class Memory {
  status = new Array<number>(ARMS).fill(0) // 0 untried, 1 failed, 2 paid
  told = -1
  get known(): number {
    return this.told >= 0 ? this.told : this.status.indexOf(2)
  }
  get failures(): number {
    return this.status.filter((v) => v === 1).length
  }
  index(t: number): number {
    return (t * ARMS + this.failures) * 2 + (this.known >= 0 ? 1 : 0)
  }
  /** Turn a move into a lever. */
  lever(move: number, rng: () => number): number {
    const pick = (list: number[]) => list[Math.floor(rng() * list.length)]
    const untried = this.status.flatMap((v, a) => (v === 0 ? [a] : []))
    const failed = this.status.flatMap((v, a) => (v === 1 ? [a] : []))
    if (move === ASK) return CLUE
    if (move === BEST && this.known >= 0) return this.known
    if (move === BEST && failed.length) return pick(failed)
    return untried.length ? pick(untried) : pick(failed)
  }
  observe(arm: number, good: number) {
    if (arm === CLUE) this.told = good
    else this.status[arm] = arm === good ? 2 : 1
  }
}

export class MetaLearner {
  private q = new Float32Array(MEMORIES * 3)
  private rng: () => number
  tasksSeen = 0
  constructor(seed: number) {
    this.rng = mulberry32(seed)
    // Start optimistic: assume every remaining pull could pay. A move is only
    // given up on after it has been tried and found wanting.
    for (let t = 0; t < PULLS; t++) this.q.fill(PULLS - t, t * ARMS * 2 * 3, (t + 1) * ARMS * 2 * 3)
  }

  private value(memory: number): number {
    return Math.max(this.q[memory * 3], this.q[memory * 3 + 1], this.q[memory * 3 + 2])
  }

  private greedy(memory: number, rng: () => number): number {
    const top = this.value(memory)
    const ties = [0, 1, 2].filter((m) => this.q[memory * 3 + m] >= top - 1e-9)
    return ties[Math.floor(rng() * ties.length)]
  }

  /** One task. With `learn`, this is a step of the slow outer loop; without, it is a test. */
  runTask(good: number, learn: boolean, rng: () => number = this.rng): Pull[] {
    const epsilon = learn ? 0.2 : 0
    const memory = new Memory()
    const pulls: Pull[] = []
    const steps: { before: number; move: number; paid: boolean; after: number }[] = []
    for (let t = 0; t < PULLS; t++) {
      const before = memory.index(t)
      const move = rng() < epsilon ? Math.floor(rng() * 3) : this.greedy(before, rng)
      const arm = memory.lever(move, rng)
      const paid = arm === good
      memory.observe(arm, good)
      pulls.push({ arm, paid, move })
      steps.push({ before, move, paid, after: t < PULLS - 1 ? memory.index(t + 1) : -1 })
    }
    if (learn) {
      // Learn from the last pull backwards, so the end of the task informs the start at once.
      for (let t = PULLS - 1; t >= 0; t--) {
        const step = steps[t]
        const future = step.after >= 0 ? this.value(step.after) : 0
        const i = step.before * 3 + step.move
        this.q[i] += 0.1 * ((step.paid ? 1 : 0) + future - this.q[i])
      }
      this.tasksSeen += 1
    }
    return pulls
  }

  train(tasks: number) {
    for (let i = 0; i < tasks; i++) this.runTask(Math.floor(this.rng() * ARMS), true)
  }

  /** Average reward on fresh tasks, acting greedily. */
  evaluate(tasks: number, seed: number): { reward: number; perPull: number[]; clueFirst: number } {
    const rng = mulberry32(seed)
    const perPull = new Array<number>(PULLS).fill(0)
    let clueFirst = 0
    for (let i = 0; i < tasks; i++) {
      const pulls = this.runTask(Math.floor(rng() * ARMS), false, rng)
      pulls.forEach((p, t) => {
        if (p.paid) perPull[t] += 1 / tasks
      })
      if (pulls[0].arm === CLUE) clueFirst += 1 / tasks
    }
    return { reward: perPull.reduce((a, b) => a + b, 0), perPull, clueFirst }
  }
}

/** A general-purpose learner with no experience of this family: UCB1 over all nine levers. */
export function ucbFromScratch(good: number): Pull[] {
  const counts = new Array<number>(ARMS + 1).fill(0)
  const sums = new Array<number>(ARMS + 1).fill(0)
  const pulls: Pull[] = []
  for (let t = 0; t < PULLS; t++) {
    let arm = counts.indexOf(0)
    if (arm < 0) {
      let top = -Infinity
      for (let a = 0; a <= ARMS; a++) {
        const score = sums[a] / counts[a] + Math.sqrt((2 * Math.log(t)) / counts[a])
        if (score > top) {
          top = score
          arm = a
        }
      }
    }
    const paid = arm === good
    counts[arm] += 1
    sums[arm] += paid ? 1 : 0
    pulls.push({ arm, paid, move: -1 })
  }
  return pulls
}

export function ucbAverage(): { reward: number; perPull: number[] } {
  const perPull = new Array<number>(PULLS).fill(0)
  for (let good = 0; good < ARMS; good++) ucbFromScratch(good).forEach((p, t) => (perPull[t] += p.paid ? 1 / ARMS : 0))
  return { reward: perPull.reduce((a, b) => a + b, 0), perPull }
}

/** Trying the paying levers one at a time, never using the clue. */
export const BEST_WITHOUT_CLUE = PULLS - (ARMS - 1) / 2
/** Pulling the clue first, then the lever it names. */
export const BEST_WITH_CLUE = PULLS - 1

export const META_CHECKPOINTS = [0, 5, 10, 20, 30, 40, 50, 75, 100, 150, 200]

export function metaCurve(seed: number): { reward: number[]; clueFirst: number[] } {
  const learner = new MetaLearner(seed)
  const reward: number[] = []
  const clueFirst: number[] = []
  for (const checkpoint of META_CHECKPOINTS) {
    learner.train(checkpoint - learner.tasksSeen)
    const e = learner.evaluate(400, 7)
    reward.push(e.reward)
    clueFirst.push(e.clueFirst)
  }
  return { reward, clueFirst }
}

/** The same curve averaged over several independent meta-learners. */
export function metaAverage(learners: number): { reward: number[]; clueFirst: number[] } {
  const reward = new Array<number>(META_CHECKPOINTS.length).fill(0)
  const clueFirst = new Array<number>(META_CHECKPOINTS.length).fill(0)
  for (let seed = 1; seed <= learners; seed++) {
    const one = metaCurve(seed)
    one.reward.forEach((v, i) => (reward[i] += v / learners))
    one.clueFirst.forEach((v, i) => (clueFirst[i] += v / learners))
  }
  return { reward, clueFirst }
}

/** Success at each checkpoint, averaged over several independent goal learners. */
export function goalAverage(size: number, hindsight: number, learners: number): number[] {
  const out = new Array<number>(CHECKPOINTS.length).fill(0)
  for (let seed = 1; seed <= learners; seed++) {
    trainGoals({ size, episodes: CHECKPOINTS[CHECKPOINTS.length - 1], hindsight, seed }).success.forEach((v, i) => (out[i] += v / learners))
  }
  return out
}
