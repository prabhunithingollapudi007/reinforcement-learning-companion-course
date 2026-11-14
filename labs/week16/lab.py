"""Week 16 lab: crossing the gap from simulation, and improving a pretrained policy.

Fill in the six short functions below. The puck, the floors and the loops that
call your functions are in world.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np

from world import G, TARGET


# ---- Part 1: the simulator has the friction wrong ----


def slide_distance(speed, friction):
    """How far a puck launched at `speed` slides before friction stops it:

        distance = speed ** 2 / (2 * friction * G)

    Works on numbers or arrays.
    """
    raise NotImplementedError


def speed_for(friction: float) -> float:
    """The launch speed that stops the puck exactly on TARGET, for one known friction.

    Solve slide_distance(speed, friction) = TARGET for speed.
    """
    raise NotImplementedError


def robust_speed(frictions: np.ndarray) -> float:
    """One launch speed for a whole range of frictions: domain randomisation.

    Choose the speed with the smallest average SQUARED miss over the given frictions.
    Writing s = speed ** 2 / (2 * G), the miss on friction f is s / f - TARGET, and
    setting the derivative of the average squared miss to zero gives

        s = TARGET * mean(1 / f) / mean(1 / f ** 2)

    Return the speed, not s.
    """
    raise NotImplementedError


def estimate_friction(nudge_speed: float, measured_distance: float) -> float:
    """Adapting: work out the friction from how far a test nudge slid.

    Solve slide_distance(nudge_speed, friction) = measured_distance for friction.
    """
    raise NotImplementedError


# ---- Part 2: improving a pretrained policy from its own attempts ----


def imitate_successes(shares: np.ndarray, success: np.ndarray) -> np.ndarray:
    """Retrain on every attempt that succeeded.

    shares[a] is how often the policy uses option a; success[a] is how often
    option a works. Among the successful attempts, option a appears in proportion
    to shares[a] * success[a]. Return those proportions, normalised to sum to 1.
    """
    raise NotImplementedError


def imitate_better_than_average(shares: np.ndarray, success: np.ndarray) -> np.ndarray:
    """Retrain only on attempts that used a better-than-average option.

    The policy's average is shares @ success. Keep the options whose success rate
    is strictly above it, in their current proportions, and drop the rest.
    If no option is above the average (the policy already uses a single option),
    return shares unchanged.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from world import improve, miss, run_adaptive

    me = sys.modules[__name__]
    nominal = speed_for(0.4)
    robust = robust_speed(np.linspace(0.2, 0.6, 41))
    print("real friction   tuned for 0.40   tuned for 0.20-0.60   nudge first")
    for f in (0.2, 0.3, 0.4, 0.6):
        print(f"    {f:.2f}          {miss(me, nominal, f):+.2f} m           {miss(me, robust, f):+.2f} m            {run_adaptive(me, f) - TARGET:+.2f} m")
    print("success rate, imitating successes:          ", " ".join(f"{v:.3f}" for v in improve(me, "successes")))
    print("success rate, imitating better than average:", " ".join(f"{v:.3f}" for v in improve(me, "advantage")))
