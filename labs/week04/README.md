# Week 4 lab: the pieces of DQN

Implement the three parts of DQN that are specific to it, in PyTorch: the replay
buffer, epsilon-greedy action selection on a network, and the loss with a target
network. The network and the training loop are provided in `agent.py`.

The easiest way to do this lab is on the Week 4 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).
This lab needs PyTorch and Gymnasium, which are in `labs/requirements.txt`.

## What to do

Open `lab.py` and fill in, in order:

1. `ReplayBuffer`: `push`, `sample` and `__len__`.
2. `select_action`: epsilon-greedy on the network's output.
3. `dqn_loss`: mean squared error against `r + gamma * max Q_target(s', a')`,
   with no future value after the episode ends and no gradient through the target.

Then, from this folder:

    python -m pytest

The last test trains on CartPole for 6000 steps, which takes about half a minute.
`python lab.py` runs the same training and prints how the episode length grew.

## Files

- `agent.py`: the Q-network and `train_dqn`, the loop that uses your pieces.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, including a hand-calculated loss.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Set `target_every=1` in `train_dqn` (no separate target network). Is training still stable?
- Shrink the buffer to 64 transitions, so each batch is nearly the most recent experience. What happens?
- Change the loss to Double DQN: choose the next action with `q_net`, value it with `target_net`.
