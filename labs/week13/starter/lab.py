"""Week 13 lab: hindsight relabelling.

Fill in the three functions below. The grid and the training loop that calls
your functions are in grid.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np


def q_target(Q: np.ndarray, next_state: int, goal: int, gamma: float) -> float:
    """The learning target for one step taken while pursuing `goal`.

        1                                          if the step arrived at the goal
        gamma * max over a of Q[next_state, goal]  otherwise

    Reaching the goal ends the episode, so there is nothing to add after the 1.
    """
    raise NotImplementedError


def hindsight_goals(states: list[int], t: int, k: int, rng: np.random.Generator) -> list[int]:
    """Pick k goals for relabelling step t: cells the episode reached AFTER step t.

    states[t] is where step t started and states[t + 1] is where it ended, so the
    candidates are states[t + 1:]. Draw k of them with replacement using
    rng.integers. Return a list of k cell numbers.
    """
    raise NotImplementedError


def replay_episode(Q: np.ndarray, states: list[int], actions: list[int], goal: int, k: int, alpha: float, gamma: float, rng: np.random.Generator) -> None:
    """Learn from one episode, changing Q in place.

    Go through the steps from the LAST to the first. For step t, with
    s = states[t], a = actions[t], s2 = states[t + 1]:

      1. Update for the goal the agent was given:
             Q[s, goal, a] += alpha * (q_target(Q, s2, goal, gamma) - Q[s, goal, a])
      2. If k > 0: for each g in hindsight_goals(states, t, k, rng), make the same
         update with g in place of goal. Skip any g equal to s (the agent was
         already there, so there is nothing to learn).

    Going backwards means the end of the episode is already learned when the
    earlier steps are replayed, so one pass carries the value all the way back.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from grid import success_rate, train

    me = sys.modules[__name__]
    for episodes in (50, 200, 800):
        plain = success_rate(train(me, episodes=episodes, hindsight=0), 6)
        hind = success_rate(train(me, episodes=episodes, hindsight=4), 6)
        print(f"{episodes:4d} episodes: given goal only {plain:.0%}   with hindsight {hind:.0%}")
