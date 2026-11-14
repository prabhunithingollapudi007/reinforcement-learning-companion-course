# Reinforcement Learning Companion

A visual, hands-on companion for learning reinforcement learning in 16 weeks. It
follows two Stanford courses, CS 234 (foundations) and CS 224R (deep RL), and adds
what lecture slides cannot: figures for every concept, interactive playgrounds
where you change the numbers and watch what happens, quizzes, and Python labs you
write and test inside the page.

> **Unofficial.** This is an independent study aid. It is not affiliated with,
> endorsed by, or produced by Stanford University or the instructors of either
> course. The lecture slides belong to their authors; this project links to them
> and does not copy or redistribute them. All lesson text, figures and code here
> are original.

It is written for someone who already knows machine learning, the maths and how to
program, and has not studied RL formally.

## What is in it

| Part | Weeks |
| --- | --- |
| 1. Tabular foundations | 1 MDPs and planning · 2 Monte Carlo and TD · 3 SARSA and Q-learning |
| 2. Value-based deep RL | 4 Function approximation and DQN |
| 3. Policy optimisation | 5 Policy gradients · 6 Trust regions, GAE and PPO · 7 Actor-critic methods |
| 4. Learning from data and humans | 8 Imitation learning · 9 Offline RL and reward learning |
| 5. Exploration | 10 Bandits · 11 Exploration in MDPs |
| 6. Planning and models | 12 Tree search and model-based RL |
| 7. Generalisation | 13 Multi-task, goal-conditioned and meta-RL · 14 Hierarchy |
| 8. Applications | 15 RL for language models · 16 RL for robots, and the frontier |

Every week has the same parts: a big picture, figures, playgrounds with a guided
"try this" walkthrough, plain-language restatements, a few folded derivations, a
Python lab, a quiz and a recap card.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

    git clone <this repository>
    cd <the folder>
    npm --prefix site install
    npm --prefix site run dev

Then open http://localhost:5173. Lessons, figures, playgrounds and quizzes work
straight away. Progress is saved in your browser only.

## Labs

Each lesson page has the week's lab built in: an editor for the lab file, a
"Run tests" button and the results. The editor saves to the real file in `labs/`,
and the tests run with your own Python, so you can also work in the folder directly.

One-time setup, with Python 3.10 or newer:

    python -m venv labs/.venv
    labs/.venv/Scripts/python -m pip install -r labs/requirements.txt

On macOS or Linux the interpreter is `labs/.venv/bin/python`. The labs for
Weeks 4 to 9 and 15 use PyTorch (CPU is enough: the longest test takes under a
minute); the rest need only NumPy. If you want to start without PyTorch, install
`numpy` and `pytest` alone and add `torch` and `gymnasium` when you reach Week 4.

The site uses `labs/.venv` if it exists, otherwise `python` on your PATH. Set the
`LAB_PYTHON` environment variable to point it at a different interpreter.

To work without the site, from any `labs/weekNN` folder:

    python -m pytest                    # checks your lab.py
    python -m pytest --impl solution    # checks the reference solution

A reference `solution.py` sits beside each lab. Try the lab first.

### What the in-page lab does on your machine

The lab editor needs to save files and run Python, which a web page cannot do by
itself. So the development server includes a small local bridge
(`site/labBridge.ts`). It is worth knowing exactly what it does:

- It exists only while you run `npm run dev`. A built or hosted copy of the site
  has no bridge, and the lab panel says so.
- It accepts requests only from this machine, and only with a random token the
  server generates at start-up.
- It can read and write only the files named in a lab's `lab.json`, and can run
  only that lab's tests or its lab file, with the Python interpreter described above.

## Tests

    npm --prefix site test        # the algorithms behind the playgrounds
    npm --prefix site run lint
    npm --prefix site run build

Every number a lesson quotes ("after 200 episodes, 61%") comes from a
deterministic simulation in `site/src/rl/` and is pinned by a test there, so the
text cannot drift from what the playground shows.

## Layout

- `site/` - the website (Vite, React, MDX, KaTeX).
  - `src/course.ts` - the 16-week outline and source links.
  - `src/lessons/` - one MDX file and one quiz file per week.
  - `src/figures/` - the static diagrams for each week.
  - `src/playgrounds/` - the interactive panels.
  - `src/rl/` - the algorithms behind the playgrounds, with their tests.
  - `src/lab/` and `labBridge.ts` - the in-page lab editor and the local bridge behind it.
- `labs/` - Python labs, one folder per week: `lab.py` (yours), `starter/`,
  `solution.py`, `test_lab.py`, and a provided environment module.

## Tested with

Windows 11, Node 22, Python 3.14, NumPy 2.5, PyTorch 2.15 (CPU), Gymnasium 1.4.
Other platforms and versions should work and have not been checked; please open
an issue if something does not.

## Adding or changing a week

1. Plan the figures first: one per concept. Draw them in `site/src/figures/weekNN.tsx`.
2. Write `site/src/lessons/WeekNN.mdx` around them, using the blocks in `src/components/Blocks.tsx`.
   A file with that name is picked up automatically.
3. Put any algorithm code in `site/src/rl/` with tests that pin every number the lesson quotes.
4. Add the lab under `labs/weekNN/` with a `lab.json`, a `starter/` copy and tests,
   then embed it in the lesson with `<LabRunner week="weekNN" />`.

## Licence

- **Code** (the site, the interactive panels, the Python labs, tests and solutions): [MIT](LICENSE).
- **Course content** (lesson text, quizzes, figures, lab instructions): [CC BY 4.0](LICENSE-CONTENT.md).
  Reuse and adapt it freely, with credit.

Neither licence covers the Stanford lecture materials, which are not part of this repository.

## Credits

- [CS 234: Reinforcement Learning](https://web.stanford.edu/class/cs234/modules.html), Stanford, Winter 2026.
- [CS 224R: Deep Reinforcement Learning](https://cs224r.stanford.edu/), Stanford, Spring 2026.
- Sutton and Barto, [*Reinforcement Learning: An Introduction*](http://incompleteideas.net/book/RLbook2020.pdf), 2nd edition.
- The format was inspired by Joseph Femia's [robotic learning companion](https://josephfemia.github.io/robotic_learning/).

Each lesson's Sources box lists the lectures it draws on. Mistakes in this
companion are its own, not the courses'. Corrections are welcome.
