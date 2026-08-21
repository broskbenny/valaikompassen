#!/usr/bin/env python3
"""Validate curated Riksdagen vote questions and their party tallies."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOTES_PATH = ROOT / "data" / "riksdagen" / "votes.json"
STATEMENTS_DIR = ROOT / "data" / "statements"
PARTIES = ("S", "M", "SD", "C", "V", "KD", "MP", "L")
TALLY_KEYS = ("yes", "no", "abstain", "absent")


def classify(tally: dict, threshold: float, minimum: int) -> str | None:
    yes = tally["yes"]
    no = tally["no"]
    decisive = yes + no
    if decisive < minimum or yes == no:
        return None
    if max(yes, no) / decisive < threshold:
        return None
    return "yes" if yes > no else "no"


def main() -> int:
    data = json.loads(VOTES_PATH.read_text(encoding="utf-8"))
    questions = data.get("questions", [])
    errors: list[str] = []
    seen: set[str] = set()

    raw_ids: set[str] = set()
    for path in STATEMENTS_DIR.glob("*.jsonl"):
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                raw_ids.add(json.loads(line)["id"])

    merged_program_ids: set[str] = set()
    for question in questions:
        qid = question.get("id")
        if not isinstance(qid, str) or not qid:
            errors.append("Vote question missing id")
            continue
        if qid in seen:
            errors.append(f"Duplicate vote question id: {qid}")
        seen.add(qid)

        statement = question.get("statement", "")
        if not isinstance(statement, str) or not 8 <= len(statement) <= 360:
            errors.append(f"{qid}: invalid statement length")
        if question.get("yes_means") not in {"support", "oppose"}:
            errors.append(f"{qid}: yes_means must be support or oppose")

        threshold = question.get("cohesion_threshold")
        minimum = question.get("minimum_decisive_votes")
        if not isinstance(threshold, (int, float)) or not 0.5 < threshold <= 1:
            errors.append(f"{qid}: invalid cohesion_threshold")
            threshold = 0.8
        if not isinstance(minimum, int) or minimum < 1:
            errors.append(f"{qid}: invalid minimum_decisive_votes")
            minimum = 3

        source = question.get("source", {})
        for key in ("rm", "bet", "point", "date", "title", "decision", "url"):
            if source.get(key) in (None, ""):
                errors.append(f"{qid}: source.{key} missing")
        if not str(source.get("url", "")).startswith("https://data.riksdagen.se/dokument/"):
            errors.append(f"{qid}: source.url is not a Riksdagen data document URL")

        tallies = question.get("party_tallies", {})
        if set(tallies) != set(PARTIES):
            errors.append(f"{qid}: party_tallies must contain exactly the eight Riksdag parties")
            continue

        support: list[str] = []
        oppose: list[str] = []
        for party in PARTIES:
            tally = tallies[party]
            if set(tally) != set(TALLY_KEYS):
                errors.append(f"{qid}/{party}: tally keys mismatch")
                continue
            if any(not isinstance(tally[key], int) or tally[key] < 0 for key in TALLY_KEYS):
                errors.append(f"{qid}/{party}: tally values must be non-negative integers")
                continue
            direction = classify(tally, float(threshold), int(minimum))
            if not direction:
                continue
            stance = question["yes_means"] if direction == "yes" else ("oppose" if question["yes_means"] == "support" else "support")
            (support if stance == "support" else oppose).append(party)

        if not support or not oppose:
            errors.append(f"{qid}: curated compass vote must have at least one coded party on each side")

        for raw_id in question.get("merge_program_ids", []):
            if raw_id not in raw_ids:
                errors.append(f"{qid}: merge_program_id does not exist: {raw_id}")
            if raw_id in merged_program_ids:
                errors.append(f"{qid}: merge_program_id reused: {raw_id}")
            merged_program_ids.add(raw_id)

    if errors:
        print("Riksdagen vote validation FAILED", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Riksdagen vote validation OK: {len(questions)} curated votes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
