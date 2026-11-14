"""Provided code for the Week 13 lab: a grid, and a goal-reaching agent that learns on it.

You do not need to change this file. Read `train` to see where each of your
functions from lab.py is used.

Cells are numbered row by row from 0. Each episode the agent starts in a random
cell and is told a random goal cell. It is paid 1 on the step that reaches the
goal, and nothing otherwise.

Q has shape (n_cells, n_cells, 4): Q[cell, goal, action].
"""

from __future__ import annotations

import numpy as np

MOVES = [(0, -1), (1, 0), (0, 1), (-1, 0)]  # up, right, down, left
GAMMA = 0.9
ALPHA = 0.5
EPSILON = 0.2


def move(size: int, cell: int, action: int) -> int:
    """The cell reached by taking `action` from `cell`. Walls block."""
    x = min(size - 1, max(0, cell % size + MOVES[action][0]))
    y = min(size - 1, max(0, cell // size + MOVES[action][1]))
    return y * size + x


def greedy(Q: np.ndarray, cell: int, goal: int, rng) -> int:
    """The best-looking action, with ties broken at random."""
    values = Q[cell, goal]
    return int(rng.choice(np.flatnonzero(values >= values.max() - 1e-9)))


def random_pair(size: int, rng) -> tuple[int, int]:
    """A random start cell and a different random goal cell."""
    n = size * size
    start = int(rng.integers(n))
    goal = int(rng.integers(n - 1))
    return start, goal + (goal >= start)


def run_episode(Q: np.ndarray, size: int, rng):
    """Act epsilon-greedily for at most 2 * size steps. Returns (states, actions, goal).

    states has one more entry than actions: it includes the start cell.
    """
    start, goal = random_pair(size, rng)
    states, actions, s = [start], [], start
    for _ in range(2 * size):
        if s == goal:
            break
        a = int(rng.integers(4)) if rng.random() < EPSILON else greedy(Q, s, goal, rng)
        s = move(size, s, a)
        states.append(s)
        actions.append(a)
    return states, actions, goal


def success_rate(Q: np.ndarray, size: int, pairs: int = 300, seed: int = 99) -> float:
    """Share of random start-goal pairs the greedy policy solves in time."""
    rng = np.random.default_rng(seed)
    solved = 0
    for _ in range(pairs):
        s, goal = random_pair(size, rng)
        for _ in range(2 * size):
            if s == goal:
                break
            s = move(size, s, greedy(Q, s, goal, rng))
        solved += s == goal
    return solved / pairs


def train(impl, size: int = 6, episodes: int = 200, hindsight: int = 4, seed: int = 0) -> np.ndarray:
    """Goal-conditioned Q-learning. `hindsight` is the number of extra goals per step; 0 turns it off."""
    rng = np.random.default_rng(seed)
    n = size * size
    Q = np.zeros((n, n, 4))
    for _ in range(episodes):
        states, actions, goal = run_episode(Q, size, rng)
        impl.replay_episode(Q, states, actions, goal, hindsight, ALPHA, GAMMA, rng)
    return Q
