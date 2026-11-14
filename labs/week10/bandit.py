"""Provided code for the Week 10 lab: the bandit and the loop that runs a strategy on it.

You do not need to change this file. Read `run` to see where each of your
functions from lab.py is used.
"""

from __future__ import annotations

import numpy as np

MEANS = np.array([0.7, 0.5, 0.3])  # the payout rate of each arm; the agent never sees these


def run(impl, strategy: str, steps: int = 2000, epsilon: float = 0.1, seed: int = 0, means: np.ndarray = MEANS) -> np.ndarray:
    """Play one bandit for `steps` pulls. Returns the total regret after every pull.

    strategy is "epsilon", "ucb" or "thompson".
    """
    rng = np.random.default_rng(seed)
    n_arms = len(means)
    estimates = np.zeros(n_arms)  # average reward seen from each arm
    counts = np.zeros(n_arms)  # times each arm has been pulled
    wins = np.zeros(n_arms)  # times each arm paid out
    regret = np.zeros(steps)
    total = 0.0
    for t in range(steps):
        if strategy == "thompson":
            arm = impl.thompson_arm(wins, counts - wins, rng)
        elif t < n_arms:
            arm = t  # epsilon-greedy and UCB try every arm once first
        elif strategy == "ucb":
            arm = int(np.argmax(impl.ucb_scores(estimates, counts, t)))
        else:
            arm = impl.epsilon_greedy_arm(estimates, epsilon, rng)

        reward = float(rng.random() < means[arm])
        estimates[arm] = impl.updated_average(estimates[arm], counts[arm], reward)
        counts[arm] += 1
        wins[arm] += reward

        total += means.max() - means[arm]
        regret[t] = total
    return regret


def average_regret(impl, strategy: str, steps: int = 2000, runs: int = 20, **kwargs) -> np.ndarray:
    """The regret curve averaged over several independent runs."""
    return np.mean([run(impl, strategy, steps=steps, seed=seed, **kwargs) for seed in range(runs)], axis=0)
