# Week 15 lab: the losses behind RLHF, DPO and reasoning models

Four short functions, each a formula from the Week 15 lesson, tried out on a
"language model" with six possible responses:

1. the Bradley-Terry loss that fits a reward model to pairwise comparisons,
2. the exact solution of "maximise reward, stay close to the starting model",
3. the DPO loss, and
4. the group-relative advantages used to train reasoning models.

The tests then confirm two claims from the lesson: DPO lands on the same model as
the two-stage RLHF route, and a checker alone is enough of a reward to learn from.
The toy model and the training loops are provided in `toy.py`. This lab uses PyTorch.

The easiest way to do this lab is on the Week 15 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the four functions. Then, from this folder:

    python -m pytest

`python lab.py` prints the starting model, the RLHF model and the DPO model side by
side, and the accuracy GRPO reaches.

## Files

- `toy.py`: the six responses, `sample_pairs`, `train_reward_model`, `train_dpo`, `train_grpo`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with hand calculations.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Call `regularised_optimum` with the reward model from the lesson's playground,
  `[7.5, 6.0, 3.5, 2.0, 9.5, 0.5]`, for beta = 4, 2, 1 and 0.5, and compute `policy @ HUMAN` each time.
- Collect only 20 comparisons. How much do the RLHF and DPO models change from seed to seed?
- In `train_grpo`, replace your advantages with the raw rewards. Does it still learn? How fast?
- Set `group=2`. Why is learning slower?
