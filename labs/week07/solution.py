"""Reference solution for the Week 7 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import torch
from torch import nn


def next_state_value(policy: nn.Module, target_q: nn.Module, next_states: torch.Tensor, alpha: float) -> torch.Tensor:
    log_probs = torch.log_softmax(policy(next_states), dim=1)
    probs = log_probs.exp()
    # Average Q over what the current policy would do, plus a bonus for staying random.
    return (probs * (target_q(next_states) - alpha * log_probs)).sum(dim=1)


def critic_loss(q_net: nn.Module, states: torch.Tensor, actions: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
    q_taken = q_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
    return nn.functional.mse_loss(q_taken, targets)


def actor_loss(policy: nn.Module, q_net: nn.Module, states: torch.Tensor, alpha: float) -> torch.Tensor:
    log_probs = torch.log_softmax(policy(states), dim=1)
    probs = log_probs.exp()
    q_values = q_net(states).detach()  # the critic is the judge here, not the thing being trained
    return (probs * (alpha * log_probs - q_values)).sum(dim=1).mean()


if __name__ == "__main__":
    import sys

    import numpy as np

    from agent import train_actor_critic

    returns = train_actor_critic(sys.modules[__name__])
    print(f"{len(returns)} episodes; first ten averaged {np.mean(returns[:10]):.0f}, last ten averaged {np.mean(returns[-10:]):.0f}")
