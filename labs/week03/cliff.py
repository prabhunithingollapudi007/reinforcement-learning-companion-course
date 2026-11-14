"""The cliff world from the Week 3 playground.

A 4 x 10 grid. The agent starts bottom-left and wants to reach bottom-right.
Every step costs 1. The cells between start and goal are a cliff: stepping
onto one costs 100 and ends the episode.

There is no model to read here, only `reset()` and `step(action)`.
"""

from __future__ import annotations

import numpy as np

ROWS, COLS = 4, 10
# up, right, down, left
MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]
ARROWS = ["^", ">", "v", "<"]


class CliffWorld:
    n_states = ROWS * COLS
    n_actions = 4
    start = (ROWS - 1) * COLS
    goal = ROWS * COLS - 1

    def __init__(self) -> None:
        self.state = self.start

    @staticmethod
    def is_cliff(s: int) -> bool:
        return s // COLS == ROWS - 1 and 0 < s % COLS < COLS - 1

    def reset(self) -> int:
        self.state = self.start
        return self.state

    def step(self, action: int) -> tuple[int, float, bool]:
        """Take an action. Returns (next_state, reward, done)."""
        r = min(ROWS - 1, max(0, self.state // COLS + MOVES[action][0]))
        c = min(COLS - 1, max(0, self.state % COLS + MOVES[action][1]))
        self.state = r * COLS + c
        if self.is_cliff(self.state):
            return self.state, -100.0, True
        return self.state, -1.0, self.state == self.goal


def greedy_route(Q: np.ndarray) -> list[int] | None:
    """The states visited when always taking the best-looking action from the start.

    Returns None if that does not reach the goal (it loops or falls off).
    """
    env = CliffWorld()
    s = env.reset()
    route = [s]
    for _ in range(env.n_states):
        s, _, done = env.step(int(np.argmax(Q[s])))
        if s in route:
            return None
        route.append(s)
        if done:
            return route if s == env.goal else None
    return None


def render_route(route: list[int] | None) -> str:
    """A text picture of a route: * for visited cells, C for the cliff."""
    if route is None:
        return "(no route to the goal yet)"
    lines = []
    for r in range(ROWS):
        line = ""
        for c in range(COLS):
            s = r * COLS + c
            line += "S" if s == CliffWorld.start else "G" if s == CliffWorld.goal else "C" if CliffWorld.is_cliff(s) else "*" if s in route else "."
        lines.append(line)
    return "\n".join(lines)
