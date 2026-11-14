# Week 6 lab: GAE and the clipped objective

Implement the two functions that distinguish PPO from plain policy gradient:
generalised advantage estimation and the clipped surrogate objective. The
actor-critic network and the training loop are provided in `agent.py`.

The easiest way to do this lab is on the Week 6 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in:

1. `gae`: advantages for a batch of steps that may span several episodes.
2. `clipped_objective`: the mean of `min(ratio * A, clamp(ratio) * A)`.

Then, from this folder:

    python -m pytest

The last test trains on CartPole, which takes about half a minute.
`python lab.py` runs the same training and prints how the episode length grew.

## Files

- `agent.py`: the actor-critic network and `train_ppo`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with hand calculations for both functions.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Train with `lam=0.0` and with `lam=1.0`. Which is steadier across seeds?
- Set `epsilon=10.0`, which switches the clip off, and keep `epochs=4`. Does training still improve steadily?
- Set `epochs=1`. How many more iterations does it need?
