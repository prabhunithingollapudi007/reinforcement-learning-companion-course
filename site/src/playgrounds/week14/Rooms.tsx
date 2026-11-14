import { useMemo, useState } from 'react'
import { LineChart } from '../../components/LineChart'
import { Playground, Slider, Stat } from '../../components/Playground'
import {
  AGENT_NAMES,
  COLS,
  DOORS,
  GOAL,
  LANDMARKS,
  ROWS,
  START,
  averageLengths,
  flatSuccess,
  hierarchicalSuccess,
  isWall,
  medianFirstGoal,
  shortestPath,
  wander,
  type AgentKind,
} from '../../rl/hierarchy'
import '../shared.css'

const KINDS: { id: AgentKind; slot: 1 | 2 | 3; short: string }[] = [
  { id: 'flat', slot: 2, short: 'Single moves' },
  { id: 'doors', slot: 3, short: 'Moves + door skills' },
  { id: 'subgoals', slot: 1, short: 'Subgoals' },
]
const CELL = 17
const GRID = COLS * CELL
const GAP = (720 - 3 * GRID) / 2
const EPISODES = 60

function RoomMap({ kind, slot, x, visits, title }: { kind: AgentKind; slot: number; x: number; visits: number[]; title: string }) {
  const max = Math.max(1, ...visits)
  return (
    <g transform={`translate(${x}, 26)`}>
      <text x={0} y={-10} className="strip-label">
        {title}
      </text>
      {visits.map((v, cell) => {
        const cx = (cell % COLS) * CELL
        const cy = Math.floor(cell / COLS) * CELL
        if (isWall(cell)) return <rect key={cell} x={cx} y={cy} width={CELL} height={CELL} className="room-wall" />
        return (
          <rect
            key={cell}
            x={cx + 0.75}
            y={cy + 0.75}
            width={CELL - 1.5}
            height={CELL - 1.5}
            rx={3}
            fill={v === 0 ? 'var(--cell-mid)' : `color-mix(in oklab, var(--series-${slot}) ${Math.round(25 + 75 * Math.sqrt(v / max))}%, var(--cell-mid))`}
          >
            <title>{v === 0 ? 'never visited' : `visited ${v} times`}</title>
          </rect>
        )
      })}
      {kind === 'subgoals' &&
        LANDMARKS.filter((l) => l !== GOAL).map((l) => (
          <circle key={l} cx={(l % COLS) * CELL + CELL / 2} cy={Math.floor(l / COLS) * CELL + CELL / 2} r={2.5} className="room-landmark" />
        ))}
      {kind === 'doors' && DOORS.map((l) => <circle key={l} cx={(l % COLS) * CELL + CELL / 2} cy={Math.floor(l / COLS) * CELL + CELL / 2} r={2.5} className="room-landmark" />)}
      <text x={(START % COLS) * CELL + CELL / 2} y={Math.floor(START / COLS) * CELL + CELL / 2 + 4.5} textAnchor="middle" className="cell-start">
        S
      </text>
      <text x={(GOAL % COLS) * CELL + CELL / 2} y={Math.floor(GOAL / COLS) * CELL + CELL / 2 + 4.5} textAnchor="middle" className="cell-start">
        G
      </text>
    </g>
  )
}

