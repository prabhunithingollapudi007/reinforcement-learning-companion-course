import { describe, expect, it } from 'vitest'
import {
  BEST_PATH,
  BUDGETS,
  accuracyByBudget,
  bestValue,
  ensembleErrorAfter,
  ensembleErrors,
  ensembleSpreadAfter,
  errorAfter,
  flatSearch,
  leafValue,
  modelRollout,
  randomPolicyValue,
  realTrajectory,
  shortRollouts,
  uct,
} from './planning'

describe('the decision tree', () => {
  it('option A is the best choice only if the later choices are made well', () => {
    expect([0, 1, 2].map(bestValue)).toEqual([1, 0.5, 0.3])
    expect(randomPolicyValue(0)).toBeCloseTo(0.33, 2)
    expect(randomPolicyValue(1)).toBeCloseTo(0.5, 6)
    expect(randomPolicyValue(2)).toBeCloseTo(0.3, 6)
  })
  it('has one best line', () => {
    expect(leafValue(BEST_PATH)).toBe(1)
  })
})

describe('tree search against flat Monte Carlo (numbers quoted in the Week 12 lesson)', () => {
  it('with 500 simulations, tree search spends almost all of them under option A', () => {
    const r = uct(500, 0.5, 1001)
    expect(r.rootVisits).toEqual([474, 19, 7])
    expect(r.choice).toBe(0)
    expect(r.rootValues[0]).toBeCloseTo(0.97, 2)
    expect(r.tree.size).toBe(49)
    expect(r.rootVisits.reduce((a, b) => a + b)).toBe(500)
  })
  it('flat search with the same budget prefers option B, because it grades options by random play', () => {
    const f = flatSearch(500, 1001)
    expect(f.choice).toBe(1)
    expect(f.rootValues[0]).toBeCloseTo(0.38, 1)
    expect(f.rootValues[1]).toBeCloseTo(0.5, 1)
  })
  it('tree search gets better with budget; flat search gets reliably worse', () => {
    const a = accuracyByBudget(0.5, 100)
    const at = (b: number) => BUDGETS.indexOf(b)
    expect(a.uct[at(50)]).toBeCloseTo(0.51, 2)
    expect(a.uct[at(200)]).toBeCloseTo(0.9, 2)
    expect(a.uct[at(1000)]).toBe(1)
    expect(a.flat[at(10)]).toBeCloseTo(0.11, 2)
    expect(a.flat[at(200)]).toBe(0)
  })
  it('too little exploration is slower to find the best line', () => {
    const a = accuracyByBudget(0.3, 100)
    expect(a.uct[BUDGETS.indexOf(200)]).toBeCloseTo(0.5, 2)
    expect(a.uct[BUDGETS.indexOf(1000)]).toBeCloseTo(0.8, 2)
  })
  it('too much exploration spreads a small budget thin, then catches up', () => {
    const a = accuracyByBudget(1.4, 100)
    expect(a.uct[BUDGETS.indexOf(100)]).toBeCloseTo(0.44, 2)
    expect(a.uct[BUDGETS.indexOf(200)]).toBeCloseTo(0.99, 2)
  })
})

describe('a model that is slightly wrong', () => {
  it('a 5% error in one number is a 1% error after one step and a 19% error after 25', () => {
    expect(errorAfter(1, 0.05)).toBeCloseTo(0.0099, 4)
    expect(errorAfter(5, 0.05)).toBeCloseTo(0.048, 3)
    expect(errorAfter(25, 0.05)).toBeCloseTo(0.194, 3)
    expect(errorAfter(50, 0.05)).toBeCloseTo(0.299, 3)
  })
  it('a perfect model does not drift', () => {
    expect(errorAfter(50, 0)).toBeCloseTo(0, 12)
    expect(modelRollout([1, 0], 10, 0)).toEqual(realTrajectory(10))
  })
  it('averaging five models with different errors cancels most of the drift', () => {
    expect(ensembleErrorAfter(25, [0.05, -0.04, 0.03, -0.05, 0.02])).toBeCloseTo(0.017, 3)
    expect(ensembleErrors(0.05)).toEqual([0.05, -0.04, 0.03, -0.05, 0.02].map((v) => expect.closeTo(v, 10)))
    expect(ensembleSpreadAfter(25, ensembleErrors(0.05))).toBeCloseTo(0.145, 3)
  })
  it('short rollouts from real states stay close; one long rollout does not', () => {
    expect(errorAfter(60, 0.05)).toBeCloseTo(0.323, 3)
    expect(shortRollouts(60, 5, 0.05)).toHaveLength(12)
    expect(errorAfter(5, 0.05) / errorAfter(1, 0.05)).toBeCloseTo(4.8, 1)
  })
})
