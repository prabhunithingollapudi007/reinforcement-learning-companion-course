"""Week 2 lab: estimating values from experience.

Fill in the four functions below. No model is available here: only episodes.

An episode is a list of (state, reward, next_state) steps, in order.
next_state is None on the step that ends the episode, and a finished
episode is worth nothing afterwards.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np


def returns(rewards: list[float], gamma: float) -> list[float]:
    """The return G_t from every step: G_t = r_t + gamma * G_{t+1}.

    Work backwards from the last reward.
    """
    raise NotImplementedError


def monte_carlo(episodes, n_states: int, gamma: float, first_visit: bool = True) -> np.ndarray:
    """Average the returns that followed each state.

    first_visit=True: only the first time a state appears in an episode counts.
    first_visit=False: every appearance counts.
    States that never appear get the value 0.
    """
    raise NotImplementedError


def td0(episodes, n_states: int, gamma: float, alpha: float) -> np.ndarray:
    """One pass of TD(0) through the episodes, in order, starting from V = 0.

    After every step: V[s] += alpha * (r + gamma * V[s_next] - V[s]),
    with V[s_next] taken as 0 when the episode has ended.
    """
    raise NotImplementedError


def certainty_equivalence(episodes, n_states: int, gamma: float) -> np.ndarray:
    """Fit the maximum-likelihood model, then evaluate it exactly.

    Count how often each state led to each next state and what reward it paid,
    turn the counts into P_hat (S x S) and R_hat (S), and solve
    V = R_hat + gamma * P_hat @ V.  States that never appear get the value 0.
    """
    raise NotImplementedError


if __name__ == "__main__":
    from gridworld import exact_values, make_gridworld, optimal_policy, sample_episodes

    world = make_gridworld()
    policy = optimal_policy(world)
    episodes = sample_episodes(world, policy, 2000, seed=0)
    truth = exact_values(world, policy)
    for name, V in [
        ("exact (from the model)", truth),
        ("Monte Carlo", monte_carlo(episodes, world.n_states, world.gamma)),
        ("TD(0), alpha 0.05", td0(episodes, world.n_states, world.gamma, 0.05)),
        ("certainty equivalence", certainty_equivalence(episodes, world.n_states, world.gamma)),
    ]:
        print(f"\n{name}  (value at start {V[world.start]:.3f})")
        print(world.render(V, policy))
