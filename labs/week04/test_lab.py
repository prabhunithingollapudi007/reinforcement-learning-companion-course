"""Tests for the Week 4 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest
import torch
from torch import nn

from agent import train_dqn


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


class Lookup(nn.Module):
    """A fake network: row i of the table is the Q-values of the state whose first feature is i."""

    def __init__(self, table):
        super().__init__()
        self.table = nn.Parameter(torch.tensor(table, dtype=torch.float32))

    def forward(self, states):
        return self.table[states[:, 0].long()]


def test_buffer_keeps_only_the_most_recent_transitions(impl):
    buffer = impl.ReplayBuffer(capacity=3)
    assert len(buffer) == 0
    for i in range(5):
        buffer.push(np.array([float(i), 0.0]), i % 2, float(i), np.array([float(i + 1), 0.0]), False)
    assert len(buffer) == 3
    states, *_ = buffer.sample(64, np.random.default_rng(0))
    assert set(states[:, 0].tolist()) == {2.0, 3.0, 4.0}  # 0 and 1 were dropped


def test_buffer_sample_shapes_and_types(impl):
    buffer = impl.ReplayBuffer(capacity=100)
    for i in range(10):
        buffer.push(np.array([float(i), 1.0, 2.0, 3.0]), i % 2, 1.0, np.array([float(i + 1), 1.0, 2.0, 3.0]), i == 9)
    states, actions, rewards, next_states, dones = buffer.sample(8, np.random.default_rng(0))
    assert states.shape == (8, 4) and next_states.shape == (8, 4)
    assert actions.shape == (8,) and rewards.shape == (8,) and dones.shape == (8,)
    assert states.dtype == torch.float32 and rewards.dtype == torch.float32 and dones.dtype == torch.float32
    assert actions.dtype == torch.int64
    assert torch.all(next_states[:, 0] == states[:, 0] + 1)  # each row is one consistent transition


def test_select_action_is_greedy_when_epsilon_is_zero(impl):
    net = Lookup([[0.1, 0.9], [0.7, 0.2]])
    rng = np.random.default_rng(0)
    assert all(impl.select_action(net, np.array([0.0, 0.0]), 0.0, rng) == 1 for _ in range(20))
    assert all(impl.select_action(net, np.array([1.0, 0.0]), 0.0, rng) == 0 for _ in range(20))


def test_select_action_is_random_when_epsilon_is_one(impl):
    net = Lookup([[0.1, 0.9]])
    rng = np.random.default_rng(0)
    picks = [impl.select_action(net, np.array([0.0, 0.0]), 1.0, rng) for _ in range(4000)]
    assert np.mean(picks) == pytest.approx(0.5, abs=0.05)


def batch(done: float):
    return (
        torch.tensor([[0.0, 0.0]]),  # state 0
        torch.tensor([1]),  # took action 1
        torch.tensor([1.0]),  # reward 1
        torch.tensor([[1.0, 0.0]]),  # landed in state 1
        torch.tensor([done]),
    )


def test_dqn_loss_matches_a_hand_calculation(impl):
    q_net = Lookup([[0.0, 2.0], [9.0, 9.0]])  # Q(s0, a1) = 2
    target_net = Lookup([[0.0, 0.0], [3.0, 5.0]])  # best next value 5, from the TARGET network
    # target = 1 + 0.9 * 5 = 5.5, error = 5.5 - 2 = 3.5, squared = 12.25
    loss = impl.dqn_loss(q_net, target_net, batch(done=0.0), gamma=0.9)
    assert loss.item() == pytest.approx(12.25)


def test_dqn_loss_ignores_the_future_after_the_episode_ends(impl):
    q_net = Lookup([[0.0, 2.0], [9.0, 9.0]])
    target_net = Lookup([[0.0, 0.0], [3.0, 5.0]])
    # target = 1, error = 1 - 2 = -1, squared = 1
    loss = impl.dqn_loss(q_net, target_net, batch(done=1.0), gamma=0.9)
    assert loss.item() == pytest.approx(1.0)


def test_gradient_reaches_the_q_network_but_not_the_target_network(impl):
    q_net = Lookup([[0.0, 2.0], [9.0, 9.0]])
    target_net = Lookup([[0.0, 0.0], [3.0, 5.0]])
    impl.dqn_loss(q_net, target_net, batch(done=0.0), gamma=0.9).backward()
    assert target_net.table.grad is None or torch.all(target_net.table.grad == 0)
    grad = q_net.table.grad
    assert grad[0, 1].item() == pytest.approx(-7.0)  # d/dq of (5.5 - q)^2 at q = 2
    assert grad[0, 0].item() == 0 and torch.all(grad[1] == 0)  # only the action taken is updated


def test_the_agent_learns_to_balance_the_pole(impl):
    returns = train_dqn(impl, steps=6000, seed=0)
    early = np.mean(returns[:10])
    best = max(np.mean(returns[i : i + 10]) for i in range(len(returns) - 9))
    assert early < 40  # a random policy lasts about 20 steps
    assert best > 100  # the reference solution reaches about 190 here
