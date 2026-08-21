#!/usr/bin/env python3
"""Download Riksdagen roll-call datasets and build a machine-readable candidate index.

The output is deliberately NOT a compass question bank. Parliamentary proposal points must
be read and interpreted before any vote can be promoted to data/riksdagen/votes.json.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

DEFAULT_RMS = ("2022/23", "2023/24", "2024/25", "2025/26")
PARTIES = ("S", "M", "SD", "C", "V", "KD", "MP", "L")
VOTE_MAP = {"ja": "yes", "nej": "no", "avstår": "abstain", "frånvarande": "absent"}


def dataset_url(rm: str) -> str:
    compact = rm.replace("/", "")
    return f"https://data.riksdagen.se/dataset/votering/votering-{compact}.csv.zip"


def download_csv(rm: str) -> str:
    request = urllib.request.Request(dataset_url(rm), headers={"User-Agent": "valaikompassen/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:  # noqa: S310 - fixed trusted host
        payload = response.read()
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        csv_names = [name for name in archive.namelist() if name.lower().endswith(".csv")]
        if len(csv_names) != 1:
            raise RuntimeError(f"Expected one CSV in {rm} archive, found {len(csv_names)}")
        raw = archive.read(csv_names[0])
    for encoding in ("utf-8-sig", "utf-8", "cp1252"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            pass
    raise RuntimeError(f"Could not decode CSV for {rm}")


def normalize_key(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def first(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        value = row.get(key)
        if value not in (None, ""):
            return value.strip()
    return ""


def parse_rows(rm: str, text: str) -> list[dict]:
    sample = text[:8192]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,\t")
    except csv.Error:
        dialect = csv.excel
        dialect.delimiter = ";"

    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    groups: dict[tuple[str, str, str, str, str], dict] = {}

    for original in reader:
        row = {normalize_key(str(k)): (v or "") for k, v in original.items() if k is not None}
        avser = first(row, "avser", "votering_avser").casefold()
        if avser and "sakfrå" not in avser:
            continue

        party = first(row, "parti").upper()
        vote_raw = first(row, "rost", "röst").casefold()
        vote = VOTE_MAP.get(vote_raw)
        if party not in PARTIES or not vote:
            continue

        bet = first(row, "beteckning", "bet", "betankande", "betänkande")
        point = first(row, "punkt")
        vote_id = first(row, "votering_id", "voteringid", "votering")
        date = first(row, "datum")
        key = (rm, bet, point, vote_id, date)
        if key not in groups:
            groups[key] = {
                "rm": rm,
                "bet": bet,
                "point": point,
                "votering_id": vote_id,
                "date": date,
                "party_tallies": {p: {"yes": 0, "no": 0, "abstain": 0, "absent": 0} for p in PARTIES},
            }
        groups[key]["party_tallies"][party][vote] += 1

    return list(groups.values())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rm", action="append", dest="rms", help="Riksmöte, e.g. 2025/26. Repeatable.")
    parser.add_argument("--output", default="data/riksdagen/generated-vote-index.json")
    args = parser.parse_args()

    rms = tuple(args.rms or DEFAULT_RMS)
    all_votes: list[dict] = []
    for rm in rms:
        print(f"Downloading {rm} …")
        all_votes.extend(parse_rows(rm, download_csv(rm)))

    all_votes.sort(key=lambda item: (item["date"], item["rm"], item["bet"], item["point"], item["votering_id"]))
    output = {
        "generated": True,
        "source": "Sveriges riksdag öppna data",
        "attribution_url": "https://www.riksdagen.se/sv/dokument-och-lagar/riksdagens-oppna-data/",
        "warning": "Candidate index only. Read the proposal point and counterproposal before promoting any row to the compass.",
        "riksmoten": list(rms),
        "votes": all_votes,
    }
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(all_votes)} substantive roll-call candidates to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
