"""The gridworld from the Week 1 playground, as a tabular MDP.

The model is exposed as two arrays so the algorithms can be written in NumPy:

    P[s, a, s2]  probability of landing in s2 after taking action a in state s
    R[s, a]      expected immediate reward for taking action a in state s

Goal, pit and wall cells are absorbing with zero reward, so their value is 0.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

# up, right, down, left
ACTIONS = [(-1, 0), (0, 1), (1, 0), (0, -1)]
ACTION_NAMES = ["up", "right", "down", "left"]
ARROWS = ["^", ">", "v", "<"]

DEFAULT_LAYOUT = [
    "......",
    ".#.#.G",
    "......",
    "SPPPP.",
]


@dataclass
class Gridworld:
    layout: list[str]
    gamma: float
    P: np.ndarray  # (S, A, S)
    R: np.ndarray  # (S, A)
    start: int

    @property
    def n_states(self) -> int:
        return self.P.shape[0]

    @property
    def n_actions(self) -> int:
        return self.P.shape[1]

    @property
    def shape(self) -> tuple[int, int]:
        return len(self.layout), len(self.layout[0])

    def cell(self, s: int) -> str:
        cols = self.shape[1]
        return self.layout[s // cols][s % cols]

    def is_decision_state(self, s: int) -> bool:
        """True where the agent actually chooses: not a wall, goal or pit."""
        return self.cell(s) in ".S"

    def render(self, V: np.ndarray, policy: np.ndarray | None = None) -> str:
        """A text picture of values (and arrows, if a policy is given)."""
        rows, cols = self.shape
        lines = []
        for r in range(rows):
            parts = []
            for c in range(cols):
                s = r * cols + c
                ch = self.cell(s)
                if ch == "#":
                    parts.append("  ####  ")
                elif ch == "G":
                    parts.append("  GOAL  ")
                elif ch == "P":
                    parts.append("  PIT   ")
                else:
                    arrow = ARROWS[int(policy[s])] if policy is not None else " "
                    parts.append(f" {arrow}{V[s]:6.3f}")
            lines.append("".join(parts))
        return "\n".join(lines)


def make_gridworld(
    layout: list[str] | None = None,
    gamma: float = 0.9,
    slip: float = 0.2,
    step_reward: float = 0.0,
    goal_reward: float = 1.0,
    pit_reward: float = -1.0,
) -> Gridworld:
    """Build the MDP. With probability `slip` a move goes sideways (half each side)."""
    layout = layout or DEFAULT_LAYOUT
    rows, cols = len(layout), len(layout[0])
    n = rows * cols
    P = np.zeros((n, 4, n))
    R = np.zeros((n, 4))
    start = 0

    def move(s: int, a: int) -> int:
        r, c = s // cols + ACTIONS[a][0], s % cols + ACTIONS[a][1]
        if not (0 <= r < rows and 0 <= c < cols) or layout[r][c] == "#":
            return s
        return r * cols + c

    def arrival_reward(s2: int) -> float:
        ch = layout[s2 // cols][s2 % cols]
        return step_reward + (goal_reward if ch == "G" else pit_reward if ch == "P" else 0.0)

    for s in range(n):
        ch = layout[s // cols][s % cols]
        if ch == "S":
            start = s
        if ch in "#GP":
            P[s, :, s] = 1.0  # absorbing, no reward
            continue
        for a in range(4):
            for a2, prob in ((a, 1 - slip), ((a + 1) % 4, slip / 2), ((a + 3) % 4, slip / 2)):
                s2 = move(s, a2)
                P[s, a, s2] += prob
                R[s, a] += prob * arrival_reward(s2)

    return Gridworld(layout=layout, gamma=gamma, P=P, R=R, start=start)
