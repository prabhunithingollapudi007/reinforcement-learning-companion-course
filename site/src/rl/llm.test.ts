import { describe, expect, it } from 'vitest'
import {
  BETAS,
  HACK,
  HUMAN,
  REF,
  RESPONSES,
  REWARD_MODEL,
  VOTE_QUESTIONS,
  VOTE_SIZES,
  expected,
  fitRewardModel,
  groupAdvantages,
  kl,
  regularisedOptimum,
  runDpo,
  samplePairs,
  sweep,
  totalVariation,
  voteCurve,
} from './llm'

describe('the toy language model', () => {
  it('starts as a proper distribution that people rate 4.4 out of 10 on average', () => {
    expect(REF.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10)
    expect(expected(REF, HUMAN)).toBeCloseTo(4.4, 6)
  })
  it('the reward model agrees with people except on one response', () => {
    RESPONSES.forEach((r, i) => {
      if (i !== HACK) expect(Math.abs(r.human - r.rewardModel)).toBeLessThanOrEqual(1)
    })
    expect(RESPONSES[HACK].rewardModel - RESPONSES[HACK].human).toBe(7.5)
  })
})

describe('optimising a reward model on a leash (numbers quoted in the Week 15 lesson)', () => {
  const points = sweep()
  const at = (beta: number) => points[BETAS.indexOf(beta)]

  it('a very large beta leaves the model where it started', () => {
    expect(totalVariation(regularisedOptimum(REF, REWARD_MODEL, 1e6), REF)).toBeLessThan(1e-4)
  })
  it('gentle optimisation helps people too', () => {
    expect(at(2.5).humanScore).toBeCloseTo(5.47, 2)
    expect(at(2.5).rewardModelScore).toBeCloseTo(6.89, 2)
    expect(at(2.5).policy[HACK]).toBeCloseTo(0.2, 2)
  })
  it('2.5 is the best beta on the grid for people', () => {
    const best = points.reduce((a, b) => (b.humanScore > a.humanScore ? b : a))
    expect(best.beta).toBe(2.5)
  })
  it('hard optimisation maximises the reward model and loses the people', () => {
    expect(at(1).humanScore).toBeCloseTo(4.29, 2)
    expect(at(1).policy[HACK]).toBeCloseTo(0.58, 2)
    expect(at(0.2).rewardModelScore).toBeCloseTo(9.5, 2)
    expect(at(0.2).humanScore).toBeCloseTo(2.0, 2)
    expect(at(0.2).policy[HACK]).toBeCloseTo(1, 2)
  })
  it('the reward-model score only ever goes up as beta falls', () => {
    for (let i = 1; i < points.length; i++) expect(points[i].rewardModelScore).toBeGreaterThan(points[i - 1].rewardModelScore)
  })
  it('with a perfect reward model the same optimisation would keep helping', () => {
    expect(at(0.2).humanScoreIfPerfect).toBeCloseTo(8.0, 2)
    for (let i = 1; i < points.length; i++) expect(points[i].humanScoreIfPerfect).toBeGreaterThan(points[i - 1].humanScoreIfPerfect)
  })
  it('KL from the starting model grows as the leash loosens', () => {
    expect(at(2.5).kl).toBeCloseTo(0.37, 2)
    expect(at(0.2).kl).toBeCloseTo(2.99, 2)
    expect(kl(REF, REF)).toBe(0)
  })
})

describe('DPO reaches the same policy without a reward model', () => {
  const pairs = samplePairs(200, 3)
  const reward = fitRewardModel(pairs, RESPONSES.length)
  const target = regularisedOptimum(REF, reward, 1)
  const run = runDpo(pairs, REF, 1, 1000, 0.3, 50)

  it('the two-stage route: fit a reward model, then take the regularised optimum', () => {
    expect(target[0]).toBeCloseTo(0.649, 3)
    expect(target[1]).toBeCloseTo(0.27, 3)
    expect(expected(target, HUMAN)).toBeCloseTo(7.01, 2)
  })
  it('DPO starts at the reference model with loss log 2', () => {
    expect(totalVariation(run.policies[0], REF)).toBeLessThan(1e-12)
    expect(run.losses[0]).toBeCloseTo(Math.log(2), 6)
    expect(totalVariation(run.policies[0], target)).toBeCloseTo(0.449, 3)
  })
  it('and converges to the two-stage answer', () => {
    const at = (step: number) => run.policies[run.recordedAt.indexOf(step)]
    expect(totalVariation(at(500), target)).toBeCloseTo(0.01, 2)
    expect(totalVariation(at(1000), target)).toBeLessThan(0.001)
    expect(run.losses[run.losses.length - 1]).toBeCloseTo(0.428, 3)
  })
  it('the loss never increases', () => {
    for (let i = 1; i < run.losses.length; i++) expect(run.losses[i]).toBeLessThanOrEqual(run.losses[i - 1] + 1e-12)
  })
})

describe('majority voting over sampled answers', () => {
  const at = (n: number) => VOTE_SIZES.indexOf(n)
  it('helps when the right answer is the single most common one', () => {
    const curve = voteCurve(VOTE_QUESTIONS[0].answers)
    expect(curve[at(1)]).toBeCloseTo(0.4, 1)
    expect(curve[at(17)]).toBeCloseTo(0.81, 2)
    expect(curve[at(129)]).toBeCloseTo(1, 2)
  })
  it('makes things worse when a wrong answer is more common', () => {
    const curve = voteCurve(VOTE_QUESTIONS[1].answers)
    expect(curve[at(1)]).toBeCloseTo(0.3, 1)
    expect(curve[at(129)]).toBeCloseTo(0.09, 2)
  })
})

describe('group-relative advantages', () => {
  it('two right answers out of eight', () => {
    const a = groupAdvantages([1, 0, 0, 1, 0, 0, 0, 0])
    expect(a[0]).toBeCloseTo(1.73, 2)
    expect(a[1]).toBeCloseTo(-0.58, 2)
    expect(a.reduce((x, y) => x + y, 0)).toBeCloseTo(0, 6)
  })
  it('a group that is all right or all wrong teaches nothing', () => {
    expect(groupAdvantages([1, 1, 1, 1]).every((v) => Math.abs(v) < 1e-6)).toBe(true)
    expect(groupAdvantages([0, 0, 0, 0]).every((v) => Math.abs(v) < 1e-6)).toBe(true)
  })
})
