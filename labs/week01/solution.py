"""Reference solution for the Week 1 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np

from gridworld import Gridworld


def q_from_v(mdp: Gridworld, V: np.ndarray) -> np.ndarray:
    return mdp.R + mdp.gamma * mdp.P @ V


def policy_evaluation(mdp: Gridworld, policy: np.ndarray, tol: float = 1e-10) -> np.ndarray:
    states = np.arange(mdp.n_states)
    V = np.zeros(mdp.n_states)
    while True:
        V_new = q_from_v(mdp, V)[states, policy]
        if np.max(np.abs(V_new - V)) < tol:
            return V_new
        V = V_new


def policy_improvement(mdp: Gridworld, V: np.ndarray) -> np.ndarray:
    return np.argmax(q_from_v(mdp, V), axis=1)


def policy_iteration(mdp: Gridworld) -> tuple[np.ndarray, np.ndarray, int]:
    states = np.arange(mdp.n_states)
    policy = np.full(mdp.n_states, 3)
    rounds = 0
    while True:
        V = policy_evaluation(mdp, policy, tol=1e-12)
        rounds += 1
        Q = q_from_v(mdp, V)
        best = np.argmax(Q, axis=1)
        # Switch only where the best action is strictly better than the current one.
        better = Q[states, best] > Q[states, policy] + 1e-9
        new_policy = np.where(better, best, policy)
        if np.array_equal(new_policy, policy):
            return policy, V, rounds
        policy = new_policy


def value_iteration(mdp: Gridworld, tol: float = 1e-10) -> tuple[np.ndarray, int]:
    V = np.zeros(mdp.n_states)
    sweeps = 0
    while True:
        V_new = q_from_v(mdp, V).max(axis=1)
        sweeps += 1
        if np.max(np.abs(V_new - V)) < tol:
            return V_new, sweeps
        V = V_new


if __name__ == "__main__":
    from gridworld import make_gridworld

    world = make_gridworld()
    V, sweeps = value_iteration(world)
    print(f"value iteration: {sweeps} sweeps")
    print(world.render(V, policy_improvement(world, V)))
    _, _, rounds = policy_iteration(world)
    print(f"policy iteration: {rounds} rounds")
