"""Seasonality and localized hotspot threshold calculation.

Enforces strict temporal isolation: thresholds and seasonal baselines are computed
ONLY on historical training periods and never learn from evaluation/test periods (FEAT-04).
"""

from __future__ import annotations

import statistics
from collections import defaultdict
from datetime import date
from typing import Any

from dengueahead.features.as_of import parse_iso_date


def calculate_seasonal_medians(
    observations: list[dict[str, Any]],
    train_end_date: str | date | None = None,
) -> dict[tuple[str, int], float]:
    """Calculate historical median cases for each (areaId, calendarWeek) pair.

    If *train_end_date* is provided, observations after that cutoff are ignored.
    """
    cutoff = parse_iso_date(train_end_date) if train_end_date is not None else None
    buckets: dict[tuple[str, int], list[float]] = defaultdict(list)

    for obs in observations:
        area_id = obs.get("areaId")
        week_start_raw = obs.get("weekStart")
        cases = obs.get("cases")
        if not area_id or not week_start_raw or cases is None:
            continue

        week_start = parse_iso_date(week_start_raw)
        if cutoff and week_start > cutoff:
            continue

        iso_week = week_start.isocalendar().week
        buckets[(area_id, iso_week)].append(float(cases))

    medians: dict[tuple[str, int], float] = {}
    for key, values in buckets.items():
        medians[key] = round(float(statistics.median(values)), 2)

    return medians


def calculate_hotspot_thresholds(
    observations: list[dict[str, Any]],
    quantile: float = 0.75,
    train_end_date: str | date | None = None,
) -> dict[tuple[str, int], float]:
    """Calculate localized hotspot threshold for each (areaId, calendarWeek) pair.

    The threshold is defined as the given *quantile* (default 75th percentile)
    of historical observations for that calendar week.
    If fewer than 2 observations exist for that calendar week, it falls back
    to the overall area quantile across all weeks.
    """
    if not (0.0 < quantile < 1.0):
        raise ValueError(f"Quantile must be in (0, 1), got {quantile}")

    cutoff = parse_iso_date(train_end_date) if train_end_date is not None else None
    week_buckets: dict[tuple[str, int], list[float]] = defaultdict(list)
    area_buckets: dict[str, list[float]] = defaultdict(list)

    for obs in observations:
        area_id = obs.get("areaId")
        week_start_raw = obs.get("weekStart")
        cases = obs.get("cases")
        if not area_id or not week_start_raw or cases is None:
            continue

        week_start = parse_iso_date(week_start_raw)
        if cutoff and week_start > cutoff:
            continue

        c_val = float(cases)
        iso_week = week_start.isocalendar().week
        week_buckets[(area_id, iso_week)].append(c_val)
        area_buckets[area_id].append(c_val)

    def _compute_quantile(data: list[float], q: float) -> float:
        if not data:
            return 0.0
        sorted_data = sorted(data)
        if len(sorted_data) == 1:
            return sorted_data[0]
        # Linear interpolation percentile
        idx = q * (len(sorted_data) - 1)
        low = int(idx)
        high = min(low + 1, len(sorted_data) - 1)
        weight = idx - low
        return sorted_data[low] * (1.0 - weight) + sorted_data[high] * weight

    area_overall_thresholds: dict[str, float] = {
        area_id: round(_compute_quantile(vals, quantile), 2)
        for area_id, vals in area_buckets.items()
    }

    thresholds: dict[tuple[str, int], float] = {}
    for (area_id, iso_week), vals in week_buckets.items():
        if len(vals) >= 2:
            thresholds[(area_id, iso_week)] = round(_compute_quantile(vals, quantile), 2)
        else:
            thresholds[(area_id, iso_week)] = area_overall_thresholds.get(area_id, 0.0)

    # For any query where specific (area, week) is missing, callers can fall back
    # to area_overall_thresholds
    return thresholds
