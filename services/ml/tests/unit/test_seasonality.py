"""Unit tests for seasonality and threshold calculations (FEAT-04)."""

from __future__ import annotations

import pytest

from dengueahead.features.seasonality import (
    calculate_hotspot_thresholds,
    calculate_seasonal_medians,
)


def test_feat_04_seasonal_threshold_never_learns_from_test_period() -> None:
    """FEAT-04: Adding outlier spikes in the test period cannot alter seasonal thresholds."""
    # Training period: 2022-W24 and 2023-W24 (week 24 of both years)
    train_observations = [
        {"areaId": "LK-11", "weekStart": "2022-06-13", "cases": 100},  # 2022-W24
        {"areaId": "LK-11", "weekStart": "2023-06-12", "cases": 120},  # 2023-W24
    ]
    # Test period: 2024-W24 with an extreme spike
    test_observations = [
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 9999},  # 2024-W24
    ]
    all_observations = train_observations + test_observations

    # With train_end_date set to 2023-12-31 (cutoff before test period)
    thresholds_with_cutoff = calculate_hotspot_thresholds(
        all_observations,
        quantile=0.75,
        train_end_date="2023-12-31",
    )
    medians_with_cutoff = calculate_seasonal_medians(
        all_observations,
        train_end_date="2023-12-31",
    )

    # Threshold for week 24 based strictly on 100 and 120
    assert ("LK-11", 24) in thresholds_with_cutoff
    assert thresholds_with_cutoff[("LK-11", 24)] <= 120.0
    assert medians_with_cutoff[("LK-11", 24)] == 110.0

    # Ensure running without test data gives the exact same result
    thresholds_train_only = calculate_hotspot_thresholds(
        train_observations,
        quantile=0.75,
    )
    assert thresholds_with_cutoff[("LK-11", 24)] == thresholds_train_only[("LK-11", 24)]


def test_invalid_quantile_raises() -> None:
    with pytest.raises(ValueError, match="Quantile must be in"):
        calculate_hotspot_thresholds([], quantile=1.5)
