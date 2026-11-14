"""Tests for the Week 15 lab.

    python -m pytest                      checks lab.py
    python -m pytest --impl solution      checks the reference solution
"""

import importlib
import math

import pytest
import torch

from toy import HUMAN, REF_PROBS, sample_pairs, train_dpo, train_grpo, train_reward_model


@pytest.fixture(scope="session")
def impl(request):
    return importlib.import_module(request.config.getoption("--impl"))


@pytest.fixture(scope="session")
def pairs():
    return sample_pairs(200, seed=0)


# ---- reward model ----


def test_equal_scores_give_the_loss_of_a_coin_flip(impl):
    loss = impl.bradley_terry_loss(torch.zeros(5), torch.zeros(5))
    assert loss.item() == pytest.approx(math.log(2))


def test_bradley_terry_matches_a_hand_calculation(impl):
    # Differences 2 and -1: -(log sigmoid(2) + log sigmoid(-1)) / 2 = (0.1269 + 1.3133) / 2
    loss = impl.bradley_terry_loss(torch.tensor([3.0, 0.0]), torch.tensor([1.0, 1.0]))
    assert loss.item() == pytest.approx(0.7201, abs=1e-4)


def test_bradley_terry_is_stable_for_huge_score_gaps(impl):
    loss = impl.bradley_terry_loss(torch.tensor([-1000.0]), torch.tensor([1000.0]))
    assert torch.isfinite(loss) and loss.item() == pytest.approx(2000.0)


def test_the_fitted_reward_model_ranks_responses_as_people_do(impl, pairs):
    scores = train_reward_model(impl, *pairs)
    assert scores.argmax().item() == HUMAN.argmax().item()
    assert scores[0] > scores[2] > scores[5]


# ---- the regularised optimum ----


def test_optimum_matches_a_hand_calculation(impl):
    # Reference (0.5, 0.5), rewards (ln 3, 0), beta 1: weights 1.5 and 0.5.
    policy = impl.regularised_optimum(torch.tensor([0.5, 0.5]), torch.tensor([math.log(3), 0.0]), 1.0)
    assert policy.tolist() == pytest.approx([0.75, 0.25])


def test_a_long_leash_changes_little_and_a_short_one_a_lot(impl):
    reward = torch.tensor([7.5, 6.0, 3.5, 2.0, 9.5, 0.5])
    gentle = impl.regularised_optimum(REF_PROBS, reward, 100.0)
    harsh = impl.regularised_optimum(REF_PROBS, reward, 0.2)
    assert gentle.tolist() == pytest.approx(REF_PROBS.tolist(), abs=0.02)
    assert harsh[4].item() == pytest.approx(1.0, abs=1e-3)
    assert gentle.sum().item() == pytest.approx(1.0) and harsh.sum().item() == pytest.approx(1.0)


# ---- DPO ----


def test_dpo_loss_at_the_reference_model_is_log_two(impl):
    logp = REF_PROBS.log()
    loss = impl.dpo_loss(logp[[0, 1]], logp[[2, 3]], logp[[0, 1]], logp[[2, 3]], beta=1.0)
    assert loss.item() == pytest.approx(math.log(2))


def test_dpo_loss_matches_a_hand_calculation(impl):
    # Winner's log ratio +0.5, loser's -0.5, beta 2: margin 2, loss -log sigmoid(2).
    loss = impl.dpo_loss(torch.tensor([-1.0]), torch.tensor([-2.0]), torch.tensor([-1.5]), torch.tensor([-1.5]), beta=2.0)
    assert loss.item() == pytest.approx(0.1269, abs=1e-4)


def test_dpo_reaches_the_same_model_as_the_two_stage_route(impl, pairs):
    scores = train_reward_model(impl, *pairs)
    two_stage = impl.regularised_optimum(REF_PROBS, scores, 1.0)
    direct = train_dpo(impl, *pairs, beta=1.0)
    assert direct.tolist() == pytest.approx(two_stage.tolist(), abs=0.005)
    assert (direct @ HUMAN).item() > (REF_PROBS @ HUMAN).item() + 1.5


# ---- GRPO ----


def test_group_advantages_match_a_hand_calculation(impl):
    # Two right out of eight: mean 0.25, standard deviation 0.433.
    adv = impl.group_advantages(torch.tensor([[1.0, 0, 0, 1, 0, 0, 0, 0]]))
    assert adv[0, 0].item() == pytest.approx(1.732, abs=1e-3)
    assert adv[0, 1].item() == pytest.approx(-0.577, abs=1e-3)


def test_each_question_is_normalised_separately(impl):
    adv = impl.group_advantages(torch.tensor([[1.0, 0.0, 0.0, 0.0], [10.0, 0.0, 0.0, 0.0]]))
    assert adv[0].tolist() == pytest.approx(adv[1].tolist())
    assert adv.sum(dim=1).tolist() == pytest.approx([0.0, 0.0], abs=1e-5)


def test_a_question_answered_all_right_or_all_wrong_gives_no_signal(impl):
    adv = impl.group_advantages(torch.tensor([[1.0, 1.0, 1.0], [0.0, 0.0, 0.0]]))
    assert torch.isfinite(adv).all() and adv.abs().max().item() < 1e-4


def test_grpo_learns_the_answers_from_a_checker_alone(impl):
    accuracy = train_grpo(impl)
    assert accuracy[0] < 0.2  # starts by guessing among ten answers
    assert accuracy[-1] > 0.9
