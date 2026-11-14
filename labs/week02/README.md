# Week 2 lab: estimating values from experience

Implement Monte Carlo, TD(0) and certainty-equivalence policy evaluation, using
episodes only. The tests check your code against the episode CS 234 works by hand,
the A/B example, and last week's gridworld, where the exact values are known.

The easiest way to do this lab is on the Week 2 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the four functions, in order:

1. `returns`: discounted return from every step, computed backwards.
2. `monte_carlo`: average return per state, first-visit or every-visit.
3. `td0`: one pass of the TD(0) update.
4. `certainty_equivalence`: fit a model from counts, then solve it.

Then, from this folder:

    python -m pytest

`python lab.py` prints the three estimates next to the exact values.

## Files

- `gridworld.py`: last week's world, plus `sample_episodes` and `exact_values`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with the reasoning for each expected number.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Evaluate with 100 episodes instead of 3000. Which estimator degrades most?
- Run `td0` twice over the same episodes (pass `episodes + episodes`). How close does it get to `certainty_equivalence`?
- Change the TD learning rate to 0.5. What happens to the estimates near the pits?
