import { describe, expect, it } from 'vitest'
import type { Question } from './Quiz'
import { optionOrder } from './quizOrder'

const files = import.meta.glob<Record<string, Question[]>>('../lessons/week*.quiz.ts', { eager: true })
const quizzes = Object.entries(files).map(([path, module]) => ({ path, questions: Object.values(module)[0] }))
const all = quizzes.flatMap((q) => q.questions)

describe('every quiz', () => {
  it('there is one per week', () => {
    expect(quizzes).toHaveLength(16)
  })
  it('each question has four distinct options and an answer among them', () => {
    for (const q of all) {
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      expect(new Set(q.options).size).toBe(q.options.length)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(q.explain.length).toBeGreaterThan(20)
    }
  })
  it('prompts are unique within a quiz', () => {
    for (const { questions } of quizzes) expect(new Set(questions.map((q) => q.prompt)).size).toBe(questions.length)
  })
})

describe('the order options are shown in', () => {
  it('is a rearrangement of the options, the same every time', () => {
    for (const q of all) {
      const order = optionOrder(q.prompt, q.options)
      expect(order.slice().sort()).toEqual(q.options.map((_, i) => i))
      expect(optionOrder(q.prompt, q.options)).toEqual(order)
    }
  })
  it('does not give the answer away by position', () => {
    const shown = [0, 0, 0, 0]
    for (const q of all) shown[optionOrder(q.prompt, q.options).indexOf(q.answer)] += 1
    for (const count of shown) expect(count / all.length).toBeLessThan(0.36)
    for (const count of shown) expect(count / all.length).toBeGreaterThan(0.14)
  })
  it('keeps "none of the above" last', () => {
    const order = optionOrder('any prompt', ['First', 'Second', 'Third', 'None of the above'])
    expect(order[3]).toBe(3)
  })
  it('leaves a scale of numbers in the order it was written', () => {
    expect(optionOrder('How often?', ['99%', '50%', '13%', '1%'])).toEqual([0, 1, 2, 3])
  })
})
