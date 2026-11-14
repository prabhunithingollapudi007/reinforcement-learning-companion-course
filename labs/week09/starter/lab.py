"""Week 9 lab: three functions for learning from fixed data and from preferences.

Fill in the three functions below. Each is one to three lines. The small
experiments that use them are in experiments.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import torch


def awr_weights(advantages: torch.Tensor, alpha: float, max_weight: float = 20.0) -> torch.Tensor:
    """Advantage-weighted regression weights: exp(advantage / alpha), capped at max_weight.

    A small alpha trusts the advantages and concentrates on the best actions;
    a large alpha is close to plain imitation. The cap stops one lucky sample
    from dominating.
    """
    raise NotImplementedError


def expectile_loss(q: torch.Tensor, v: torch.Tensor, tau: float) -> torch.Tensor:
    """The asymmetric squared loss used by implicit Q-learning to fit V.

    With u = q - v, each element costs  tau * u^2        when u >= 0  (V is too low)
                                   and  (1 - tau) * u^2  when u < 0   (V is too high).
    Return the mean. With tau = 0.5 this is half the ordinary squared error.
    """
    raise NotImplementedError


def preference_loss(reward_winner: torch.Tensor, reward_loser: torch.Tensor) -> torch.Tensor:
    """The loss for a reward model trained on comparisons.

    The model says the winner is preferred with probability
    sigmoid(reward_winner - reward_loser). Return minus the mean log of that
    probability. torch.nn.functional.logsigmoid is the numerically safe way.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    import experiments

    me = sys.modules[__name__]
    print("old policy picks the best action:", f"{experiments.OLD_POLICY[3]:.2f}")
    print("after plain cloning:             ", f"{experiments.weighted_imitation(me, None)[3]:.2f}")
    print("after advantage-weighted cloning:", f"{experiments.weighted_imitation(me, 0.1)[3]:.2f}")
    weights = experiments.fit_reward(me)
    print("reward direction error:", f"{experiments.direction_error_degrees(weights):.1f} degrees")
