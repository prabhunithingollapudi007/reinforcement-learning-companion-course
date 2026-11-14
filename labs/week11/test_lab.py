"""Tests for the Week 11 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from corridor import run_epsilon_greedy, run_optimistic


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


def test_bonus_shrinks_with_the_square_root_of_the_count(impl):
    bonus = impl.exploration_bonus(np.array([[1.0, 4.0], [100.0, 25.0]]), beta=0.5)
    assert bonus == pytest.approx(np.array([[0.5, 0.25], [0.05, 0.1]]))


def test_bonus_is_zero_for_untried_pairs_and_never_divides_by_zero(impl):
    with np.errstate(all="raise"):
        bonus = impl.exploration_bonus(np.array([[0.0, 4.0]]), beta=0.5)
    assert bonus == pytest.approx(np.array([[0.0, 0.25]]))


def test_untried_pairs_are_assumed_to_be_as_good_as_possible(impl):
    counts = np.zeros((3, 2))
    Q = impl.optimistic_q(np.zeros((3, 2)), np.zeros((3, 2), dtype=int), counts, 0.5, 0.9, 10.0)
    assert Q == pytest.approx(np.full((3, 2), 10.0))


def test_optimistic_q_matches_a_hand_calculation(impl):
    # Two states. From state 0: action 0 was tried twice (total reward 0.1, led back to 0),
    # action 1 was tried once (reward 0, led to state 1). Nothing has been tried from state 1.
    reward_sum = np.array([[0.1, 0.0], [0.0, 0.0]])
    next_state = np.array([[0, 1], [0, 0]])
    counts = np.array([[2.0, 1.0], [0.0, 0.0]])
    Q = impl.optimistic_q(reward_sum, next_state, counts, beta=0.5, gamma=0.9, v_max=10.0)
    assert Q[1] == pytest.approx([10.0, 10.0])
    # Action 1: 0 + 0.5 / sqrt(1) + 0.9 * 10 = 9.5.  So V(0) = 9.5.
    assert Q[0, 1] == pytest.approx(9.5)
    # Action 0: 0.05 + 0.5 / sqrt(2) + 0.9 * 9.5
    assert Q[0, 0] == pytest.approx(0.05 + 0.5 / np.sqrt(2) + 0.9 * 9.5, abs=1e-4)


def test_the_plan_heads_for_the_unknown(impl):
    # The far-away untried state makes "advance" look better than a small sure reward.
    reward_sum = np.array([[0.5, 0.0], [0.0, 0.0]])
    next_state = np.array([[0, 1], [0, 0]])
    counts = np.array([[10.0, 1.0], [0.0, 0.0]])
    Q = impl.optimistic_q(reward_sum, next_state, counts, beta=0.5, gamma=0.9, v_max=10.0)
    assert np.argmax(Q[0]) == 1


@pytest.mark.parametrize("n, by_episode", [(6, 10), (8, 12), (12, 16)])
def test_optimism_reaches_the_far_reward_in_about_n_episodes(impl, n, by_episode):
    first_success, returns = run_optimistic(impl, n)
    assert first_success is not None and first_success <= by_episode
    assert returns[-1] == pytest.approx(5.0)  # and then collects it every episode


def test_epsilon_greedy_does_not_on_the_same_corridor():
    assert all(run_epsilon_greedy(8, episodes=300, seed=seed)[0] is None for seed in range(5))
