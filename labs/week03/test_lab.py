"""Tests for the Week 3 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from cliff import CliffWorld, greedy_route


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


def test_epsilon_zero_is_greedy(impl):
    Q = np.zeros((3, 4))
    Q[1] = [0.1, 0.9, -0.2, 0.3]
    rng = np.random.default_rng(0)
    assert all(impl.epsilon_greedy(Q, 1, 0.0, rng) == 1 for _ in range(50))


def test_epsilon_one_is_uniform(impl):
    Q = np.zeros((3, 4))
    Q[1] = [0.1, 0.9, -0.2, 0.3]
    rng = np.random.default_rng(0)
    counts = np.bincount([impl.epsilon_greedy(Q, 1, 1.0, rng) for _ in range(8000)], minlength=4)
    assert np.all(np.abs(counts / 8000 - 0.25) < 0.03)


def test_epsilon_greedy_probabilities(impl):
    # With 4 actions and epsilon 0.2 the greedy action is chosen 1 - 0.2 + 0.2/4 = 85% of the time.
    Q = np.zeros((3, 4))
    Q[1] = [0.1, 0.9, -0.2, 0.3]
    rng = np.random.default_rng(1)
    picks = [impl.epsilon_greedy(Q, 1, 0.2, rng) for _ in range(20000)]
    assert np.mean(np.array(picks) == 1) == pytest.approx(0.85, abs=0.02)


def small_q():
    Q = np.zeros((3, 2))
    Q[0] = [1.0, 0.0]
    Q[1] = [2.0, 5.0]
    return Q


def test_sarsa_uses_the_action_actually_taken(impl):
    Q = small_q()
    # Next action is 0, worth 2: target = 1 + 0.9 * 2 = 2.8, so Q[0, 0] moves halfway from 1 to 2.8.
    impl.sarsa_update(Q, s=0, a=0, r=1.0, s_next=1, a_next=0, done=False, alpha=0.5, gamma=0.9)
    assert Q[0, 0] == pytest.approx(1.9)


def test_q_learning_uses_the_best_next_action(impl):
    Q = small_q()
    # Best next action is worth 5: target = 1 + 0.9 * 5 = 5.5, so Q[0, 0] moves halfway from 1 to 5.5.
    impl.q_learning_update(Q, s=0, a=0, r=1.0, s_next=1, done=False, alpha=0.5, gamma=0.9)
    assert Q[0, 0] == pytest.approx(3.25)


def test_nothing_follows_the_end_of_an_episode(impl):
    Q = small_q()
    impl.sarsa_update(Q, s=0, a=1, r=-100.0, s_next=1, a_next=1, done=True, alpha=0.5, gamma=0.9)
    assert Q[0, 1] == pytest.approx(-50.0)
    Q = small_q()
    impl.q_learning_update(Q, s=0, a=1, r=-100.0, s_next=1, done=True, alpha=0.5, gamma=0.9)
    assert Q[0, 1] == pytest.approx(-50.0)


def test_train_returns_a_table_and_one_reward_per_episode(impl):
    Q, rewards = impl.train("sarsa", 20, seed=0)
    assert Q.shape == (CliffWorld.n_states, CliffWorld.n_actions)
    assert len(rewards) == 20
    assert all(r <= -11 for r in rewards)  # no episode can beat the shortest route


@pytest.fixture(scope="session")
def trained(impl):
    return {m: [impl.train(m, 500, seed=seed) for seed in range(4)] for m in ("q_learning", "sarsa")}


def test_q_learning_finds_the_shortest_route(trained):
    for Q, _ in trained["q_learning"]:
        route = greedy_route(Q)
        assert route is not None
        assert len(route) - 1 == 11  # up, nine steps along the edge, down


def test_sarsa_takes_a_longer_safer_route(trained):
    for Q, _ in trained["sarsa"]:
        route = greedy_route(Q)
        assert route is not None
        assert len(route) - 1 > 11
        # It never walks along the row directly above the cliff.
        edge_row = [s for s in route[1:-1] if s // 10 == 2 and 0 < s % 10 < 9]
        assert not edge_row


def test_sarsa_does_better_while_still_exploring(trained):
    sarsa = np.mean([np.mean(rewards[-100:]) for _, rewards in trained["sarsa"]])
    q_learning = np.mean([np.mean(rewards[-100:]) for _, rewards in trained["q_learning"]])
    assert sarsa > q_learning + 5
