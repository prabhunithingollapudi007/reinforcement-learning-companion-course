"""Tests for the Week 16 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib

import numpy as np
import pytest

from world import START, SUCCESS, TARGET, improve, miss, real_floors, run_adaptive


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


# ---- Part 1 ----


def test_slide_distance_matches_the_physics(impl):
    # speed 2 m/s, friction 0.4, g = 10: 4 / 8 = 0.5 m
    assert impl.slide_distance(2.0, 0.4) == pytest.approx(0.5)
    assert impl.slide_distance(2.0, np.array([0.2, 0.4])) == pytest.approx([1.0, 0.5])


def test_the_tuned_speed_lands_on_the_target_in_its_own_simulator(impl):
    for friction in (0.2, 0.4, 0.8):
        assert impl.slide_distance(impl.speed_for(friction), friction) == pytest.approx(TARGET)
    assert impl.speed_for(0.4) == pytest.approx(np.sqrt(8.0))


def test_it_misses_when_the_real_floor_is_different(impl):
    speed = impl.speed_for(0.4)
    assert miss(impl, speed, 0.3) == pytest.approx(1 / 3, abs=1e-6)  # 33 cm too far
    assert miss(impl, speed, 0.6) == pytest.approx(-1 / 3, abs=1e-6)  # 33 cm short
    assert miss(impl, speed, 0.2) == pytest.approx(1.0)


def test_robust_speed_matches_a_hand_calculation(impl):
    # Two floors, 0.2 and 0.5: mean(1/f) = 3.5, mean(1/f^2) = 14.5, so s = 3.5 / 14.5.
    assert impl.robust_speed(np.array([0.2, 0.5])) == pytest.approx(np.sqrt(20 * 3.5 / 14.5))


def test_robust_speed_is_the_best_single_speed_for_its_range(impl):
    floors = np.linspace(0.2, 0.6, 41)
    best = impl.robust_speed(floors)

    def cost(speed):
        return float(np.mean(miss(impl, speed, floors) ** 2))

    assert cost(best) < cost(best * 1.02) and cost(best) < cost(best * 0.98)
    assert cost(best) < cost(impl.speed_for(0.4))


def test_robust_speed_is_a_cautious_compromise(impl):
    floors = np.linspace(0.2, 0.6, 41)
    nominal, robust = impl.speed_for(0.4), impl.robust_speed(floors)
    assert robust < nominal
    # Its worst miss over the range is smaller ...
    assert np.abs(miss(impl, robust, floors)).max() < np.abs(miss(impl, nominal, floors)).max() - 0.3
    # ... but it is no longer right on the floor the simulator assumed.
    assert miss(impl, robust, 0.4) == pytest.approx(-0.185, abs=0.005)


def test_friction_is_recovered_exactly_from_a_perfect_measurement(impl):
    for friction in (0.25, 0.5, 0.75):
        assert impl.estimate_friction(1.0, impl.slide_distance(1.0, friction)) == pytest.approx(friction)


def test_adapting_lands_close_on_every_floor(impl):
    landings = np.array([run_adaptive(impl, f, measurement_error=0.05) for f in real_floors()])
    assert np.abs(landings - TARGET).max() < 0.05
    perfect = np.array([run_adaptive(impl, f, measurement_error=0.0) for f in real_floors()])
    assert perfect == pytest.approx(TARGET)


# ---- Part 2 ----


def test_imitating_successes_reweights_by_success_rate(impl):
    new = impl.imitate_successes(START, SUCCESS)
    assert new.sum() == pytest.approx(1.0)
    assert new == pytest.approx(START * SUCCESS / 0.807)


def test_imitating_successes_never_makes_the_policy_worse(impl):
    history = improve(impl, "successes")
    assert history[0] == pytest.approx(0.807)
    assert all(b > a for a, b in zip(history, history[1:]))
    assert history[-1] == pytest.approx(0.943, abs=0.001)


def test_better_than_average_keeps_only_the_good_options(impl):
    new = impl.imitate_better_than_average(START, SUCCESS)
    # Average 0.807: the 0.99 and 0.85 options stay, in proportion 0.3 : 0.4.
    assert new == pytest.approx([3 / 7, 4 / 7, 0.0, 0.0])


def test_better_than_average_reaches_the_best_option_in_two_rounds(impl):
    history = improve(impl, "advantage")
    assert history[1] == pytest.approx(0.91, abs=0.001)
    assert history[2] == pytest.approx(0.99)
    assert history[-1] == pytest.approx(0.99)  # and then stays put


def test_a_policy_with_one_option_is_left_alone(impl):
    shares = np.array([1.0, 0.0, 0.0, 0.0])
    assert impl.imitate_better_than_average(shares, SUCCESS) == pytest.approx(shares)
