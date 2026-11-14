"""Tests for the Week 7 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib
import math

import numpy as np
import pytest
import torch
from torch import nn

from agent import train_actor_critic


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


class Lookup(nn.Module):
    """A fake network: row i of the table is the output for the state whose first feature is i."""

    def __init__(self, table):
        super().__init__()
        self.table = nn.Parameter(torch.tensor(table, dtype=torch.float32))

    def forward(self, states):
        return self.table[states[:, 0].long()]


STATE0 = torch.tensor([[0.0, 0.0]])
EVEN = math.log(0.5)


def test_next_state_value_averages_over_the_current_policy(impl):
    policy = Lookup([[0.0, 0.0]])  # 50 / 50
    target_q = Lookup([[1.0, 3.0]])
    # With no entropy bonus: 0.5 * 1 + 0.5 * 3 = 2
    assert impl.next_state_value(policy, target_q, STATE0, alpha=0.0).item() == pytest.approx(2.0)


def test_next_state_value_follows_the_policy_not_the_max(impl):
    policy = Lookup([[math.log(0.9), math.log(0.1)]])  # mostly action 0
    target_q = Lookup([[1.0, 3.0]])
    # 0.9 * 1 + 0.1 * 3 = 1.2, not the max 3 that Q-learning would use
    assert impl.next_state_value(policy, target_q, STATE0, alpha=0.0).item() == pytest.approx(1.2, abs=1e-5)


def test_next_state_value_includes_the_entropy_bonus(impl):
    policy = Lookup([[0.0, 0.0]])
    target_q = Lookup([[1.0, 3.0]])
    # 2 - alpha * log 0.5 = 2 + 0.5 * 0.6931
    assert impl.next_state_value(policy, target_q, STATE0, alpha=0.5).item() == pytest.approx(2.0 - 0.5 * EVEN, abs=1e-5)


def test_critic_loss_uses_the_stored_action(impl):
    q_net = Lookup([[1.0, 4.0]])
    loss = impl.critic_loss(q_net, STATE0, torch.tensor([1]), torch.tensor([6.0]))
    assert loss.item() == pytest.approx(4.0)  # (6 - 4)^2
    loss.backward()
    assert q_net.table.grad[0, 0].item() == 0  # the other action is untouched


def test_actor_loss_matches_a_hand_calculation(impl):
    policy = Lookup([[0.0, 0.0]])
    q_net = Lookup([[1.0, 3.0]])
    # sum of 0.5 * (alpha * log 0.5 - Q) = alpha * log 0.5 - 2
    assert impl.actor_loss(policy, q_net, STATE0, alpha=0.5).item() == pytest.approx(0.5 * EVEN - 2.0, abs=1e-5)


def test_actor_gradient_favours_the_action_with_higher_q(impl):
    policy = Lookup([[0.0, 0.0]])
    q_net = Lookup([[1.0, 3.0]])
    impl.actor_loss(policy, q_net, STATE0, alpha=0.0).backward()
    grad = policy.table.grad[0]
    assert grad[1].item() < 0 < grad[0].item()  # descending raises the logit of action 1
    assert q_net.table.grad is None  # the critic is not trained by the actor's loss


def test_the_agent_learns_to_balance_the_pole(impl):
    returns = train_actor_critic(impl, seed=0)
    early = np.mean(returns[:10])
    best = max(np.mean(returns[i : i + 10]) for i in range(len(returns) - 9))
    assert early < 40  # an untrained policy lasts about 20 steps
    assert best > 100  # the reference solution reaches about 200 here
