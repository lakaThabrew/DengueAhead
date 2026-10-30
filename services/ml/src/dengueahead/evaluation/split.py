"""Temporal train/validation/test split definitions.

Prevents data leakage by partitioning strictly by date ranges rather than random sampling.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from dengueahead.features.as_of import parse_iso_date


@dataclass(frozen=True)
class DateRange:
    start_date: str
    end_date: str

    def contains(self, d: str | date) -> bool:
        dt = parse_iso_date(d)
        return parse_iso_date(self.start_date) <= dt <= parse_iso_date(self.end_date)


@dataclass(frozen=True)
class TemporalSplitConfig:
    train_range: DateRange
    val_range: DateRange
    test_range: DateRange


DEFAULT_SPLIT = TemporalSplitConfig(
    train_range=DateRange(start_date="2020-01-06", end_date="2023-12-25"),
    val_range=DateRange(start_date="2024-01-01", end_date="2024-06-24"),
    test_range=DateRange(start_date="2024-07-01", end_date="2024-12-30"),
)


def get_weekly_dates_in_range(start: str | date, end: str | date) -> list[str]:
    """Return all Monday ISO date strings between *start* and *end* inclusive."""
    curr = parse_iso_date(start)
    end_date = parse_iso_date(end)
    # Adjust curr to Monday if needed
    if curr.weekday() != 0:
        curr = curr - timedelta(days=curr.weekday())

    dates: list[str] = []
    while curr <= end_date:
        dates.append(curr.isoformat())
        curr += timedelta(days=7)
    return dates
