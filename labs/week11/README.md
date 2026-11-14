# Week 11 lab: exploring on purpose

Implement the two pieces of optimism-by-planning from the Week 11 lesson: the
count-based exploration bonus, and value iteration on a learned model with that
bonus added. Then watch it walk to the end of a corridor that epsilon-greedy
cannot. The corridor and both agents are provided in `corridor.py`.

The easiest way to do this lab is on the Week 11 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the two functions. Then, from this folder:

    python -m pytest

`python lab.py` prints the episode in which each agent first reaches the far reward,
for corridors of 6, 8 and 12 cells.

## Files

- `corridor.py`: the environment, `run_optimistic` and `run_epsilon_greedy`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with a hand calculation of the optimistic values.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Set `beta=0` in `run_optimistic`. Does it still explore? Why?
- Set `v_max` to 0 inside `corridor.py` so untried pairs look worthless. What happens?
- Give `run_epsilon_greedy` a 4-cell corridor and count how often it succeeds over 20 seeds.
