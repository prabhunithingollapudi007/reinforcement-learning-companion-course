import { describe, expect, it } from 'vitest'
import { compoundingMistakes, crashes, dagger, expertRun, generate, independentMistakes, makeDemos, regressionAction, velocity } from './imitation'

describe('demonstrations with two good answers (numbers quoted in the Week 8 lesson)', () => {
  const demos = makeDemos(200, 0.6, 1)
  it('regression to the mean lands between them, where nobody went', () => {
    expect(regressionAction(demos)).toBeCloseTo(-0.18, 1)
    expect(crashes(regressionAction(demos))).toBe(true)
    expect(demos.filter(crashes).length).toBeLessThanOrEqual(1) // (almost) no demonstrator ever did that
  })
  it('one generation step is the same as regression', () => {
    const ends = generate(demos, 400, 1, 5).paths.map((p) => p[1])
    for (const a of ends) expect(a).toBeCloseTo(regressionAction(demos), 6)
  })
  it('with more steps the samples separate into the two demonstrated answers', () => {
    const share = (steps: number) => {
      const ends = generate(demos, 400, steps, 5).paths.map((p) => p[p.length - 1])
      return { crash: ends.filter(crashes).length / ends.length, left: ends.filter((a) => a < 0).length / ends.length }
    }
    expect(share(2).crash).toBeCloseTo(0.39, 1)
    expect(share(4).crash).toBeLessThan(0.06)
    expect(share(10).crash).toBeLessThan(0.01)
    expect(share(10).left).toBeCloseTo(0.6, 1) // the 60/40 split of the demonstrators is preserved
  })
  it('at time 0 the velocity points from the noise to the mean of the data', () => {
    expect(velocity(0.7, 0, demos)).toBeCloseTo(regressionAction(demos) - 0.7, 2)
  })
})

describe('compounding errors in the lane', () => {
  const base = { wobble: 0.1, cloneError: 0.1, demos: 3, horizon: 100, rollouts: 200, seed: 3 }
  it('the expert never leaves the lane', () => {
    expect(expertRun(base).failures).toBe(0)
  })
  it('a slightly imperfect clone leaves it about a fifth of the time', () => {
    const runs = dagger(base, 3)
    expect(runs[0].failures).toBe(44)
    expect(runs[0].covered).toBeCloseTo(0.38, 2)
  })
  it('one round of expert labels on the clone’s own states fixes it', () => {
    const runs = dagger(base, 3)
    expect(runs[1].failures).toBe(0)
    expect(runs[1].covered).toBeGreaterThan(0.8)
  })
  it('a perfect copy never leaves the data, so it never fails', () => {
    expect(dagger({ ...base, cloneError: 0 }, 0)[0].failures).toBe(0)
  })
  it('a worse copy fails more than half the time', () => {
    expect(dagger({ ...base, cloneError: 0.15 }, 0)[0].failures).toBe(118)
  })
})

describe('counting mistakes over a long task', () => {
  it('independent mistakes grow with T, compounding ones roughly with T squared', () => {
    expect(independentMistakes(0.01, 100)).toBeCloseTo(1)
    expect(compoundingMistakes(0.01, 100)).toBeCloseTo(37.2, 1)
    expect(compoundingMistakes(0.01, 200)).toBeCloseTo(114.3, 1)
    // For short tasks the compounding count is close to eps * T^2 / 2.
    expect(compoundingMistakes(0.001, 100)).toBeCloseTo((0.001 * 100 * 101) / 2, 0)
  })
})
