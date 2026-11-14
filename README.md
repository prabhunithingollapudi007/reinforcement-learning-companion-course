# Reinforcement Learning Companion

A self-study companion for one 16-week path through Stanford CS 234 (foundations)
and CS 224R (deep RL): a local website with figures, interactive playgrounds and
Python labs you can write and test inside the page.

## Run the site

    npm --prefix site install
    npm --prefix site run dev

Then open http://localhost:5173.

## Labs

Each lesson page has the week's lab built in: an editor for the lab file, a
"Run tests" button and the results. The editor saves to the real file in `labs/`,
and the tests run with your own Python, so you can also work in the folder directly.

One-time setup for the Python side:

    python -m venv labs/.venv
    labs/.venv/Scripts/python -m pip install -r labs/requirements.txt

(On macOS or Linux the interpreter is `labs/.venv/bin/python`.) The site uses
`labs/.venv` if it exists, otherwise `python` on your PATH. Set `LAB_PYTHON` to
point it at a different interpreter.

The in-page lab works only while the site runs through `npm run dev` on this
machine. It can read and write only the files a lab's `lab.json` lists, and run
only that lab's tests or lab file.

## Layout

- `site/` - the website (Vite, React, MDX, KaTeX).
  - `src/course.ts` - the 16-week outline and source links.
  - `src/lessons/` - one MDX file per week, registered in `index.ts`.
  - `src/figures/` - the static diagrams for each week.
  - `src/playgrounds/` - the interactive panels.
  - `src/rl/` - the algorithms behind the playgrounds, with tests (`npm --prefix site test`).
  - `src/lab/` and `labBridge.ts` - the in-page lab editor and the local bridge behind it.
- `labs/` - Python labs, one folder per week. See `labs/week01/README.md`.
- `materials/` - lecture slides and handouts downloaded from the two course sites,
  kept as local reference only. The site links to the originals and does not copy them.

## Status

Weeks 1-6 are written: MDPs and planning, Monte Carlo and TD, SARSA and Q-learning,
function approximation with DQN, policy gradients, and PPO. Weeks 7-16 show their planned outline.

## Adding a week

1. Plan the figures first: one per concept. Draw them in `site/src/figures/weekNN.tsx`.
2. Write `site/src/lessons/WeekNN.mdx` around them, using the blocks in `src/components/Blocks.tsx`.
   A file with that name is picked up automatically.
3. Put any algorithm code in `site/src/rl/` with tests that pin every number the lesson quotes.
4. Add the lab under `labs/weekNN/` with a `lab.json`, a `starter/` copy and tests,
   then embed it in the lesson with `<LabRunner week="weekNN" />`.
