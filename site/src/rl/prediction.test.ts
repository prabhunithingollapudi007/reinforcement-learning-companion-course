import { describe, expect, it } from 'vitest'
import {
  abDataset,
  batchMonteCarlo,
  certaintyEquivalence,
  learningCurves,
  mcUpdate,
  mean,
  mulberry32,
  returns,
  sampleEpisode,
  sampleTargets,
  tdUpdate,
  trueValues,
  variance,
  type Episode,
} from './prediction'

// The trajectory worked by hand in CS 234 lecture 3: s3, s2, s2, s1, with reward 1 on leaving s1.
const lecture: Episode = [
  { state: 2, reward: 0, next: 1 },
  { state: 1, reward: 0, next: 1 },
  { state: 1, reward: 0, next: 0 },
  { state: 0, reward: 1, next: null },
]

describe('the corridor', () => {
  it('has linear true values when gamma is 1', () => {
    trueValues(1).forEach((v, s) => expect(v).toBeCloseTo(1 + 1.5 * s, 6))
  })
  it('episodes start in the middle and end at an exit', () => {
    const rng = mulberry32(1)
    for (let i = 0; i < 50; i++) {
      const e = sampleEpisode(rng)
      expect(e[0].state).toBe(3)
      expect([1, 10]).toContain(e[e.length - 1].reward)
      expect(e[e.length - 1].next).toBeNull()
    }
  })
})

describe('the lecture example', () => {
  const gamma = 0.5
  it('returns are computed backwards', () => {
    expect(returns(lecture, gamma)).toEqual([0.125, 0.25, 0.5, 1])
  })
  it('first-visit and every-visit Monte Carlo disagree about s2', () => {
    const zero = new Array<number>(7).fill(0)
    // With alpha = 1 a first-visit update sets the estimate to the first return: gamma^2.
    expect(mcUpdate(zero, lecture, gamma, 1, true)[1]).toBeCloseTo(0.25)
    // Every-visit averages both returns from s2: (gamma^2 + gamma) / 2.
    const everyVisit = batchMonteCarlo([lecture], 7, gamma)
    expect(everyVisit[1]).toBeCloseTo(0.375)
  })
  it('TD with alpha = 1 only learns about s1 from this one episode', () => {
    expect(tdUpdate(new Array<number>(7).fill(0), lecture, gamma, 1)).toEqual([1, 0, 0, 0, 0, 0, 0])
  })
})

describe('bias and variance of the two targets', () => {
  it('Monte Carlo targets are unbiased but spread out; TD targets are tight but inherit the estimate error', () => {
    const exact = sampleTargets({ state: 3, gamma: 1, estimateError: 0, samples: 4000, seed: 7 })
    expect(mean(exact.mc)).toBeCloseTo(exact.truth, 0)
    expect(mean(exact.td)).toBeCloseTo(exact.truth, 0)
    expect(variance(exact.mc)).toBeGreaterThan(5 * variance(exact.td))
    const off = sampleTargets({ state: 3, gamma: 1, estimateError: 2, samples: 4000, seed: 7 })
    expect(mean(off.td) - off.truth).toBeCloseTo(2, 0)
    expect(Math.abs(mean(off.mc) - off.truth)).toBeLessThan(0.3)
  })
})

describe('learning curves quoted in the lesson', () => {
  it('at the default settings TD is ahead of Monte Carlo after 100 episodes', () => {
    const c = learningCurves({ episodes: 100, runs: 200, alpha: 0.1, gamma: 1, seed: 3 })
    expect(c.mc[0]).toBeCloseTo(c.td[0])
    expect(c.td[100]).toBeLessThan(c.mc[100])
    expect(c.td[100]).toBeLessThan(1)
  })
})

describe('batch evaluation on the A/B data', () => {
  it('Monte Carlo and certainty equivalence agree on B but not on A', () => {
    const data = abDataset(6, 1)
    const mc = batchMonteCarlo(data, 2, 1)
    const ce = certaintyEquivalence(data, 2, 1)
    expect(mc[1]).toBeCloseTo(0.75)
    expect(ce[1]).toBeCloseTo(0.75)
    expect(mc[0]).toBe(0)
    expect(ce[0]).toBeCloseTo(0.75)
  })
})

describe('more learning-curve claims from the Week 2 lesson', () => {
  it('early on Monte Carlo is ahead; a large step size leaves it stuck; a small one keeps it ahead', () => {
    const base = learningCurves({ episodes: 100, runs: 200, alpha: 0.1, gamma: 1, seed: 3 })
    expect(base.mc[10]).toBeCloseTo(3.0, 0)
    expect(base.td[10]).toBeCloseTo(5.3, 0)
    expect(base.td[100]).toBeCloseTo(0.8, 1)
    expect(base.mc[100]).toBeCloseTo(1.2, 1)
    const big = learningCurves({ episodes: 100, runs: 200, alpha: 0.4, gamma: 1, seed: 3 })
    expect(big.mc[100]).toBeGreaterThan(2)
    expect(big.td[100]).toBeLessThan(big.mc[100] / 2)
    const small = learningCurves({ episodes: 100, runs: 200, alpha: 0.04, gamma: 1, seed: 3 })
    for (const e of [10, 50, 100]) expect(small.mc[e]).toBeLessThan(small.td[e])
  })
  it('target variances at gamma = 1 are about 20 and about 2', () => {
    const t = sampleTargets({ state: 3, gamma: 1, estimateError: 0, samples: 400, seed: 7 })
    expect(variance(t.mc)).toBeCloseTo(20.25, 0)
    expect(variance(t.td)).toBeCloseTo(2.25, 1)
  })
})
