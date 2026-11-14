import { useMemo, useState } from 'react'
import { Playground, Slider } from '../../components/Playground'
import { abDataset, batchMonteCarlo, certaintyEquivalence } from '../../rl/prediction'
import '../shared.css'

export function BatchAB() {
  const [ones, setOnes] = useState(6)
  const [zeros, setZeros] = useState(1)

  const { mc, ce } = useMemo(() => {
    const data = abDataset(ones, zeros)
    return { mc: batchMonteCarlo(data, 2, 1), ce: certaintyEquivalence(data, 2, 1) }
  }, [ones, zeros])
  const total = ones + zeros + 1

  return (
    <Playground
      title="Same data, two answers"
      caption={
        <>
          A classic example from Sutton and Barto's textbook, with γ = 1. Replay this fixed dataset through each method
          until nothing changes. They agree about B and disagree about A, because they are answering different
          questions.
        </>
      }
    >
      <div className="controls">
        <Slider label="Episodes that start in B and pay 1" value={ones} min={0} max={8} step={1} onChange={setOnes} />
        <Slider label="Episodes that start in B and pay 0" value={zeros} min={0} max={8} step={1} onChange={setZeros} />
      </div>

      <div className="chart-title">The dataset ({total} episodes)</div>
      <div className="chips">
        <span className="chip chip-accent">A, 0, B, 0</span>
        {Array.from({ length: ones }, (_, i) => (
          <span className="chip" key={`one${i}`}>
            B, 1
          </span>
        ))}
        {Array.from({ length: zeros }, (_, i) => (
          <span className="chip" key={`zero${i}`}>
            B, 0
          </span>
        ))}
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-title">Both methods</div>
          <div className="card-value">V(B) = {mc[1].toFixed(2)}</div>
          <div className="card-note">
            B was visited {total} times and paid 1 on {ones} of them.
          </div>
        </div>
        <div className="card">
          <div className="card-title">Batch Monte Carlo</div>
          <div className="card-value">V(A) = {mc[0].toFixed(2)}</div>
          <div className="card-note">A was seen once and the return that followed was 0. That is the best fit to the returns observed.</div>
        </div>
        <div className="card">
          <div className="card-title">Batch TD(0)</div>
          <div className="card-value">V(A) = {ce[0].toFixed(2)}</div>
          <div className="card-note">A always led to B with reward 0, so A is worth whatever B is worth. That is the best fit to a Markov model of the data.</div>
        </div>
      </div>
    </Playground>
  )
}
