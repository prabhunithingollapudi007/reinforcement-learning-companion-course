// A small gridworld MDP with exact dynamic-programming solvers.
// The Python lab in labs/week01 implements the same world, and the tests
// check that both agree on the optimal values.

export type Cell = 'empty' | 'wall' | 'goal' | 'pit'

export interface GridSpec {
  rows: number
  cols: number
  cells: Cell[] // row-major
  start: number
}

export interface Params {
  gamma: number // discount factor
  slip: number // probability the move goes sideways (split evenly left/right)
  stepReward: number // reward added on every move ("living reward")
  goalReward: number
  pitReward: number
}

// up, right, down, left
export const ACTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
]
export const ACTION_NAMES = ['up', 'right', 'down', 'left'] as const
export const NO_ACTION = -1

export const DEFAULT_PARAMS: Params = {
  gamma: 0.9,
  slip: 0.2,
  stepReward: 0,
  goalReward: 1,
  pitReward: -1,
}

/** Parse a picture of the grid: . empty, # wall, G goal, P pit, S start. */
export function parseGrid(rowsText: string[]): GridSpec {
  const rows = rowsText.length
  const cols = rowsText[0].length
  const cells: Cell[] = []
  let start = 0
  rowsText.forEach((line, r) => {
    for (let c = 0; c < cols; c++) {
      const ch = line[c]
      if (ch === 'S') start = r * cols + c
      cells.push(ch === '#' ? 'wall' : ch === 'G' ? 'goal' : ch === 'P' ? 'pit' : 'empty')
    }
  })
  return { rows, cols, cells, start }
}

// The risky route along the pits takes 7 moves; the safe route over the top takes 9.
export const DEFAULT_GRID: GridSpec = parseGrid(['......', '.#.#.G', '......', 'SPPPP.'])

export function isTerminal(spec: GridSpec, s: number): boolean {
  return spec.cells[s] === 'goal' || spec.cells[s] === 'pit'
}

/** States where the agent actually chooses an action. */
export function isDecisionState(spec: GridSpec, s: number): boolean {
  return spec.cells[s] === 'empty'
}

function move(spec: GridSpec, s: number, a: number): number {
  const r = Math.floor(s / spec.cols) + ACTIONS[a][0]
  const c = (s % spec.cols) + ACTIONS[a][1]
  if (r < 0 || r >= spec.rows || c < 0 || c >= spec.cols) return s
  const s2 = r * spec.cols + c
  return spec.cells[s2] === 'wall' ? s : s2
}

export interface Outcome {
  next: number
  prob: number
}

/** P(s' | s, a): the intended move, or a slip to either side. */
export function outcomes(spec: GridSpec, s: number, a: number, slip: number): Outcome[] {
  const raw: Outcome[] = [
    { next: move(spec, s, a), prob: 1 - slip },
    { next: move(spec, s, (a + 1) % 4), prob: slip / 2 },
    { next: move(spec, s, (a + 3) % 4), prob: slip / 2 },
  ]
  return raw.filter((o) => o.prob > 0)
}

/** Reward for arriving in s': the step reward plus any goal or pit payoff. */
export function reward(spec: GridSpec, p: Params, next: number): number {
  const cell = spec.cells[next]
  return p.stepReward + (cell === 'goal' ? p.goalReward : cell === 'pit' ? p.pitReward : 0)
}

/** Q(s,a) = sum_s' P(s'|s,a) [ r + gamma V(s') ], with V = 0 at terminal states. */
export function qValue(spec: GridSpec, p: Params, V: number[], s: number, a: number): number {
  let q = 0
  for (const o of outcomes(spec, s, a, p.slip)) {
    const future = isTerminal(spec, o.next) ? 0 : V[o.next]
    q += o.prob * (reward(spec, p, o.next) + p.gamma * future)
  }
  return q
}

export function zeros(spec: GridSpec): number[] {
  return new Array(spec.cells.length).fill(0)
}

export function maxNormDiff(a: number[], b: number[]): number {
  let m = 0
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]))
  return m
}

const TIE = 1e-9

/** Greedy policy with respect to V (first best action wins ties). */
export function greedyPolicy(spec: GridSpec, p: Params, V: number[]): number[] {
  return spec.cells.map((_, s) => {
    if (!isDecisionState(spec, s)) return NO_ACTION
    let best = 0
    let bestQ = -Infinity
    for (let a = 0; a < 4; a++) {
      const q = qValue(spec, p, V, s, a)
      if (q > bestQ + TIE) {
        bestQ = q
        best = a
      }
    }
    return best
  })
}

/** One synchronous Bellman optimality backup: V_{k+1} = B V_k. */
export function bellmanBackup(spec: GridSpec, p: Params, V: number[]): number[] {
  return spec.cells.map((_, s) => {
    if (!isDecisionState(spec, s)) return 0
    let best = -Infinity
    for (let a = 0; a < 4; a++) best = Math.max(best, qValue(spec, p, V, s, a))
    return best
  })
}

