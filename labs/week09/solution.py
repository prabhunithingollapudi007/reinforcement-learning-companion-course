"""Reference solution for the Week 9 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import torch


def awr_weights(advantages: torch.Tensor, alpha: float, max_weight: float = 20.0) -> torch.Tensor:
    return torch.exp(advantages / alpha).clamp(max=max_weight)


def expectile_loss(q: torch.Tensor, v: torch.Tensor, tau: float) -> torch.Tensor:
    u = q - v
    weight = torch.where(u < 0, 1.0 - tau, tau)
    return (weight * u**2).mean()


def preference_loss(reward_winner: torch.Tensor, reward_loser: torch.Tensor) -> torch.Tensor:
    return -torch.nn.functional.logsigmoid(reward_winner - reward_loser).mean()


if __name__ == "__main__":
    import sys

    import experiments

    me = sys.modules[__name__]
    print("old policy picks the best action:", f"{experiments.OLD_POLICY[3]:.2f}")
    print("after plain cloning:             ", f"{experiments.weighted_imitation(me, None)[3]:.2f}")
    print("after advantage-weighted cloning:", f"{experiments.weighted_imitation(me, 0.1)[3]:.2f}")
    weights = experiments.fit_reward(me)
    print("reward direction error:", f"{experiments.direction_error_degrees(weights):.1f} degrees")
