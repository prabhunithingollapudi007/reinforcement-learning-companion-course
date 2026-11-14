import { describe, expect, it } from 'vitest'
import { clipIsActive, clipObjective, gae, kStepWeights, lambdaSweep, ridgeAscent, ridgeGradient, ridgeKL, ridgeValue } from './ppo'

describe('the clipped objective', () => {
  it('equals r * A inside the clip range', () => {
    expect(clipObjective(1.1, 2, 0.2)).toBeCloseTo(2.2)
    expect(clipObjective(0.9, -2, 0.2)).toBeCloseTo(-1.8)
  })
  it('stops rewarding a move once the ratio has gone far enough in the good direction', () => {
    expect(clipObjective(1.5, 1, 0.2)).toBeCloseTo(1.2) // A > 0: capped at 1 + eps
    expect(clipObjective(0.5, -1, 0.2)).toBeCloseTo(-0.8) // A < 0: capped at 1 - eps
    expect(clipIsActive(1.5, 1, 0.2)).toBe(true)
    expect(clipIsActive(0.5, -1, 0.2)).toBe(true)
  })
  it('still penalises a move in the bad direction in full', () => {
    expect(clipObjective(0.5, 1, 0.2)).toBeCloseTo(0.5)
    expect(clipObjective(1.5, -1, 0.2)).toBeCloseTo(-1.5)
    expect(clipIsActive(0.5, 1, 0.2)).toBe(false)
  })
})

describe('the ridge beside a cliff (numbers quoted in the Week 6 lesson)', () => {
  it('the closed-form gradient matches a finite difference', () => {
    for (const mu of [0, 1.5, 2, 2.3, 2.6, 3]) {
      const fd = (ridgeValue(mu + 1e-5) - ridgeValue(mu - 1e-5)) / 2e-5
      expect(ridgeGradient(mu)).toBeCloseTo(fd, 3)
    }
  })
  it('a small step is slow, a moderate one reaches the top', () => {
    expect(ridgeAscent({ learningRate: 0.1, maxKL: null, steps: 40 }).values[40]).toBeCloseTo(0.61, 2)
    const good = ridgeAscent({ learningRate: 1, maxKL: null, steps: 40 })
    expect(good.values[10]).toBeCloseTo(0.9, 2)
    expect(good.values[40]).toBeCloseTo(0.9, 2)
  })
  it('a large step goes over the cliff and cannot come back', () => {
    const run = ridgeAscent({ learningRate: 10, maxKL: null, steps: 40 })
    expect(run.collapsed).toBe(true)
    expect(run.values[40]).toBeCloseTo(-1, 2)
    expect(Math.abs(ridgeGradient(run.mus[40]))).toBeLessThan(1e-6) // no signal left to follow
  })
  it('limiting the KL divergence of each step makes every learning rate safe', () => {
    for (const learningRate of [1, 6, 10]) {
      const run = ridgeAscent({ learningRate, maxKL: 0.5, steps: 40 })
      expect(run.collapsed).toBe(false)
      expect(run.values[40]).toBeCloseTo(0.9, 2)
      for (let k = 1; k < run.mus.length; k++) expect(ridgeKL(run.mus[k] - run.mus[k - 1])).toBeLessThanOrEqual(0.5 + 1e-9)
    }
  })
  it('a tighter limit is safe but slower', () => {
    expect(ridgeAscent({ learningRate: 10, maxKL: 0.02, steps: 40 }).values[10]).toBeCloseTo(0.37, 2)
    expect(ridgeAscent({ learningRate: 10, maxKL: 0.5, steps: 40 }).values[10]).toBeCloseTo(0.9, 2)
  })
})

describe('generalised advantage estimation', () => {
  const rewards = [1, 1, 1]
  const values = [0.5, 0.5, 0.5]
  it('lambda = 0 is the one-step TD error', () => {
    expect(gae(rewards, values, 1, 0)).toEqual([1, 1, 0.5])
  })
  it('lambda = 1 is the return minus the value', () => {
    expect(gae(rewards, values, 1, 1)).toEqual([2.5, 1.5, 0.5])
  })
  it('weights on the k-step estimators sum to 1 and decay by lambda', () => {
    const w = kStepWeights(0.9, 200)
    expect(w.reduce((a, b) => a + b)).toBeCloseTo(1, 6)
    expect(w[1] / w[0]).toBeCloseTo(0.9)
  })
  it('spread grows with lambda; bias from a wrong critic shrinks with lambda', () => {
    const s = lambdaSweep({ valueError: -0.6, gamma: 1, samples: 3000, seed: 5 })
    expect(s.spread[0]).toBeCloseTo(0.6, 1)
    expect(s.spread[20]).toBeCloseTo(4.5, 1)
    expect(Math.abs(s.bias[0])).toBeCloseTo(3.3, 1)
    expect(Math.abs(s.bias[20])).toBeLessThan(0.3)
  })
  it('the best lambda depends on how good the critic is', () => {
    const exact = lambdaSweep({ valueError: 0, gamma: 1, samples: 3000, seed: 5 })
    const poor = lambdaSweep({ valueError: -0.6, gamma: 1, samples: 3000, seed: 5 })
    const argmin = (xs: number[]) => xs.indexOf(Math.min(...xs))
    expect(exact.lambdas[argmin(exact.rmse)]).toBe(0)
    expect(poor.lambdas[argmin(poor.rmse)]).toBeCloseTo(0.8, 1)
  })
})
