"""Reference solution for the Week 3 lab. Try lab.py yourself before reading this."""

from __future__ import annotations

import numpy as np

from cliff import CliffWorld


def epsilon_greedy(Q: np.ndarray, s: int, epsilon: float, rng: np.random.Generator) -> int:
    if rng.random() < epsilon:
        return int(rng.integers(Q.shape[1]))
    return int(np.argmax(Q[s]))


def sarsa_update(Q, s, a, r, s_next, a_next, done, alpha, gamma) -> None:
    target = r + (0.0 if done else gamma * Q[s_next, a_next])
    Q[s, a] += alpha * (target - Q[s, a])


def q_learning_update(Q, s, a, r, s_next, done, alpha, gamma) -> None:
    target = r + (0.0 if done else gamma * np.max(Q[s_next]))
    Q[s, a] += alpha * (target - Q[s, a])


def train(method: str, episodes: int, alpha: float = 0.5, epsilon: float = 0.1, gamma: float = 1.0, seed: int = 0):
    env = CliffWorld()
    rng = np.random.default_rng(seed)
    Q = np.zeros((env.n_states, env.n_actions))
    rewards = []
    for _ in range(episodes):
        s = env.reset()
        a = epsilon_greedy(Q, s, epsilon, rng)
        total = 0.0
        for _ in range(1000):
            s_next, r, done = env.step(a)
            total += r
            a_next = epsilon_greedy(Q, s_next, epsilon, rng)
            if method == "sarsa":
                sarsa_update(Q, s, a, r, s_next, a_next, done, alpha, gamma)
            else:
                q_learning_update(Q, s, a, r, s_next, done, alpha, gamma)
            if done:
                break
            s, a = s_next, a_next
        rewards.append(total)
    return Q, rewards


if __name__ == "__main__":
    from cliff import greedy_route, render_route

    for method in ("q_learning", "sarsa"):
        Q, rewards = train(method, 500)
        route = greedy_route(Q)
        steps = "no route" if route is None else f"{len(route) - 1} steps"
        print(f"\n{method}: greedy route {steps}, average reward over the last 100 episodes {np.mean(rewards[-100:]):.1f}")
        print(render_route(route))
