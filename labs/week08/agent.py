"""Provided code for the Week 8 lab: the expert, the policy network and the experiment.

You do not need to change this file. Read `run_experiment` to see where each
of your functions from lab.py is used.
"""

from __future__ import annotations

import gymnasium as gym
import numpy as np
import torch
from torch import nn


def expert_action(state) -> int:
    """A hand-written controller that balances the pole for the full 500 steps."""
    x, x_dot, theta, theta_dot = state
    return int(theta + 0.5 * theta_dot + 0.05 * x + 0.1 * x_dot > 0)


def make_policy() -> nn.Module:
    """Maps a state to one logit per action (push left, push right)."""
    return nn.Sequential(nn.Linear(4, 32), nn.Tanh(), nn.Linear(32, 2))


def run_episode(env, act, seed: int):
    """Run one episode with `act(state) -> action`. Returns (total reward, states visited)."""
    state, _ = env.reset(seed=seed)
    states, total, done = [], 0.0, False
    while not done:
        states.append(state)
        state, reward, terminated, truncated, _ = env.step(act(state))
        total += reward
        done = terminated or truncated
    return total, states


def fit(impl, states, actions, seed: int, epochs: int = 200, lr: float = 1e-2) -> nn.Module:
    """Train a fresh policy on (state, action) pairs with your cloning loss."""
    torch.manual_seed(seed)
    policy = make_policy()
    optimizer = torch.optim.Adam(policy.parameters(), lr=lr)
    states_t = torch.as_tensor(np.array(states), dtype=torch.float32)
    actions_t = torch.as_tensor(actions, dtype=torch.int64)
    for _ in range(epochs):
        loss = impl.cloning_loss(policy, states_t, actions_t)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    return policy


def evaluate(impl, env, policy: nn.Module, episodes: int = 5) -> float:
    """Average episode length when the policy acts greedily."""
    return float(np.mean([run_episode(env, lambda s: impl.greedy_action(policy, s), 2000 + k)[0] for k in range(episodes)]))


def run_experiment(impl, seed: int = 0, demo_steps: int = 50, rounds: int = 3) -> list[float]:
    """Clone the expert from a short demonstration, then improve with DAgger.

    Returns the average episode length after cloning alone, then after each DAgger round.
    """
    env = gym.make("CartPole-v1")

    # 1. A single short demonstration: the first `demo_steps` steps of one expert episode.
    _, demo_states = run_episode(env, expert_action, 1000 + seed)
    states = list(demo_states[:demo_steps])
    actions = [expert_action(s) for s in states]

    # 2. Behaviour cloning.
    policy = fit(impl, states, actions, seed)
    history = [evaluate(impl, env, policy)]

    # 3. DAgger: run the learner, have the expert label where it went, retrain on everything.
    for r in range(rounds):
        new_states, new_actions = impl.dagger_round(policy, env, expert_action, seed=3000 + r)
        states += list(new_states)
        actions += list(new_actions)
        policy = fit(impl, states, actions, seed + r + 1)
        history.append(evaluate(impl, env, policy))

    env.close()
    return history
