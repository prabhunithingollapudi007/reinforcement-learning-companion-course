"""Reference solution for the Week 15 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import torch
import torch.nn.functional as F


def bradley_terry_loss(winner_scores: torch.Tensor, loser_scores: torch.Tensor) -> torch.Tensor:
    return -F.logsigmoid(winner_scores - loser_scores).mean()


def regularised_optimum(ref_probs: torch.Tensor, reward: torch.Tensor, beta: float) -> torch.Tensor:
    return torch.softmax(ref_probs.log() + reward / beta, dim=0)


def dpo_loss(logp_winner, logp_loser, ref_logp_winner, ref_logp_loser, beta: float) -> torch.Tensor:
    implied_winner = beta * (logp_winner - ref_logp_winner)
    implied_loser = beta * (logp_loser - ref_logp_loser)
    # Exactly the Bradley-Terry loss, applied to the rewards the policy implies.
    return bradley_terry_loss(implied_winner, implied_loser)


def group_advantages(rewards: torch.Tensor) -> torch.Tensor:
    mean = rewards.mean(dim=1, keepdim=True)
    std = rewards.std(dim=1, keepdim=True, unbiased=False)
    return (rewards - mean) / (std + 1e-8)


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
