"""Week 3 lab: learning to act without a model.

Fill in the four functions below. Q is a NumPy array of shape (n_states, n_actions).

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np

from cliff import CliffWorld


def epsilon_greedy(Q: np.ndarray, s: int, epsilon: float, rng: np.random.Generator) -> int:
    """With probability epsilon return a uniformly random action,
    otherwise the action with the largest Q[s] (np.argmax).

    Draw the coin flip with rng.random() and the random action with
    rng.integers(n_actions).
    """
    raise NotImplementedError


def sarsa_update(Q, s, a, r, s_next, a_next, done, alpha, gamma) -> None:
    """Update Q[s, a] in place toward r + gamma * Q[s_next, a_next].

    If the episode is done, nothing follows: the target is just r.
    """
    raise NotImplementedError


def q_learning_update(Q, s, a, r, s_next, done, alpha, gamma) -> None:
    """Update Q[s, a] in place toward r + gamma * max over a' of Q[s_next, a'].

    If the episode is done, the target is just r.
    """
    raise NotImplementedError


def train(method: str, episodes: int, alpha: float = 0.5, epsilon: float = 0.1, gamma: float = 1.0, seed: int = 0):
    """Train on the cliff world and return (Q, rewards).

    method is "sarsa" or "q_learning". rewards is a list with the total reward
    of every episode. Start from Q = 0 and rng = np.random.default_rng(seed).

    Each episode: reset the environment and choose the first action epsilon-greedily.
    Then repeat: take the action, choose the next action epsilon-greedily from the
    new state, apply the update for the chosen method, and move on. Stop when done.
    """
    raise NotImplementedError


if __name__ == "__main__":
    from cliff import greedy_route, render_route

    for method in ("q_learning", "sarsa"):
        Q, rewards = train(method, 500)
        route = greedy_route(Q)
        steps = "no route" if route is None else f"{len(route) - 1} steps"
        print(f"\n{method}: greedy route {steps}, average reward over the last 100 episodes {np.mean(rewards[-100:]):.1f}")
        print(render_route(route))
