# Week 9 lab: weighted imitation, expectiles and preferences

Three short functions, each carrying one idea from the Week 9 lesson, and a
small experiment for each in `experiments.py`:

- advantage weights, used to imitate logged data selectively;
- the expectile loss, used by implicit Q-learning to fit a value function;
- the preference loss, used to fit a reward model to pairwise comparisons.

The easiest way to do this lab is on the Week 9 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the three functions. Then, from this folder:

    python -m pytest

`python lab.py` prints how often the policy picks the best action after plain
cloning and after advantage-weighted cloning, and how close the fitted reward
is to the hidden one.

## Files

- `experiments.py`: the three experiments that call your functions.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with hand calculations for each loss.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- In `weighted_imitation`, try `alpha` of 1.0, 0.3, 0.1 and 0.03. Where does it stop helping, and why does the cap matter?
- Fit the value with `tau=0.999`. How close does it get to the largest Q-value?
- Fit the reward from 20 comparisons instead of 200, over several seeds. How much does the direction wander?
