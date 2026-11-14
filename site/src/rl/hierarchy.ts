// Week 14: breaking long tasks into pieces.

import { mulberry32 } from './prediction'

// ---- Four rooms ----

export const LAYOUT = [
  '#############',
  '#.....#.....#',
  '#.....#.....#',
  '#...........#',
  '#.....#.....#',
  '#.....#.....#',
  '##.####.....#',
  '#.....###.###',
  '#.....#.....#',
  '#.....#.....#',
  '#...........#',
  '#.....#.....#',
  '#############',
]
export const ROWS = LAYOUT.length
export const COLS = LAYOUT[0].length
export const cellOf = (row: number, col: number) => row * COLS + col
export const isWall = (cell: number) => LAYOUT[Math.floor(cell / COLS)][cell % COLS] === '#'
export const OPEN_CELLS = Array.from({ length: ROWS * COLS }, (_, c) => c).filter((c) => !isWall(c))

/** The four doorways between rooms. */
export const DOORS = [cellOf(3, 6), cellOf(6, 2), cellOf(7, 9), cellOf(10, 6)]
export const START = cellOf(1, 1)
export const GOAL = cellOf(9, 10)

const STEP = [-COLS, 1, COLS, -1] // up, right, down, left

export function moveIn(cell: number, action: number): number {
  const next = cell + STEP[action]
  return isWall(next) ? cell : next
}

/** From every cell, the first move of a shortest path to `target`, and how far away it is. */
function routesTo(target: number): { first: Int8Array; dist: Int16Array } {
  const first = new Int8Array(ROWS * COLS).fill(-1)
  const dist = new Int16Array(ROWS * COLS).fill(-1)
  const queue = [target]
  dist[target] = 0
  while (queue.length) {
    const cell = queue.shift()!
    for (let a = 0; a < 4; a++) {
      // Walk backwards: `from` reaches `cell` by action a.
      const from = cell - STEP[a]
      if (from < 0 || from >= ROWS * COLS || isWall(from) || dist[from] >= 0) continue
      dist[from] = dist[cell] + 1
      first[from] = a
      queue.push(from)
    }
  }
  return { first, dist }
}

/** Which room each cell is in (0 to 3). Doorways and walls are -1. */
export const ROOM: Int8Array = (() => {
  const room = new Int8Array(ROWS * COLS).fill(-1)
  let next = 0
  for (const seed of OPEN_CELLS) {
    if (room[seed] >= 0 || DOORS.includes(seed)) continue
    const queue = [seed]
    room[seed] = next
    while (queue.length) {
      const cell = queue.shift()!
      for (let a = 0; a < 4; a++) {
        const to = moveIn(cell, a)
        if (room[to] < 0 && !DOORS.includes(to)) {
          room[to] = next
          queue.push(to)
        }
      }
    }
    next += 1
  }
  return room
})()

/** The rooms a cell touches: its own, or for a doorway the two it joins. */
export function roomsOf(cell: number): number[] {
  if (ROOM[cell] >= 0) return [ROOM[cell]]
  return [0, 1, 2, 3].filter((r) => [0, 1, 2, 3].some((a) => ROOM[moveIn(cell, a)] === r))
}

/** Places a higher level can ask for: the four doorways, the middle of each room, and the goal. */
export const LANDMARKS = [...DOORS, cellOf(3, 3), cellOf(3, 9), cellOf(9, 3), cellOf(10, 9), GOAL]
export const LANDMARK_NAMES = ['top door', 'left door', 'right door', 'bottom door', 'room 1', 'room 2', 'room 3', 'room 4', 'the goal']
const ROUTES = LANDMARKS.map(routesTo)

/** The low level can only reach a place in a room it is already in or standing at the door of. */
export function withinReach(cell: number, landmark: number): boolean {
  const here = roomsOf(cell)
  return roomsOf(LANDMARKS[landmark]).some((r) => here.includes(r))
}

/** Steps lost when the low level is asked for something out of its reach. */
export const WASTED = 6

/**
 * Three agents.
 *  flat      chooses single moves
 *  doors     chooses single moves or "go to doorway k" from anywhere
 *  subgoals  chooses a landmark; a low level walks there if it is within reach
 */
export type AgentKind = 'flat' | 'doors' | 'subgoals'
export const AGENT_NAMES: Record<AgentKind, string> = {
  flat: 'Flat: single moves',
  doors: 'Moves plus door-seeking skills',
  subgoals: 'Subgoals for a low level',
}
export const choicesFor = (kind: AgentKind) => (kind === 'flat' ? 4 : kind === 'doors' ? 8 : LANDMARKS.length)

export interface Outcome {
  cell: number
  steps: number
  reward: number // discounted within the choice
  reachedGoal: boolean
  path: number[] // cells stood on, one per step
}

function follow(cell: number, landmark: number, gamma: number, budget: number): Outcome {
  const target = LANDMARKS[landmark]
  const path: number[] = []
  let s = cell
  let steps = 0
  if (s === target) return { cell: s, steps: 1, reward: 0, reachedGoal: false, path: [s] }
  while (s !== target && steps < budget) {
    s = moveIn(s, ROUTES[landmark].first[s])
    path.push(s)
    steps += 1
    if (s === GOAL) return { cell: s, steps, reward: gamma ** (steps - 1), reachedGoal: true, path }
  }
  return { cell: s, steps, reward: 0, reachedGoal: false, path }
}

