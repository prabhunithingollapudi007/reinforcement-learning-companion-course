import { useState } from 'react'

export interface Question {
  prompt: string
  options: string[]
  answer: number
  explain: string
}

export function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null))
  const answered = picked.filter((p) => p !== null).length
  const correct = picked.filter((p, i) => p === questions[i].answer).length

  return (
    <div className="quiz">
      {questions.map((q, i) => {
        const choice = picked[i]
        return (
          <fieldset className="quiz-q" key={q.prompt}>
            <legend>
              <span className="quiz-n">{i + 1}</span>
              {q.prompt}
            </legend>
            <div className="quiz-options">
              {q.options.map((opt, j) => {
                const chosen = choice === j
                const reveal = choice !== null
                const state = !reveal ? '' : j === q.answer ? 'is-right' : chosen ? 'is-wrong' : 'is-dim'
                return (
                  <button
                    type="button"
                    key={opt}
                    className={`quiz-option ${state}`}
                    aria-pressed={chosen}
                    onClick={() => setPicked((prev) => prev.map((p, k) => (k === i ? j : p)))}
                  >
                    <span className="quiz-mark" aria-hidden="true">
                      {reveal && j === q.answer ? '✓' : reveal && chosen ? '✕' : String.fromCharCode(65 + j)}
                    </span>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
            {choice !== null && (
              <p className="quiz-explain" role="status">
                <strong>{choice === q.answer ? 'Correct.' : 'Not quite.'}</strong> {q.explain}
              </p>
            )}
          </fieldset>
        )
      })}
      <div className="quiz-score">
        {answered === 0
          ? `${questions.length} questions. Pick an answer to see the explanation.`
          : `${correct} of ${answered} correct so far (${questions.length} questions).`}
        {answered > 0 && (
          <button type="button" className="btn btn-quiet" onClick={() => setPicked(questions.map(() => null))}>
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
