# Week 10 lab: three ways to choose an arm

Implement epsilon-greedy, UCB1 and Thompson sampling for a three-armed bandit,
plus the running-average update they share, and compare their regret. The
bandit and the loop that plays it are provided in `bandit.py`.

The easiest way to do this lab is on the Week 10 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the four functions. Then, from this folder:

    python -m pytest

`python lab.py` prints each strategy's regret after 500 and 2000 pulls.

## Files

- `bandit.py`: the arms, `run` and `average_regret`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Decay epsilon as `1 / t` inside `run`. Does its regret still grow in a straight line?
- Make the arms harder to tell apart, `means=np.array([0.55, 0.5, 0.45])`. Which strategy suffers most?
- Replace the `2` in the UCB bonus with `0.5`. It loses its guarantee; what happens to its regret here?
