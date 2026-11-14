"""Reference solution for the Week 14 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np

from rooms import move


def success_with_retries(p: float, steps: int, pieces: int, retries: int) -> float:
    one_try = p ** (steps / pieces)
    one_piece = 1 - (1 - one_try) ** (retries + 1)
    return one_piece**pieces


def follow_skill(cell: int, first_move: np.ndarray, target: int, goal: int, gamma: float):
    steps = 0
    while cell != target:
        cell = move(cell, int(first_move[cell]))
        steps += 1
        if cell == goal:
            # The reward of 1 arrives on the last of `steps` steps inside the skill.
            return cell, steps, gamma ** (steps - 1), True
    return cell, steps, 0.0, False


def smdp_target(reward: float, steps: int, next_values: np.ndarray, gamma: float, done: bool) -> float:
    if done:
        return float(reward)
    return float(reward + gamma**steps * np.max(next_values))


if __name__ == "__main__":
    import sys

    from rooms import train

    me = sys.modules[__name__]
    print(f"99% per step, 200 steps, one attempt:      {success_with_retries(0.99, 200, 1, 0):.1%}")
    print(f"the same in 10 pieces with 2 retries each: {success_with_retries(0.99, 200, 10, 2):.1%}")
    for kind in ("flat", "subgoals"):
        lengths = train(me, kind)
        print(f"{kind:9s} first episode {lengths[0]:5d} steps, tenth {lengths[9]:4d}, total over 30 episodes {sum(lengths)}")
