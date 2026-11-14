"""Reference solution for the Week 5 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import torch
from torch import nn


def rewards_to_go(rewards: list[float], gamma: float) -> list[float]:
    out = [0.0] * len(rewards)
    running = 0.0
    for t in reversed(range(len(rewards))):
        running = rewards[t] + gamma * running
        out[t] = running
    return out


def standardize(weights: torch.Tensor) -> torch.Tensor:
    return (weights - weights.mean()) / (weights.std() + 1e-8)


def policy_loss(policy: nn.Module, states: torch.Tensor, actions: torch.Tensor, weights: torch.Tensor) -> torch.Tensor:
    log_probs = torch.distributions.Categorical(logits=policy(states)).log_prob(actions)
    # The weights are numbers, not something to differentiate.
    return -(log_probs * weights.detach()).mean()


if __name__ == "__main__":
    import sys

    from agent import train_reinforce

    history = train_reinforce(sys.modules[__name__])
    print(f"{len(history)} iterations; episode length went from {history[0]:.0f} to {history[-1]:.0f}")
