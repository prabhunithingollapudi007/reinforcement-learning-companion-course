# Week 14 lab: learning with skills

Three short pieces from the Week 14 lesson:

1. the arithmetic of why long tasks fail and what retrying a piece buys,
2. running a skill ("walk to that doorway") inside the four-rooms world, and
3. the SMDP Q-learning target, which lets one learner choose among things that
   take different amounts of time.

With those in place, a high-level agent that chooses subgoals learns four rooms
about ten times faster than an agent choosing single moves. The world and the
learning loop are provided in `rooms.py`.

The easiest way to do this lab is on the Week 14 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the three functions. Then, from this folder:

    python -m pytest

`python lab.py` prints the reliability numbers and the learning comparison.

## Files

- `rooms.py`: the world, the landmarks and routes, `execute` and `train`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with hand calculations.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Set `WASTED` in `rooms.py` to 30. How much does a clumsy low level cost the high level?
- Remove the room centres from `LANDMARKS`. Does the agent still learn as fast?
- Move `GOAL` to a doorway. Which agent benefits?
- Make the low level unreliable: let `follow_skill` give up after 3 steps with probability 0.2.
