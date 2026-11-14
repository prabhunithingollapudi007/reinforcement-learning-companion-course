"""Week 15 lab: the losses behind RLHF, DPO and reasoning models.

Fill in the four functions below. The toy language model and the training
loops that call your functions are in toy.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import torch
import torch.nn.functional as F  # noqa: F401  (F.logsigmoid is useful below)


def bradley_terry_loss(winner_scores: torch.Tensor, loser_scores: torch.Tensor) -> torch.Tensor:
    """The loss for fitting a reward model to comparisons.

        -mean of log sigmoid(score of the winner - score of the loser)

    Both inputs have shape (n,), one entry per comparison. Return a scalar.
    Use F.logsigmoid rather than torch.log(torch.sigmoid(...)): it is stable for large inputs.
    """
    raise NotImplementedError


def regularised_optimum(ref_probs: torch.Tensor, reward: torch.Tensor, beta: float) -> torch.Tensor:
    """The policy that maximises expected reward minus beta * KL(policy || reference).

        policy(y) is proportional to ref_probs(y) * exp(reward(y) / beta)

    Both inputs have shape (n_responses,). Return probabilities of the same shape.
    Hint: work with logs and finish with torch.softmax, which normalises for you.
    """
    raise NotImplementedError


def dpo_loss(logp_winner, logp_loser, ref_logp_winner, ref_logp_loser, beta: float) -> torch.Tensor:
    """The DPO loss: the Bradley-Terry loss with the reward that a policy implies.

        implied reward of y = beta * (log policy(y) - log reference(y))
        loss = -mean of log sigmoid(implied reward of winner - implied reward of loser)

    Each input has shape (n,): log probabilities of the winning and losing
    response of each comparison, under the policy and under the reference model.
    """
    raise NotImplementedError


def group_advantages(rewards: torch.Tensor) -> torch.Tensor:
    """GRPO advantages. rewards has shape (n_questions, group_size).

    Each answer is compared with the other answers to the SAME question:

        advantage = (reward - mean of its row) / (standard deviation of its row + 1e-8)

    Use the plain standard deviation (divide by the group size, not by one less):
    rewards.std(dim=1, keepdim=True, unbiased=False).
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from toy import HUMAN, REF_PROBS, RESPONSES, sample_pairs, train_dpo, train_grpo, train_reward_model

    me = sys.modules[__name__]
    winners, losers = sample_pairs()
    scores = train_reward_model(me, winners, losers)
    two_stage = regularised_optimum(REF_PROBS, scores, beta=1.0)
    direct = train_dpo(me, winners, losers, beta=1.0)
    print(f"{'response':34s} start   RLHF    DPO")
    for name, a, b, c in zip(RESPONSES, REF_PROBS, two_stage, direct):
        print(f"{name:34s} {a:.3f}  {b:.3f}  {c:.3f}")
    print(f"what people think: start {REF_PROBS @ HUMAN:.2f}, RLHF {two_stage @ HUMAN:.2f}, DPO {direct @ HUMAN:.2f}")
    accuracy = train_grpo(me)
    print(f"GRPO on checkable questions: accuracy {accuracy[0]:.0%} after one step, {accuracy[-1]:.0%} after {len(accuracy)}")
