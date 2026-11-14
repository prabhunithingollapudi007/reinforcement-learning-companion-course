import { describe, expect, it } from 'vitest'
import { averageRegret, betaDensity, chooseArm, emptyStats, sampleBeta, stuckShare, ucbBonus, type Strategy } from './bandits'
import { mean, mulberry32, variance } from './prediction'

const MEANS = [0.7, 0.5, 0.3]
const run = (s: Strategy, epsilon = 0.1) => averageRegret(s, MEANS, 5000, epsilon, 50, 5)

describe('regret of four strategies (numbers quoted in the Week 10 lesson)', () => {
  const greedy = run('greedy')
  const eps = run('epsilon')
  const ucb = run('ucb')
  const thompson = run('thompson')

  it('after 1000 pulls', () => {
    expect(greedy[1000]).toBeCloseTo(62, -1)
    expect(eps[1000]).toBeCloseTo(36, 0)
    expect(ucb[1000]).toBeCloseTo(44, 0)
    expect(thompson[1000]).toBeCloseTo(13, 0)
  })
  it('after 5000 pulls', () => {
    expect(greedy[5000]).toBeCloseTo(302, -1)
    expect(eps[5000]).toBeCloseTo(117, 0)
    expect(ucb[5000]).toBeCloseTo(82, 0)
    expect(thompson[5000]).toBeCloseTo(18, 0)
  })
  it('greedy and epsilon-greedy grow in a straight line; UCB and Thompson flatten', () => {
    const slope = (c: number[], from: number, to: number) => (c[to] - c[from]) / (to - from)
    expect(slope(eps, 4000, 5000) / slope(eps, 1000, 2000)).toBeGreaterThan(0.85)
    expect(slope(greedy, 4000, 5000) / slope(greedy, 1000, 2000)).toBeGreaterThan(0.85)
    expect(slope(ucb, 4000, 5000) / slope(ucb, 1000, 2000)).toBeLessThan(0.6)
    expect(slope(thompson, 4000, 5000)).toBeLessThan(0.002)
  })
  it('UCB starts behind epsilon-greedy and overtakes it', () => {
    expect(ucb[1000]).toBeGreaterThan(eps[1000])
    expect(ucb[3000]).toBeLessThan(eps[3000])
  })
  it('epsilon-greedy pays epsilon times the average gap on every pull, forever', () => {
    // A random pull costs (0 + 0.2 + 0.4) / 3 = 0.2 on average; that happens 10% of the time.
    expect((eps[5000] - eps[4000]) / 1000).toBeCloseTo(0.02, 2)
  })
})

describe('when the arms are close together: 0.70, 0.65, 0.60 (numbers quoted in the Week 10 lesson)', () => {
  const close = (s: Strategy) => averageRegret(s, [0.7, 0.65, 0.6], 5000, 0.1, 50, 5)[4999]
  it('the two methods with logarithmic regret end up worse than with a gap of 0.2', () => {
    expect(close('ucb')).toBeCloseTo(118, -1)
    expect(close('thompson')).toBeCloseTo(36, 0)
    expect(close('ucb')).toBeGreaterThan(run('ucb')[4999])
    expect(close('thompson')).toBeGreaterThan(run('thompson')[4999])
  })
  it('greedy and epsilon-greedy totals fall, because each wrong pull costs a quarter as much', () => {
    expect(close('greedy')).toBeCloseTo(186, -1)
    expect(close('epsilon')).toBeCloseTo(60.5, 0)
    expect(close('greedy')).toBeLessThan(run('greedy')[4999])
    expect(close('epsilon')).toBeLessThan(run('epsilon')[4999])
  })
})

describe('greedy can lock on to the wrong arm', () => {
  it('in about a third of runs it is still mostly pulling a worse arm at the end', () => {
    expect(stuckShare('greedy', MEANS, 1000, 0, 200, 5)).toBeCloseTo(0.33, 1)
    expect(stuckShare('ucb', MEANS, 1000, 0, 200, 5)).toBeLessThan(0.02)
  })
})

describe('the pieces', () => {
  it('the UCB bonus shrinks as an arm is pulled and grows slowly with time', () => {
    expect(ucbBonus(100, 10)).toBeCloseTo(Math.sqrt((2 * Math.log(100)) / 10))
    expect(ucbBonus(100, 40)).toBeLessThan(ucbBonus(100, 10))
    expect(ucbBonus(1000, 10)).toBeGreaterThan(ucbBonus(100, 10))
  })
  it('UCB pulls the arm with the highest upper bound, not the highest average', () => {
    const s = emptyStats(2)
    s.pulls = [100, 2]
    s.wins = [60, 1] // averages 0.6 and 0.5, but the second is barely known
    expect(chooseArm('ucb', s, 0, mulberry32(1)).arm).toBe(1)
    expect(chooseArm('greedy', s, 0, mulberry32(1)).arm).toBe(0)
  })
  it('Beta samples have the right mean and spread', () => {
    const rng = mulberry32(3)
    const xs = Array.from({ length: 4000 }, () => sampleBeta(8, 4, rng))
    expect(mean(xs)).toBeCloseTo(8 / 12, 1)
    expect(variance(xs)).toBeCloseTo((8 * 4) / (12 * 12 * 13), 2)
  })
  it('the Beta density integrates to 1', () => {
    const d = betaDensity(5, 3)
    expect(d.reduce((a, b) => a + b, 0) / (d.length - 1)).toBeCloseTo(1, 2)
  })
})