/** Three agents in four rooms: flat, awkward skills, and subgoals for a low level. */
export function FourRooms() {
  const [steps, setSteps] = useState(500)
  const [seed, setSeed] = useState(500)

  const walks = useMemo(() => ({ flat: wander('flat', steps, seed), doors: wander('doors', steps, seed), subgoals: wander('subgoals', steps, seed) }), [steps, seed])
  const curves = useMemo(() => ({ flat: averageLengths('flat', EPISODES, 20), doors: averageLengths('doors', EPISODES, 20), subgoals: averageLengths('subgoals', EPISODES, 20) }), [])
  const medians = useMemo(() => ({ flat: medianFirstGoal('flat', 41), doors: medianFirstGoal('doors', 41), subgoals: medianFirstGoal('subgoals', 41) }), [])
  const total = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0))

  return (
    <Playground
      title="Four rooms, three agents"
      caption={
        <>
          The agent starts at S and is paid only at G, in the opposite room. The maps show where each agent goes when
          it knows nothing and chooses at random. The first chooses single moves. The second can also choose “go to
          doorway k” from anywhere. The third chooses a subgoal (a doorway, the middle of a room, or G), and a low
          level walks there if it is in the same room; if not, six steps are wasted. Dots mark the places skills lead
          to.
        </>
      }
    >
      <div className="controls controls-3">
        <Slider label="Steps of random wandering" value={steps} min={100} max={3000} step={100} onChange={setSteps} format={(v) => `${v}`} />
        <div className="button-row">
          <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
            Wander again
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 720 ${26 + ROWS * CELL + 22}`}
        className="chart"
        role="img"
        aria-label={`Cells visited in ${steps} steps of random wandering. ${KINDS.map((k) => `${AGENT_NAMES[k.id]}: ${walks[k.id].visits.filter((v) => v > 0).length} cells, goal ${walks[k.id].firstGoal === null ? 'not reached' : `first reached at step ${walks[k.id].firstGoal}`}`).join('. ')}.`}
      >
        {KINDS.map((k, i) => (
          <g key={k.id}>
            <RoomMap kind={k.id} slot={k.slot} x={i * (GRID + GAP)} visits={walks[k.id].visits} title={k.short} />
            <text x={i * (GRID + GAP)} y={26 + ROWS * CELL + 16} className="tick">
              {walks[k.id].firstGoal === null ? 'has not found G' : `found G at step ${walks[k.id].firstGoal}`}
            </text>
          </g>
        ))}
      </svg>

      <div className="chart-title">Now with learning: steps to reach G in each episode, averaged over 20 agents of each kind</div>
      <LineChart
        series={KINDS.map((k) => ({ name: AGENT_NAMES[k.id], values: curves[k.id], slot: k.slot }))}
        xLabel="episode"
        yLabel="steps to reach G"
        ariaLabel={`Steps per episode over ${EPISODES} episodes. ${KINDS.map((k) => `${AGENT_NAMES[k.id]} starts at ${Math.round(curves[k.id][0])} and totals ${total(curves[k.id])} steps`).join('; ')}. The shortest possible is ${shortestPath()}.`}
        log
        floor={10}
        height={280}
        format={(v) => v.toFixed(0)}
        xFormat={(k) => `${k + 1}`}
        tableRows={[0, 1, 2, 4, 9, 19, 39, 59]}
        legendNote={`shortest possible: ${shortestPath()} steps`}
      />
      <div className="stats">
        {KINDS.map((k) => (
          <Stat
            key={k.id}
            label={k.short}
            value={`${total(curves[k.id]).toLocaleString('en-US')} steps`}
            note={`to finish ${EPISODES} episodes; by wandering alone it first finds G after ${medians[k.id].toLocaleString('en-US')} steps (median)`}
          />
        ))}
      </div>
    </Playground>
  )
}

const LENGTHS = [10, 20, 50, 100, 200, 500, 1000]

/** Why long tasks fail, and what a higher level that can redo a piece buys. */
export function LongTasks() {
  const [p, setP] = useState(0.99)
  const [piece, setPiece] = useState(20)
  const [retries, setRetries] = useState(2)
  const [lengthIndex, setLengthIndex] = useState(4)
  const steps = LENGTHS[lengthIndex]

  const flat = LENGTHS.map((h) => flatSuccess(p, h))
  const hier = LENGTHS.map((h) => hierarchicalSuccess(p, h, h / piece, retries))
  const pct = (v: number) => (v >= 0.0995 ? `${(v * 100).toFixed(0)}%` : v >= 0.001 ? `${(v * 100).toFixed(1)}%` : 'under 0.1%')

  return (
    <Playground
      title="Long tasks are fragile"
      caption={
        <>
          Suppose each step goes right with a fixed probability and one wrong step spoils the task. The orange line is
          the chance of getting through the whole task. The blue line cuts the task into pieces and lets a higher
          level notice a failed piece and ask for it again. That assumes it <em>can</em> notice, which is its own
          problem.
        </>
      }
    >
      <div className="controls">
        <Slider label="Chance each step goes right" value={p} min={0.95} max={0.999} step={0.001} onChange={setP} format={(v) => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Task length" value={lengthIndex} min={0} max={LENGTHS.length - 1} step={1} onChange={setLengthIndex} format={() => `${steps} steps`} />
        <Slider label="Steps in each piece" value={piece} min={5} max={100} step={5} onChange={setPiece} format={(v) => `${v}`} />
        <Slider label="Retries allowed per piece" value={retries} min={0} max={4} step={1} onChange={setRetries} format={(v) => `${v}`} />
      </div>
      <LineChart
        series={[
          { name: 'In pieces, with retries', values: hier, slot: 1, dots: true },
          { name: 'One unbroken attempt', values: flat, slot: 2, dots: true },
        ]}
        xLabel="task length in steps"
        yLabel="chance of success"
        ariaLabel={`Chance of success against task length when each step succeeds with probability ${p}. For ${steps} steps: ${pct(flat[lengthIndex])} in one attempt, ${pct(hier[lengthIndex])} in pieces of ${piece} with ${retries} retries.`}
        yMin={0}
        yMax={1}
        height={250}
        marker={{ x: lengthIndex, label: `${steps} steps` }}
        format={pct}
        xFormat={(k) => `${LENGTHS[k]}`}
        tableRows={LENGTHS.map((_, i) => i)}
      />
      <div className="stats">
        <Stat label={`${steps} steps in one attempt`} value={pct(flat[lengthIndex])} note={`${(p * 100).toFixed(1)}% multiplied by itself ${steps} times`} />
        <Stat label="One piece, one try" value={pct(p ** piece)} note={`${piece} steps`} />
        <Stat label={`In pieces, ${retries} ${retries === 1 ? 'retry' : 'retries'} each`} value={pct(hier[lengthIndex])} note={`${(steps / piece).toFixed(steps % piece ? 1 : 0)} pieces`} />
      </div>
    </Playground>
  )
}
