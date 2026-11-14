"""Tests for the Week 5 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import pytest
import torch
from torch import nn

from agent import train_reinforce


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


class FixedLogits(nn.Module):
    """A fake policy: the same learnable logits for every state."""

    def __init__(self, logits):
        super().__init__()
        self.logits = nn.Parameter(torch.tensor(logits, dtype=torch.float32))

    def forward(self, states):
        return self.logits.expand(states.shape[0], -1)


def test_rewards_to_go_without_discounting(impl):
    # The figure in the lesson: rewards 1, 0, 2, 0, 1, 3.
    assert impl.rewards_to_go([1, 0, 2, 0, 1, 3], 1.0) == pytest.approx([7, 6, 6, 4, 4, 3])


def test_rewards_to_go_with_discounting(impl):
    assert impl.rewards_to_go([1, 1, 1], 0.5) == pytest.approx([1.75, 1.5, 1.0])
    assert impl.rewards_to_go([], 0.9) == []


def test_standardize_gives_zero_mean_and_unit_spread(impl):
    out = impl.standardize(torch.tensor([1.0, 2.0, 3.0, 4.0, 10.0]))
    assert out.mean().item() == pytest.approx(0.0, abs=1e-6)
    assert out.std().item() == pytest.approx(1.0, abs=1e-4)
    # The order of the weights is preserved: the best action still has the largest weight.
    assert torch.argmax(out).item() == 4


def test_policy_loss_matches_a_hand_calculation(impl):
    policy = FixedLogits([0.0, 0.0])  # both actions have probability 0.5
    states = torch.zeros(2, 4)
    actions = torch.tensor([0, 1])
    weights = torch.tensor([2.0, 4.0])
    # log 0.5 = -0.6931; loss = -mean(-0.6931 * 2, -0.6931 * 4) = 0.6931 * 3
    assert impl.policy_loss(policy, states, actions, weights).item() == pytest.approx(0.6931 * 3, abs=1e-3)


def test_gradient_pushes_toward_the_better_action(impl):
    policy = FixedLogits([0.0, 0.0])
    states = torch.zeros(2, 4)
    # Action 1 was followed by more reward than action 0.
    loss = impl.policy_loss(policy, states, torch.tensor([0, 1]), torch.tensor([-1.0, 1.0]))
    loss.backward()
    grad = policy.logits.grad
    # Gradient descent subtracts the gradient, so a negative gradient raises that logit.
    assert grad[1].item() < 0 < grad[0].item()


def test_weights_are_treated_as_constants(impl):
    policy = FixedLogits([0.3, -0.2])
    weights = torch.tensor([1.0, 2.0], requires_grad=True)
    impl.policy_loss(policy, torch.zeros(2, 4), torch.tensor([0, 1]), weights).backward()
    assert weights.grad is None


def test_the_agent_learns_to_balance_the_pole(impl):
    history = train_reinforce(impl, seed=0)
    assert history[0] < 60  # an untrained policy lasts about 25 steps
    assert max(history) > 150  # the reference solution passes 200 within about 25 iterations
