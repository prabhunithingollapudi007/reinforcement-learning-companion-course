"""Reference solution for the Week 10 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np


def updated_average(average: float, count: float, reward: float) -> float:
    return average + (reward - average) / (count + 1)


def epsilon_greedy_arm(estimates: np.ndarray, epsilon: float, rng: np.random.Generator) -> int:
    if rng.random() < epsilon:
        return int(rng.integers(len(estimates)))
    return int(np.argmax(estimates))


def ucb_scores(estimates: np.ndarray, counts: np.ndarray, t: int) -> np.ndarray:
    return estimates + np.sqrt(2 * np.log(t) / counts)


def thompson_arm(wins: np.ndarray, losses: np.ndarray, rng: np.random.Generator) -> int:
    return int(np.argmax(rng.beta(1 + wins, 1 + losses)))


if __name__ == "__main__":
    import sys

    from bandit import average_regret

    me = sys.modules[__name__]
    for strategy in ("epsilon", "ucb", "thompson"):
        curve = average_regret(me, strategy)
        print(f"{strategy:9s} regret after 500 pulls {curve[499]:6.1f}, after 2000 pulls {curve[-1]:6.1f}")
