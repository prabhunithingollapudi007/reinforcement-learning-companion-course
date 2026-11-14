"""Week 8 lab: behaviour cloning and DAgger.

Fill in the three functions below. The expert, the policy network and the
experiment are provided in agent.py: read `run_experiment` there to see where
each piece is used.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import torch
from torch import nn


def cloning_loss(policy: nn.Module, states: torch.Tensor, actions: torch.Tensor) -> torch.Tensor:
    """The behaviour cloning loss: minus the average log-probability the policy
    gives to the expert's actions.

    policy(states) returns logits, shape (N, n_actions). Turn them into
    log-probabilities with torch.log_softmax(..., dim=1), pick out the entry for
    each expert action with .gather, average, and negate.
    """
    raise NotImplementedError


def greedy_action(policy: nn.Module, state) -> int:
    """The most likely action for one state (a NumPy array of 4 numbers), as an int.

    No gradients are needed here.
    """
    raise NotImplementedError


def dagger_round(policy: nn.Module, env, expert, seed: int):
    """One round of DAgger data collection. Returns (states, expert_actions).

    Start with env.reset(seed=seed). Let the LEARNER drive: at every step record
    the state, then step the environment with greedy_action(policy, state),
    until the episode ends (terminated or truncated).

    Then label every recorded state with what the EXPERT would have done there:
    expert(state). The learner's own actions are not returned.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from agent import run_experiment

    history = run_experiment(sys.modules[__name__])
    print("cloning alone:", round(history[0]), "| after each DAgger round:", [round(h) for h in history[1:]], "| expert: 500")
