// Week 12: looking ahead with a model.

import { mulberry32 } from './prediction'

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

// ---- Tree search on a small decision tree ----
//
// Four decisions in a row, three options each: 81 possible outcomes.
// Option A at the root leads mostly to poor outcomes, with one excellent line.
// Option B is reliably decent. Option C is reliably mediocre.

export const BRANCH = 3
export const DEPTH = 4
export const NOISE = 0.2
export const BEST_PATH = [0, 1, 2, 0]

/** The true average payoff of an outcome, given the four choices that led to it. */
export function leafValue(path: number[]): number {
  if (path[0] === 1) return 0.5
  if (path[0] === 2) return 0.3
  if (path[1] !== 1) return 0.2
  if (path[2] !== 2) return 0.45
  return path[3] === 0 ? 1.0 : 0.8
}

/** What a root option is worth if every later choice is made at random. */
export function randomPolicyValue(first: number): number {
  let sum = 0
  for (let i = 0; i < BRANCH ** (DEPTH - 1); i++) {
    const rest = [Math.floor(i / 9) % 3, Math.floor(i / 3) % 3, i % 3]
    sum += leafValue([first, ...rest])
  }
  return sum / BRANCH ** (DEPTH - 1)
}

/** What a root option is worth if every later choice is made well. */
export function bestValue(first: number): number {
  let best = -Infinity
  for (let i = 0; i < BRANCH ** (DEPTH - 1); i++) {
    const rest = [Math.floor(i / 9) % 3, Math.floor(i / 3) % 3, i % 3]
    best = Math.max(best, leafValue([first, ...rest]))
  }
  return best
}

export interface TreeNode {
  visits: number
  total: number
}
export type Tree = Map<string, TreeNode>
const key = (path: number[]) => path.join('')

export interface SearchResult {
  tree: Tree
  rootVisits: number[]
  rootValues: number[]
  choice: number
}

/** Monte Carlo tree search with the UCT rule. */
export function uct(simulations: number, c: number, seed: number): SearchResult {
  const rng = mulberry32(seed)
  const tree: Tree = new Map([['', { visits: 0, total: 0 }]])
  for (let k = 0; k < simulations; k++) {
    const path: number[] = []
    // 1. Select: walk down while every child of the current node has been tried.
    for (;;) {
      if (path.length === DEPTH) break
      const children = [0, 1, 2].map((a) => tree.get(key([...path, a])))
      const untried = [0, 1, 2].filter((a) => !children[a])
      if (untried.length) {
        // 2. Expand: add one new child.
        const a = untried[Math.floor(rng() * untried.length)]
        path.push(a)
        tree.set(key(path), { visits: 0, total: 0 })
        break
      }
      const parent = tree.get(key(path))!
      let best = 0
      let bestScore = -Infinity
      children.forEach((child, a) => {
        const score = child!.total / child!.visits + c * Math.sqrt(Math.log(parent.visits) / child!.visits)
        if (score > bestScore) {
          bestScore = score
          best = a
        }
      })
      path.push(best)
    }
    // 3. Simulate: finish the remaining choices at random.
    const full = path.slice()
    while (full.length < DEPTH) full.push(Math.floor(rng() * BRANCH))
    const outcome = leafValue(full) + NOISE * gaussian(rng)
    // 4. Back up: every node on the path learns from the outcome.
    for (let d = 0; d <= path.length; d++) {
      const node = tree.get(key(path.slice(0, d)))!
      node.visits += 1
      node.total += outcome
    }
  }
  const roots = [0, 1, 2].map((a) => tree.get(String(a)) ?? { visits: 0, total: 0 })
  const rootVisits = roots.map((n) => n.visits)
  return { tree, rootVisits, rootValues: roots.map((n) => (n.visits ? n.total / n.visits : 0)), choice: rootVisits.indexOf(Math.max(...rootVisits)) }
}

