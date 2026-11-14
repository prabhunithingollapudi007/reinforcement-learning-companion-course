# Week 16 lab: crossing the gap, and improving a pretrained policy

Two parts, matching the two halves of the Week 16 lesson.

1. A robot shoves a puck to a line 1 m away. Tune the shove for one simulated
   friction and see it miss on a different floor. Then compute the single shove that
   is best across a range of frictions (domain randomisation), and a policy that
   nudges the puck first and works out the friction (adaptation).
2. A pretrained policy succeeds 80.7% of the time. Improve it from its own attempts
   by two rules, and see why one is much faster.

Everything here is a one-line formula. The point is the comparison the tests make.
The puck, the floors and the loops are provided in `world.py`.

The easiest way to do this lab is on the Week 16 page of the companion site. To work
in the folder directly, use the interpreter in `labs/.venv` (see `labs/week01/README.md`).

## What to do

Open `lab.py` and fill in the six functions. Then, from this folder:

    python -m pytest

`python lab.py` prints the misses of the three policies on four floors, and the
success rate round by round under the two improvement rules.

## Files

- `world.py`: constants, `miss`, `run_adaptive`, `improve`.
- `lab.py`: your work. `starter/lab.py` is the empty version.
- `test_lab.py`: the checks, with hand calculations.
- `solution.py`: a reference. Run the tests against it with `python -m pytest --impl solution`.

## Things to try afterwards

- Compute `robust_speed` for ranges of growing width around 0.4. When does it become
  worse on average than the speed tuned for 0.4 alone?
- Replace the squared miss with the absolute miss (search over speeds numerically).
  Is the best speed more or less cautious?
- Give `run_adaptive` a 20% measurement error. How large a range of floors would a
  robust speed have to cover before adapting stops being worth it?
- In part 2, estimate each option's success rate from 20 simulated attempts instead of
  using the true rates. How often does `imitate_better_than_average` discard the best option?
