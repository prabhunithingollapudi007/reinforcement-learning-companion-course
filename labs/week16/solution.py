"""Reference solution for the Week 16 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np

from world import G, TARGET


def slide_distance(speed, friction):
    return speed**2 / (2 * friction * G)


def speed_for(friction: float) -> float:
    return float(np.sqrt(2 * friction * G * TARGET))


def robust_speed(frictions: np.ndarray) -> float:
    frictions = np.asarray(frictions, dtype=float)
    s = TARGET * np.mean(1 / frictions) / np.mean(1 / frictions**2)
    return float(np.sqrt(2 * G * s))


def estimate_friction(nudge_speed: float, measured_distance: float) -> float:
    return nudge_speed**2 / (2 * G * measured_distance)


def imitate_successes(shares: np.ndarray, success: np.ndarray) -> np.ndarray:
    weights = shares * success
    return weights / weights.sum()


def imitate_better_than_average(shares: np.ndarray, success: np.ndarray) -> np.ndarray:
    average = shares @ success
    weights = np.where(success > average + 1e-12, shares, 0.0)
    if weights.sum() == 0:
        return shares
    return weights / weights.sum()


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
