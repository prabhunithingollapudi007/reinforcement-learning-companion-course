import { describe, expect, it } from 'vitest'
import { agreement, angleError, averageOutcomes, chooseActions, collectComparisons, errorByQueries, expectile, fitCritic, fitReward, sampleQValues } from './offline'

describe('choosing actions from a critic trained on a fixed dataset (numbers quoted in the Week 9 lesson)', () => {
  const o = averageOutcomes(0.6, 0.6, 300)
  it('the action rated highest anywhere is usually one the data never contained', () => {
    expect(o.naiveOutside).toBeCloseTo(0.79, 1)
  })
  it('the critic expects far more from that action than it delivers', () => {
    expect(o.naiveBelieved).toBeCloseTo(1.19, 1)
    expect(o.naive).toBeCloseTo(0.51, 1)
  })
  it('staying within the data beats both the naive choice and plain imitation', () => {
    expect(o.inData).toBeCloseTo(0.99, 1)
    expect(o.imitation).toBeCloseTo(0.49, 1)
    expect(o.inData).toBeGreaterThan(o.naive + 0.3)
  })
  it('within the data the critic is accurate', () => {
    const c = chooseActions(fitCritic(0.6, 0.6, 1), 0.6)
    expect(Math.abs(c.inData.believed - c.inData.actual)).toBeLessThan(0.08)
  })
  it('no method can find a good action the data does not contain', () => {
    const far = averageOutcomes(-1, 0.3, 300)
    expect(far.inData).toBeLessThan(0.02)
    expect(far.imitation).toBeLessThan(0.02)
  })
})

describe('expectiles', () => {
  const q = sampleQValues(200, 2)
  it('tau = 0.5 is the mean', () => {
    expect(expectile(q, 0.5)).toBeCloseTo(q.reduce((a, b) => a + b) / q.length, 9)
  })
  it('larger tau moves toward the best values in the data without passing them', () => {
    expect(expectile(q, 0.5)).toBeCloseTo(0.41, 2)
    expect(expectile(q, 0.9)).toBeCloseTo(0.66, 2)
    expect(expectile(q, 0.99)).toBeCloseTo(0.82, 2)
    expect(expectile(q, 0.99)).toBeLessThan(Math.max(...q))
  })
})

describe('learning a reward from comparisons', () => {
  it('more comparisons recover the reward direction more accurately', () => {
    const errors = errorByQueries(0.3, 30)
    expect(errors[0]).toBeCloseTo(23.6, 0) // 5 comparisons
    expect(errors[3]).toBeCloseTo(5.8, 0) // 50
    expect(errors[6]).toBeCloseTo(2.2, 0) // 500
  })
  it('a noisier judge needs more comparisons', () => {
    const calm = errorByQueries(0.05, 30)
    const noisy = errorByQueries(1, 30)
    for (let i = 0; i < calm.length; i++) expect(noisy[i]).toBeGreaterThan(calm[i])
    expect(noisy[3]).toBeCloseTo(17.5, 0)
  })
  it('the learned reward ranks fresh trajectories the way the true one does', () => {
    const w = fitReward(collectComparisons(100, 0.3, 1))
    expect(angleError(w)).toBeLessThan(5)
    expect(agreement(w)).toBeGreaterThan(0.97)
  })
})
