"""Provided code for the Week 16 lab: a puck on a floor of unknown friction, and a pretrained grasping policy.

You do not need to change this file. Read the functions below to see where each
of your functions from lab.py is used.

Part 1. A robot shoves a puck so that it slides and stops on a line 1 m away.
The policy is one number: the launch speed. The simulator's friction may be wrong.

Part 2. A pretrained policy has four ways of grasping an object, each with a
success rate it does not know.
"""

from __future__ import annotations

import numpy as np

G = 10.0
TARGET = 1.0  # metres


def miss(impl, speed: float, friction) -> np.ndarray:
    """How far from the target the puck stops, in metres (positive = too far)."""
    return impl.slide_distance(speed, np.asarray(friction, dtype=float)) - TARGET


def real_floors() -> np.ndarray:
    """The frictions the real robot might meet."""
    return np.linspace(0.2, 0.8, 31)


def run_adaptive(impl, friction: float, measurement_error: float = 0.05, nudge_speed: float = 1.0) -> float:
    """Nudge the puck, measure the slide (imperfectly), estimate the friction, then make the real shove.

    Returns where the puck stops.
    """
    measured = impl.slide_distance(nudge_speed, friction) * (1 + measurement_error)
    estimate = impl.estimate_friction(nudge_speed, measured)
    return float(impl.slide_distance(impl.speed_for(estimate), friction))


# ---------------------------------------------------------------------------

STRATEGIES = ["careful grasp from above", "quick grasp from above", "grasp from the side", "push, then grasp"]
SUCCESS = np.array([0.99, 0.85, 0.70, 0.30])
START = np.array([0.30, 0.40, 0.20, 0.10])  # how often the pretrained policy uses each


def improve(impl, rule: str, rounds: int = 8) -> list[float]:
    """Repeat an improvement rule. Returns the policy's success rate before each round and after the last."""
    shares = START.copy()
    history = [float(shares @ SUCCESS)]
    for _ in range(rounds):
        shares = impl.imitate_successes(shares, SUCCESS) if rule == "successes" else impl.imitate_better_than_average(shares, SUCCESS)
        history.append(float(shares @ SUCCESS))
    return history
