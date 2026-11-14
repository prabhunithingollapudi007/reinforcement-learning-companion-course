import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GRID as g,
  DEFAULT_PARAMS,
  bellmanBackup,
  convergenceTrace,
  evaluatePolicy,
  greedyPolicy,
  intendedPath,
  maxNormDiff,
  outcomes,
  policyIteration,
  valueIteration,
  zeros,
} from './gridworld'

const at = (r: number, c: number) => r * g.cols + c

describe('gridworld dynamics', () => {
  it('splits slip evenly to the two sides and probabilities sum to 1', () => {
    const o = outcomes(g, at(2, 2), 1, 0.2)
    expect(o.reduce((s, x) => s + x.prob, 0)).toBeCloseTo(1)
    expect(o.find((x) => x.next === at(2, 3))?.prob).toBeCloseTo(0.8)
    expect(o.find((x) => x.next === at(3, 2))?.prob).toBeCloseTo(0.1) // slips into the pit below
  })
  it('bumping into a wall or the edge leaves the agent in place', () => {
    expect(outcomes(g, at(2, 1), 0, 0)[0].next).toBe(at(2, 1)) // wall above
    expect(outcomes(g, g.start, 3, 0)[0].next).toBe(g.start) // left edge
  })
})

describe('value iteration', () => {
  it('with no slip the start is worth gamma^6: seven moves to a +1 goal', () => {
    const { V } = valueIteration(g, { ...DEFAULT_PARAMS, slip: 0 })
    expect(V[g.start]).toBeCloseTo(0.9 ** 6, 9)
  })
  it('matches the reference values shared with the Python lab', () => {
    const { V } = valueIteration(g, DEFAULT_PARAMS)
    expect(V[g.start]).toBeCloseTo(0.1842, 4)
    expect(V[at(0, 0)]).toBeCloseTo(0.4958, 3)
    expect(V[at(2, 5)]).toBeCloseTo(0.9603, 3)
  })
  it('V_1 is the best one-step reward', () => {
    const V1 = bellmanBackup(g, DEFAULT_PARAMS, zeros(g))
    expect(V1[at(0, 5)]).toBeCloseTo(0.8) // move down into the goal succeeds 80% of the time
    expect(V1[at(0, 0)]).toBe(0)
  })
  it('agrees with policy iteration', () => {
    for (const p of [DEFAULT_PARAMS, { ...DEFAULT_PARAMS, gamma: 0.99 }, { ...DEFAULT_PARAMS, stepReward: -0.2 }]) {
      const { V } = valueIteration(g, p, 1e-13)
      const pi = policyIteration(g, p)
      expect(maxNormDiff(pi.values[pi.values.length - 1], V)).toBeLessThan(1e-8)
    }
  })
  it('policy iteration improves monotonically in every state', () => {
    const pi = policyIteration(g, DEFAULT_PARAMS)
    for (let i = 1; i < pi.values.length; i++) {
      pi.values[i].forEach((v, s) => expect(v).toBeGreaterThanOrEqual(pi.values[i - 1][s] - 1e-9))
    }
  })
  it('the greedy policy of V* evaluates to V*', () => {
    const { V } = valueIteration(g, DEFAULT_PARAMS, 1e-13)
    expect(maxNormDiff(evaluatePolicy(g, DEFAULT_PARAMS, greedyPolicy(g, DEFAULT_PARAMS, V)), V)).toBeLessThan(1e-8)
  })
})

describe('behaviour the lesson describes', () => {
  const route = (p: typeof DEFAULT_PARAMS) => {
    const { V } = valueIteration(g, p)
    const pol = greedyPolicy(g, p, V)
    return { first: pol[g.start], moves: intendedPath(g, pol).length - 1 }
  }
  it('route length flips with slip', () => {
    expect(route({ ...DEFAULT_PARAMS, slip: 0 }).moves).toBe(7)
    expect(route({ ...DEFAULT_PARAMS, slip: 0.1 }).moves).toBe(9)
    expect(route({ ...DEFAULT_PARAMS, slip: 0.25 }).first).toBe(3) // pushes into the left wall
  })
  it('step cost brings back the short route, then makes the pit attractive', () => {
    expect(route({ ...DEFAULT_PARAMS, stepReward: -0.14 }).moves).toBe(9)
    expect(route({ ...DEFAULT_PARAMS, stepReward: -0.16 }).moves).toBe(7)
    expect(route({ ...DEFAULT_PARAMS, stepReward: -0.28 }).first).toBe(1) // right, into the pit
  })
  it('both a patient and an impatient agent push into the wall at the start', () => {
    expect(route({ ...DEFAULT_PARAMS, gamma: 0.99 }).first).toBe(3)
    expect(route({ ...DEFAULT_PARAMS, gamma: 0.8 }).first).toBe(3)
    expect(route(DEFAULT_PARAMS).first).toBe(0)
  })
  it('convergence numbers quoted in the lesson', () => {
    const t = convergenceTrace(g, DEFAULT_PARAMS)
    expect(t.viErrors.length - 1).toBe(43)
    expect(t.policyOptimalAt).toBe(16)
    t.viErrors.forEach((e, k) => expect(e).toBeLessThanOrEqual(t.bound[k] + 1e-12))
    const last = t.viErrors.length - 1
    expect(t.viErrors[last] / t.viErrors[last - 1]).toBeCloseTo(0.74, 2)
    const patient = convergenceTrace(g, { ...DEFAULT_PARAMS, gamma: 0.99 })
    expect(patient.viErrors.length - 1).toBeGreaterThan(100)
    expect(patient.piErrors.length).toBeLessThan(10)
    const exact = convergenceTrace(g, { ...DEFAULT_PARAMS, slip: 0 })
    expect(exact.viErrors[exact.viErrors.length - 1]).toBe(0)
  })
})
