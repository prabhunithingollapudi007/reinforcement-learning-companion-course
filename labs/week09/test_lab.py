"""Tests for the Week 9 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib
import math

import pytest
import torch

import experiments


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


def test_awr_weights_are_exponential_in_the_advantage(impl):
    w = impl.awr_weights(torch.tensor([0.0, 1.0, -1.0]), alpha=1.0)
    assert w.tolist() == pytest.approx([1.0, math.e, 1 / math.e], rel=1e-5)


def test_awr_weights_sharpen_as_alpha_shrinks(impl):
    advantages = torch.tensor([0.0, 0.2])
    gentle = impl.awr_weights(advantages, alpha=1.0)
    sharp = impl.awr_weights(advantages, alpha=0.1)
    assert sharp[1] / sharp[0] > gentle[1] / gentle[0]


def test_awr_weights_are_capped(impl):
    w = impl.awr_weights(torch.tensor([100.0]), alpha=0.1, max_weight=20.0)
    assert w.item() == pytest.approx(20.0)


def test_weighted_imitation_prefers_the_action_that_paid_best(impl):
    cloned = experiments.weighted_imitation(impl, None)
    weighted = experiments.weighted_imitation(impl, 0.1)
    # The old policy chose the best action (number 3) 5% of the time. Cloning copies that.
    assert cloned[3].item() == pytest.approx(0.05, abs=0.02)
    # Weighting by advantage makes it several times more likely, using the same data.
    assert weighted[3].item() > 0.25


def test_expectile_loss_matches_a_hand_calculation(impl):
    q = torch.tensor([1.0, 0.0])
    v = torch.tensor([0.0, 1.0])
    # u = [1, -1]: the first costs tau * 1, the second (1 - tau) * 1.
    assert impl.expectile_loss(q, v, 0.9).item() == pytest.approx((0.9 + 0.1) / 2)
    assert impl.expectile_loss(torch.tensor([1.0]), torch.tensor([0.0]), 0.9).item() == pytest.approx(0.9)
    assert impl.expectile_loss(torch.tensor([0.0]), torch.tensor([1.0]), 0.9).item() == pytest.approx(0.1)


def test_expectile_at_one_half_is_half_the_squared_error(impl):
    q = torch.tensor([0.3, 0.9, 0.1])
    v = torch.tensor([0.5, 0.5, 0.5])
    assert impl.expectile_loss(q, v, 0.5).item() == pytest.approx(0.5 * ((q - v) ** 2).mean().item())


def test_fitted_value_moves_from_the_mean_toward_the_best_action(impl):
    q = torch.tensor([0.2, 0.3, 0.25, 0.35, 0.9, 0.3, 0.28, 0.85])
    mean_fit = experiments.fit_value(impl, q, 0.5)
    high_fit = experiments.fit_value(impl, q, 0.9)
    assert mean_fit == pytest.approx(q.mean().item(), abs=0.01)
    assert high_fit == pytest.approx(0.726, abs=0.02)
    assert high_fit < q.max().item()  # never beyond what is in the data


def test_preference_loss_matches_a_hand_calculation(impl):
    # Equal rewards: the model gives each a 50% chance, so the loss is log 2.
    assert impl.preference_loss(torch.tensor([1.0]), torch.tensor([1.0])).item() == pytest.approx(math.log(2))
    # The winner rated 2 higher: -log sigmoid(2).
    assert impl.preference_loss(torch.tensor([3.0]), torch.tensor([1.0])).item() == pytest.approx(-math.log(1 / (1 + math.exp(-2))), abs=1e-5)


def test_preference_loss_is_lower_when_the_model_agrees_with_the_person(impl):
    agrees = impl.preference_loss(torch.tensor([2.0]), torch.tensor([0.0]))
    disagrees = impl.preference_loss(torch.tensor([0.0]), torch.tensor([2.0]))
    assert agrees.item() < disagrees.item()


def test_a_reward_model_recovers_the_hidden_reward_direction(impl):
    weights = experiments.fit_reward(impl, n=200, seed=0)
    assert experiments.direction_error_degrees(weights) < 8
