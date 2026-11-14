import { describe, expect, it } from 'vitest'
import { bufferStudy, learningCurve } from './actorCritic'
import { mean } from './prediction'

const last = (xs: number[]) => mean(xs.slice(250, 300))

describe('actor-critic against plain policy gradient on the corridor (numbers quoted in the Week 7 lesson)', () => {
  const run = (mode: 'actor-critic' | 'reinforce', rewardNoise: number) =>
    learningCurve({ mode, actorRate: 0.2, criticRate: 0.2, rewardNoise }, 300, 200, 7)

  it('with a clean reward both learn to leave on the right', () => {
    expect(last(run('actor-critic', 0))).toBeGreaterThan(0.99)
    expect(last(run('reinforce', 0))).toBeGreaterThan(0.99)
  })
  it('with a clean reward the Monte Carlo version is a little quicker at first', () => {
    expect(mean(run('reinforce', 0).slice(0, 50))).toBeGreaterThan(mean(run('actor-critic', 0).slice(0, 50)))
  })
  it('with a noisy reward the critic keeps learning on track', () => {
    expect(last(run('actor-critic', 2))).toBeCloseTo(0.98, 1)
    expect(last(run('reinforce', 2))).toBeCloseTo(0.85, 1)
  })
  it('with a very noisy reward plain policy gradient ends up worse than chance', () => {
    expect(last(run('actor-critic', 3))).toBeCloseTo(0.9, 1)
    expect(last(run('reinforce', 3))).toBeLessThan(0.45)
  })
})

describe('evaluating the current policy from an old policy’s data', () => {
  const study = (oldP: number, newP: number) => bufferStudy({ oldP, newP, payA: 0.2, payB: 1, noise: 0.3, size: 500, seed: 3 })

  it('averaging the buffer gives the value of the policy that filled it', () => {
    const s = study(0.2, 0.9)
    expect(s.truth).toBeCloseTo(0.92)
    expect(s.vFromBuffer).toBeCloseTo(0.36, 1) // the old policy's value: 0.8 * 0.2 + 0.2 * 1
    expect(s.vFromQ).toBeCloseTo(0.92, 1)
  })
  it('the two agree when the policies are the same', () => {
    const s = study(0.5, 0.5)
    expect(s.vFromBuffer).toBeCloseTo(s.truth, 1)
    expect(s.vFromQ).toBeCloseTo(s.truth, 1)
  })
  it('Q needs every action the current policy takes to appear in the buffer', () => {
    const s = study(0, 0.9)
    expect(s.counts[1]).toBe(0)
    expect(s.vFromQ).toBeNull()
  })
})
