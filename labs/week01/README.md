# Week 1 lab: planning in a known MDP

Implement the algorithms from the Week 1 lesson on the same gridworld the
playground uses. When the tests pass, your numbers match the cells on the page.

The easiest way to do this lab is on the Week 1 page of the companion site, which
has an editor and a "Run tests" button that work on these same files. The rest of
this page is for working in the folder directly.

## Setup

From the `labs` folder, once:

    python -m venv .venv
    .venv/Scripts/python -m pip install -r requirements.txt

(On macOS or Linux use `.venv/bin/python`.) Use that interpreter for the commands below.

## What to do

Open `lab.py` and fill in the five functions, in order:

1. `q_from_v`: one line, `Q = R + gamma * P @ V`.
2. `policy_evaluation`: repeat the backup for a fixed policy until it stops changing.
3. `policy_improvement`: act greedily on a value function.
4. `policy_iteration`: alternate 2 and 3.
5. `value_iteration`: repeat the backup with a max.

Then, from this folder:

    python -m pytest

`python lab.py` prints the optimal values and arrows as text.

## Files

- `gridworld.py`: the environment. Read `make_gridworld`; it is the whole model.
- `lab.py`: your work.
- `test_lab.py`: the checks, with the reasoning for each expected number.
- `starter/lab.py`: the empty version of `lab.py`, used by "Reset to starter" on the site.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Count sweeps for `gamma` in 0.5, 0.9, 0.99. How does it compare with `1 / (1 - gamma)`?
- Replace the iterative `policy_evaluation` with the direct solve
  `V = (I - gamma * P_pi)^-1 R_pi` using `np.linalg.solve`. Same answer?
- Start value iteration from random values instead of zeros. The contraction
  argument says the result cannot change. Check it.
