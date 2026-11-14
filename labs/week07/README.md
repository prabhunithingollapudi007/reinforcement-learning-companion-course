# Week 7 lab: an off-policy actor-critic

Implement the three functions at the heart of an off-policy actor-critic for
discrete actions, in the style of soft actor-critic: the value of the next state
under the current policy, the critic's loss and the actor's loss. The networks,
the replay buffer and the training loop are provided in `agent.py`.

The easiest way to do this lab is on the Week 7 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in:

1. `next_state_value`: average the target critic over the current policy's actions.
2. `critic_loss`: regress Q for the stored action toward the target.
3. `actor_loss`: make actions with high Q more likely, with a small entropy bonus.

Then, from this folder:

    python -m pytest

The last test trains on CartPole for 8000 steps, which takes about half a minute.
`python lab.py` runs the same training and prints how the episode length grew.

## Files

- `agent.py`: the networks, the replay buffer and `train_actor_critic`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with hand calculations for each function.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Set `alpha=0.0`. Does the policy still explore enough to learn?
- In `next_state_value`, use the max over actions instead of the policy's average. Which Week 4 algorithm have you rebuilt?
- Compare how many environment steps this needs with Week 6's PPO.
