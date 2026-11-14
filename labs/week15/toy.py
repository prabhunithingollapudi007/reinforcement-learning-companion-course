"""Provided code for the Week 15 lab: a language model small enough to solve exactly.

You do not need to change this file. Read the three `train_*` functions to see
where each of your functions from lab.py is used.

Part 1 and 2. One prompt, six possible responses. The "language model" is a
vector of six logits. People compare pairs of responses.

Part 3. Twenty arithmetic questions, ten possible answers each, and a checker
that says whether an answer is right. The "language model" is a table of logits.
"""

from __future__ import annotations

import numpy as np
import torch

RESPONSES = [
    "accurate and concise",
    "accurate but rambling",
    "vague generalities",
    "confident, one invented fact",
    "flattering and heavily formatted",
    "off topic",
]
REF_PROBS = torch.tensor([0.20, 0.30, 0.25, 0.10, 0.05, 0.10])
HUMAN = torch.tensor([8.0, 6.0, 3.0, 1.0, 2.0, 0.5])  # what people think of each response


def sample_pairs(n: int = 200, seed: int = 0):
    """n comparisons. Returns (winners, losers): two integer tensors of response numbers.

    The better response usually wins, not always (the Bradley-Terry model).
    """
    rng = np.random.default_rng(seed)
    winners, losers = [], []
    for _ in range(n):
        i, j = rng.choice(len(RESPONSES), size=2, replace=False)
        p_i_wins = 1 / (1 + np.exp(-(HUMAN[i].item() - HUMAN[j].item()) / 2))
        if rng.random() < p_i_wins:
            winners.append(i), losers.append(j)
        else:
            winners.append(j), losers.append(i)
    return torch.tensor(winners), torch.tensor(losers)


def train_reward_model(impl, winners, losers, steps: int = 3000, lr: float = 0.05) -> torch.Tensor:
    """Fit one score per response to the comparisons. Returns the six scores, centred on zero."""
    scores = torch.zeros(len(RESPONSES), requires_grad=True)
    optimiser = torch.optim.Adam([scores], lr=lr)
    for _ in range(steps):
        loss = impl.bradley_terry_loss(scores[winners], scores[losers])
        optimiser.zero_grad()
        loss.backward()
        optimiser.step()
    scores = scores.detach()
    return scores - scores.mean()


def train_dpo(impl, winners, losers, beta: float = 1.0, steps: int = 3000, lr: float = 0.05) -> torch.Tensor:
    """Run DPO from the reference model. Returns the final probabilities of the six responses."""
    ref_logp = REF_PROBS.log()
    logits = ref_logp.clone().requires_grad_(True)
    optimiser = torch.optim.Adam([logits], lr=lr)
    for _ in range(steps):
        logp = torch.log_softmax(logits, dim=0)
        loss = impl.dpo_loss(logp[winners], logp[losers], ref_logp[winners], ref_logp[losers], beta)
        optimiser.zero_grad()
        loss.backward()
        optimiser.step()
    return torch.softmax(logits.detach(), dim=0)


# ---------------------------------------------------------------------------
# Part 3: questions with checkable answers.
# ---------------------------------------------------------------------------

N_QUESTIONS, N_ANSWERS = 20, 10


def correct_answers(seed: int = 0) -> torch.Tensor:
    return torch.tensor(np.random.default_rng(seed).integers(N_ANSWERS, size=N_QUESTIONS))


def train_grpo(impl, group: int = 8, steps: int = 300, lr: float = 4.0, seed: int = 0):
    """Policy gradient with group-relative advantages. Returns the accuracy after each step.

    Each step, every question is answered `group` times, a checker marks each
    answer right (1) or wrong (0), and the model is updated with
        loss = -(advantage * log probability of the sampled answer).mean()
    """
    torch.manual_seed(seed)
    truth = correct_answers(seed)
    logits = torch.zeros(N_QUESTIONS, N_ANSWERS, requires_grad=True)
    optimiser = torch.optim.SGD([logits], lr=lr)
    accuracy = []
    for _ in range(steps):
        logp = torch.log_softmax(logits, dim=1)
        answers = torch.multinomial(logp.exp().detach(), group, replacement=True)  # (questions, group)
        rewards = (answers == truth[:, None]).float()
        advantages = impl.group_advantages(rewards)
        loss = -(advantages.detach() * logp.gather(1, answers)).mean()
        optimiser.zero_grad()
        loss.backward()
        optimiser.step()
        with torch.no_grad():
            accuracy.append(torch.softmax(logits, dim=1)[torch.arange(N_QUESTIONS), truth].mean().item())
    return accuracy
