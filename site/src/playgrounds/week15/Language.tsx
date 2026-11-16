import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import {
  BETAS,
  HACK,
  HUMAN,
  REF,
  RESPONSES,
  VOTE_QUESTIONS,
  VOTE_SIZES,
  expected,
  fitRewardModel,
  regularisedOptimum,
  runDpo,
  samplePairs,
  sweep,
  totalVariation,
  voteCurve,
} from '../../rl/llm'
import '../shared.css'

const ROW_H = 40
const BAR_X = 250
const BAR_W = 300

/** Six responses, each with two bars: how often before, how often after. */
function PolicyBars({ before, after, beforeName, afterName, slot, notes }: { before: number[]; after: number[]; beforeName: string; afterName: string; slot: 1 | 2 | 3; notes?: string[] }) {
  return (
    <>
      <svg
        viewBox={`0 0 720 ${RESPONSES.length * ROW_H + 8}`}
        className="chart"
        role="img"
        aria-label={`How often each kind of response is given. ${RESPONSES.map((r, i) => `${r.name}: ${beforeName} ${(before[i] * 100).toFixed(0)}%, ${afterName} ${(after[i] * 100).toFixed(0)}%`).join('. ')}.`}
      >
        {RESPONSES.map((r, i) => {
          const y = 4 + i * ROW_H
          return (
            <g key={r.name}>
              <text x={0} y={y + 22} className={i === HACK ? 'strip-label' : 'tick'}>
                {r.name}
              </text>
              <rect x={BAR_X} y={y + 4} width={Math.max(1, before[i] * BAR_W)} height={12} rx={4} className="bar-before">
                <title>{`${beforeName}: ${(before[i] * 100).toFixed(1)}%`}</title>
              </rect>
              <rect x={BAR_X} y={y + 19} width={Math.max(1, after[i] * BAR_W)} height={12} rx={4} className={`bar-${slot}`}>
                <title>{`${afterName}: ${(after[i] * 100).toFixed(1)}%`}</title>
              </rect>
              <text x={BAR_X + Math.max(before[i], after[i]) * BAR_W + 8} y={y + 30} className="tick">
                {(after[i] * 100).toFixed(0)}%
              </text>
              {notes && (
                <text x={720} y={y + 22} textAnchor="end" className="tick">
                  {notes[i]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <ul className="swatches">
        <li>
          <i className="swatch swatch-none" /> {beforeName}
        </li>
        <li>
          <i className={`swatch swatch-${slot}`} /> {afterName}
        </li>
      </ul>
    </>
  )
}

/** Maximising a learned reward on a KL leash, and what happens when the leash is let out. */
export function OverOptimised() {
  const [index, setIndex] = useState(5)
  const points = useMemo(() => sweep(), [])
  const point = points[index]
  const notes = RESPONSES.map((r) => `people ${r.human.toFixed(1)} · reward model ${r.rewardModel.toFixed(1)}`)

  return (
    <Playground
      title="Optimising a reward model on a leash"
      caption={
        <>
          One prompt, six kinds of response. The numbers on the right are what people think of each response and what
          the learned reward model scores it. They agree except on the row in bold, which the reward model has
          mistaken for a good answer. The blue bars are the best possible model for the chosen β: the one that
          maximises reward-model score minus β times its distance from where it started.
        </>
      }
    >
      <div className="controls">
        <Slider
          label="Leash β (smaller means optimise harder)"
          value={index}
          min={0}
          max={BETAS.length - 1}
          step={1}
          onChange={setIndex}
          format={() => `β = ${point.beta}`}
        />
      </div>
      <PolicyBars before={REF} after={point.policy} beforeName="the starting model" afterName="after optimisation" slot={1} notes={notes} />

      <div className="chart-title">Scores as the leash is let out</div>
      <LineChart
        series={[
          { name: 'What the reward model says', values: points.map((p) => p.rewardModelScore), slot: 2 },
          { name: 'What people think', values: points.map((p) => p.humanScore), slot: 1 },
          { name: 'What people would think if the reward model were perfect', values: points.map((p) => p.humanScoreIfPerfect), slot: 3 },
        ]}
        xLabel="β, from gentle to aggressive"
        yLabel="average score, 0 to 10"
        ariaLabel={`Scores against beta from ${BETAS[0]} to ${BETAS[BETAS.length - 1]}. The reward-model score rises from ${points[0].rewardModelScore.toFixed(1)} to ${points[points.length - 1].rewardModelScore.toFixed(1)}. What people think rises from ${points[0].humanScore.toFixed(1)} to a peak of 5.5 at beta 2.5, then falls to ${points[points.length - 1].humanScore.toFixed(1)}.`}
        yMin={0}
        yMax={10}
        height={260}
        marker={{ x: index, label: `β = ${point.beta}` }}
        format={(v) => v.toFixed(2)}
        xFormat={(k) => `${BETAS[k]}`}
        tableRows={BETAS.map((_, i) => i)}
      />
      <div className="stats stats-4">
        <Stat label="Reward-model score" value={point.rewardModelScore.toFixed(2)} note="what training sees and reports" />
        <Stat label="What people think" value={point.humanScore.toFixed(2)} note={`the starting model scored ${expected(REF, HUMAN).toFixed(2)}`} />
        <Stat label="Share of the flattering response" value={`${(point.policy[HACK] * 100).toFixed(0)}%`} note="up from 5%" />
        <Stat label="Distance from the start (KL)" value={point.kl.toFixed(2)} note="what β is charging for" />
      </div>
    </Playground>
  )
}

const DPO_STEPS = 1000
const DPO_EVERY = 50

/** DPO arriving at the policy that RLHF's two stages would produce. */
export function DpoMatches() {
  const [count, setCount] = useState(200)
  const [beta, setBeta] = useState(1)
  const [at, setAt] = useState(0)

  const result = useMemo(() => {
    const pairs = samplePairs(count, 3)
    const reward = fitRewardModel(pairs, RESPONSES.length)
    const target = regularisedOptimum(REF, reward, beta)
    // A larger step for a short leash, so every setting settles within the slider's range.
    const run = runDpo(pairs, REF, beta, DPO_STEPS, 0.3 / Math.min(1, beta * beta), DPO_EVERY)
    return { target, run, distance: run.policies.map((p) => totalVariation(p, target)) }
  }, [count, beta])
  const policy = result.run.policies[at]

  return (
    <Playground
      title="Two routes to the same model"
      caption={
        <>
          People compared pairs of responses. Route one, RLHF: fit a reward model to the comparisons, then find the
          best model on a leash of β (grey bars). Route two, DPO: start from the same model and run plain gradient
          descent on a classification loss over the same comparisons (orange bars). No reward model, no sampling from
          the model, no policy gradient.
        </>
      }
    >
      <div className="controls controls-3">
        <Slider label="Comparisons collected" value={count} min={50} max={1000} step={50} onChange={setCount} format={(v) => `${v}`} />
        <Slider label="Leash β" value={beta} min={0.5} max={2} step={0.25} onChange={setBeta} format={(v) => v.toFixed(2)} />
        <Slider label="DPO gradient steps" value={at} min={0} max={DPO_STEPS / DPO_EVERY} step={1} onChange={setAt} format={(v) => `${v * DPO_EVERY}`} />
      </div>
      <PolicyBars before={result.target} after={policy} beforeName="RLHF: reward model, then optimise" afterName={`DPO after ${at * DPO_EVERY} steps`} slot={2} />

      <div className="chart-title">How far DPO is from the RLHF answer</div>
      <LineChart
        series={[{ name: 'Difference between the two models', values: result.distance, slot: 2 }]}
        xLabel="DPO gradient steps"
        yLabel="share of probability that differs"
        ariaLabel={`Total variation distance between the DPO model and the RLHF model against gradient steps. It falls from ${result.distance[0].toFixed(2)} to ${result.distance[result.distance.length - 1].toFixed(3)}.`}
        yMin={0}
        height={220}
        marker={{ x: at, label: `${at * DPO_EVERY} steps` }}
        format={(v) => v.toFixed(3)}
        xFormat={(k) => `${k * DPO_EVERY}`}
        tableRows={[0, 2, 4, 6, 10, 14, 20]}
      />
      <div className="stats">
        <Stat label="Difference now" value={result.distance[at].toFixed(3)} note="0 means the two models are identical" />
        <Stat label="DPO loss" value={result.run.losses[at].toFixed(3)} note="starts at 0.693: a coin flip on every comparison" />
        <Stat label="What people think of the DPO model" value={expected(policy, HUMAN).toFixed(2)} note={`the starting model scored ${expected(REF, HUMAN).toFixed(2)}`} />
      </div>
    </Playground>
  )
}

/** More samples at answer time: when voting helps and when it cannot. */
export function Voting() {
  const [index, setIndex] = useState(4)
  const curves = useMemo(() => VOTE_QUESTIONS.map((q) => voteCurve(q.answers)), [])
  const n = VOTE_SIZES[index]

  return (
    <Playground
      title="Answering by majority vote"
      caption={
        <>
          Ask the model the same question many times and return the most common answer. On the first question a single
          sample is right 40% of the time and the wrong answers are scattered. On the second a single sample is right
          30% of the time and one particular wrong answer comes up 40% of the time.
        </>
      }
    >
      <div className="controls">
        <Slider label="Samples per question" value={index} min={0} max={VOTE_SIZES.length - 1} step={1} onChange={setIndex} format={() => `${n}`} />
      </div>
      <LineChart
        series={VOTE_QUESTIONS.map((q, i) => ({ name: q.name, values: curves[i], slot: (i === 0 ? 1 : 2) as 1 | 2, dots: true }))}
        xLabel="samples per question"
        yLabel="vote is correct"
        ariaLabel={`Accuracy of a majority vote against the number of samples. ${VOTE_QUESTIONS.map((q, i) => `${q.name}: from ${curves[i][0].toFixed(2)} with one sample to ${curves[i][curves[i].length - 1].toFixed(2)} with ${VOTE_SIZES[VOTE_SIZES.length - 1]}`).join('. ')}.`}
        yMin={0}
        yMax={1}
        height={250}
        marker={{ x: index, label: `${n} samples` }}
        format={(v) => `${Math.round(v * 100)}%`}
        xFormat={(k) => `${VOTE_SIZES[k]}`}
        tableRows={VOTE_SIZES.map((_, i) => i)}
      />
      <div className="stats">
        <Stat label="Right answer most common" value={`${Math.round(curves[0][index] * 100)}%`} note={`with ${n} ${n === 1 ? 'sample' : 'samples'}; 40% with one`} />
        <Stat label="Tempting wrong answer" value={`${Math.round(curves[1][index] * 100)}%`} note={`with ${n} ${n === 1 ? 'sample' : 'samples'}; 30% with one`} />
        <Stat label="Cost" value={`${n}×`} note="every sample is a full answer" />
      </div>
    </Playground>
  )
}
