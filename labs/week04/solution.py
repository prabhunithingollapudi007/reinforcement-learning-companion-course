"""Reference solution for the Week 4 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

from collections import deque

import numpy as np
import torch
from torch import nn


class ReplayBuffer:
    def __init__(self, capacity: int) -> None:
        self.data: deque = deque(maxlen=capacity)

    def __len__(self) -> int:
        return len(self.data)

    def push(self, state, action, reward, next_state, done) -> None:
        self.data.append((state, action, reward, next_state, done))

    def sample(self, batch_size: int, rng: np.random.Generator):
        indices = rng.integers(len(self.data), size=batch_size)
        states, actions, rewards, next_states, dones = zip(*(self.data[i] for i in indices))
        return (
            torch.as_tensor(np.array(states), dtype=torch.float32),
            torch.as_tensor(actions, dtype=torch.int64),
            torch.as_tensor(rewards, dtype=torch.float32),
            torch.as_tensor(np.array(next_states), dtype=torch.float32),
            torch.as_tensor(dones, dtype=torch.float32),
        )


def select_action(q_net: nn.Module, state, epsilon: float, rng: np.random.Generator) -> int:
    with torch.no_grad():
        q_values = q_net(torch.as_tensor(np.asarray(state), dtype=torch.float32).unsqueeze(0))[0]
    if rng.random() < epsilon:
        return int(rng.integers(q_values.shape[0]))
    return int(torch.argmax(q_values))


def dqn_loss(q_net: nn.Module, target_net: nn.Module, batch, gamma: float) -> torch.Tensor:
    states, actions, rewards, next_states, dones = batch
    # Q(s, a; w) for the actions that were actually taken.
    q_taken = q_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
    # The target is a fixed number: no gradient flows through the target network.
    with torch.no_grad():
        best_next = target_net(next_states).max(dim=1).values
        targets = rewards + gamma * (1.0 - dones) * best_next
    return nn.functional.mse_loss(q_taken, targets)


if __name__ == "__main__":
    import sys

    from agent import train_dqn

    returns = train_dqn(sys.modules[__name__])
    print(f"{len(returns)} episodes; first ten averaged {np.mean(returns[:10]):.0f}, last ten averaged {np.mean(returns[-10:]):.0f}")
