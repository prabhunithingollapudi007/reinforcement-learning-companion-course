"""Provided code for the Week 7 lab: networks, replay buffer and the training loop.

You do not need to change this file. Read `train_actor_critic` to see where
each of your functions from lab.py is used.

The algorithm is an off-policy actor-critic for discrete actions, in the style
of soft actor-critic: a Q critic trained from a replay buffer, an actor trained
to prefer actions the critic rates highly, and a small bonus for staying random.
"""

from __future__ import annotations

from collections import deque

import gymnasium as gym
import numpy as np
import torch
from torch import nn


def mlp(inputs: int, outputs: int, hidden: int = 64) -> nn.Sequential:
    return nn.Sequential(nn.Linear(inputs, hidden), nn.ReLU(), nn.Linear(hidden, hidden), nn.ReLU(), nn.Linear(hidden, outputs))


class ReplayBuffer:
    """The buffer you wrote in Week 4, provided here."""

    def __init__(self, capacity: int) -> None:
        self.data: deque = deque(maxlen=capacity)

    def __len__(self) -> int:
        return len(self.data)

    def push(self, *transition) -> None:
        self.data.append(transition)

    def sample(self, batch_size: int, rng: np.random.Generator):
        rows = [self.data[i] for i in rng.integers(len(self.data), size=batch_size)]
        states, actions, rewards, next_states, dones = zip(*rows)
        return (
            torch.as_tensor(np.array(states), dtype=torch.float32),
            torch.as_tensor(actions, dtype=torch.int64),
            torch.as_tensor(rewards, dtype=torch.float32),
            torch.as_tensor(np.array(next_states), dtype=torch.float32),
            torch.as_tensor(dones, dtype=torch.float32),
        )


def train_actor_critic(
    impl,
    steps: int = 8000,
    seed: int = 0,
    gamma: float = 0.99,
    alpha: float = 0.05,
    lr: float = 1e-3,
    batch_size: int = 128,
    learning_starts: int = 500,
    tau: float = 0.01,
) -> list[float]:
    """Train on CartPole using the pieces in `impl` (your lab module).

    Returns the total reward of every finished episode, in order.
    """
    torch.manual_seed(seed)
    rng = np.random.default_rng(seed)
    env = gym.make("CartPole-v1")
    obs_dim, n_actions = env.observation_space.shape[0], env.action_space.n

    policy = mlp(obs_dim, n_actions)  # the actor: logits over actions
    q_net = mlp(obs_dim, n_actions)  # the critic: one Q-value per action
    target_q = mlp(obs_dim, n_actions)
    target_q.load_state_dict(q_net.state_dict())
    actor_opt = torch.optim.Adam(policy.parameters(), lr=lr)
    critic_opt = torch.optim.Adam(q_net.parameters(), lr=lr)
    buffer = ReplayBuffer(20_000)

    returns: list[float] = []
    state, _ = env.reset(seed=seed)
    episode_return = 0.0
    for _ in range(steps):
        # 1. Act by sampling from the actor. No epsilon needed: the policy is stochastic.
        with torch.no_grad():
            logits = policy(torch.as_tensor(state, dtype=torch.float32))
        action = int(torch.distributions.Categorical(logits=logits).sample())
        next_state, reward, terminated, truncated, _ = env.step(action)
        buffer.push(state, action, reward, next_state, terminated)
        episode_return += reward
        state = next_state
        if terminated or truncated:
            returns.append(episode_return)
            episode_return = 0.0
            state, _ = env.reset()

        if len(buffer) < learning_starts:
            continue
        states, actions, rewards, next_states, dones = buffer.sample(batch_size, rng)

        # 2. Critic: fit Q(s, a) to r + gamma * (value of s' under the CURRENT policy).
        with torch.no_grad():
            next_value = impl.next_state_value(policy, target_q, next_states, alpha)
            targets = rewards + gamma * (1.0 - dones) * next_value
        critic_loss = impl.critic_loss(q_net, states, actions, targets)
        critic_opt.zero_grad()
        critic_loss.backward()
        critic_opt.step()

        # 3. Actor: shift probability toward actions the critic rates highly.
        actor_loss = impl.actor_loss(policy, q_net, states, alpha)
        actor_opt.zero_grad()
        actor_loss.backward()
        actor_opt.step()

        # 4. Let the target critic drift slowly toward the critic.
        with torch.no_grad():
            for target_param, param in zip(target_q.parameters(), q_net.parameters()):
                target_param.mul_(1.0 - tau).add_(tau * param)

    env.close()
    return returns
