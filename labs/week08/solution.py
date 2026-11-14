"""Reference solution for the Week 8 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import torch
from torch import nn


def cloning_loss(policy: nn.Module, states: torch.Tensor, actions: torch.Tensor) -> torch.Tensor:
    log_probs = torch.log_softmax(policy(states), dim=1)
    return -log_probs.gather(1, actions.unsqueeze(1)).mean()


def greedy_action(policy: nn.Module, state) -> int:
    with torch.no_grad():
        logits = policy(torch.as_tensor(state, dtype=torch.float32).unsqueeze(0))[0]
    return int(torch.argmax(logits))


def dagger_round(policy: nn.Module, env, expert, seed: int):
    # The LEARNER drives, so the states are the ones it actually reaches.
    state, _ = env.reset(seed=seed)
    states, done = [], False
    while not done:
        states.append(state)
        state, _, terminated, truncated, _ = env.step(greedy_action(policy, state))
        done = terminated or truncated
    # The EXPERT says what it would have done in each of them.
    return states, [expert(s) for s in states]


if __name__ == "__main__":
    import sys

    from agent import run_experiment

    history = run_experiment(sys.modules[__name__])
    print("cloning alone:", round(history[0]), "| after each DAgger round:", [round(h) for h in history[1:]], "| expert: 500")
