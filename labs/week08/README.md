# Week 8 lab: behaviour cloning and DAgger

Clone a CartPole expert from the first 50 steps of a single demonstration, see
how far that gets, and then fix it with DAgger. The expert, the policy network
and the experiment are provided in `agent.py`.

The easiest way to do this lab is on the Week 8 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in:

1. `cloning_loss`: minus the average log-probability of the expert's actions.
2. `greedy_action`: the policy's most likely action for one state.
3. `dagger_round`: run the learner, and return the states it visited with the
   expert's actions for them.

Then, from this folder:

    python -m pytest

`python lab.py` prints the episode length after cloning alone and after each
DAgger round. The expert manages the full 500 steps.

## Files

- `agent.py`: the expert, the policy network, training and `run_experiment`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Give cloning a much longer demonstration (`demo_steps=500`). Is DAgger still needed?
- In `dagger_round`, return the learner's own actions as the labels instead of the expert's. What happens over the rounds?
- Make the expert noisy: flip its action 10% of the time. How does cloning cope?
