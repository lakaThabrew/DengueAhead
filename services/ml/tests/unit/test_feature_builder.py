"""Unit tests for FeatureBuilder (FEAT-03, FEAT-05, FEAT-06)."""

from __future__ import annotations

from dengueahead.features.builder import build_features_for_area


def test_feat_03_moving_average_excludes_target_period() -> None:
    """FEAT-03: 4w moving average includes lags 1..4 and excludes target week t+1."""
    observations = [
        {"areaId": "LK-11", "weekStart": "2024-05-20", "cases": 10},  # lag 4
        {"areaId": "LK-11", "weekStart": "2024-05-27", "cases": 20},  # lag 3
        {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 30},  # lag 2
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 40},  # lag 1 (current week t)
        {"areaId": "LK-11", "weekStart": "2024-06-17", "cases": 999},  # target week t+1
    ]
    # as-of cutoff is 2024-06-10 (week t)
    rec = build_features_for_area("LK-11", as_of="2024-06-10", observations=observations)

    assert not rec.is_withheld
    assert rec.features["cases_lag_1"] == 40.0
    assert rec.features["cases_lag_2"] == 30.0
    assert rec.features["cases_lag_3"] == 20.0
    assert rec.features["cases_lag_4"] == 10.0
    # Mean of (40 + 30 + 20 + 10) / 4 = 25.0
    assert rec.features["cases_roll_mean_4w"] == 25.0
    assert rec.target_week == "2024-06-17"


def test_feat_05_insufficient_history_triggers_withheld() -> None:
    """FEAT-05: Fewer than 4 observations triggers WITHHELD and INSUFFICIENT_HISTORY flag."""
    observations = [
        {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 30},
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 40},
    ]
    rec = build_features_for_area("LK-11", as_of="2024-06-10", observations=observations)

    assert rec.is_withheld
    assert "INSUFFICIENT_HISTORY" in rec.quality_flags


def test_feat_05_missing_current_week_triggers_withheld() -> None:
    """FEAT-05: Null case count in current week triggers WITHHELD and MISSING_CURRENT_REPORT."""
    observations = [
        {"areaId": "LK-11", "weekStart": "2024-05-20", "cases": 10},
        {"areaId": "LK-11", "weekStart": "2024-05-27", "cases": 20},
        {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 30},
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": None},  # current week missing
    ]
    rec = build_features_for_area("LK-11", as_of="2024-06-10", observations=observations)

    assert rec.is_withheld
    assert "MISSING_CURRENT_REPORT" in rec.quality_flags


def test_feat_06_no_division_by_zero_in_growth_rates() -> None:
    """FEAT-06: Zero in growth denominator uses floor of 1.0; no ZeroDivisionError."""
    observations = [
        {"areaId": "LK-11", "weekStart": "2024-05-20", "cases": 0},  # lag 4 = 0
        {"areaId": "LK-11", "weekStart": "2024-05-27", "cases": 5},
        {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 0},  # lag 2 = 0
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 15},  # lag 1 = 15
    ]
    rec = build_features_for_area("LK-11", as_of="2024-06-10", observations=observations)

    assert not rec.is_withheld
    # growth_1w = (15 - 0) / max(0, 1.0) = 15.0
    assert rec.features["growth_1w"] == 15.0
    # growth_4w = (15 - 0) / max(0, 1.0) = 15.0
    assert rec.features["growth_4w"] == 15.0
