"""Week 4 lab: the pieces of DQN, in PyTorch.

Fill in the replay buffer and the two functions below. The network and the
training loop are provided in agent.py: read `train_dqn` there to see where
each piece is used.

Run the tests from this folder with:

    python -m pytest

The last test trains on CartPole for a few thousand steps (about half a minute).
"""

from __future__ import annotations

import numpy as np
import torch
from torch import nn


class ReplayBuffer:
    """Stores the most recent `capacity` transitions."""

    def __init__(self, capacity: int) -> None:
        raise NotImplementedError

    def __len__(self) -> int:
        """How many transitions are stored right now."""
        raise NotImplementedError

    def push(self, state, action, reward, next_state, done) -> None:
        """Add one transition. When full, the oldest one is dropped."""
        raise NotImplementedError

    def sample(self, batch_size: int, rng: np.random.Generator):
        """A random minibatch, as five tensors:

        states       float32, shape (batch, obs_dim)
        actions      int64,   shape (batch,)
        rewards      float32, shape (batch,)
        next_states  float32, shape (batch, obs_dim)
        dones        float32, shape (batch,)   1.0 where the episode ended

        Pick the indices with rng.integers(len(self), size=batch_size).
        """
        raise NotImplementedError


def select_action(q_net: nn.Module, state, epsilon: float, rng: np.random.Generator) -> int:
    """Epsilon-greedy on the network's Q-values for one state.

    With probability epsilon (rng.random() < epsilon) return rng.integers(n_actions);
    otherwise the action with the largest Q-value. No gradients are needed here.
    """
    raise NotImplementedError


def dqn_loss(q_net: nn.Module, target_net: nn.Module, batch, gamma: float) -> torch.Tensor:
    """Mean squared error between Q(s, a; w) and the DQN target.

    target = r + gamma * max over a' of Q(s', a'; w-)     if the episode goes on
    target = r                                            if it ended (done = 1)

    Q(s, a; w) comes from q_net, for the action actually taken (use .gather).
    The target comes from target_net and must be treated as a constant:
    compute it under torch.no_grad().
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from agent import train_dqn

    returns = train_dqn(sys.modules[__name__])
    print(f"{len(returns)} episodes; first ten averaged {np.mean(returns[:10]):.0f}, last ten averaged {np.mean(returns[-10:]):.0f}")
