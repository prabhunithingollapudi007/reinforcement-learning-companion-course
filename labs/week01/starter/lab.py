"""Week 1 lab: planning in a known MDP.

Fill in the five functions below. Each is a few lines of NumPy.
Run the tests from this folder with:

    python -m pytest

The model is `mdp.P` with shape (S, A, S), `mdp.R` with shape (S, A), and `mdp.gamma`.
A deterministic policy is an integer array of shape (S,) holding one action per state.
"""

from __future__ import annotations

import numpy as np

from gridworld import Gridworld


def q_from_v(mdp: Gridworld, V: np.ndarray) -> np.ndarray:
    """Q[s, a] = R[s, a] + gamma * sum_s2 P[s, a, s2] * V[s2].  Shape (S, A)."""
    raise NotImplementedError


def policy_evaluation(mdp: Gridworld, policy: np.ndarray, tol: float = 1e-10) -> np.ndarray:
    """V^pi, by repeating the Bellman backup for `policy` from V = 0
    until no value changes by more than `tol`."""
    raise NotImplementedError


def policy_improvement(mdp: Gridworld, V: np.ndarray) -> np.ndarray:
    """The greedy policy with respect to V: the best action in every state."""
    raise NotImplementedError


def policy_iteration(mdp: Gridworld) -> tuple[np.ndarray, np.ndarray, int]:
    """Alternate evaluation and improvement, starting from "always left" (action 3),
    until the policy stops changing.

    Returns (policy, V, rounds), where rounds counts the policies you evaluated.
    To avoid flipping between tied actions forever, keep the current action
    unless another one is better by more than 1e-9.
    """
    raise NotImplementedError


def value_iteration(mdp: Gridworld, tol: float = 1e-10) -> tuple[np.ndarray, int]:
    """Repeat the Bellman optimality backup from V = 0 until no value changes
    by more than `tol`.  Returns (V, sweeps)."""
    raise NotImplementedError


if __name__ == "__main__":
    from gridworld import make_gridworld

    world = make_gridworld()
    V, sweeps = value_iteration(world)
    print(f"value iteration: {sweeps} sweeps")
    print(world.render(V, policy_improvement(world, V)))
