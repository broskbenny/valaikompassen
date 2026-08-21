#!/usr/bin/env python3
"""Validate the source registry and statement JSONL files using stdlib only."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "data" / "statements" / "index.json"
SOURCES_PATH = ROOT / "data" / "sources.json"
ID_RE = re.compile(r"^(S|M|SD|C|V|KD|MP|L)-[0-9]{4}-[0-9]{3,4}$")
VALID_PARTIES = {"S", "M", "SD", "C", "V", "KD", "MP", "L"}
VALID_TYPES = {"proposal", "position"}
VALID_STATUS = {"curated", "needs_review", "rejected"}
VALID_CONFIDENCE = {"high", "medium", "low"}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    source_registry = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))

    sources = source_registry.get("sources", [])
    source_by_party = {row["party"]: row for row in sources}
    document_ids = {row["document_id"] for row in sources}

    if set(source_by_party) != VALID_PARTIES:
        fail(errors, f"Source registry parties mismatch: {sorted(source_by_party)}")
    if len(document_ids) != len(sources):
        fail(errors, "Duplicate document_id in source registry")

    rows: list[dict] = []
    seen_ids: set[str] = set()

    for relative in index.get("files", []):
        path = ROOT / relative
        if not path.exists():
            fail(errors, f"Missing dataset file: {relative}")
            continue

        for line_no, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not raw.strip():
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError as exc:
                fail(errors, f"{relative}:{line_no}: invalid JSON: {exc}")
                continue

            row_id = row.get("id")
            party = row.get("source_party")
            statement = row.get("statement", "")
            source = row.get("source", {})
            review = row.get("review", {})

            if not isinstance(row_id, str) or not ID_RE.fullmatch(row_id):
                fail(errors, f"{relative}:{line_no}: invalid id {row_id!r}")
            elif row_id in seen_ids:
                fail(errors, f"{relative}:{line_no}: duplicate id {row_id}")
            else:
                seen_ids.add(row_id)

            if party not in VALID_PARTIES:
                fail(errors, f"{relative}:{line_no}: invalid source_party {party!r}")
            elif isinstance(row_id, str) and not row_id.startswith(f"{party}-"):
                fail(errors, f"{relative}:{line_no}: id/party mismatch: {row_id} vs {party}")

            if row.get("type") not in VALID_TYPES:
                fail(errors, f"{relative}:{line_no}: invalid type {row.get('type')!r}")
            if not isinstance(row.get("topic"), str) or not row["topic"].strip():
                fail(errors, f"{relative}:{line_no}: missing topic")
            if not isinstance(statement, str) or not 8 <= len(statement) <= 320:
                fail(errors, f"{relative}:{line_no}: statement length out of range")

            document_id = source.get("document_id")
            if document_id not in document_ids:
                fail(errors, f"{relative}:{line_no}: unknown document_id {document_id!r}")
            elif party in source_by_party and document_id != source_by_party[party]["document_id"]:
                fail(errors, f"{relative}:{line_no}: document/party mismatch")
            if not isinstance(source.get("pdf_page"), int) or source["pdf_page"] < 1:
                fail(errors, f"{relative}:{line_no}: invalid pdf_page")
            if not isinstance(source.get("section"), str) or not source["section"].strip():
                fail(errors, f"{relative}:{line_no}: missing source section")

            if review.get("status") not in VALID_STATUS:
                fail(errors, f"{relative}:{line_no}: invalid review status")
            if review.get("confidence") not in VALID_CONFIDENCE:
                fail(errors, f"{relative}:{line_no}: invalid review confidence")

            rows.append(row)

    party_counts = Counter(row["source_party"] for row in rows)
    type_counts = Counter(row["type"] for row in rows)
    topic_counts = Counter(row["topic"] for row in rows)

    if len(rows) != index.get("total_statements"):
        fail(errors, f"Index total_statements={index.get('total_statements')} but parsed {len(rows)}")
    if dict(party_counts) != index.get("counts_by_party"):
        fail(errors, f"counts_by_party mismatch: {dict(party_counts)}")
    if dict(type_counts) != index.get("counts_by_type"):
        fail(errors, f"counts_by_type mismatch: {dict(type_counts)}")
    if dict(sorted(topic_counts.items())) != index.get("counts_by_topic"):
        fail(errors, "counts_by_topic mismatch")

    if errors:
        print("Dataset validation FAILED", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Dataset validation OK: {len(rows)} statements, {len(source_by_party)} sources")
    print("By party:", ", ".join(f"{party}={party_counts[party]}" for party in sorted(party_counts)))
    print("By type:", ", ".join(f"{kind}={type_counts[kind]}" for kind in sorted(type_counts)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
