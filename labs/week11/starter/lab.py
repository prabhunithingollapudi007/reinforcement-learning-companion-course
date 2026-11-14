"""Week 11 lab: exploring on purpose.

Fill in the two functions below. The corridor and the agents that use your
functions are in corridor.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np


def exploration_bonus(counts: np.ndarray, beta: float) -> np.ndarray:
    """The bonus added to each state-action pair's estimated reward:

        beta / sqrt(count)   where the pair has been tried at least once
        0                    where it has never been tried

    Pairs that were never tried are handled separately in optimistic_q.
    counts has shape (n_states, n_actions); return the same shape.
    """
    raise NotImplementedError


def optimistic_q(reward_sum, next_state, counts, beta: float, gamma: float, v_max: float, iterations: int = 60) -> np.ndarray:
    """Value iteration on the learned model, with optimism. Returns Q, shape (n_states, n_actions).

    reward_sum[s, a]  total reward received from that pair so far
    next_state[s, a]  the state it led to (the world is deterministic)
    counts[s, a]      how many times it has been tried

    Start from Q = 0 and repeat `iterations` times, with V(s) = max over a of Q[s, a]:

        tried pair:    Q[s, a] = mean reward + bonus + gamma * V(next_state[s, a])
        untried pair:  Q[s, a] = v_max

    The mean reward is reward_sum / counts. Avoid dividing by zero for untried pairs.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from corridor import run_epsilon_greedy, run_optimistic

    for n in (6, 8, 12):
        optimistic, _ = run_optimistic(sys.modules[__name__], n)
        greedy, _ = run_epsilon_greedy(n)
        print(f"{n:2d} cells: bonus + planning reached the end in episode {optimistic}; epsilon-greedy in 300 episodes: {greedy}")
