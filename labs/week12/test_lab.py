"""Tests for the Week 12 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from world import collect_random_data, reward, run_flat, run_mpc, run_random, run_uct

A_TRUE = np.array([[1.0, 0.1], [0.0, 0.9]])
B_TRUE = np.array([0.0, 0.2])


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


# ---- Part 1: tree search ----


def test_uct_score_is_the_average_plus_a_bonus(impl):
    # Child 0: 4 visits, total 3.0, so average 0.75. Child 1: 1 visit, total 1.0.
    scores = impl.uct_scores(np.array([3.0, 1.0]), np.array([4, 1]), parent_visits=5, c=1.0)
    assert scores == pytest.approx([0.75 + np.sqrt(np.log(5) / 4), 1.0 + np.sqrt(np.log(5))])


def test_with_c_zero_the_score_is_just_the_average(impl):
    scores = impl.uct_scores(np.array([3.0, 1.0, 0.5]), np.array([4, 2, 1]), parent_visits=7, c=0.0)
    assert scores == pytest.approx([0.75, 0.5, 0.5])


def test_a_rarely_tried_child_can_outscore_a_better_looking_one(impl):
    scores = impl.uct_scores(np.array([60.0, 0.4]), np.array([100, 1]), parent_visits=101, c=0.5)
    assert np.argmax(scores) == 1


def test_tree_search_finds_the_best_first_choice(impl):
    picks = [int(np.argmax(run_uct(impl, simulations=500, seed=seed))) for seed in range(10)]
    assert picks.count(0) >= 9


def test_flat_monte_carlo_does_not():
    # Under random follow-up play, choice 1 looks best. More samples only confirm it.
    assert all(int(np.argmax(run_flat(500, seed))) == 1 for seed in range(5))


# ---- Part 2: learning a model and planning with it ----


def test_the_model_is_recovered_exactly_from_noiseless_data(impl):
    rng = np.random.default_rng(0)
    states = rng.normal(size=(50, 2))
    actions = rng.uniform(-1, 1, size=50)
    next_states = states @ A_TRUE.T + actions[:, None] * B_TRUE
    A, B = impl.fit_linear_model(states, actions, next_states)
    assert np.shape(A) == (2, 2) and np.shape(B) == (2,)
    assert A == pytest.approx(A_TRUE, abs=1e-8)
    assert B == pytest.approx(B_TRUE, abs=1e-8)


def test_the_model_is_close_from_noisy_real_data(impl):
    A, B = impl.fit_linear_model(*collect_random_data(200, seed=0))
    assert A == pytest.approx(A_TRUE, abs=0.01)
    assert B == pytest.approx(B_TRUE, abs=0.01)


def test_imagined_returns_match_a_hand_calculation(impl):
    # Start at position 1, at rest. One plan: push -1 twice.
    #   step 0: state (1, 0), action -1      reward -(1 + 0 + 0.01)           = -1.01
    #           next state (1 + 0.1 * 0, 0.9 * 0 - 0.2) = (1, -0.2)
    #   step 1: state (1, -0.2), action -1   reward -(1 + 0.1 * 0.04 + 0.01)  = -1.014
    returns = impl.imagined_returns(A_TRUE, B_TRUE, np.array([1.0, 0.0]), np.array([[-1.0, -1.0]]))
    assert returns == pytest.approx([-2.024])


def test_imagined_returns_scores_every_plan_separately(impl):
    plans = np.array([[-1.0, -1.0, -1.0, -1.0, -1.0, -1.0], [1.0, 1.0, 1.0, 1.0, 1.0, 1.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])
    returns = impl.imagined_returns(A_TRUE, B_TRUE, np.array([1.0, 0.0]), plans)
    assert returns.shape == (3,)
    # Pushing toward 0 is best, doing nothing is next, pushing away is worst.
    assert returns[0] > returns[2] > returns[1]
    # Doing nothing at (1, 0) for 6 steps costs exactly 6.
    assert returns[2] == pytest.approx(-6.0)


def test_plan_returns_the_first_action_of_the_best_candidate(impl):
    state = np.array([1.0, 0.0])
    action = impl.plan(A_TRUE, B_TRUE, state, 10, 50, np.random.default_rng(3))
    candidates = np.random.default_rng(3).uniform(-1, 1, size=(50, 10))
    best = candidates[np.argmax(impl.imagined_returns(A_TRUE, B_TRUE, state, candidates))]
    assert float(action) == pytest.approx(best[0])


def test_plan_pushes_toward_the_target(impl):
    rng = np.random.default_rng(0)
    assert impl.plan(A_TRUE, B_TRUE, np.array([1.0, 0.0]), 15, 300, rng) < 0
    assert impl.plan(A_TRUE, B_TRUE, np.array([-1.0, 0.0]), 15, 300, rng) > 0


@pytest.mark.parametrize("seed", [0, 1, 2])
def test_planning_with_the_learned_model_parks_the_cart(impl, seed):
    positions, total = run_mpc(impl, seed=seed)
    assert np.abs(positions[-10:]).max() < 0.1  # at rest near 0 for the last ten steps
    assert total > -12.0
    assert total > run_random(seed=seed)[1]


def test_reward_helper_is_what_the_docstring_says():
    assert reward(np.array([1.0, 2.0]), 1.0) == pytest.approx(-(1.0 + 0.4 + 0.01))
