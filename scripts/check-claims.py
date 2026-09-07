#!/usr/bin/env python3
"""Lightweight CLAIMS.yml checks without adding a build dependency."""

from __future__ import annotations

import datetime as dt
import re
import sys
from pathlib import Path


CLAIMS_PATH = Path("CLAIMS.yml")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
CLAIM_RE = re.compile(r"^  ([a-z0-9_]+):$")
FIELD_RE = re.compile(r"^    ([a-zA-Z0-9_]+):(?:\s*(.*))?$")
TOP_FIELD_RE = re.compile(r"^([a-zA-Z0-9_]+):\s*(.*)$")

ALLOWED_STATUSES = {
    "builder_guardrail",
    "daa_gated",
    "ecosystem_live",
    "live",
    "live_design",
    "live_framing",
    "measurement_sensitive",
    "narrative_guardrail",
    "research",
    "research_direction",
    "roadmap",
    "roadmap_framing",
    "targeted",
    "testnet_only",
}

DRIFT_SENSITIVE_STATUSES = {
    "builder_guardrail",
    "daa_gated",
    "ecosystem_live",
    "measurement_sensitive",
    "research",
    "research_direction",
    "roadmap",
    "roadmap_framing",
    "targeted",
    "testnet_only",
}


def fail(message: str) -> None:
    print(f"CLAIMS.yml check failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def parse_date(value: str, label: str) -> dt.date:
    if not DATE_RE.match(value):
        fail(f"{label} must use YYYY-MM-DD, got {value!r}")
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        fail(f"{label} is not a valid date: {value!r}")


def read_claims() -> tuple[dict[str, str], dict[str, dict[str, str]], dict[str, list[str]]]:
    top: dict[str, str] = {}
    claims: dict[str, dict[str, str]] = {}
    forbidden: dict[str, list[str]] = {}
    current_claim: str | None = None
    current_list: str | None = None
    in_claims = False

    for line_no, raw_line in enumerate(CLAIMS_PATH.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue

        if line == "claims:":
            in_claims = True
            current_claim = None
            current_list = None
            continue

        if not in_claims:
            match = TOP_FIELD_RE.match(line)
            if match:
                top[match.group(1)] = match.group(2).strip()
            continue

        claim_match = CLAIM_RE.match(line)
        if claim_match:
            current_claim = claim_match.group(1)
            current_list = None
            claims[current_claim] = {}
            forbidden[current_claim] = []
            continue

        if current_claim is None:
            fail(f"unexpected line before first claim at {line_no}: {line}")

        field_match = FIELD_RE.match(line)
        if field_match:
            key, value = field_match.group(1), (field_match.group(2) or "").strip()
            if key == "forbidden_copy":
                current_list = key
                continue
            current_list = None
            if value:
                claims[current_claim][key] = value
            continue

        if current_list == "forbidden_copy" and line.startswith("      - "):
            phrase = line.removeprefix("      - ").strip()
            if phrase:
                forbidden[current_claim].append(phrase)
            continue

    return top, claims, forbidden


def main() -> None:
    if not CLAIMS_PATH.exists():
        fail("CLAIMS.yml is missing")

    top, claims, forbidden = read_claims()
    today = dt.date.today()

    last_checked = parse_date(top.get("last_checked", ""), "last_checked")
    recheck_after = parse_date(top.get("recheck_after", ""), "recheck_after")

    if recheck_after < last_checked:
        fail("top-level recheck_after cannot be before last_checked")
    if recheck_after < today:
        fail(f"top-level recheck_after is stale: {recheck_after.isoformat()}")
    if not claims:
        fail("claims block is empty")

    for claim_id, claim in claims.items():
        status = claim.get("status")
        if not status:
            fail(f"{claim_id} missing status")
        if status not in ALLOWED_STATUSES:
            fail(f"{claim_id} has unknown status {status!r}")
        if not claim.get("summary"):
            fail(f"{claim_id} missing summary")
        if not claim.get("source"):
            fail(f"{claim_id} missing source")

        if status in DRIFT_SENSITIVE_STATUSES:
            claim_recheck = claim.get("recheck_after")
            if not claim_recheck:
                fail(f"{claim_id} is {status} and needs claim-level recheck_after")
            parsed_recheck = parse_date(claim_recheck, f"{claim_id}.recheck_after")
            if parsed_recheck < today:
                fail(f"{claim_id}.recheck_after is stale: {parsed_recheck.isoformat()}")

        if status in {"daa_gated", "targeted", "testnet_only", "roadmap", "research_direction"}:
            if not forbidden.get(claim_id):
                fail(f"{claim_id} is {status} and needs forbidden_copy guardrails")

    print(f"Claims checks passed. claims={len(claims)}")


if __name__ == "__main__":
    main()