/** Carry out one choice: a single move, or a whole skill until it finishes. */
export function execute(kind: AgentKind, cell: number, choice: number, gamma: number, budget: number): Outcome {
  if (kind !== 'subgoals' && choice < 4) {
    const next = moveIn(cell, choice)
    return { cell: next, steps: 1, reward: next === GOAL ? 1 : 0, reachedGoal: next === GOAL, path: [next] }
  }
  if (kind === 'doors') return follow(cell, choice - 4, gamma, budget)
  if (!withinReach(cell, choice)) {
    const steps = Math.min(WASTED, budget)
    return { cell, steps, reward: 0, reachedGoal: false, path: new Array<number>(steps).fill(cell) }
  }
  return follow(cell, choice, gamma, budget)
}

// ---- Exploring at random (no learning, no reward) ----

export interface Wander {
  visits: number[] // per cell
  firstGoal: number | null // the step on which the goal was first stood on
}

export function wander(kind: AgentKind, steps: number, seed: number): Wander {
  const rng = mulberry32(seed)
  const visits = new Array<number>(ROWS * COLS).fill(0)
  let firstGoal: number | null = null
  let s = START
  visits[s] = 1
  let t = 0
  while (t < steps) {
    const out = execute(kind, s, Math.floor(rng() * choicesFor(kind)), 1, steps - t)
    for (const cell of out.path) {
      visits[cell] += 1
      t += 1
      if (cell === GOAL && firstGoal === null) firstGoal = t
    }
    s = out.cell
  }
  return { visits, firstGoal }
}

/** Median number of steps of random wandering before the goal is first reached. */
export function medianFirstGoal(kind: AgentKind, runs: number, cap = 50000): number {
  const times = Array.from({ length: runs }, (_, r) => wander(kind, cap, 500 + r).firstGoal ?? cap).sort((a, b) => a - b)
  return times[Math.floor(runs / 2)]
}

// ---- Learning to reach the goal ----

export interface LearnOptions {
  kind: AgentKind
  episodes: number
  seed: number
  epsilon?: number
  alpha?: number
  gamma?: number
  maxSteps?: number
}

/** Q-learning over choices; for the two agents with skills this is SMDP Q-learning. Returns the steps each episode took. */
export function learnRooms(o: LearnOptions): number[] {
  const rng = mulberry32(o.seed)
  const epsilon = o.epsilon ?? 0.1
  const alpha = o.alpha ?? 0.25
  const gamma = o.gamma ?? 0.95
  const maxSteps = o.maxSteps ?? 20000
  const n = choicesFor(o.kind)
  const q = new Float64Array(ROWS * COLS * n)
  const best = (s: number) => {
    let top = -Infinity
    for (let c = 0; c < n; c++) top = Math.max(top, q[s * n + c])
    return top
  }
  const lengths: number[] = []
  for (let e = 0; e < o.episodes; e++) {
    let s = START
    let t = 0
    while (t < maxSteps) {
      let choice: number
      if (rng() < epsilon) choice = Math.floor(rng() * n)
      else {
        const top = best(s)
        const ties: number[] = []
        for (let c = 0; c < n; c++) if (q[s * n + c] >= top - 1e-12) ties.push(c)
        choice = ties[Math.floor(rng() * ties.length)]
      }
      const out = execute(o.kind, s, choice, gamma, maxSteps - t)
      const target = out.reward + (out.reachedGoal ? 0 : gamma ** out.steps * best(out.cell))
      q[s * n + choice] += alpha * (target - q[s * n + choice])
      s = out.cell
      t += out.steps
      if (out.reachedGoal) break
    }
    lengths.push(t)
  }
  return lengths
}

export function averageLengths(kind: AgentKind, episodes: number, runs: number): number[] {
  const out = new Array<number>(episodes).fill(0)
  for (let r = 0; r < runs; r++) learnRooms({ kind, episodes, seed: 100 + r }).forEach((v, i) => (out[i] += v / runs))
  return out
}

/** The fewest primitive steps from start to goal. */
export function shortestPath(): number {
  const dist = new Int32Array(ROWS * COLS).fill(-1)
  dist[START] = 0
  const queue = [START]
  while (queue.length) {
    const cell = queue.shift()!
    for (let a = 0; a < 4; a++) {
      const next = moveIn(cell, a)
      if (dist[next] < 0) {
        dist[next] = dist[cell] + 1
        queue.push(next)
      }
    }
  }
  return dist[GOAL]
}

// ---- Why long tasks fail, and what a higher level can do about it ----

/** Chance of finishing a task of `steps` steps when each step independently goes right with probability p. */
export const flatSuccess = (p: number, steps: number) => p ** steps

/**
 * The same task cut into `pieces` equal subtasks. A higher level notices when a
 * subtask has failed and asks for it again, up to `retries` more times.
 */
export function hierarchicalSuccess(p: number, steps: number, pieces: number, retries: number): number {
  const one = p ** (steps / pieces)
  return (1 - (1 - one) ** (retries + 1)) ** pieces
}
