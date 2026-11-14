"""Reference solution for the Week 11 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np


def exploration_bonus(counts: np.ndarray, beta: float) -> np.ndarray:
    return np.where(counts > 0, beta / np.sqrt(np.maximum(counts, 1)), 0.0)


def optimistic_q(reward_sum, next_state, counts, beta: float, gamma: float, v_max: float, iterations: int = 60) -> np.ndarray:
    tried = counts > 0
    mean_reward = np.where(tried, reward_sum / np.maximum(counts, 1), 0.0)
    optimistic_reward = mean_reward + exploration_bonus(counts, beta)
    Q = np.zeros_like(reward_sum, dtype=float)
    for _ in range(iterations):
        V = Q.max(axis=1)
        # A pair that has been tried: its reward, its bonus, and the value of where it led.
        # A pair that has never been tried: as good as anything could be.
        Q = np.where(tried, optimistic_reward + gamma * V[next_state], v_max)
    return Q


if __name__ == "__main__":
    import sys

    from corridor import run_epsilon_greedy, run_optimistic

    for n in (6, 8, 12):
        optimistic, _ = run_optimistic(sys.modules[__name__], n)
        greedy, _ = run_epsilon_greedy(n)
        print(f"{n:2d} cells: bonus + planning reached the end in episode {optimistic}; epsilon-greedy in 300 episodes: {greedy}")
