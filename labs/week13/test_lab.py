"""Tests for the Week 13 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from grid import move, success_rate, train


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


def test_target_is_one_when_the_step_arrives_at_the_goal(impl):
    Q = np.full((4, 4, 4), 0.7)
    assert impl.q_target(Q, next_state=2, goal=2, gamma=0.9) == pytest.approx(1.0)


def test_target_bootstraps_from_the_best_action_otherwise(impl):
    Q = np.zeros((4, 4, 4))
    Q[1, 3] = [0.2, 0.5, 0.1, 0.0]  # from cell 1, pursuing goal 3
    Q[1, 2] = [0.9, 0.9, 0.9, 0.9]  # a different goal: must not be used
    assert impl.q_target(Q, next_state=1, goal=3, gamma=0.9) == pytest.approx(0.45)


def test_hindsight_goals_come_only_from_later_in_the_episode(impl):
    states = [10, 11, 12, 13, 14]
    rng = np.random.default_rng(0)
    for t in range(4):
        goals = impl.hindsight_goals(states, t, 50, rng)
        assert len(goals) == 50
        assert set(goals) <= set(states[t + 1 :])
    # From step 1 every later cell should turn up sooner or later.
    assert set(impl.hindsight_goals(states, 1, 200, rng)) == {12, 13, 14}


def test_the_last_step_can_only_be_relabelled_with_the_final_cell(impl):
    assert impl.hindsight_goals([3, 4, 5], 1, 4, np.random.default_rng(0)) == [5, 5, 5, 5]


def test_without_hindsight_a_failed_episode_teaches_nothing(impl):
    # 3 x 3 grid: 0 -> 1 -> 2, but the goal was cell 8.
    Q = np.zeros((9, 9, 4))
    impl.replay_episode(Q, [0, 1, 2], [1, 1], goal=8, k=0, alpha=0.5, gamma=0.9, rng=np.random.default_rng(0))
    assert not Q.any()


def test_with_hindsight_the_same_episode_teaches_how_to_reach_where_it_went(impl):
    Q = np.zeros((9, 9, 4))
    impl.replay_episode(Q, [0, 1, 2], [1, 1], goal=8, k=8, alpha=0.5, gamma=0.9, rng=np.random.default_rng(0))
    assert not Q[:, 8].any()  # still nothing about the goal that was missed
    assert Q[1, 2, 1] > 0  # from cell 1, going right reaches cell 2
    assert Q[0, 1, 1] > 0  # from cell 0, going right reaches cell 1
    assert Q[0, 2, 1] > 0  # and, because the replay runs backwards, cell 2 is known to lie beyond


def test_a_successful_episode_is_learned_in_one_backward_pass(impl):
    # 0 -> 1 -> 2 with goal 2 and alpha = 1: exact values after a single replay.
    Q = np.zeros((9, 9, 4))
    impl.replay_episode(Q, [0, 1, 2], [1, 1], goal=2, k=0, alpha=1.0, gamma=0.9, rng=np.random.default_rng(0))
    assert Q[1, 2, 1] == pytest.approx(1.0)
    assert Q[0, 2, 1] == pytest.approx(0.9)


def test_grid_helper_moves_and_blocks():
    assert move(3, 4, 1) == 5 and move(3, 4, 0) == 1 and move(3, 0, 3) == 0


@pytest.mark.parametrize("seed", [0, 1, 2])
def test_hindsight_learns_far_more_from_the_same_200_episodes(impl, seed):
    plain = success_rate(train(impl, size=6, episodes=200, hindsight=0, seed=seed), 6)
    hindsight = success_rate(train(impl, size=6, episodes=200, hindsight=4, seed=seed), 6)
    assert hindsight > 0.7
    assert hindsight > plain + 0.25


def test_with_800_episodes_hindsight_reaches_nearly_every_goal(impl):
    assert success_rate(train(impl, size=6, episodes=800, hindsight=4, seed=0), 6) > 0.95
