import { describe, expect, it } from 'vitest'
import { PEAK, climb, corridorSteps, estimateSpread, expectedReward, simulateCorridor, trueGradient } from './policyGradient'
import { mean, variance } from './prediction'

const sd = (xs: number[]) => Math.sqrt(variance(xs))
const base = { sigma: 1, learningRate: 0.5, batchSize: 20, offset: 0, useBaseline: true, steps: 100, seed: 2 }

describe('the score-function gradient estimate', () => {
  it('matches the closed-form gradient on average, with or without a baseline', () => {
    const s = estimateSpread({ mu: 0, sigma: 1, batchSize: 10, offset: 0, trials: 2000, seed: 4 })
    expect(s.truth).toBeCloseTo(0.26, 2)
    expect(mean(s.plain)).toBeCloseTo(s.truth, 1)
    expect(mean(s.withBaseline)).toBeCloseTo(s.truth, 1)
  })
  it('the closed-form gradient agrees with a finite difference', () => {
    const h = 1e-5
    expect((expectedReward(0.5 + h, 1) - expectedReward(0.5 - h, 1)) / (2 * h)).toBeCloseTo(trueGradient(0.5, 1), 6)
  })
  it('adding a constant to every reward inflates the noise unless a baseline removes it (numbers in the lesson)', () => {
    const shifted = estimateSpread({ mu: 0, sigma: 1, batchSize: 10, offset: 5, trials: 2000, seed: 4 })
    expect(sd(shifted.plain)).toBeCloseTo(1.69, 1)
    expect(sd(shifted.withBaseline)).toBeCloseTo(0.11, 2)
    expect(sd(shifted.plain) / sd(shifted.withBaseline)).toBeGreaterThan(14)
    const two = estimateSpread({ mu: 0, sigma: 1, batchSize: 10, offset: 2, trials: 1500, seed: 4 })
    expect(sd(two.plain)).toBeCloseTo(0.75, 1)
    const unshifted = estimateSpread({ mu: 0, sigma: 1, batchSize: 10, offset: 0, trials: 2000, seed: 4 })
    expect(sd(unshifted.plain)).toBeCloseTo(0.16, 2)
  })
})

describe('climbing the reward curve', () => {
  it('with a baseline the mean reaches the peak, and the reward offset makes no difference at all', () => {
    const a = climb(base)
    const b = climb({ ...base, offset: 5 })
    expect(mean(a.slice(-30))).toBeCloseTo(PEAK, 1)
    b.forEach((mu, k) => expect(mu).toBeCloseTo(a[k], 6))
  })
  it('without a baseline and with shifted rewards it wanders', () => {
    const p = climb({ ...base, offset: 5, useBaseline: false })
    expect(sd(p.slice(-30))).toBeGreaterThan(0.5)
    expect(sd(climb(base).slice(-30))).toBeLessThan(0.1)
  })
})

describe('the aliased corridor', () => {
  it('a coin flip is the best the agent can do, at 4.5 steps', () => {
    expect(corridorSteps(0.5)).toBe(4.5)
    expect(corridorSteps(0.2)).toBeCloseTo(6.75)
    expect(corridorSteps(0.9)).toBeCloseTo(11.61, 2)
    expect(corridorSteps(1)).toBe(Infinity)
    for (let p = 0.05; p < 1; p += 0.05) expect(corridorSteps(p)).toBeGreaterThanOrEqual(4.5 - 1e-9)
  })
  it('the formula agrees with simulation', () => {
    expect(simulateCorridor(0.5, 20000, 1)).toBeCloseTo(4.5, 1)
    expect(simulateCorridor(0.2, 20000, 1)).toBeCloseTo(6.75, 0)
  })
})
