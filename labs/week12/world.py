"""Provided code for the Week 12 lab: a decision tree to search, and a cart to steer.

You do not need to change this file. Read `run_uct` and `run_mpc` to see where
each of your functions from lab.py is used.
"""

from __future__ import annotations

import numpy as np

# ---------------------------------------------------------------------------
# Part 1. The decision tree from the lesson: four choices, three options each.
# ---------------------------------------------------------------------------

BRANCH, DEPTH, NOISE = 3, 4, 0.2


def leaf_value(path) -> float:
    """The true average payoff of an outcome. Option 0 first is best, if followed up well."""
    if path[0] == 1:
        return 0.5
    if path[0] == 2:
        return 0.3
    if path[1] != 1:
        return 0.2
    if path[2] != 2:
        return 0.45
    return 1.0 if path[3] == 0 else 0.8


def run_uct(impl, simulations: int = 500, c: float = 0.5, seed: int = 0) -> np.ndarray:
    """Monte Carlo tree search. Returns how often each first choice was visited."""
    rng = np.random.default_rng(seed)
    visits: dict[tuple, int] = {(): 0}
    totals: dict[tuple, float] = {(): 0.0}
    for _ in range(simulations):
        path: tuple = ()
        # Select: walk down while every child of the current node is already in the tree.
        while len(path) < DEPTH:
            children = [path + (a,) for a in range(BRANCH)]
            untried = [child for child in children if child not in visits]
            if untried:
                # Expand: add one new node.
                path = untried[rng.integers(len(untried))]
                visits[path], totals[path] = 0, 0.0
                break
            scores = impl.uct_scores(
                np.array([totals[child] for child in children]),
                np.array([visits[child] for child in children]),
                visits[path],
                c,
            )
            path = children[int(np.argmax(scores))]
        # Simulate: finish the remaining choices at random.
        full = list(path) + [int(rng.integers(BRANCH)) for _ in range(DEPTH - len(path))]
        outcome = leaf_value(full) + NOISE * rng.normal()
        # Back up: every node on the path learns from the outcome.
        for depth in range(len(path) + 1):
            visits[path[:depth]] += 1
            totals[path[:depth]] += outcome
    return np.array([visits.get((a,), 0) for a in range(BRANCH)])


def run_flat(simulations: int = 500, seed: int = 0) -> np.ndarray:
    """Simple Monte Carlo search: the average result of each first choice under random play."""
    rng = np.random.default_rng(seed)
    totals, counts = np.zeros(BRANCH), np.zeros(BRANCH)
    for k in range(simulations):
        a = k % BRANCH
        full = [a] + [int(rng.integers(BRANCH)) for _ in range(DEPTH - 1)]
        totals[a] += leaf_value(full) + NOISE * rng.normal()
        counts[a] += 1
    return totals / np.maximum(counts, 1)


# ---------------------------------------------------------------------------
# Part 2. A cart on a track. The state is (position, velocity), the action is a
# push between -1 and 1. The aim is to bring the cart to rest at position 0.
# The agent is NOT told the equations below. It has to learn them from data.
# ---------------------------------------------------------------------------

_A_TRUE = np.array([[1.0, 0.1], [0.0, 0.9]])
_B_TRUE = np.array([0.0, 0.2])
START = np.array([1.0, 0.0])


def real_step(state: np.ndarray, action: float, rng=None) -> np.ndarray:
    """The real world. A little noise is added if a random generator is passed in."""
    nxt = _A_TRUE @ state + _B_TRUE * float(np.clip(action, -1, 1))
    if rng is not None:
        nxt = nxt + 0.002 * rng.normal(size=2)
    return nxt


def reward(states: np.ndarray, actions: np.ndarray) -> np.ndarray:
    """Reward for being in `states` and taking `actions`. Works on one state or a batch.

    states has shape (..., 2) and actions has shape (...). Being far from 0, moving
    fast and pushing hard all cost a little.
    """
    states, actions = np.asarray(states), np.asarray(actions)
    return -(states[..., 0] ** 2 + 0.1 * states[..., 1] ** 2 + 0.01 * actions**2)


def collect_random_data(n: int = 200, seed: int = 0):
    """Push the cart around at random. Returns (states, actions, next_states)."""
    rng = np.random.default_rng(seed)
    states, actions, next_states = [], [], []
    s = START.copy()
    for t in range(n):
        if t % 20 == 0:
            s = rng.uniform(-1.5, 1.5, size=2)
        a = float(rng.uniform(-1, 1))
        s2 = real_step(s, a, rng)
        states.append(s)
        actions.append(a)
        next_states.append(s2)
        s = s2
    return np.array(states), np.array(actions), np.array(next_states)


def run_mpc(impl, steps: int = 60, horizon: int = 15, n_candidates: int = 300, seed: int = 0):
    """Learn a model from random data, then steer by planning. Returns (positions, total_reward)."""
    rng = np.random.default_rng(seed)
    # 1. Learn the model from 200 random transitions.
    A, B = impl.fit_linear_model(*collect_random_data(200, seed))
    # 2. Model predictive control: plan, take one real step, plan again.
    s, total, positions = START.copy(), 0.0, [float(START[0])]
    for _ in range(steps):
        a = float(impl.plan(A, B, s, horizon, n_candidates, rng))
        total += float(reward(s, a))
        s = real_step(s, a, rng)
        positions.append(float(s[0]))
    return np.array(positions), total


def run_random(steps: int = 60, seed: int = 0):
    """The same cart pushed at random, for comparison."""
    rng = np.random.default_rng(seed)
    s, total, positions = START.copy(), 0.0, [float(START[0])]
    for _ in range(steps):
        a = float(rng.uniform(-1, 1))
        total += float(reward(s, a))
        s = real_step(s, a, rng)
        positions.append(float(s[0]))
    return np.array(positions), total
