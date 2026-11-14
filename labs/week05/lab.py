"""Week 5 lab: REINFORCE, in PyTorch.

Fill in the three functions below. The policy network and the training loop
are provided in agent.py: read `train_reinforce` there to see where each piece
is used.

Run the tests from this folder with:

    python -m pytest

The last test trains on CartPole (about half a minute).
"""

from __future__ import annotations

import torch
from torch import nn


def rewards_to_go(rewards: list[float], gamma: float) -> list[float]:
    """For every step t, the discounted sum of rewards from t to the end.

    out[t] = rewards[t] + gamma * out[t + 1]. Work backwards.
    """
    raise NotImplementedError


def standardize(weights: torch.Tensor) -> torch.Tensor:
    """Subtract the mean and divide by the standard deviation (plus 1e-8).

    Subtracting the mean is the baseline: each action is judged against the
    average. Dividing by the standard deviation keeps the step size steady
    as returns grow.
    """
    raise NotImplementedError


def policy_loss(policy: nn.Module, states: torch.Tensor, actions: torch.Tensor, weights: torch.Tensor) -> torch.Tensor:
    """The surrogate loss whose gradient is the policy gradient estimate:

        loss = - mean over all steps of  log pi(a_t | s_t) * weight_t

    policy(states) returns logits, shape (N, n_actions). Use
    torch.distributions.Categorical(logits=...).log_prob(actions).
    The weights must be treated as constants (.detach()).
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from agent import train_reinforce

    history = train_reinforce(sys.modules[__name__])
    print(f"{len(history)} iterations; episode length went from {history[0]:.0f} to {history[-1]:.0f}")
