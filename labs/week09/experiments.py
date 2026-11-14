"""Provided code for the Week 9 lab: three small experiments that use your functions.

You do not need to change this file. Each experiment is a few lines; read them
to see where your functions from lab.py are used.
"""

from __future__ import annotations

import numpy as np
import torch

N_ACTIONS = 5
# What each action is really worth. The old policy rarely chose the best one (action 3).
TRUE_REWARD = torch.tensor([0.1, 0.3, 0.2, 0.9, 0.4])
OLD_POLICY = torch.tensor([0.35, 0.3, 0.2, 0.05, 0.1])


def make_bandit_data(n: int = 2000, seed: int = 0):
    """Actions the old policy took in one state, and the noisy rewards it received."""
    generator = torch.Generator().manual_seed(seed)
    actions = torch.multinomial(OLD_POLICY, n, replacement=True, generator=generator)
    rewards = TRUE_REWARD[actions] + 0.1 * torch.randn(n, generator=generator)
    return actions, rewards


def weighted_imitation(impl, alpha: float | None, seed: int = 0) -> torch.Tensor:
    """Fit a policy to the logged actions. Returns its action probabilities.

    alpha=None is plain behaviour cloning. Otherwise each example is weighted by
    your `awr_weights` of its advantage: reward minus the average reward.
    """
    actions, rewards = make_bandit_data(seed=seed)
    advantages = rewards - rewards.mean()
    weights = torch.ones_like(rewards) if alpha is None else impl.awr_weights(advantages, alpha)
    logits = torch.zeros(N_ACTIONS, requires_grad=True)
    optimizer = torch.optim.Adam([logits], lr=0.1)
    for _ in range(300):
        log_probs = torch.log_softmax(logits, dim=0)[actions]
        loss = -(weights * log_probs).sum() / weights.sum()
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    return torch.softmax(logits.detach(), dim=0)


def fit_value(impl, q_values: torch.Tensor, tau: float) -> float:
    """Fit one number V to a set of Q-values with your expectile loss."""
    v = torch.zeros(1, requires_grad=True)
    optimizer = torch.optim.Adam([v], lr=0.02)
    for _ in range(1500):
        loss = impl.expectile_loss(q_values, v.expand_as(q_values), tau)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    return float(v.detach())


TRUE_DIRECTION = np.array([np.cos(np.radians(35)), np.sin(np.radians(35))])


def make_comparisons(n: int, seed: int = 0):
    """Pairs of trajectories (as 2 features each), ordered so the first is the one a person preferred."""
    rng = np.random.default_rng(seed)
    a = rng.uniform(-1, 1, size=(n, 2))
    b = rng.uniform(-1, 1, size=(n, 2))
    gap = (a - b) @ TRUE_DIRECTION
    prefers_a = rng.random(n) < 1 / (1 + np.exp(-gap / 0.3))
    winners = np.where(prefers_a[:, None], a, b)
    losers = np.where(prefers_a[:, None], b, a)
    return torch.as_tensor(winners, dtype=torch.float32), torch.as_tensor(losers, dtype=torch.float32)


def fit_reward(impl, n: int = 200, seed: int = 0) -> np.ndarray:
    """Fit a linear reward model to comparisons with your preference loss. Returns its weights."""
    winners, losers = make_comparisons(n, seed)
    weights = torch.zeros(2, requires_grad=True)
    optimizer = torch.optim.Adam([weights], lr=0.05)
    for _ in range(400):
        loss = impl.preference_loss(winners @ weights, losers @ weights)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    return weights.detach().numpy()


def direction_error_degrees(weights: np.ndarray) -> float:
    cos = float(weights @ TRUE_DIRECTION / (np.linalg.norm(weights) + 1e-12))
    return float(np.degrees(np.arccos(np.clip(cos, -1, 1))))
