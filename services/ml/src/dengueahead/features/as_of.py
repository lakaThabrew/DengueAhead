"""Temporal cutoff validation and as-of filtering.

Ensures no epidemiological or weather observation after the issue cutoff date
enters feature extraction or baseline prediction (Rule 1 & Rule 2).
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any

_DATE_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_iso_date(value: str | date | datetime) -> date:
    """Parse a date string (YYYY-MM-DD), date, or datetime into a date object."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        cleaned = value.strip()
        if "T" in cleaned:
            cleaned = cleaned.split("T")[0]
        if not _DATE_REGEX.match(cleaned):
            raise ValueError(f"Invalid date format '{value}', expected YYYY-MM-DD")
        return date.fromisoformat(cleaned)
    raise TypeError(f"Cannot parse date from type {type(value).__name__}")


def filter_observations_as_of(
    observations: list[dict[str, Any]],
    as_of: str | date,
) -> list[dict[str, Any]]:
    """Return only observations whose weekStart is strictly on or before as_of.

    Guarantees that target-week and future data are excluded from feature calculation.
    """
    cutoff = parse_iso_date(as_of)
    filtered = []
    for obs in observations:
        week_start_raw = obs.get("weekStart")
        if not week_start_raw:
            continue
        week_start = parse_iso_date(week_start_raw)
        if week_start <= cutoff:
            filtered.append(obs)
    return filtered


def filter_weather_as_of(
    weather_records: list[dict[str, Any]],
    as_of: str | date,
) -> list[dict[str, Any]]:
    """Return weather records whose weekStart AND availableAt are on or before as_of.

    Guarantees that weather data that was not yet published as of the cutoff
    cannot be used in feature extraction (as-of availability rule).
    """
    cutoff = parse_iso_date(as_of)
    filtered = []
    for rec in weather_records:
        week_start_raw = rec.get("weekStart")
        if not week_start_raw:
            continue
        week_start = parse_iso_date(week_start_raw)
        if week_start > cutoff:
            continue

        available_at_raw = rec.get("availableAt")
        if available_at_raw:
            available_at = parse_iso_date(available_at_raw)
            if available_at > cutoff:
                continue

        filtered.append(rec)
    return filtered