/** Simple Monte Carlo search: the same budget spread evenly over the root options, with random play after. */
export function flatSearch(simulations: number, seed: number): { rootValues: number[]; choice: number } {
  const rng = mulberry32(seed)
  const total = [0, 0, 0]
  const count = [0, 0, 0]
  for (let k = 0; k < simulations; k++) {
    const a = k % BRANCH
    const path = [a]
    while (path.length < DEPTH) path.push(Math.floor(rng() * BRANCH))
    total[a] += leafValue(path) + NOISE * gaussian(rng)
    count[a] += 1
  }
  const rootValues = total.map((t, a) => (count[a] ? t / count[a] : 0))
  return { rootValues, choice: rootValues.indexOf(Math.max(...rootValues)) }
}

export const BUDGETS = [10, 20, 50, 100, 200, 500, 1000]

/** How often each method picks the truly best root option, for each simulation budget. */
export function accuracyByBudget(c: number, runs: number): { uct: number[]; flat: number[] } {
  const out = { uct: [] as number[], flat: [] as number[] }
  for (const budget of BUDGETS) {
    let u = 0
    let f = 0
    for (let r = 0; r < runs; r++) {
      if (uct(budget, c, 1000 + r).choice === 0) u++
      if (flatSearch(budget, 1000 + r).choice === 0) f++
    }
    out.uct.push(u / runs)
    out.flat.push(f / runs)
  }
  return out
}

// ---- A learned model drifting away from the world ----
//
// The real system swings around a circle, slowly spiralling inward.
// The learned model has the rotation speed slightly wrong.

export type Point = [number, number]
const ANGLE = 0.2
const DECAY = 0.99

function advance(p: Point, angle: number, decay: number): Point {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [decay * (c * p[0] - s * p[1]), decay * (s * p[0] + c * p[1])]
}

export const realStep = (p: Point): Point => advance(p, ANGLE, DECAY)
/** `error` is the relative error in the model's rotation speed. */
export const modelStep = (p: Point, error: number): Point => advance(p, ANGLE * (1 + error), DECAY)

export function realTrajectory(steps: number, start: Point = [1, 0]): Point[] {
  const out = [start]
  for (let t = 0; t < steps; t++) out.push(realStep(out[t]))
  return out
}

export function modelRollout(start: Point, steps: number, error: number): Point[] {
  const out = [start]
  for (let t = 0; t < steps; t++) out.push(modelStep(out[t], error))
  return out
}

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Distance between the model's prediction and reality after k steps from the same start. */
export function errorAfter(k: number, error: number, start: Point = [1, 0]): number {
  return distance(realTrajectory(k, start)[k], modelRollout(start, k, error)[k])
}

/** The average of several models with independent errors: an ensemble. */
export function ensembleErrorAfter(k: number, errors: number[], start: Point = [1, 0]): number {
  const real = realTrajectory(k, start)[k]
  const ends = errors.map((e) => modelRollout(start, k, e)[k])
  const mean: Point = [ends.reduce((s, p) => s + p[0], 0) / ends.length, ends.reduce((s, p) => s + p[1], 0) / ends.length]
  return distance(real, mean)
}

/** How far apart the ensemble's members are after k steps: their average distance from the ensemble mean. */
export function ensembleSpreadAfter(k: number, errors: number[], start: Point = [1, 0]): number {
  const ends = errors.map((e) => modelRollout(start, k, e)[k])
  const mean: Point = [ends.reduce((s, p) => s + p[0], 0) / ends.length, ends.reduce((s, p) => s + p[1], 0) / ends.length]
  return ends.reduce((s, p) => s + distance(p, mean), 0) / ends.length
}

/** Five models whose errors are spread around zero, scaled by one number. */
export const ENSEMBLE_SHAPE = [1, -0.8, 0.6, -1, 0.4]
export const ensembleErrors = (error: number) => ENSEMBLE_SHAPE.map((m) => m * error)

/** Model rollouts of length k, each restarted from the real state the system had reached. */
export function shortRollouts(total: number, k: number, error: number): Point[][] {
  const real = realTrajectory(total)
  const out: Point[][] = []
  for (let t = 0; t < total; t += k) out.push(modelRollout(real[t], Math.min(k, total - t), error))
  return out
}
