"""Week 12 lab: search, and planning with a model you learned.

Fill in the four functions below. The decision tree, the cart and the loops
that call your functions are in world.py.

Run the tests from this folder with:

    python -m pytest
"""

from __future__ import annotations

import numpy as np

from world import reward


def uct_scores(child_totals: np.ndarray, child_visits: np.ndarray, parent_visits: int, c: float) -> np.ndarray:
    """The UCT score of each child of a node. The search goes to the child with the highest.

        score = average result of the child + c * sqrt(ln(parent_visits) / child_visits)

    child_totals[i]  sum of the results of all simulations through child i
    child_visits[i]  how many simulations went through child i (always at least 1 here)
    """
    raise NotImplementedError


def fit_linear_model(states: np.ndarray, actions: np.ndarray, next_states: np.ndarray):
    """Learn the dynamics from data, assuming next_state = A @ state + B * action.

    states       shape (n, 2)
    actions      shape (n,)
    next_states  shape (n, 2)

    Return (A, B) with A of shape (2, 2) and B of shape (2,), chosen by least squares.
    Hint: stack states and actions into one (n, 3) input matrix X and solve X @ W = next_states.
    """
    raise NotImplementedError


def imagined_returns(A: np.ndarray, B: np.ndarray, state: np.ndarray, action_sequences: np.ndarray) -> np.ndarray:
    """Roll every candidate action sequence out in the model and add up its rewards.

    state             shape (2,): where the cart really is now
    action_sequences  shape (n, horizon): n candidate plans
    Returns shape (n,): the total reward the model predicts for each plan.

    For each step t: add reward(states, actions_t), then move every imagined state
    forward with states = states @ A.T + actions_t[:, None] * B. `reward` is imported
    from world.py and works on a whole batch at once. No discounting.
    """
    raise NotImplementedError


def plan(A: np.ndarray, B: np.ndarray, state: np.ndarray, horizon: int, n_candidates: int, rng: np.random.Generator) -> float:
    """Random shooting. Return the first action of the best of n_candidates random plans.

    Draw the plans with rng.uniform(-1, 1, size=(n_candidates, horizon)), score them
    with imagined_returns, and return the first action of the highest-scoring one.
    """
    raise NotImplementedError


if __name__ == "__main__":
    import sys

    from world import run_flat, run_mpc, run_random, run_uct

    me = sys.modules[__name__]
    print("Tree search, visits under each first choice:", run_uct(me))
    print("Flat Monte Carlo estimates of each first choice:", np.round(run_flat(), 2))
    positions, total = run_mpc(me)
    print(f"Planning with a learned model: cart ends at {positions[-1]:+.3f}, total reward {total:.2f}")
    positions, total = run_random()
    print(f"Random pushes:                 cart ends at {positions[-1]:+.3f}, total reward {total:.2f}")
