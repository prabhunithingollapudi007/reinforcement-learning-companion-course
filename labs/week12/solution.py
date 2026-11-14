"""Reference solution for the Week 12 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np

from world import reward


def uct_scores(child_totals: np.ndarray, child_visits: np.ndarray, parent_visits: int, c: float) -> np.ndarray:
    return child_totals / child_visits + c * np.sqrt(np.log(parent_visits) / child_visits)


def fit_linear_model(states: np.ndarray, actions: np.ndarray, next_states: np.ndarray):
    X = np.column_stack([states, actions])  # (n, 3)
    W, *_ = np.linalg.lstsq(X, next_states, rcond=None)  # (3, 2): X @ W is close to next_states
    return W[:2].T, W[2]


def imagined_returns(A: np.ndarray, B: np.ndarray, state: np.ndarray, action_sequences: np.ndarray) -> np.ndarray:
    n, horizon = action_sequences.shape
    states = np.tile(state, (n, 1))  # every plan starts from the same real state
    total = np.zeros(n)
    for t in range(horizon):
        actions = action_sequences[:, t]
        total += reward(states, actions)
        states = states @ A.T + actions[:, None] * B
    return total


def plan(A: np.ndarray, B: np.ndarray, state: np.ndarray, horizon: int, n_candidates: int, rng: np.random.Generator) -> float:
    candidates = rng.uniform(-1, 1, size=(n_candidates, horizon))
    returns = imagined_returns(A, B, state, candidates)
    return float(candidates[np.argmax(returns), 0])


if __name__ == "__main__":
    import sys

    from world import run_flat, run_mpc, run_random, run_uct

    me = sys.modules[__name__]
    print("Tree search, visits under each first choice:", run_uct(me))
    print("Flat Monte Carlo estimates of each first choice:", np.round(run_flat(), 2))
    positions, total = run_mpc(me)
    print(f"Planning with a learned model: cart ends at {positions[-1]:+.3f}, total reward {total:.2f}")
    positions, total = run_random()
    print(f"Random pushes:                 cart ends at {positions[-1]:+.3f}, total reward {total:.2f}")
