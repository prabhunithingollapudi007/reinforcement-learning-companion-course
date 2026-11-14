# Week 3 lab: SARSA and Q-learning on the cliff

Implement epsilon-greedy action selection and the two TD control updates, then
train both on the cliff world and confirm what the Week 3 playground shows:
Q-learning learns the shortest route along the edge, SARSA a longer and safer one,
and SARSA collects more reward while both are still exploring.

The easiest way to do this lab is on the Week 3 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the four functions, in order:

1. `epsilon_greedy`: random with probability epsilon, otherwise greedy.
2. `sarsa_update`: bootstrap from the next action actually taken.
3. `q_learning_update`: bootstrap from the best next action.
4. `train`: the episode loop that ties them together.

Then, from this folder:

    python -m pytest

`python lab.py` trains both and draws their routes as text.

## Files

- `cliff.py`: the environment (`reset`, `step`) and `greedy_route`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with the reasoning for each expected number.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Train with `epsilon=0.02`. Do the two methods still differ?
- Decay epsilon as `1 / episode_number`. What route does SARSA end up with?
- Implement double Q-learning with two tables and compare its value for the start state with plain Q-learning's.