/** One synchronous backup for a fixed policy: V_{k+1} = B^pi V_k. */
export function policyBackup(spec: GridSpec, p: Params, policy: number[], V: number[]): number[] {
  return spec.cells.map((_, s) =>
    isDecisionState(spec, s) ? qValue(spec, p, V, s, policy[s]) : 0,
  )
}

export interface IterationResult {
  V: number[]
  sweeps: number
  history: number[][] // V_0, V_1, ..., V_sweeps
}

export function valueIteration(
  spec: GridSpec,
  p: Params,
  tol = 1e-10,
  maxSweeps = 20000,
  keepHistory = false,
): IterationResult {
  let V = zeros(spec)
  const history: number[][] = keepHistory ? [V] : []
  let sweeps = 0
  while (sweeps < maxSweeps) {
    const next = bellmanBackup(spec, p, V)
    sweeps++
    const delta = maxNormDiff(next, V)
    V = next
    if (keepHistory) history.push(V)
    if (delta < tol) break
  }
  return { V, sweeps, history }
}

export function evaluatePolicy(
  spec: GridSpec,
  p: Params,
  policy: number[],
  tol = 1e-12,
  maxSweeps = 50000,
): number[] {
  let V = zeros(spec)
  for (let k = 0; k < maxSweeps; k++) {
    const next = policyBackup(spec, p, policy, V)
    const delta = maxNormDiff(next, V)
    V = next
    if (delta < tol) break
  }
  return V
}

export interface PolicyIterationResult {
  policies: number[][] // pi_0, pi_1, ...
  values: number[][] // V^{pi_0}, V^{pi_1}, ...
}

/** Policy iteration from a fixed starting policy (default: always move left). */
export function policyIteration(
  spec: GridSpec,
  p: Params,
  initialAction = 3,
  maxIters = 200,
): PolicyIterationResult {
  let policy = spec.cells.map((_, s) => (isDecisionState(spec, s) ? initialAction : NO_ACTION))
  const policies: number[][] = []
  const values: number[][] = []
  for (let i = 0; i < maxIters; i++) {
    const V = evaluatePolicy(spec, p, policy)
    policies.push(policy)
    values.push(V)
    // Keep the current action unless another is strictly better, so ties cannot cycle.
    const improved = policy.map((a, s) => {
      if (!isDecisionState(spec, s)) return NO_ACTION
      let best = a
      let bestQ = qValue(spec, p, V, s, a)
      for (let b = 0; b < 4; b++) {
        const q = qValue(spec, p, V, s, b)
        if (q > bestQ + TIE) {
          bestQ = q
          best = b
        }
      }
      return best
    })
    if (improved.every((a, s) => a === policy[s])) break
    policy = improved
  }
  return { policies, values }
}

/** The intended (slip-free) route from the start under a policy, for drawing. */
export function intendedPath(spec: GridSpec, policy: number[]): number[] {
  const path = [spec.start]
  const seen = new Set(path)
  let s = spec.start
  while (isDecisionState(spec, s) && policy[s] !== NO_ACTION) {
    const next = move(spec, s, policy[s])
    if (seen.has(next)) break
    path.push(next)
    seen.add(next)
    s = next
  }
  return path
}

export interface ConvergenceTrace {
  vStar: number[]
  viErrors: number[] // ||V_k - V*||_inf for k = 0..K
  bound: number[] // gamma^k ||V_0 - V*||_inf
  piErrors: number[] // ||V^{pi_i} - V*||_inf for each policy-iteration step
  policyOptimalAt: number // first sweep after which the greedy policy stays optimal
}

/** Everything the convergence chart needs, for one setting of the parameters. */
export function convergenceTrace(spec: GridSpec, p: Params, floor = 1e-6): ConvergenceTrace {
  const { V: vStar } = valueIteration(spec, p, 1e-13)
  const viErrors: number[] = []
  const policyValueCache = new Map<string, boolean>()
  const optimalFlags: boolean[] = []
  let V = zeros(spec)
  for (let k = 0; k <= 5000; k++) {
    const err = maxNormDiff(V, vStar)
    viErrors.push(err)
    const pol = greedyPolicy(spec, p, V)
    const key = pol.join(',')
    let optimal = policyValueCache.get(key)
    if (optimal === undefined) {
      optimal = maxNormDiff(evaluatePolicy(spec, p, pol), vStar) < 1e-7
      policyValueCache.set(key, optimal)
    }
    optimalFlags.push(optimal)
    if (err < floor) break
    V = bellmanBackup(spec, p, V)
  }
  let policyOptimalAt = optimalFlags.length - 1
  while (policyOptimalAt > 0 && optimalFlags[policyOptimalAt - 1]) policyOptimalAt--
  const bound = viErrors.map((_, k) => Math.pow(p.gamma, k) * viErrors[0])
  const pi = policyIteration(spec, p)
  const piErrors = pi.values.map((v) => maxNormDiff(v, vStar))
  return { vStar, viErrors, bound, piErrors, policyOptimalAt }
}
