"""Week 7 lab: an off-policy actor-critic.

Fill in the three functions below. The networks, the replay buffer and the
training loop are provided in agent.py: read `train_actor_critic` there to see
where each piece is used.

Both networks take a batch of states and return one number per action:
`policy(states)` gives logits, `q_net(states)` gives Q-values.
`alpha` is the weight of the entropy bonus: a small reward for keeping the
policy random, which is what keeps it exploring.

Run the tests from this folder with:

    python -m pytest

The last test trains on CartPole (about half a minute).
"""

from __future__ import annotations

import torch
from torch import nn


def next_state_value(policy: nn.Module, target_q: nn.Module, next_states: torch.Tensor, alpha: float) -> torch.Tensor:
    """The value of each next state under the CURRENT policy. Shape (batch,).

        V(s') = sum over a' of  pi(a' | s') * ( Q_target(s', a') - alpha * log pi(a' | s') )

    This is the step that makes old data usable: the next action is not read
    from the buffer, it is averaged over what the current policy would do.
    Use torch.log_softmax(policy(next_states), dim=1) for the log-probabilities.
    """
    raise NotImplementedError


def critic_loss(q_net: nn.Module, states: torch.Tensor, actions: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
    """Mean squared error between Q(s, a) for the stored actions and the targets."""
    raise NotImplementedError


def actor_loss(policy: nn.Module, q_net: nn.Module, states: torch.Tensor, alpha: float) -> torch.Tensor:
    """A scalar to minimise, so that the policy prefers actions with high Q:

        loss = mean over states of  sum over a of  pi(a | s) * ( alpha * log pi(a | s) - Q(s, a) )

    Q is the judge here, not the thing being trained: detach it.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    import numpy as np

    from agent import train_actor_critic

    returns = train_actor_critic(sys.modules[__name__])
    print(f"{len(returns)} episodes; first ten averaged {np.mean(returns[:10]):.0f}, last ten averaged {np.mean(returns[-10:]):.0f}")
