# Week 12 lab: search, and planning with a learned model

Two short parts, matching the two halves of the Week 12 lesson.

1. Write the UCT scoring rule and watch tree search find a move that flat Monte Carlo
   search misses.
2. Learn the dynamics of a cart from 200 random pushes, then park it by planning:
   sample candidate action sequences, roll them out in your model, take the first
   action of the best, and repeat.

The tree, the cart and both loops are provided in `world.py`.

The easiest way to do this lab is on the Week 12 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the four functions. Then, from this folder:

    python -m pytest

`python lab.py` prints what tree search and flat search chose, and where the cart
ends up under planning and under random pushes.

## Files

- `world.py`: the decision tree, the cart, `run_uct` and `run_mpc`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with hand calculations.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Call `run_uct` with `c=0.1` and `c=3`. How do the visit counts change?
- Call `run_mpc` with `horizon=2`. Why does a short-sighted planner struggle?
- Fit the model from only 5 transitions (`collect_random_data(5)`) and plan with it.
- Replace random shooting with the cross-entropy method: after scoring, refit a mean and
  standard deviation per time step to the best 10% of plans, resample, and repeat three times.
