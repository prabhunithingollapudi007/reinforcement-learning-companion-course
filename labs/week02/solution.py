"""Reference solution for the Week 2 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np

# An episode is a list of (state, reward, next_state) steps.
# next_state is None on the step that ends the episode.


def returns(rewards: list[float], gamma: float) -> list[float]:
    G = [0.0] * len(rewards)
    running = 0.0
    for t in reversed(range(len(rewards))):
        running = rewards[t] + gamma * running
        G[t] = running
    return G


def monte_carlo(episodes, n_states: int, gamma: float, first_visit: bool = True) -> np.ndarray:
    total = np.zeros(n_states)
    count = np.zeros(n_states)
    for episode in episodes:
        G = returns([r for _, r, _ in episode], gamma)
        seen = set()
        for t, (s, _, _) in enumerate(episode):
            if first_visit and s in seen:
                continue
            seen.add(s)
            total[s] += G[t]
            count[s] += 1
    return np.divide(total, count, out=np.zeros(n_states), where=count > 0)


def td0(episodes, n_states: int, gamma: float, alpha: float) -> np.ndarray:
    V = np.zeros(n_states)
    for episode in episodes:
        for s, r, s_next in episode:
            target = r + (0.0 if s_next is None else gamma * V[s_next])
            V[s] += alpha * (target - V[s])
    return V


def certainty_equivalence(episodes, n_states: int, gamma: float) -> np.ndarray:
    count = np.zeros(n_states)
    reward_sum = np.zeros(n_states)
    transitions = np.zeros((n_states, n_states))
    for episode in episodes:
        for s, r, s_next in episode:
            count[s] += 1
            reward_sum[s] += r
            if s_next is not None:
                transitions[s, s_next] += 1
    visited = count > 0
    R_hat = np.divide(reward_sum, count, out=np.zeros(n_states), where=visited)
    P_hat = np.divide(transitions, count[:, None], out=np.zeros_like(transitions), where=visited[:, None])
    # Solve V = R + gamma P V for the fitted model.
    return np.linalg.solve(np.eye(n_states) - gamma * P_hat, R_hat)


if __name__ == "__main__":
    from gridworld import exact_values, make_gridworld, optimal_policy, sample_episodes

    world = make_gridworld()
    policy = optimal_policy(world)
    episodes = sample_episodes(world, policy, 2000, seed=0)
    truth = exact_values(world, policy)
    for name, V in [
        ("exact (from the model)", truth),
        ("Monte Carlo", monte_carlo(episodes, world.n_states, world.gamma)),
        ("TD(0), alpha 0.05", td0(episodes, world.n_states, world.gamma, 0.05)),
        ("certainty equivalence", certainty_equivalence(episodes, world.n_states, world.gamma)),
    ]:
        print(f"\n{name}  (value at start {V[world.start]:.3f})")
        print(world.render(V, policy))
