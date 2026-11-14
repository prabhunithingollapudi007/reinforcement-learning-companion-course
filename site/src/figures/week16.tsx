import { arrow } from './arrows'
import { Figure } from './Figure'
import { Loop } from './week12'

/** The sim-to-real recipe. */
export function SimToRealLoop() {
  return (
    <Loop
      accent={2}
      back="measurements from the real robot make the simulator more faithful"
      boxes={[
        { title: 'Simulate', lines: ['thousands of robots', 'in parallel'] },
        { title: 'Train', lines: ['with RL, usually PPO,', 'for billions of steps'] },
        { title: 'Deploy', lines: ['the same policy on', 'the real robot'] },
        { title: 'Compare', lines: ['what happened with', 'what was simulated'] },
      ]}
      label="Four steps in a loop. Simulate thousands of robots in parallel. Train a policy with reinforcement learning, usually PPO, for billions of steps. Deploy the same policy on the real robot. Compare what happened with what was simulated, and use the difference to make the simulator more faithful."
      caption="Simulated experience is cheap, fast, safe and comes with every quantity labelled. The third box is where it gets hard: the policy has only ever lived in the simulator, and the simulator is never quite the world."
    />
  )
}

/** A teacher that is told everything, and a student that has to work it out. */
export function TeacherStudent() {
  return (
    <Figure
      height={250}
      label="Two policies. The teacher, trained by reinforcement learning in simulation, sees the robot's state and privileged information such as friction, mass and terrain. The student sees only what a real robot can sense: its own recent history of sensor readings. The student is trained by imitation to output what the teacher would."
      caption="Learning to adapt in two stages. The teacher's job is easy because the simulator tells it the friction, the payload and the terrain. The student is given only a short history of its own sensor readings and has to reproduce the teacher's actions, which forces it to infer those hidden quantities from how the robot has been responding. Only the student is deployed."
    >
      <rect x={30} y={34} width={290} height={150} rx={14} className="fig-box" />
      <text x={175} y={62} textAnchor="middle" className="fig-big">
        Teacher
      </text>
      <text x={175} y={82} textAnchor="middle" className="fig-small">
        simulation only, trained by RL
      </text>
      <rect x={50} y={98} width={120} height={32} rx={8} className="fig-chip" />
      <text x={110} y={119} textAnchor="middle" className="fig-small">
        robot state
      </text>
      <rect x={180} y={98} width={120} height={32} rx={8} className="fig-chip-accent" />
      <text x={240} y={119} textAnchor="middle" className="fig-small">
        friction, mass, terrain
      </text>
      <text x={175} y={162} textAnchor="middle" className="fig-math">
        π(a | state, e)
      </text>

      <rect x={400} y={34} width={290} height={150} rx={14} className="fig-box-accent" />
      <text x={545} y={62} textAnchor="middle" className="fig-big">
        Student
      </text>
      <text x={545} y={82} textAnchor="middle" className="fig-small">
        deployed, trained by imitation
      </text>
      <rect x={420} y={98} width={120} height={32} rx={8} className="fig-chip" />
      <text x={480} y={119} textAnchor="middle" className="fig-small">
        robot state
      </text>
      <rect x={550} y={98} width={120} height={32} rx={8} className="fig-chip" />
      <text x={610} y={119} textAnchor="middle" className="fig-small">
        recent sensor history
      </text>
      <text x={545} y={162} textAnchor="middle" className="fig-math">
        π′(a | state, history)
      </text>
      <line x1={322} y1={109} x2={396} y2={109} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={360} y={98} textAnchor="middle" className="fig-label">
        imitate
      </text>
      <text x={360} y={224} textAnchor="middle" className="fig-strong">
        the student must work out from its history what the teacher was simply told
      </text>
    </Figure>
  )
}

/** Improving a large frozen policy by training a small one beside it. */
export function SmallBesideLarge() {
  return (
    <Figure
      height={236}
      label="A large pretrained robot policy is kept frozen. A small policy, trained by reinforcement learning from real experience, feeds it an adjustment: either the noise its action generator starts from, or a small correction to its output. The improved behaviour can later be distilled back into the large policy."
      caption="Fine-tuning a model with billions of parameters by RL on a real robot is slow and delicate. A common alternative leaves the large model alone and trains a small policy that steers it: by choosing the noise its action generator starts from, or by adding a small correction to its action. The small policy learns in tens of episodes, and what it learns can later be distilled back into the large one."
    >
      <rect x={30} y={40} width={150} height={52} rx={12} className="fig-box" />
      <text x={105} y={62} textAnchor="middle" className="fig-strong">
        camera images
      </text>
      <text x={105} y={80} textAnchor="middle" className="fig-small">
        and instruction
      </text>
      <rect x={250} y={24} width={220} height={84} rx={14} className="fig-box" />
      <text x={360} y={54} textAnchor="middle" className="fig-big">
        Large pretrained policy
      </text>
      <text x={360} y={76} textAnchor="middle" className="fig-small">
        frozen
      </text>
      <rect x={250} y={140} width={220} height={66} rx={14} className="fig-box-accent" />
      <text x={360} y={166} textAnchor="middle" className="fig-big">
        Small policy
      </text>
      <text x={360} y={186} textAnchor="middle" className="fig-small">
        trained by RL on the robot
      </text>
      <rect x={560} y={40} width={130} height={52} rx={12} className="fig-box" />
      <text x={625} y={71} textAnchor="middle" className="fig-strong">
        action
      </text>
      <line x1={182} y1={66} x2={246} y2={66} className="fig-line" markerEnd={arrow('ink')} />
      <line x1={472} y1={66} x2={556} y2={66} className="fig-line" markerEnd={arrow('ink')} />
      <path d="M105,94 L105,173 L246,173" className="fig-line" markerEnd={arrow('ink')} fill="none" />
      <line x1={360} y1={138} x2={360} y2={112} className="fig-line-s1" markerEnd={arrow('s1')} />
      <text x={372} y={130} className="fig-label">
        steer
      </text>
      <path d="M625,94 L625,173 L474,173" className="fig-line-s2" markerEnd={arrow('s2')} fill="none" />
      <text x={550} y={192} textAnchor="middle" className="fig-small">
        reward from the real task
      </text>
    </Figure>
  )
}
