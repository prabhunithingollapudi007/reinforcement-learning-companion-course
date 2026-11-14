# Week 13 lab: hindsight relabelling

A goal-reaching agent on a grid is paid only when it arrives at the goal it was
given, which at first almost never happens. Implement hindsight relabelling, so that
every episode teaches the agent how to reach the cells it did get to, and compare
the two learners on the same number of episodes. The grid and the training loop are
provided in `grid.py`.

The easiest way to do this lab is on the Week 13 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the three functions. Then, from this folder:

    python -m pytest

`python lab.py` prints the share of goals reached after 50, 200 and 800 episodes,
with and without hindsight.

## Files

- `grid.py`: the grid, `run_episode`, `train` and `success_rate`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with small hand-worked episodes.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Change `hindsight_goals` to always return the final cell of the episode (the "final"
  strategy) and compare with choosing among all later cells (the "future" strategy).
- Replay the episode forwards instead of backwards. How much slower is learning?
- Train on a 10 x 10 grid. How many episodes does each learner need to reach 80%?
