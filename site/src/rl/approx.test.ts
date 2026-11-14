import { describe, expect, it } from 'vitest'
import { bestLineError, divergenceThreshold, fitLine, meanOf, triadTrace } from './approx'

const all = { gamma: 0.99, alpha: 0.1, shareA: 1, bootstrap: true, shared: true, freeze: 1, steps: 200 }

describe('the two-state example (numbers quoted in the Week 4 lesson)', () => {
  it('diverges when approximation, bootstrapping and off-policy data are combined', () => {
    const t = triadTrace(all)
    expect(t.diverges).toBe(true)
    expect(t.values[200]).toBeGreaterThan(1e8)
  })
  it('is stable when any one of the three is removed', () => {
    expect(triadTrace({ ...all, shareA: 0.5 }).diverges).toBe(false) // data from following the policy
    expect(triadTrace({ ...all, bootstrap: false }).diverges).toBe(false) // Monte Carlo target
    expect(triadTrace({ ...all, shared: false }).diverges).toBe(false) // a table
    expect(triadTrace({ ...all, shareA: 0.5 }).values[200]).toBeLessThan(1e-10)
  })
  it('tips over once about 80% of updates land on the first state', () => {
    expect(divergenceThreshold(0.99)).toBeCloseTo(0.803, 3)
    expect(triadTrace({ ...all, shareA: 0.8 }).diverges).toBe(false)
    expect(triadTrace({ ...all, shareA: 0.82 }).diverges).toBe(true)
  })
  it('needs gamma above one half', () => {
    expect(triadTrace({ ...all, gamma: 0.5 }).diverges).toBe(false)
    expect(triadTrace({ ...all, gamma: 0.4 }).diverges).toBe(false)
  })
  it('a frozen target slows the blow-up enormously but does not cure it', () => {
    const frozen = triadTrace({ ...all, freeze: 20 })
    expect(frozen.diverges).toBe(true)
    expect(frozen.values[200]).toBeLessThan(1e3)
    expect(frozen.values[200]).toBeGreaterThan(100)
  })
})

describe('fitting a line to a curve from ordered or replayed samples', () => {
  const opts = { alpha: 0.3, steps: 960, sweep: 120, seed: 1 }
  const ordered = fitLine({ ...opts, order: 'trajectory' })
  const replayed = fitLine({ ...opts, order: 'replay' })
  it('replay ends up close to the best a line can do', () => {
    expect(bestLineError()).toBeCloseTo(0.034, 3)
    expect(meanOf(replayed.error.slice(-120))).toBeCloseTo(0.042, 2)
  })
  it('samples in trajectory order leave the fit swinging, with nearly three times the error', () => {
    const inOrder = meanOf(ordered.error.slice(-120))
    expect(inOrder).toBeCloseTo(0.113, 2)
    expect(inOrder / meanOf(replayed.error.slice(-120))).toBeGreaterThan(2.5)
    expect(Math.max(...ordered.error.slice(-120))).toBeGreaterThan(0.2)
  })
})
