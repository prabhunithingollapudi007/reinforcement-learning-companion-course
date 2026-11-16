import { useState } from 'react'
import { Playground } from '../../components/Playground'
import { useLink, week } from '../../router'
import '../shared.css'

type Model = 'none' | 'simulator'
type Demos = 'no' | 'yes'
type Acting = 'none' | 'costly' | 'cheap'
type Reward = 'given' | 'preferences' | 'none'

interface Advice {
  title: string
  weeks: number[]
  why: string
}

/** The course as a set of rules of thumb. */
function advise(model: Model, demos: Demos, acting: Acting, reward: Reward): Advice[] {
  const out: Advice[] = []
  if (demos === 'yes') {
    out.push({
      title: 'Start with behaviour cloning',
      weeks: [8],
      why: 'Demonstrations are the cheapest route to a policy that does something sensible. Everything else can start from it.',
    })
    if (acting !== 'none') out.push({ title: 'Then correct it where it drifts: DAgger, or RL fine-tuning', weeks: [8, 16], why: 'A cloned policy fails in states its demonstrations never visited. Letting it act and fixing what goes wrong closes that gap.' })
  }
  if (reward === 'preferences') {
    out.push({
      title: 'Learn the reward from comparisons, and stay near what you trust',
      weeks: [9, 15],
      why: 'A reward model fitted to preferences is wrong somewhere. Regularise toward the starting policy, or use DPO.',
    })
  }
  if (reward === 'none') {
    out.push({ title: 'Make goals the reward: goal-conditioned RL with hindsight relabelling', weeks: [13], why: 'Reaching a state needs no reward design, and relabelling turns every failed attempt into a success at something.' })
    out.push(
      demos === 'yes'
        ? { title: 'Or recover a reward from the demonstrations', weeks: [9], why: 'Reward learning turns “what someone did or chose” into a reward that RL can then optimise.' }
        : { title: 'Otherwise, collect demonstrations or comparisons', weeks: [8, 9], why: 'With no reward and no goal to state, the only remaining source of “what is wanted” is someone showing or choosing.' },
    )
  }
  if (model === 'simulator') {
    out.push({ title: 'Plan or search with the model', weeks: [1, 12], why: 'If you can ask “what happens if”, look ahead before acting: dynamic programming when the problem is small, tree search when it is not.' })
    if (acting !== 'cheap') out.push({ title: 'Train in simulation, then cross the gap', weeks: [16], why: 'Simulated experience is nearly free. Randomise what you are unsure of, and let the policy adapt from its recent history.' })
  }
  if (acting === 'none' && reward !== 'none') {
    out.push({ title: 'Offline RL: improve on the data without leaving it', weeks: [9], why: 'With a fixed dataset, any action the data does not cover is a guess. Constrain the policy or be pessimistic about values.' })
  }
  if (acting === 'costly' && reward !== 'none') {
    out.push({ title: 'Reuse every sample: off-policy actor-critic with a replay buffer', weeks: [7, 4], why: 'When each real step is expensive, learn from it many times.' })
    if (model === 'none') out.push({ title: 'Learn a model to multiply your data', weeks: [12], why: 'A learned model turns each real transition into many imagined ones, as long as rollouts stay short.' })
    out.push({ title: 'Explore on purpose', weeks: [10, 11], why: 'Random exploration wastes expensive steps. Optimism or posterior sampling chooses what is worth trying.' })
  }
  if (acting === 'cheap' && reward !== 'none') {
    out.push({ title: 'Policy gradients with a trust region: PPO', weeks: [5, 6], why: 'When experience is plentiful, on-policy methods are simple, stable and scale well.' })
    out.push({ title: 'With a handful of discrete actions: DQN', weeks: [4], why: 'Value-based methods are sample-efficient when you can take a max over actions.' })
  }
  out.push({ title: 'If the task is long: add a level', weeks: [14], why: 'A high level choosing subgoals shortens the horizon each learner faces.' })
  out.push({ title: 'If there are many related tasks: share', weeks: [13], why: 'Condition one policy on the task, and relabel data across tasks.' })
  return out
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o.id} className={o.id === value ? 'choice-option is-on' : 'choice-option'}>
          <input type="radio" name={label} checked={o.id === value} onChange={() => onChange(o.id)} />
          {o.text}
        </label>
      ))}
    </fieldset>
  )
}

/** Describe a problem; get the parts of the course that apply. */
export function WhichTool() {
  const link = useLink()
  const [model, setModel] = useState<Model>('none')
  const [demos, setDemos] = useState<Demos>('no')
  const [acting, setActing] = useState<Acting>('cheap')
  const [reward, setReward] = useState<Reward>('given')
  const advice = advise(model, demos, acting, reward)

  return (
    <Playground
      title="Which tool for which problem?"
      caption={<>Rules of thumb, not laws. Real systems usually combine several of these, and the links take you back to the week that explains each one.</>}
    >
      <div className="choices">
        <Choice
          label="Can you query a model or simulator?"
          value={model}
          onChange={setModel}
          options={[
            { id: 'none', text: 'No' },
            { id: 'simulator', text: 'Yes' },
          ]}
        />
        <Choice
          label="Do you have demonstrations?"
          value={demos}
          onChange={setDemos}
          options={[
            { id: 'no', text: 'No' },
            { id: 'yes', text: 'Yes' },
          ]}
        />
        <Choice
          label="Can the agent act and gather its own data?"
          value={acting}
          onChange={setActing}
          options={[
            { id: 'none', text: 'No, fixed dataset' },
            { id: 'costly', text: 'Yes, but each step is costly' },
            { id: 'cheap', text: 'Yes, cheaply' },
          ]}
        />
        <Choice
          label="Where does the reward come from?"
          value={reward}
          onChange={setReward}
          options={[
            { id: 'given', text: 'It is given or can be checked' },
            { id: 'preferences', text: 'Only people’s preferences' },
            { id: 'none', text: 'There is none' },
          ]}
        />
      </div>
      <ol className="advice">
        {advice.map((item) => (
          <li key={item.title} className="advice-item">
            <div className="advice-title">{item.title}</div>
            <div className="advice-why">{item.why}</div>
            <div className="advice-weeks">
              {item.weeks.map((w) => (
                <a key={w} href={link(week(w))} className="chip chip-accent">
                  Week {w}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Playground>
  )
}
