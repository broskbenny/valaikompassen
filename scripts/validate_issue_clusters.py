#!/usr/bin/env python3
"""Validate issue clusters against the combined displayed question bank."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "data" / "question-bank.json"
VOTES_PATH = ROOT / "data" / "riksdagen" / "votes.json"
CLUSTERS_PATH = ROOT / "data" / "issue-clusters.json"


def main() -> int:
    bank = json.loads(BANK_PATH.read_text(encoding="utf-8"))
    votes = json.loads(VOTES_PATH.read_text(encoding="utf-8"))
    data = json.loads(CLUSTERS_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []

    merge_program_ids = {
        raw_id
        for vote in votes.get("questions", [])
        for raw_id in vote.get("merge_program_ids", [])
    }
    visible_ids = {
        raw_id
        for raw_id in bank.get("singleton_ids", [])
        if raw_id not in merge_program_ids
    }
    visible_ids.update(question.get("id") for question in bank.get("canonical_questions", []))
    visible_ids.update(question.get("id") for question in votes.get("questions", []))
    visible_ids.discard(None)

    seen_cluster_ids: set[str] = set()
    membership: dict[str, str] = {}
    for cluster in data.get("clusters", []):
        cluster_id = cluster.get("id")
        if not isinstance(cluster_id, str) or not cluster_id:
            errors.append("Cluster missing id")
            continue
        if cluster_id in seen_cluster_ids:
            errors.append(f"Duplicate cluster id: {cluster_id}")
        seen_cluster_ids.add(cluster_id)

        if len(str(cluster.get("title", "")).strip()) < 4:
            errors.append(f"{cluster_id}: title is missing or too short")
        if len(str(cluster.get("note", "")).strip()) < 20:
            errors.append(f"{cluster_id}: note must explain why questions remain distinct")

        question_ids = cluster.get("question_ids", [])
        if not isinstance(question_ids, list) or len(question_ids) < 2:
            errors.append(f"{cluster_id}: a cluster needs at least two questions")
            continue
        if len(set(question_ids)) != len(question_ids):
            errors.append(f"{cluster_id}: duplicate question id inside cluster")

        for question_id in question_ids:
            if question_id not in visible_ids:
                errors.append(f"{cluster_id}: unknown displayed question id: {question_id}")
            previous = membership.get(question_id)
            if previous:
                errors.append(f"{question_id}: belongs to both {previous} and {cluster_id}")
            membership[question_id] = cluster_id

    if errors:
        print("Issue cluster validation FAILED", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        f"Issue cluster validation OK: {len(seen_cluster_ids)} clusters, "
        f"{len(membership)} clustered displayed questions"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
