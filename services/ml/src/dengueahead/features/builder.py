"""As-of safe feature extraction engine for DengueAhead.

Extracts temporal lag features, rolling moving averages, growth momentum,
and meteorological signals strictly bounded by an issue cutoff date (FEAT-01..06).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

from dengueahead.features.as_of import (
    filter_observations_as_of,
    filter_weather_as_of,
    parse_iso_date,
)


@dataclass(frozen=True)
class FeatureRecord:
    """Computed feature vector for a single area and forecast issue date."""

    area_id: str
    issue_date: str
    target_week: str
    feature_set_version: str
    features: dict[str, float | int | bool | None]
    source_snapshot_ids: list[str] = field(default_factory=list)
    quality_flags: list[str] = field(default_factory=list)
    is_withheld: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "areaId": self.area_id,
            "issueDate": self.issue_date,
            "targetWeek": self.target_week,
            "featureSetVersion": self.feature_set_version,
            "features": self.features,
            "sourceSnapshotIds": self.source_snapshot_ids,
            "qualityFlags": self.quality_flags,
            "isWithheld": self.is_withheld,
        }


def build_features_for_area(
    area_id: str,
    as_of: str | date,
    observations: list[dict[str, Any]],
    weather_records: list[dict[str, Any]] | None = None,
    seasonal_medians: dict[tuple[str, int], float] | None = None,
    feature_set_version: str = "v1.0.0",
) -> FeatureRecord:
    """Build feature vector for *area_id* as of *as_of* cutoff date.

    Strictly excludes any observation where weekStart > as_of.
    """
    cutoff = parse_iso_date(as_of)
    target_date = cutoff + timedelta(days=7)
    target_week_str = target_date.isoformat()
    issue_date_str = cutoff.isoformat()

    # Filter observations to strictly on or before cutoff
    area_obs = [
        o for o in filter_observations_as_of(observations, cutoff) if o.get("areaId") == area_id
    ]
    # Sort chronologically by weekStart ascending
    area_obs.sort(key=lambda o: str(o.get("weekStart", "")))

    quality_flags: list[str] = []
    snapshot_ids: set[str] = set()

    for o in area_obs:
        snap_id = o.get("sourceSnapshotId")
        if snap_id:
            snapshot_ids.add(str(snap_id))
        for qf in o.get("qualityFlags", []):
            if qf not in quality_flags:
                quality_flags.append(qf)

    # Minimum history check: must have at least 4 observations to compute lags
    if len(area_obs) < 4:
        quality_flags.append("INSUFFICIENT_HISTORY")
        return FeatureRecord(
            area_id=area_id,
            issue_date=issue_date_str,
            target_week=target_week_str,
            feature_set_version=feature_set_version,
            features={},
            source_snapshot_ids=sorted(snapshot_ids),
            quality_flags=quality_flags,
            is_withheld=True,
        )

    # Latest observation is week t (the most recent completed week on/before cutoff)
    latest_obs = area_obs[-1]
    latest_cases = latest_obs.get("cases")

    # If current week observation is missing, cannot reliably forecast
    if latest_cases is None:
        quality_flags.append("MISSING_CURRENT_REPORT")
        return FeatureRecord(
            area_id=area_id,
            issue_date=issue_date_str,
            target_week=target_week_str,
            feature_set_version=feature_set_version,
            features={"cases_lag_1": None},
            source_snapshot_ids=sorted(snapshot_ids),
            quality_flags=quality_flags,
            is_withheld=True,
        )

    # Extract 4 most recent case counts (lags 1..4)
    # area_obs[-1] is lag 1 (week t)
    # area_obs[-2] is lag 2 (week t-1)
    # area_obs[-3] is lag 3 (week t-2)
    # area_obs[-4] is lag 4 (week t-3)
    c1 = float(latest_cases)
    c2 = float(area_obs[-2]["cases"]) if area_obs[-2].get("cases") is not None else None
    c3 = float(area_obs[-3]["cases"]) if area_obs[-3].get("cases") is not None else None
    c4 = float(area_obs[-4]["cases"]) if area_obs[-4].get("cases") is not None else None

    # Growth rates — division-by-zero protected: max(denominator, 1.0)
    growth_1w = None
    if c2 is not None:
        growth_1w = round((c1 - c2) / max(c2, 1.0), 4)

    growth_4w = None
    if c4 is not None:
        growth_4w = round((c1 - c4) / max(c4, 1.0), 4)

    diff_1w = round(c1 - c2, 2) if c2 is not None else None

    # Rolling means
    # 2-week rolling mean
    roll_mean_2w = round((c1 + c2) / 2.0, 2) if c2 is not None else c1

    # 4-week rolling mean
    four_lags = [c for c in (c1, c2, c3, c4) if c is not None]
    roll_mean_4w = round(sum(four_lags) / len(four_lags), 2) if four_lags else c1

    # 4-week rolling standard deviation
    roll_std_4w = 0.0
    if len(four_lags) >= 2:
        variance = sum((c - roll_mean_4w) ** 2 for c in four_lags) / len(four_lags)
        roll_std_4w = round(math.sqrt(variance), 2)

    # 8-week rolling mean (if available)
    eight_obs = [o.get("cases") for o in area_obs[-8:] if o.get("cases") is not None]
    roll_mean_8w = round(sum(eight_obs) / len(eight_obs), 2) if eight_obs else roll_mean_4w

    # Seasonal signals
    calendar_week = target_date.isocalendar().week
    seasonal_median = None
    seasonal_ratio = None
    if seasonal_medians:
        seasonal_median = seasonal_medians.get((area_id, calendar_week))
        if seasonal_median is not None:
            seasonal_ratio = round(c1 / max(seasonal_median, 1.0), 4)

    # Weather lags
    rain_lag_1 = None
    rain_lag_2 = None
    rain_lag_3 = None
    temp_lag_1 = None
    temp_lag_2 = None
    temp_lag_3 = None
    humidity_lag_1 = None
    weather_available = False

    if weather_records:
        filtered_w = [
            w for w in filter_weather_as_of(weather_records, cutoff) if w.get("areaId") == area_id
        ]
        filtered_w.sort(key=lambda w: str(w.get("weekStart", "")))
        if filtered_w:
            weather_available = True
            latest_w = filtered_w[-1]
            rain_lag_1 = latest_w.get("rainMm")
            temp_lag_1 = latest_w.get("tempC")
            humidity_lag_1 = latest_w.get("humidityPct")
            if len(filtered_w) >= 2:
                rain_lag_2 = filtered_w[-2].get("rainMm")
                temp_lag_2 = filtered_w[-2].get("tempC")
            if len(filtered_w) >= 3:
                rain_lag_3 = filtered_w[-3].get("rainMm")
                temp_lag_3 = filtered_w[-3].get("tempC")

    features: dict[str, float | int | bool | None] = {
        "cases_lag_1": c1,
        "cases_lag_2": c2,
        "cases_lag_3": c3,
        "cases_lag_4": c4,
        "growth_1w": growth_1w,
        "growth_4w": growth_4w,
        "cases_diff_1w": diff_1w,
        "cases_roll_mean_2w": roll_mean_2w,
        "cases_roll_mean_4w": roll_mean_4w,
        "cases_roll_mean_8w": roll_mean_8w,
        "cases_roll_std_4w": roll_std_4w,
        "calendar_week": calendar_week,
        "seasonal_historical_median": seasonal_median,
        "seasonal_ratio": seasonal_ratio,
        "rain_lag_1": rain_lag_1,
        "rain_lag_2": rain_lag_2,
        "rain_lag_3": rain_lag_3,
        "temp_lag_1": temp_lag_1,
        "temp_lag_2": temp_lag_2,
        "temp_lag_3": temp_lag_3,
        "humidity_lag_1": humidity_lag_1,
        "weather_available": weather_available,
    }

    return FeatureRecord(
        area_id=area_id,
        issue_date=issue_date_str,
        target_week=target_week_str,
        feature_set_version=feature_set_version,
        features=features,
        source_snapshot_ids=sorted(snapshot_ids),
        quality_flags=quality_flags,
        is_withheld=False,
    )
