"""Week 14 lab: learning with skills.

Fill in the three functions below. The four-rooms world and the learning loop
that calls your functions are in rooms.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np

from rooms import move


def success_with_retries(p: float, steps: int, pieces: int, retries: int) -> float:
    """Chance of finishing a long task that is cut into equal pieces, each of which may be retried.

    Each step goes right with probability p, and a piece succeeds only if all of
    its steps/pieces steps go right. A failed piece can be attempted again, up to
    `retries` more times. The task succeeds if every piece eventually succeeds.

        one piece, one try:        q = p ** (steps / pieces)
        one piece, with retries:   1 - (1 - q) ** (retries + 1)
        the whole task:            that, to the power pieces
    """
    raise NotImplementedError


def follow_skill(cell: int, first_move: np.ndarray, target: int, goal: int, gamma: float):
    """Run the skill "walk to `target`" from `cell`. Returns (cell, steps, reward, reached_goal).

    first_move[c] is the move to make in cell c; move(c, a) from rooms.py gives the
    next cell. Keep stepping until you stand on `target`.

    The task's goal pays 1 and ends everything. If a step lands on `goal`, stop at
    once and return reached_goal=True, with reward gamma ** (steps - 1): the 1 is
    discounted by the steps taken before it inside the skill. Otherwise the
    reward is 0.0 and reached_goal is False.

    You may assume cell != target when this is called.
    """
    raise NotImplementedError


def smdp_target(reward: float, steps: int, next_values: np.ndarray, gamma: float, done: bool) -> float:
    """The Q-learning target for a choice that took `steps` steps.

        reward                                        if the episode ended (done)
        reward + gamma ** steps * max(next_values)    otherwise

    reward is already discounted inside the skill. next_values holds the Q-values
    of every choice in the state where the skill ended.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from rooms import train

    me = sys.modules[__name__]
    print(f"99% per step, 200 steps, one attempt:      {success_with_retries(0.99, 200, 1, 0):.1%}")
    print(f"the same in 10 pieces with 2 retries each: {success_with_retries(0.99, 200, 10, 2):.1%}")
    for kind in ("flat", "subgoals"):
        lengths = train(me, kind)
        print(f"{kind:9s} first episode {lengths[0]:5d} steps, tenth {lengths[9]:4d}, total over 30 episodes {sum(lengths)}")
