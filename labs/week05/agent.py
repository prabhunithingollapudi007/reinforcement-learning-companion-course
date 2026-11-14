"""Provided code for the Week 5 lab: the policy network and the training loop.

You do not need to change this file. Read `train_reinforce` to see where each
of your functions from lab.py is used.
"""

from __future__ import annotations

import gymnasium as gym
import numpy as np
import torch
from torch import nn


class PolicyNetwork(nn.Module):
    """Maps a state to one logit per action. Softmax of the logits is the policy."""

    def __init__(self, obs_dim: int, n_actions: int, hidden: int = 64) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, hidden),
            nn.Tanh(),
            nn.Linear(hidden, n_actions),
        )

    def forward(self, states: torch.Tensor) -> torch.Tensor:
        return self.net(states)


def run_episode(env, policy: nn.Module, seed: int | None = None):
    """Play one episode by sampling from the policy. Returns (states, actions, rewards)."""
    states, actions, rewards = [], [], []
    state, _ = env.reset(seed=seed)
    done = False
    while not done:
        with torch.no_grad():
            logits = policy(torch.as_tensor(state, dtype=torch.float32).unsqueeze(0))[0]
        action = int(torch.distributions.Categorical(logits=logits).sample())
        next_state, reward, terminated, truncated, _ = env.step(action)
        states.append(state)
        actions.append(action)
        rewards.append(float(reward))
        state = next_state
        done = terminated or truncated
    return states, actions, rewards


def train_reinforce(
    impl,
    iterations: int = 60,
    episodes_per_iteration: int = 10,
    seed: int = 0,
    gamma: float = 0.99,
    lr: float = 1e-2,
    use_baseline: bool = True,
    stop_at: float | None = 200.0,
) -> list[float]:
    """Train REINFORCE on CartPole using the pieces in `impl` (your lab module).

    Returns the average episode length of every iteration. Stops early once an
    iteration averages `stop_at` or more.
    """
    torch.manual_seed(seed)
    env = gym.make("CartPole-v1")
    policy = PolicyNetwork(env.observation_space.shape[0], env.action_space.n)
    optimizer = torch.optim.Adam(policy.parameters(), lr=lr)

    history: list[float] = []
    for iteration in range(iterations):
        # 1. Collect fresh episodes with the current policy.
        all_states, all_actions, all_weights, lengths = [], [], [], []
        for episode in range(episodes_per_iteration):
            states, actions, rewards = run_episode(env, policy, seed=seed * 100_000 + iteration * 100 + episode)
            all_states.extend(states)
            all_actions.extend(actions)
            # 2. Each action is weighted by the reward that came after it.
            all_weights.extend(impl.rewards_to_go(rewards, gamma))
            lengths.append(len(rewards))

        states_t = torch.as_tensor(np.array(all_states), dtype=torch.float32)
        actions_t = torch.as_tensor(all_actions, dtype=torch.int64)
        weights_t = torch.as_tensor(all_weights, dtype=torch.float32)
        # 3. Judge each action against the average, not against zero.
        if use_baseline:
            weights_t = impl.standardize(weights_t)

        # 4. One gradient step on the surrogate loss.
        loss = impl.policy_loss(policy, states_t, actions_t, weights_t)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        history.append(float(np.mean(lengths)))
        if stop_at is not None and history[-1] >= stop_at:
            break

    env.close()
    return history
