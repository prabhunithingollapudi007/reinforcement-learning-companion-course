"""Reference solution for the Week 13 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np


def q_target(Q: np.ndarray, next_state: int, goal: int, gamma: float) -> float:
    if next_state == goal:
        return 1.0
    return float(gamma * Q[next_state, goal].max())


def hindsight_goals(states: list[int], t: int, k: int, rng: np.random.Generator) -> list[int]:
    later = states[t + 1 :]
    return [int(later[i]) for i in rng.integers(len(later), size=k)]


def replay_episode(Q: np.ndarray, states: list[int], actions: list[int], goal: int, k: int, alpha: float, gamma: float, rng: np.random.Generator) -> None:
    for t in reversed(range(len(actions))):
        s, a, s2 = states[t], actions[t], states[t + 1]
        # What was asked for.
        Q[s, goal, a] += alpha * (q_target(Q, s2, goal, gamma) - Q[s, goal, a])
        # Hindsight: the same step, as if a cell reached later had been the goal.
        if k > 0:
            for g in hindsight_goals(states, t, k, rng):
                if g != s:
                    Q[s, g, a] += alpha * (q_target(Q, s2, g, gamma) - Q[s, g, a])


if __name__ == "__main__":
    import sys

    from grid import success_rate, train

    me = sys.modules[__name__]
    for episodes in (50, 200, 800):
        plain = success_rate(train(me, episodes=episodes, hindsight=0), 6)
        hind = success_rate(train(me, episodes=episodes, hindsight=4), 6)
        print(f"{episodes:4d} episodes: given goal only {plain:.0%}   with hindsight {hind:.0%}")
