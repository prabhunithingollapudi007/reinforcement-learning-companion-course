"""Shared pytest options for every week's lab.

    python -m pytest                   checks lab.py in the current week's folder
    python -m pytest --impl solution   checks the reference solution

`--lab-report` is used by the companion website to show results per test.
"""

import json

_results = []


def pytest_addoption(parser):
    parser.addoption(
        "--impl",
        default="lab",
        help="module to test: 'lab' (your work) or 'solution' (the reference)",
    )
    parser.addoption(
        "--lab-report",
        default=None,
        help="write per-test results to this JSON file",
    )


def pytest_runtest_logreport(report):
    # One entry per test: its call phase, or its setup phase if that is where it broke.
    if report.when == "call" or (report.when == "setup" and report.outcome != "passed"):
        message = ""
        if report.failed:
            crash = getattr(report.longrepr, "reprcrash", None)
            message = crash.message if crash is not None else str(report.longrepr)
        _results.append(
            {
                "name": report.nodeid.split("::", 1)[-1],
                "outcome": report.outcome,
                "message": message,
            }
        )


def pytest_sessionfinish(session):
    path = session.config.getoption("--lab-report")
    if path:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(_results, f)
