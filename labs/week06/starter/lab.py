"""Week 6 lab: the two pieces that make PPO what it is.

Fill in the two functions below. The actor-critic network and the training
loop are provided in agent.py: read `train_ppo` there to see where each piece
is used.

Run the tests from this folder with:

    python -m pytest

The last test trains on CartPole (about half a minute).
"""

from __future__ import annotations

import torch


def gae(rewards, values, dones, last_value: float, gamma: float, lam: float) -> list[float]:
    """Generalised advantage estimates for a batch of consecutive steps.

    rewards[t], values[t] = V(s_t) and dones[t] (1.0 if the episode ended on
    step t, else 0.0) are lists of the same length. The steps may span several
    episodes. last_value is V of the state after the final step.

    Work backwards. With next_value = values[t + 1] (or last_value at the end)
    and alive = 1 - dones[t]:

        delta_t = rewards[t] + gamma * next_value * alive - values[t]
        A_t     = delta_t + gamma * lam * alive * A_{t+1}

    `alive` stops both the bootstrap and the running sum from leaking across
    the end of an episode.
    """
    raise NotImplementedError


def clipped_objective(new_log_probs: torch.Tensor, old_log_probs: torch.Tensor, advantages: torch.Tensor, epsilon: float) -> torch.Tensor:
    """PPO's clipped surrogate objective (a scalar to be maximised).

        ratio = exp(new_log_probs - old_log_probs)
        objective = mean( min( ratio * A,  clamp(ratio, 1 - eps, 1 + eps) * A ) )
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from agent import train_ppo

    history = train_ppo(sys.modules[__name__])
    print(f"{len(history)} iterations; episode length went from {history[0]:.0f} to {history[-1]:.0f}")
