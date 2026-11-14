"""Tests for the Week 2 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from gridworld import exact_values, make_gridworld, optimal_policy, sample_episodes


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


# The episode worked by hand in CS 234 lecture 3: s3, s2, s2, s1, then reward 1.
# States are numbered from 0, so s1 is 0, s2 is 1 and s3 is 2.
LECTURE = [(2, 0.0, 1), (1, 0.0, 1), (1, 0.0, 0), (0, 1.0, None)]

# The A/B example: A is state 0, B is state 1.
AB = [[(0, 0.0, 1), (1, 0.0, None)]] + [[(1, 1.0, None)]] * 6 + [[(1, 0.0, None)]]


def test_returns_are_computed_backwards(impl):
    assert impl.returns([0, 0, 0, 1], 0.5) == pytest.approx([0.125, 0.25, 0.5, 1.0])
    assert impl.returns([2, 3], 1.0) == pytest.approx([5.0, 3.0])
    assert impl.returns([], 0.9) == []


def test_first_visit_on_the_lecture_episode(impl):
    V = impl.monte_carlo([LECTURE], 7, 0.5, first_visit=True)
    assert V[0] == pytest.approx(1.0)
    assert V[1] == pytest.approx(0.25)  # gamma^2: only the first visit to s2 counts
    assert V[2] == pytest.approx(0.125)
    assert np.all(V[3:] == 0)  # never visited


def test_every_visit_on_the_lecture_episode(impl):
    V = impl.monte_carlo([LECTURE], 7, 0.5, first_visit=False)
    assert V[1] == pytest.approx(0.375)  # (gamma^2 + gamma) / 2


def test_td0_passes_information_back_one_step(impl):
    # With alpha = 1, one pass only learns about the state next to the reward.
    V = impl.td0([LECTURE], 7, 0.5, alpha=1.0)
    assert V == pytest.approx([1, 0, 0, 0, 0, 0, 0])
    # A second pass over the same episode carries it one state further.
    V2 = impl.td0([LECTURE, LECTURE], 7, 0.5, alpha=1.0)
    assert V2[1] == pytest.approx(0.5)


def test_td0_uses_the_learning_rate(impl):
    V = impl.td0([[(0, 1.0, None)]], 1, 0.9, alpha=0.1)
    assert V[0] == pytest.approx(0.1)


def test_ab_example_monte_carlo(impl):
    V = impl.monte_carlo(AB, 2, 1.0)
    assert V[1] == pytest.approx(0.75)
    assert V[0] == pytest.approx(0.0)  # the only return ever seen from A


def test_ab_example_certainty_equivalence(impl):
    V = impl.certainty_equivalence(AB, 2, 1.0)
    assert V[1] == pytest.approx(0.75)
    assert V[0] == pytest.approx(0.75)  # A always led to B, so it is worth what B is worth


@pytest.fixture(scope="session")
def gridworld_data():
    world = make_gridworld()
    policy = optimal_policy(world)
    episodes = sample_episodes(world, policy, 3000, seed=0)
    visits = np.zeros(world.n_states)
    for episode in episodes:
        for s, _, _ in episode:
            visits[s] += 1
    return world, episodes, exact_values(world, policy), visits > 300


def test_monte_carlo_approaches_the_exact_values(impl, gridworld_data):
    world, episodes, truth, often = gridworld_data
    V = impl.monte_carlo(episodes, world.n_states, world.gamma)
    assert abs(V[world.start] - truth[world.start]) < 0.03
    assert np.max(np.abs(V - truth)[often]) < 0.04


def test_td0_approaches_the_exact_values(impl, gridworld_data):
    world, episodes, truth, often = gridworld_data
    V = impl.td0(episodes, world.n_states, world.gamma, alpha=0.02)
    assert abs(V[world.start] - truth[world.start]) < 0.06
    assert np.max(np.abs(V - truth)[often]) < 0.1


def test_certainty_equivalence_approaches_the_exact_values(impl, gridworld_data):
    world, episodes, truth, often = gridworld_data
    V = impl.certainty_equivalence(episodes, world.n_states, world.gamma)
    assert abs(V[world.start] - truth[world.start]) < 0.03
    assert np.max(np.abs(V - truth)[often]) < 0.04
