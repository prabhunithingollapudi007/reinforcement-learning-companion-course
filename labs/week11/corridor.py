"""Provided code for the Week 11 lab: the corridor and two agents that explore it.

You do not need to change this file. Read `run_optimistic` to see where each
of your functions from lab.py is used.

The corridor has n cells. The agent starts at the left end.
  action 0, retreat: go back to the start and receive 0.05
  action 1, advance: move one cell right and receive 0, except at the far end,
                     where advancing stays put and pays 1
"""

from __future__ import annotations

import numpy as np

RETREAT, ADVANCE = 0, 1
SMALL = 0.05
GAMMA = 0.9
V_MAX = 1 / (1 - GAMMA)  # the most any state could possibly be worth


def step(n: int, s: int, a: int) -> tuple[int, float]:
    """Returns (next_state, reward)."""
    if a == RETREAT:
        return 0, SMALL
    if s == n - 1:
        return s, 1.0
    return s + 1, 0.0


def horizon(n: int) -> int:
    return n - 1 + 5


def run_optimistic(impl, n: int = 8, episodes: int = 60, beta: float = 0.5):
    """Explore with a count-based bonus and planning. Returns (first_success, returns).

    first_success is the first episode (counting from 1) in which the far reward
    was collected, or None. returns is the total reward of each episode.
    """
    counts = np.zeros((n, 2))
    reward_sum = np.zeros((n, 2))
    next_state = np.zeros((n, 2), dtype=int)  # the world is deterministic: remember where each pair led
    first_success, returns = None, []
    for episode in range(1, episodes + 1):
        # Plan once per episode on the model so far, with bonuses.
        Q = impl.optimistic_q(reward_sum, next_state, counts, beta, GAMMA, V_MAX)
        s, total = 0, 0.0
        for _ in range(horizon(n)):
            a = int(np.argmax(Q[s]))
            s2, r = step(n, s, a)
            counts[s, a] += 1
            reward_sum[s, a] += r
            next_state[s, a] = s2
            total += r
            if r == 1.0 and first_success is None:
                first_success = episode
            s = s2
        returns.append(total)
    return first_success, returns


def run_epsilon_greedy(n: int = 8, episodes: int = 300, epsilon: float = 0.1, alpha: float = 0.5, seed: int = 0):
    """Q-learning with epsilon-greedy exploration, for comparison. Same return values."""
    rng = np.random.default_rng(seed)
    Q = np.zeros((n, 2))
    first_success, returns = None, []
    for episode in range(1, episodes + 1):
        s, total = 0, 0.0
        for _ in range(horizon(n)):
            if rng.random() < epsilon or Q[s, 0] == Q[s, 1]:
                a = int(rng.integers(2))
            else:
                a = int(np.argmax(Q[s]))
            s2, r = step(n, s, a)
            Q[s, a] += alpha * (r + GAMMA * Q[s2].max() - Q[s, a])
            total += r
            if r == 1.0 and first_success is None:
                first_success = episode
            s = s2
        returns.append(total)
    return first_success, returns
