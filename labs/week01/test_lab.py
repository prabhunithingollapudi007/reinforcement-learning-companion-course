"""Tests for the Week 1 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution

The expected numbers are the ones the Week 1 playground displays.
"""

import importlib

import numpy as np
import pytest

from gridworld import make_gridworld


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


@pytest.fixture
def world():
    return make_gridworld()  # gamma 0.9, slip 0.2, no step reward


def at(world, r, c):
    return r * world.shape[1] + c


def test_model_is_a_valid_mdp(world):
    assert np.allclose(world.P.sum(axis=2), 1.0)
    assert world.P.shape == (24, 4, 24)


def test_q_from_v_one_step(impl, world):
    Q = impl.q_from_v(world, np.zeros(world.n_states))
    assert Q.shape == (24, 4)
    # From the cell above the goal, "down" reaches it 80% of the time.
    assert Q[at(world, 0, 5), 2] == pytest.approx(0.8)
    # From the start, "up" slips right into a pit 10% of the time.
    assert Q[world.start, 0] == pytest.approx(-0.1)


def test_value_iteration_matches_the_playground(impl, world):
    V, sweeps = impl.value_iteration(world)
    assert V[world.start] == pytest.approx(0.1842, abs=1e-4)
    assert V[at(world, 0, 0)] == pytest.approx(0.4958, abs=1e-3)
    assert V[at(world, 2, 5)] == pytest.approx(0.9603, abs=1e-3)
    assert V[at(world, 1, 5)] == 0.0  # the goal itself is terminal
    assert 20 < sweeps < 200


def test_no_slip_gives_gamma_to_the_sixth(impl):
    world = make_gridworld(slip=0.0)
    V, _ = impl.value_iteration(world)
    assert V[world.start] == pytest.approx(0.9**6)  # seven moves to a +1 goal


def test_greedy_policy_of_optimal_values(impl, world):
    V, _ = impl.value_iteration(world)
    policy = impl.policy_improvement(world, V)
    assert policy[world.start] == 0  # up
    assert policy[at(world, 0, 5)] == 2  # down into the goal
    # Evaluating the greedy policy of V* gives V* back.
    assert np.allclose(impl.policy_evaluation(world, policy), V, atol=1e-6)


def test_policy_evaluation_of_a_bad_policy(impl, world):
    always_right = np.full(world.n_states, 1)
    V = impl.policy_evaluation(world, always_right)
    V_star, _ = impl.value_iteration(world)
    assert np.all(V <= V_star + 1e-8)  # no policy beats the optimum anywhere
    assert V[world.start] < 0  # walking right from S goes into a pit


def test_policy_iteration_agrees_with_value_iteration(impl, world):
    _, V, rounds = impl.policy_iteration(world)
    V_star, sweeps = impl.value_iteration(world)
    assert np.allclose(V, V_star, atol=1e-6)
    assert rounds == 7
    assert rounds < sweeps


@pytest.mark.parametrize(
    "kwargs, first_action",
    [
        ({"slip": 0.25}, 3),  # pushes into the left wall
        ({"step_reward": -0.28}, 1),  # walks right, into the pit
        ({"gamma": 0.99}, 3),  # patient: pushes into the wall
        ({"gamma": 0.8}, 3),  # impatient: same action, opposite reason
    ],
)
def test_the_specification_changes_the_behaviour(impl, kwargs, first_action):
    world = make_gridworld(**kwargs)
    V, _ = impl.value_iteration(world)
    assert impl.policy_improvement(world, V)[world.start] == first_action
