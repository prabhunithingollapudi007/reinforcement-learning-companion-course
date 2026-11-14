"""Tests for the Week 14 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from rooms import DOORS, GOAL, LANDMARKS, ROUTES, START, cell_of, train, within_reach


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


# ---- long tasks ----


def test_one_unbroken_attempt_is_p_to_the_power_of_the_length(impl):
    assert impl.success_with_retries(0.99, 200, 1, 0) == pytest.approx(0.99**200)


def test_cutting_into_pieces_without_retries_changes_nothing(impl):
    assert impl.success_with_retries(0.99, 200, 10, 0) == pytest.approx(0.99**200)


def test_retries_help_a_great_deal(impl):
    # One piece of 20 steps succeeds with q = 0.99 ** 20 = 0.8179.
    # With 2 retries: 1 - (1 - q) ** 3 = 0.99396. Ten such pieces: 0.9412.
    assert impl.success_with_retries(0.99, 200, 10, 2) == pytest.approx(0.9412, abs=1e-4)
    assert impl.success_with_retries(0.99, 200, 10, 1) == pytest.approx(0.7137, abs=1e-4)


# ---- running a skill ----


def test_skill_walks_to_its_target_by_the_shortest_route(impl):
    # From the start to the top doorway is 7 steps.
    cell, steps, reward, reached = impl.follow_skill(START, ROUTES[0], LANDMARKS[0], GOAL, 0.95)
    assert (cell, steps, reward, bool(reached)) == (DOORS[0], 7, 0.0, False)


def test_skill_that_arrives_at_the_goal_is_paid_with_discounting(impl):
    # From the right-hand doorway, the goal is 3 steps away. The 1 arrives on the third step.
    cell, steps, reward, reached = impl.follow_skill(DOORS[2], ROUTES[8], GOAL, GOAL, 0.9)
    assert cell == GOAL and steps == 3 and bool(reached)
    assert reward == pytest.approx(0.9**2)


def test_skill_stops_if_it_crosses_the_goal_on_the_way_elsewhere(impl):
    # Walking from just right of the goal to the middle of the bottom-right room passes over the goal.
    start = cell_of(9, 11)
    assert ROUTES[7][start] == 3  # the route's first move is left, onto the goal
    cell, steps, reward, reached = impl.follow_skill(start, ROUTES[7], LANDMARKS[7], GOAL, 0.9)
    assert cell == GOAL and steps == 1 and bool(reached)
    assert reward == pytest.approx(1.0)


# ---- the SMDP update ----


def test_target_when_the_episode_ended_is_just_the_reward(impl):
    assert impl.smdp_target(0.81, 3, np.array([5.0, 7.0]), 0.9, True) == pytest.approx(0.81)


def test_target_discounts_the_future_by_the_time_the_skill_took(impl):
    assert impl.smdp_target(0.0, 7, np.array([0.2, 0.5, 0.1]), 0.9, False) == pytest.approx(0.9**7 * 0.5)


def test_with_one_step_it_is_ordinary_q_learning(impl):
    assert impl.smdp_target(1.0, 1, np.array([2.0, 3.0]), 0.5, False) == pytest.approx(1.0 + 0.5 * 3.0)


# ---- putting it together ----


def test_world_helper_knows_what_is_within_reach():
    assert within_reach(START, 0) and not within_reach(START, 8)


@pytest.mark.parametrize("seed", [0, 1, 2])
def test_subgoals_learn_four_rooms_many_times_faster_than_single_moves(impl, seed):
    flat = train(impl, "flat", episodes=30, seed=seed)
    subgoals = train(impl, "subgoals", episodes=30, seed=seed)
    assert sum(subgoals) < sum(flat) / 4
    # By the end the subgoal agent is close to the 17-step shortest path.
    assert np.mean(subgoals[-5:]) < 30
