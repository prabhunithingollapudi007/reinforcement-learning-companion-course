"""Tests for the Week 6 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import pytest
import torch

from agent import train_ppo


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


REWARDS = [1.0, 1.0, 1.0]
VALUES = [0.5, 0.5, 0.5]
ONE_EPISODE = [0.0, 0.0, 1.0]  # the episode ends on the last step


def test_lambda_zero_is_the_td_error(impl):
    # delta = r + V(next) - V(now): 1 + 0.5 - 0.5 = 1, and 1 + 0 - 0.5 = 0.5 at the end.
    assert impl.gae(REWARDS, VALUES, ONE_EPISODE, 99.0, 1.0, 0.0) == pytest.approx([1.0, 1.0, 0.5])


def test_lambda_one_is_return_minus_value(impl):
    # Returns are 3, 2, 1; subtract the value 0.5.
    assert impl.gae(REWARDS, VALUES, ONE_EPISODE, 99.0, 1.0, 1.0) == pytest.approx([2.5, 1.5, 0.5])


def test_discounting(impl):
    # delta = [1 + 0.9*0.5 - 0.5, same, 1 - 0.5] = [0.95, 0.95, 0.5]; A_t = delta_t + 0.9*0.5*A_{t+1}
    out = impl.gae(REWARDS, VALUES, ONE_EPISODE, 0.0, 0.9, 0.5)
    assert out == pytest.approx([0.95 + 0.45 * (0.95 + 0.45 * 0.5), 0.95 + 0.45 * 0.5, 0.5])


def test_an_unfinished_episode_bootstraps_from_the_last_value(impl):
    # Nothing has ended, so the final step looks ahead to last_value.
    out = impl.gae([1.0], [0.5], [0.0], 2.0, 1.0, 0.95)
    assert out == pytest.approx([1.0 + 2.0 - 0.5])


def test_nothing_leaks_across_the_end_of_an_episode(impl):
    # Step 0 ends an episode; step 1 starts a new one with a very high value.
    out = impl.gae([1.0, 1.0], [0.5, 100.0], [1.0, 0.0], 100.0, 1.0, 1.0)
    assert out[0] == pytest.approx(0.5)  # 1 - 0.5: the next episode's value is not used


def test_clipped_objective_inside_the_range_is_ratio_times_advantage(impl):
    old = torch.log(torch.tensor([0.5, 0.5]))
    new = torch.log(torch.tensor([0.55, 0.45]))  # ratios 1.1 and 0.9
    out = impl.clipped_objective(new, old, torch.tensor([2.0, -2.0]), 0.2)
    assert out.item() == pytest.approx((1.1 * 2.0 + 0.9 * -2.0) / 2, abs=1e-5)


def test_clipped_objective_caps_gains_but_not_losses(impl):
    old = torch.log(torch.tensor([0.4, 0.4, 0.4, 0.4]))
    new = torch.log(torch.tensor([0.6, 0.2, 0.2, 0.6]))  # ratios 1.5, 0.5, 0.5, 1.5
    advantages = torch.tensor([1.0, -1.0, 1.0, -1.0])
    # good action made much more likely: capped at 1.2
    # bad action made much less likely: capped at -0.8
    # good action made less likely: full penalty, 0.5
    # bad action made more likely: full penalty, -1.5
    out = impl.clipped_objective(new, old, advantages, 0.2)
    assert out.item() == pytest.approx((1.2 - 0.8 + 0.5 - 1.5) / 4, abs=1e-5)


def test_no_gradient_once_the_clip_is_reached(impl):
    old = torch.log(torch.tensor([0.4]))
    new = torch.log(torch.tensor([0.6])).requires_grad_()  # ratio 1.5, beyond 1.2
    impl.clipped_objective(new, old, torch.tensor([1.0]), 0.2).backward()
    assert new.grad.item() == pytest.approx(0.0)


def test_the_agent_learns_to_balance_the_pole(impl):
    history = train_ppo(impl, seed=0)
    assert history[0] < 60  # an untrained policy lasts about 22 steps
    assert max(history) > 150  # the reference solution passes 200 within about 12 iterations
