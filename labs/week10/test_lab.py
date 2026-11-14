"""Tests for the Week 10 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from bandit import average_regret


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


def test_updated_average_is_the_running_mean(impl):
    average, count = 0.0, 0
    for reward in [1.0, 0.0, 1.0, 1.0]:
        average = impl.updated_average(average, count, reward)
        count += 1
    assert average == pytest.approx(0.75)


def test_epsilon_greedy_is_greedy_when_epsilon_is_zero(impl):
    rng = np.random.default_rng(0)
    estimates = np.array([0.2, 0.9, 0.5])
    assert all(impl.epsilon_greedy_arm(estimates, 0.0, rng) == 1 for _ in range(50))


def test_epsilon_greedy_probabilities(impl):
    rng = np.random.default_rng(0)
    estimates = np.array([0.2, 0.9, 0.5])
    picks = np.array([impl.epsilon_greedy_arm(estimates, 0.3, rng) for _ in range(20000)])
    # The greedy arm gets 1 - 0.3 + 0.3 / 3 = 0.8; each other arm 0.1.
    assert np.mean(picks == 1) == pytest.approx(0.8, abs=0.02)
    assert np.mean(picks == 0) == pytest.approx(0.1, abs=0.02)


def test_ucb_scores_match_the_formula(impl):
    scores = impl.ucb_scores(np.array([0.6, 0.5]), np.array([100.0, 2.0]), t=102)
    assert scores[0] == pytest.approx(0.6 + np.sqrt(2 * np.log(102) / 100))
    assert scores[1] == pytest.approx(0.5 + np.sqrt(2 * np.log(102) / 2))
    assert np.argmax(scores) == 1  # the barely-tried arm has the higher bound


def test_ucb_bonus_shrinks_with_pulls(impl):
    few = impl.ucb_scores(np.array([0.5]), np.array([5.0]), t=1000)[0]
    many = impl.ucb_scores(np.array([0.5]), np.array([500.0]), t=1000)[0]
    assert many < few


def test_thompson_prefers_the_arm_that_is_clearly_better(impl):
    rng = np.random.default_rng(0)
    wins = np.array([80.0, 20.0])
    losses = np.array([20.0, 80.0])
    picks = [impl.thompson_arm(wins, losses, rng) for _ in range(500)]
    assert np.mean(picks) < 0.01  # arm 0 nearly always


def test_thompson_still_tries_an_arm_it_knows_little_about(impl):
    rng = np.random.default_rng(0)
    wins = np.array([60.0, 0.0])
    losses = np.array([40.0, 1.0])  # arm 1: one pull, one failure
    picks = [impl.thompson_arm(wins, losses, rng) for _ in range(2000)]
    assert 0.05 < np.mean(picks) < 0.5


@pytest.fixture(scope="session")
def curves(impl):
    return {s: average_regret(impl, s, steps=4000) for s in ("epsilon", "ucb", "thompson")}


def test_thompson_sampling_has_the_lowest_regret(curves):
    assert curves["thompson"][-1] < curves["ucb"][-1] < curves["epsilon"][-1]
    assert curves["thompson"][-1] < 30  # the reference solution gets about 17


def test_epsilon_greedy_regret_grows_in_a_straight_line(curves):
    c = curves["epsilon"]
    assert (c[-1] - c[-1001]) / (c[1499] - c[499]) > 0.8


def test_ucb_regret_flattens(curves):
    c = curves["ucb"]
    assert (c[-1] - c[-1001]) / (c[1499] - c[499]) < 0.5
