# Week 5 lab: REINFORCE

Implement the three pieces of the policy gradient estimator in PyTorch: the
reward-to-go, the baseline, and the surrogate loss. The policy network and the
training loop are provided in `agent.py`.

The easiest way to do this lab is on the Week 5 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in, in order:

1. `rewards_to_go`: the discounted reward from each step to the end.
2. `standardize`: subtract the mean and divide by the standard deviation.
3. `policy_loss`: minus the average of log-probability times weight.

Then, from this folder:

    python -m pytest

The last test trains on CartPole, which takes about half a minute.
`python lab.py` runs the same training and prints how the episode length grew.

## Files

- `agent.py`: the policy network, `run_episode` and `train_reinforce`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, including a hand-calculated loss.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Call `train_reinforce(..., use_baseline=False)` over several seeds. How much do the runs differ from each other?
- Use the whole episode's return for every step instead of the reward-to-go. Does it still learn?
- Collect 2 episodes per iteration instead of 10. What happens to the learning curve?
