import { describe, expect, it } from 'vitest'
import {
  REAL_FRICTIONS,
  START_SHARES,
  STRATEGIES,
  TARGET,
  averageImprovement,
  averageMiss,
  chained,
  estimateFriction,
  frictionRange,
  gapCurves,
  improveExactly,
  improveOnce,
  robustSpeed,
  slideDistance,
  speedFor,
  successRate,
  worstMiss,
} from './robots'

const at = (friction: number) => REAL_FRICTIONS.indexOf(friction)

describe('sliding a puck', () => {
  it('the right speed for a known friction lands on the target', () => {
    for (const f of [0.2, 0.4, 0.8]) expect(slideDistance(speedFor(f), f)).toBeCloseTo(TARGET, 10)
  })
  it('halving the friction doubles the slide', () => {
    expect(slideDistance(2, 0.2)).toBeCloseTo(2 * slideDistance(2, 0.4), 10)
  })
})

describe('the simulator has the friction wrong (numbers quoted in the Week 16 lesson)', () => {
  const g = gapCurves(0.4, 0.2, 0.05)

  it('a policy tuned for friction 0.4 is perfect at 0.4 and misses elsewhere', () => {
    expect(g.nominal[at(0.4)]).toBeCloseTo(1, 6)
    expect(g.nominal[at(0.6)]).toBeCloseTo(0.667, 3)
    expect(g.nominal[at(0.3)]).toBeCloseTo(1.333, 3)
    expect(g.nominal[at(0.2)]).toBeCloseTo(2, 6)
  })
  it('one speed for the range 0.2 to 0.6 is a cautious compromise', () => {
    expect(g.robustSpeed).toBeLessThan(g.nominalSpeed)
    expect(g.robust[at(0.4)]).toBeCloseTo(0.815, 3)
    expect(g.robust[at(0.2)]).toBeCloseTo(1.629, 3)
    expect(g.robust[at(0.6)]).toBeCloseTo(0.543, 3)
    expect(g.robust[at(0.3)]).toBeCloseTo(1.086, 3)
  })
  it('over that range it cuts the worst miss from 1.00 m to 0.63 m, and the average only slightly', () => {
    const band = (xs: number[]) => xs.slice(at(0.2), at(0.6) + 1)
    expect(worstMiss(band(g.nominal))).toBeCloseTo(1.0, 2)
    expect(worstMiss(band(g.robust))).toBeCloseTo(0.629, 3)
    expect(averageMiss(band(g.nominal))).toBeCloseTo(0.306, 3)
    expect(averageMiss(band(g.robust))).toBeCloseTo(0.285, 3)
  })
  it('randomising too widely makes the compromise worse than not randomising', () => {
    const wide = gapCurves(0.4, 0.3, 0.05)
    const band = (xs: number[]) => xs.slice(at(0.2), at(0.7) + 1)
    expect(averageMiss(band(wide.robust))).toBeGreaterThan(averageMiss(band(wide.nominal)))
    expect(wide.robust[at(0.4)]).toBeCloseTo(0.542, 3)
  })
  it('measuring a test nudge to within 5% lands within 5 cm at every friction', () => {
    for (const d of g.adaptive) expect(d).toBeCloseTo(0.952, 3)
    expect(estimateFriction(0.6, 0)).toBeCloseTo(0.6, 10)
  })
  it('the robust speed really is the best single speed for its range', () => {
    const range = frictionRange(0.2, 0.6)
    const cost = (speed: number) => range.reduce((a, f) => a + (slideDistance(speed, f) - TARGET) ** 2, 0)
    const best = robustSpeed(range)
    expect(cost(best)).toBeLessThan(cost(best * 1.01))
    expect(cost(best)).toBeLessThan(cost(best * 0.99))
  })
})

describe('improving a pretrained policy from its own attempts', () => {
  it('the pretrained policy succeeds 80.7% of the time', () => {
    expect(successRate(START_SHARES)).toBeCloseTo(0.807, 3)
    expect(START_SHARES.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10)
  })
  it('imitating the successes improves every round, slowly', () => {
    const s = improveExactly(8, 'successes').success
    expect(s[1]).toBeCloseTo(0.855, 3)
    expect(s[8]).toBeCloseTo(0.943, 3)
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1])
  })
  it('imitating only better-than-average strategies gets to 99% in two rounds', () => {
    const s = improveExactly(8, 'advantage').success
    expect(s[1]).toBeCloseTo(0.91, 3)
    expect(s[2]).toBeCloseTo(0.99, 3)
    expect(improveExactly(2, 'advantage').shares[2]).toEqual([1, 0, 0, 0])
  })
  it('one round of imitating successes reweights by success rate', () => {
    const next = improveOnce(START_SHARES, 'successes')
    expect(next[0]).toBeCloseTo((0.3 * 0.99) / 0.807, 6)
    expect(next[3]).toBeCloseTo((0.1 * 0.3) / 0.807, 6)
  })
  it('with 100 attempts per round the picture is the same on average', () => {
    expect(averageImprovement(8, 100, 'successes', 200)[8]).toBeCloseTo(0.943, 2)
    expect(averageImprovement(8, 100, 'advantage', 200)[2]).toBeCloseTo(0.988, 2)
    expect(averageImprovement(8, 100, 'successes', 200)[1]).toBeCloseTo(0.857, 3)
    expect(averageImprovement(8, 100, 'advantage', 200)[1]).toBeCloseTo(0.914, 3)
  })
  it('with only 20 attempts per round, judging by advantage sometimes discards the best option', () => {
    expect(averageImprovement(8, 20, 'advantage', 200)[8]).toBeCloseTo(0.985, 3)
  })
  it('reliability per stage decides whether a five-stage task works at all', () => {
    expect(chained(0.807, 5)).toBeCloseTo(0.342, 3)
    expect(chained(0.943, 5)).toBeCloseTo(0.746, 3)
    expect(chained(0.99, 5)).toBeCloseTo(0.951, 3)
    expect(STRATEGIES).toHaveLength(4)
  })
})
