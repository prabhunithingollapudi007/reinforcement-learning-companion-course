"""Reference solution for the Week 6 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import torch


def gae(rewards, values, dones, last_value: float, gamma: float, lam: float) -> list[float]:
    advantages = [0.0] * len(rewards)
    running = 0.0
    for t in reversed(range(len(rewards))):
        next_value = last_value if t == len(rewards) - 1 else values[t + 1]
        alive = 1.0 - dones[t]  # 0 when the episode ended on this step
        delta = rewards[t] + gamma * next_value * alive - values[t]
        running = delta + gamma * lam * alive * running
        advantages[t] = running
    return advantages


def clipped_objective(new_log_probs: torch.Tensor, old_log_probs: torch.Tensor, advantages: torch.Tensor, epsilon: float) -> torch.Tensor:
    ratio = torch.exp(new_log_probs - old_log_probs)
    unclipped = ratio * advantages
    clipped = torch.clamp(ratio, 1.0 - epsilon, 1.0 + epsilon) * advantages
    return torch.min(unclipped, clipped).mean()


if __name__ == "__main__":
    import sys

    from agent import train_ppo

    history = train_ppo(sys.modules[__name__])
    print(f"{len(history)} iterations; episode length went from {history[0]:.0f} to {history[-1]:.0f}")
