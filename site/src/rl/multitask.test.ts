import { describe, expect, it } from 'vitest'
import {
  ARMS,
  BEST_WITHOUT_CLUE,
  BEST_WITH_CLUE,
  CHECKPOINTS,
  CLUE,
  META_CHECKPOINTS,
  MetaLearner,
  goalAverage,
  metaAverage,
  moveCell,
  trainGoals,
  ucbAverage,
  ucbFromScratch,
} from './multitask'

describe('the grid', () => {
  it('moves one cell and stops at walls', () => {
    expect(moveCell(8, 27, 1)).toBe(28)
    expect(moveCell(8, 27, 0)).toBe(19)
    expect(moveCell(8, 0, 3)).toBe(0)
    expect(moveCell(8, 63, 2)).toBe(63)
  })
})

describe('goal reaching with and without hindsight (numbers quoted in the Week 13 lesson)', () => {
  const at = (episodes: number) => CHECKPOINTS.indexOf(episodes)
  const plain = goalAverage(8, 0, 10)
  const hindsight = goalAverage(8, 4, 10)

  it('an untrained agent reaches about one goal in eight by wandering', () => {
    expect(plain[0]).toBeCloseTo(0.12, 2)
    expect(hindsight[0]).toBe(plain[0])
  })
  it('after 200 episodes hindsight has learned far more', () => {
    expect(plain[at(200)]).toBeCloseTo(0.22, 2)
    expect(hindsight[at(200)]).toBeCloseTo(0.61, 2)
  })
  it('after 1600 episodes hindsight is nearly perfect and plain learning is not', () => {
    expect(plain[at(1600)]).toBeCloseTo(0.69, 2)
    expect(hindsight[at(1600)]).toBeCloseTo(0.97, 2)
  })
  it('the reason: almost no update carries a signal without relabelling', () => {
    const a = trainGoals({ size: 8, episodes: 200, hindsight: 0, seed: 1 })
    const b = trainGoals({ size: 8, episodes: 200, hindsight: 4, seed: 1 })
    expect(a.usefulShare).toBeCloseTo(0.087, 3)
    expect(b.usefulShare).toBeCloseTo(0.75, 2)
    expect(a.learner.reachable(27, 5).filter(Boolean).length - 1).toBe(13)
    expect(b.learner.reachable(27, 5).filter(Boolean).length - 1).toBe(48)
  })
  it('with enough episodes hindsight reaches every goal from the middle of the grid', () => {
    const b = trainGoals({ size: 8, episodes: 1600, hindsight: 4, seed: 1 })
    expect(b.learner.reachable(27, 5).every(Boolean)).toBe(true)
  })
})

describe('learning to learn on the lever family', () => {
  it('the two benchmark strategies', () => {
    expect(BEST_WITHOUT_CLUE).toBe(6.5)
    expect(BEST_WITH_CLUE).toBe(9)
  })
  it('a general learner starting from scratch wastes the task trying every lever once', () => {
    expect(ucbAverage().reward).toBe(2)
    expect(ucbFromScratch(5).map((p) => p.arm)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, CLUE, 5])
  })
  it('before any meta-training the agent is no better than chance', () => {
    expect(new MetaLearner(1).evaluate(400, 7).reward).toBeCloseTo(2.78, 2)
  })
  it('after 100 tasks every learner pulls the clue first and earns 9 of 10', () => {
    const m = metaAverage(20)
    const at = (tasks: number) => META_CHECKPOINTS.indexOf(tasks)
    expect(m.reward[at(20)]).toBeCloseTo(6.39, 2)
    expect(m.reward[at(50)]).toBeCloseTo(8.23, 2)
    expect(m.reward[at(100)]).toBeCloseTo(9, 6)
    expect(m.clueFirst[at(100)]).toBeCloseTo(1, 6)
    expect(m.reward[at(200)]).toBeCloseTo(9, 6)
  })
  it('the learned strategy: ask, then exploit', () => {
    const learner = new MetaLearner(1)
    learner.train(100)
    for (let good = 0; good < ARMS; good++) {
      const pulls = learner.runTask(good, false)
      expect(pulls[0].arm).toBe(CLUE)
      expect(pulls.slice(1).every((p) => p.arm === good && p.paid)).toBe(true)
    }
  })
  it('part-way through training it has a half-formed strategy', () => {
    const learner = new MetaLearner(1)
    learner.train(20)
    expect(learner.evaluate(400, 7).reward).toBeCloseTo(7.25, 2)
  })
})
