"""Tests for the Week 8 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib
import math

import gymnasium as gym
import numpy as np
import pytest
import torch
from torch import nn

from agent import expert_action, run_experiment


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


class FixedLogits(nn.Module):
    """A fake policy with the same learnable logits for every state."""

    def __init__(self, logits):
        super().__init__()
        self.logits = nn.Parameter(torch.tensor(logits, dtype=torch.float32))

    def forward(self, states):
        return self.logits.expand(states.shape[0], -1)


def test_cloning_loss_matches_a_hand_calculation(impl):
    policy = FixedLogits([math.log(0.8), math.log(0.2)])  # 80% left, 20% right
    states = torch.zeros(2, 4)
    # The expert went left once and right once: -(log 0.8 + log 0.2) / 2
    loss = impl.cloning_loss(policy, states, torch.tensor([0, 1]))
    assert loss.item() == pytest.approx(-(math.log(0.8) + math.log(0.2)) / 2, abs=1e-5)


def test_cloning_loss_is_lower_when_the_policy_agrees_with_the_expert(impl):
    states = torch.zeros(3, 4)
    expert = torch.tensor([1, 1, 1])
    agrees = impl.cloning_loss(FixedLogits([0.0, 3.0]), states, expert)
    disagrees = impl.cloning_loss(FixedLogits([3.0, 0.0]), states, expert)
    assert agrees.item() < disagrees.item()


def test_cloning_loss_gradient_raises_the_expert_action(impl):
    policy = FixedLogits([0.0, 0.0])
    impl.cloning_loss(policy, torch.zeros(1, 4), torch.tensor([1])).backward()
    assert policy.logits.grad[1].item() < 0 < policy.logits.grad[0].item()


def test_greedy_action(impl):
    state = np.zeros(4, dtype=np.float32)
    assert impl.greedy_action(FixedLogits([0.2, 1.5]), state) == 1
    assert impl.greedy_action(FixedLogits([0.9, -0.5]), state) == 0
    assert isinstance(impl.greedy_action(FixedLogits([0.9, -0.5]), state), int)


def test_dagger_visits_the_learners_states(impl):
    env = gym.make("CartPole-v1")
    always_left = FixedLogits([5.0, 0.0])
    states, _ = impl.dagger_round(always_left, env, expert_action, seed=7)
    # Replay the same episode by hand, pushing left every step.
    state, _ = env.reset(seed=7)
    expected, done = [], False
    while not done:
        expected.append(state)
        state, _, terminated, truncated, _ = env.step(0)
        done = terminated or truncated
    assert len(states) == len(expected) and len(states) < 30  # pushing left only, the pole falls fast
    assert np.allclose(np.array(states), np.array(expected))
    env.close()


def test_dagger_labels_come_from_the_expert(impl):
    env = gym.make("CartPole-v1")
    states, labels = impl.dagger_round(FixedLogits([5.0, 0.0]), env, expert_action, seed=7)
    assert list(labels) == [expert_action(s) for s in states]
    assert 1 in labels  # the expert disagrees with "always left" somewhere
    env.close()


def test_dagger_fixes_what_cloning_alone_cannot(impl):
    history = run_experiment(impl, seed=0)
    assert history[0] < 200  # cloned from 50 steps of one demonstration: falls early
    assert history[-1] > 400  # after three rounds of DAgger: close to the expert's 500
