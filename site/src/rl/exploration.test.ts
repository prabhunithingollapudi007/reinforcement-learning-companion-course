import { describe, expect, it } from 'vitest'
import { bestReturn, corridorStep, epsilonEpisodesNeeded, horizon, runExplorer, safeReturn, summarise } from './exploration'
import { mean } from './prediction'

const base = { n: 8, episodes: 100, epsilon: 0.1, bonus: 0.5 }

describe('the corridor', () => {
  it('retreating pays a little and resets; advancing pays only at the far end', () => {
    expect(corridorStep(8, 3, 0)).toEqual({ next: 0, reward: 0.05 })
    expect(corridorStep(8, 3, 1)).toEqual({ next: 4, reward: 0 })
    expect(corridorStep(8, 7, 1)).toEqual({ next: 7, reward: 1 })
  })
  it('walking to the end and collecting is worth far more than staying safe', () => {
    expect(horizon(8)).toBe(12)
    expect(bestReturn()).toBe(5)
    expect(safeReturn(8)).toBeCloseTo(0.6)
  })
})

describe('three explorers on an eight-cell corridor (numbers quoted in the Week 11 lesson)', () => {
  const eps = summarise('epsilon', base, 20)
  const bonus = summarise('bonus', base, 20)
  const posterior = summarise('posterior', base, 20)

  it('epsilon-greedy never finds the far reward in 100 episodes and gets about halfway', () => {
    expect(eps.foundShare).toBe(0)
    expect(eps.farthest).toBeCloseTo(3, 0)
    expect(mean(eps.averageReturns)).toBeCloseTo(0.55, 1)
  })
  it('the exploration bonus finds it within a handful of episodes', () => {
    expect(bonus.foundShare).toBe(1)
    expect(bonus.medianFoundAt).toBe(6)
    expect(mean(bonus.averageReturns)).toBeCloseTo(4.7, 1)
  })
  it('posterior sampling finds it nearly as fast', () => {
    expect(posterior.foundShare).toBe(1)
    expect(posterior.medianFoundAt).toBe(10)
    expect(mean(posterior.averageReturns.slice(80))).toBeGreaterThan(4.9)
  })
  it('a larger epsilon barely helps', () => {
    expect(summarise('epsilon', { ...base, epsilon: 0.3 }, 20).foundShare).toBeLessThan(0.2)
  })
})

describe('how the difficulty scales with corridor length', () => {
  it('directed exploration scales gently', () => {
    expect(summarise('bonus', { ...base, n: 4 }, 20).medianFoundAt).toBe(3)
    expect(summarise('bonus', { ...base, n: 12 }, 20).medianFoundAt).toBe(9)
    expect(summarise('posterior', { ...base, n: 12 }, 20).medianFoundAt).toBe(15)
  })
  it('epsilon-greedy manages a short corridor sometimes', () => {
    const short = summarise('epsilon', { ...base, n: 4 }, 20).foundShare
    expect(short).toBeGreaterThan(0.1)
    expect(short).toBeLessThan(0.6)
  })
  it('the rough count for epsilon-greedy grows by a factor of 2/epsilon per cell', () => {
    expect(epsilonEpisodesNeeded(4, 0.1)).toBeCloseTo(8000)
    expect(epsilonEpisodesNeeded(8, 0.1)).toBeCloseTo(1.28e9, -7)
    expect(epsilonEpisodesNeeded(9, 0.1) / epsilonEpisodesNeeded(8, 0.1)).toBeCloseTo(20)
  })
})

describe('a single run', () => {
  it('an explorer that has found the reward keeps collecting it', () => {
    const run = runExplorer('bonus', { ...base, seed: 1 })
    expect(run.foundAt).not.toBeNull()
    expect(run.returns[99]).toBe(5)
  })
})
