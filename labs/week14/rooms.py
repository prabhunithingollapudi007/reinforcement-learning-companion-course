"""Provided code for the Week 14 lab: four rooms, and agents that learn in them.

You do not need to change this file. Read `execute` and `train` to see where
each of your functions from lab.py is used.

Cells are numbered row by row from 0 on a 13 x 13 grid. '#' is a wall.
The agent starts in the top-left room and is paid 1 on reaching the goal in the
bottom-right room.
"""

from __future__ import annotations

from collections import deque

import numpy as np

LAYOUT = [
    "#############",
    "#.....#.....#",
    "#.....#.....#",
    "#...........#",
    "#.....#.....#",
    "#.....#.....#",
    "##.####.....#",
    "#.....###.###",
    "#.....#.....#",
    "#.....#.....#",
    "#...........#",
    "#.....#.....#",
    "#############",
]
ROWS, COLS = len(LAYOUT), len(LAYOUT[0])
N_CELLS = ROWS * COLS
STEP = [-COLS, 1, COLS, -1]  # up, right, down, left

GAMMA = 0.95
ALPHA = 0.25
EPSILON = 0.1
WASTED = 6  # steps lost when the low level is asked for something out of reach
MAX_STEPS = 20000


def cell_of(row: int, col: int) -> int:
    return row * COLS + col


def is_wall(cell: int) -> bool:
    return LAYOUT[cell // COLS][cell % COLS] == "#"


def move(cell: int, action: int) -> int:
    nxt = cell + STEP[action]
    return cell if is_wall(nxt) else nxt


DOORS = [cell_of(3, 6), cell_of(6, 2), cell_of(7, 9), cell_of(10, 6)]
START = cell_of(1, 1)
GOAL = cell_of(9, 10)
# Places the high level can ask for: four doorways, the middle of each room, the goal.
LANDMARKS = DOORS + [cell_of(3, 3), cell_of(3, 9), cell_of(9, 3), cell_of(10, 9), GOAL]


def route_to(target: int) -> np.ndarray:
    """first_move[cell] is the first move of a shortest path from cell to target (-1 at the target and in walls)."""
    first = np.full(N_CELLS, -1)
    seen = {target}
    queue = deque([target])
    while queue:
        cell = queue.popleft()
        for a in range(4):
            frm = cell - STEP[a]  # `frm` reaches `cell` by action a
            if 0 <= frm < N_CELLS and not is_wall(frm) and frm not in seen:
                seen.add(frm)
                first[frm] = a
                queue.append(frm)
    return first


ROUTES = [route_to(landmark) for landmark in LANDMARKS]


def _rooms() -> np.ndarray:
    room = np.full(N_CELLS, -1)
    nxt = 0
    for seed in range(N_CELLS):
        if is_wall(seed) or seed in DOORS or room[seed] >= 0:
            continue
        room[seed] = nxt
        queue = deque([seed])
        while queue:
            cell = queue.popleft()
            for a in range(4):
                to = move(cell, a)
                if room[to] < 0 and to not in DOORS:
                    room[to] = nxt
                    queue.append(to)
        nxt += 1
    return room


ROOM = _rooms()


def rooms_of(cell: int) -> set[int]:
    """The room a cell is in, or for a doorway the two rooms it joins."""
    if ROOM[cell] >= 0:
        return {int(ROOM[cell])}
    return {int(ROOM[move(cell, a)]) for a in range(4)} - {-1}


def within_reach(cell: int, landmark: int) -> bool:
    """The low level can only walk to a landmark in a room it is in or at the door of."""
    return bool(rooms_of(cell) & rooms_of(LANDMARKS[landmark]))


def n_choices(kind: str) -> int:
    return 4 if kind == "flat" else len(LANDMARKS)


def execute(impl, kind: str, cell: int, choice: int):
    """Carry out one choice. Returns (next_cell, steps, discounted_reward, reached_goal).

    kind "flat":      choice 0-3 is a single move.
    kind "subgoals":  choice is a landmark number; the low level walks there if it is within reach.
    """
    if kind == "flat":
        nxt = move(cell, choice)
        return nxt, 1, float(nxt == GOAL), nxt == GOAL
    if not within_reach(cell, choice):
        return cell, WASTED, 0.0, False
    if cell == LANDMARKS[choice]:
        return cell, 1, 0.0, False
    return impl.follow_skill(cell, ROUTES[choice], LANDMARKS[choice], GOAL, GAMMA)


def train(impl, kind: str, episodes: int = 30, seed: int = 0) -> list[int]:
    """Q-learning over choices. Returns the number of primitive steps each episode took."""
    rng = np.random.default_rng(seed)
    n = n_choices(kind)
    Q = np.zeros((N_CELLS, n))
    lengths = []
    for _ in range(episodes):
        s, t = START, 0
        while t < MAX_STEPS:
            if rng.random() < EPSILON:
                choice = int(rng.integers(n))
            else:
                choice = int(rng.choice(np.flatnonzero(Q[s] >= Q[s].max() - 1e-12)))
            s2, steps, reward, done = execute(impl, kind, s, choice)
            target = impl.smdp_target(reward, steps, Q[s2], GAMMA, done)
            Q[s, choice] += ALPHA * (target - Q[s, choice])
            s, t = s2, t + steps
            if done:
                break
        lengths.append(t)
    return lengths
