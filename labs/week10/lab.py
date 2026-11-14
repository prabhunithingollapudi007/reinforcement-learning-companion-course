"""Week 10 lab: three ways to choose an arm.

Fill in the four functions below. Each is one or two lines of NumPy. The bandit
and the loop that plays it are in bandit.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np


def updated_average(average: float, count: float, reward: float) -> float:
    """The new running average of an arm after one more reward.

    `average` is the mean of the `count` rewards seen so far. This is the
    incremental update from Week 2: new = old + (reward - old) / (count + 1).
    """
    raise NotImplementedError


def epsilon_greedy_arm(estimates: np.ndarray, epsilon: float, rng: np.random.Generator) -> int:
    """With probability epsilon (rng.random() < epsilon) a uniformly random arm
    (rng.integers(n_arms)); otherwise the arm with the highest estimate."""
    raise NotImplementedError


def ucb_scores(estimates: np.ndarray, counts: np.ndarray, t: int) -> np.ndarray:
    """The upper confidence bound of every arm at time t:

        estimate + sqrt(2 * ln(t) / count)

    Every arm has been pulled at least once when this is called.
    """
    raise NotImplementedError


def thompson_arm(wins: np.ndarray, losses: np.ndarray, rng: np.random.Generator) -> int:
    """Thompson sampling with a Beta(1, 1) prior on every arm.

    Draw one sample per arm from Beta(1 + wins, 1 + losses) with rng.beta,
    and return the arm with the highest sample.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from bandit import average_regret

    me = sys.modules[__name__]
    for strategy in ("epsilon", "ucb", "thompson"):
        curve = average_regret(me, strategy)
        print(f"{strategy:9s} regret after 500 pulls {curve[499]:6.1f}, after 2000 pulls {curve[-1]:6.1f}")
