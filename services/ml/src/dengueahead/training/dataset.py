"""Tabular dataset assembly for ML training and evaluation (ML-02).

Constructs feature matrices (X, y) strictly bounded by historical cutoffs.
Ensures target values y_{t+1} are never leaked into feature matrix X.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Any

import numpy as np

from dengueahead.evaluation.split import DateRange, get_weekly_dates_in_range
from dengueahead.features.as_of import parse_iso_date
from dengueahead.features.builder import build_features_for_area

FEATURE_NAMES: list[str] = [
    "cases_lag_1",
    "cases_lag_2",
    "cases_lag_3",
    "cases_lag_4",
    "growth_1w",
    "growth_4w",
    "cases_diff_1w",
    "cases_roll_mean_2w",
    "cases_roll_mean_4w",
    "cases_roll_mean_8w",
    "cases_roll_std_4w",
    "calendar_week",
    "seasonal_historical_median",
    "seasonal_ratio",
    "rain_lag_1",
    "rain_lag_2",
    "rain_lag_3",
    "temp_lag_1",
    "temp_lag_2",
    "temp_lag_3",
    "humidity_lag_1",
]


@dataclass(frozen=True)
class TabularDataset:
    """Tabular feature matrix X and continuous target vector y."""

    X: np.ndarray
    y: np.ndarray
    feature_names: list[str]
    area_ids: list[str]
    issue_dates: list[str]
    target_weeks: list[str]

    def __len__(self) -> int:
        return len(self.y)


def extract_feature_vector(
    features: dict[str, Any],
    feature_names: list[str] | None = None,
) -> list[float]:
    """Convert features dict to numeric vector according to canonical feature names."""
    names = feature_names or FEATURE_NAMES
    vec: list[float] = []
    for name in names:
        val = features.get(name)
        if val is None or isinstance(val, bool):
            vec.append(np.nan)
        else:
            vec.append(float(val))
    return vec


def build_tabular_dataset(
    observations: list[dict[str, Any]],
    areas: list[str],
    date_range: DateRange,
    weather_records: list[dict[str, Any]] | None = None,
    seasonal_medians: dict[tuple[str, int], float] | None = None,
    feature_names: list[str] | None = None,
) -> TabularDataset:
    """Assemble (X, y) tabular matrix for weeks within *date_range*.

    For each issue date T in *date_range*, target week is T + 7 days.
    y is the observed cases count at T + 7 days.
    X is the feature vector computed strictly as of T (ML-02).
    """
    names = feature_names or FEATURE_NAMES
    issue_dates = get_weekly_dates_in_range(date_range.start_date, date_range.end_date)

    # Fast lookup for ground truth target values
    obs_lookup: dict[tuple[str, str], float] = {}
    for o in observations:
        area = o.get("areaId")
        ws = o.get("weekStart")
        cases = o.get("cases")
        if area and ws and cases is not None:
            obs_lookup[(area, ws)] = float(cases)

    X_rows: list[list[float]] = []
    y_vals: list[float] = []
    row_areas: list[str] = []
    row_issue_dates: list[str] = []
    row_target_weeks: list[str] = []

    for issue_date in issue_dates:
        issue_dt = parse_iso_date(issue_date)
        target_week_str = (issue_dt + timedelta(days=7)).isoformat()

        for area_id in areas:
            # Target must exist to train/evaluate
            target_cases = obs_lookup.get((area_id, target_week_str))
            if target_cases is None:
                continue

            rec = build_features_for_area(
                area_id=area_id,
                as_of=issue_date,
                observations=observations,
                weather_records=weather_records,
                seasonal_medians=seasonal_medians,
            )

            if rec.is_withheld:
                continue

            vec = extract_feature_vector(rec.features, names)
            X_rows.append(vec)
            y_vals.append(target_cases)
            row_areas.append(area_id)
            row_issue_dates.append(issue_date)
            row_target_weeks.append(target_week_str)

    X_arr = np.array(X_rows, dtype=np.float64) if X_rows else np.empty((0, len(names)))
    y_arr = np.array(y_vals, dtype=np.float64) if y_vals else np.empty((0,))

    return TabularDataset(
        X=X_arr,
        y=y_arr,
        feature_names=list(names),
        area_ids=row_areas,
        issue_dates=row_issue_dates,
        target_weeks=row_target_weeks,
    )
