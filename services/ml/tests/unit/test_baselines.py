"""Unit tests for baseline models (BASE-01..04)."""

from __future__ import annotations

from dengueahead.baselines.naive import NaiveLastWeekForecaster
from dengueahead.baselines.rolling_mean import RollingMean4wForecaster
from dengueahead.baselines.seasonal_median import SeasonalMedianForecaster
from dengueahead.contracts.prediction import Prediction
from dengueahead.features.builder import FeatureRecord


def _sample_record(
    c1: float = 120.0,
    roll_mean_4w: float = 115.0,
    seasonal_median: float = 110.0,
    is_withheld: bool = False,
) -> FeatureRecord:
    return FeatureRecord(
        area_id="LK-11",
        issue_date="2024-06-17",
        target_week="2024-06-24",
        feature_set_version="v1.0.0",
        features={
            "cases_lag_1": c1 if not is_withheld else None,
            "cases_roll_mean_4w": roll_mean_4w,
            "seasonal_historical_median": seasonal_median,
        },
        source_snapshot_ids=["snap-001"],
        quality_flags=[],
        is_withheld=is_withheld,
    )


def test_base_01_naive_last_week_forecaster() -> None:
    """BASE-01: Naive forecaster predicts y_hat = c1."""
    forecaster = NaiveLastWeekForecaster()
    rec = _sample_record(c1=120.0)
    pred = forecaster.predict(rec, current_threshold=100.0, next_threshold=100.0)

    assert isinstance(pred, Prediction)
    assert pred.pointForecast == 120.0
    assert pred.confidenceStatus == "NOT_AVAILABLE"
    assert pred.riskProbability is None
    assert pred.status == "PERSISTENT"
    assert pred.modelVersion == "baseline-naive-last-week-v1"


def test_base_02_rolling_mean_4w_forecaster() -> None:
    """BASE-02: Rolling mean forecaster predicts y_hat = cases_roll_mean_4w."""
    forecaster = RollingMean4wForecaster()
    rec = _sample_record(c1=90.0, roll_mean_4w=105.5)
    # current 90 < 100, predicted 105.5 >= 100 => EMERGING
    pred = forecaster.predict(rec, current_threshold=100.0, next_threshold=100.0)

    assert isinstance(pred, Prediction)
    assert pred.pointForecast == 105.5
    assert pred.confidenceStatus == "NOT_AVAILABLE"
    assert pred.riskProbability is None
    assert pred.status == "EMERGING"
    assert pred.modelVersion == "baseline-rolling-mean-4w-v1"


def test_base_03_seasonal_median_forecaster() -> None:
    """BASE-03: Seasonal median forecaster predicts y_hat = seasonal_historical_median."""
    forecaster = SeasonalMedianForecaster()
    rec = _sample_record(c1=90.0, seasonal_median=95.0)
    # current 90 < 100, predicted 95.0 < 100 => STABLE
    pred = forecaster.predict(rec, current_threshold=100.0, next_threshold=100.0)

    assert isinstance(pred, Prediction)
    assert pred.pointForecast == 95.0
    assert pred.confidenceStatus == "NOT_AVAILABLE"
    assert pred.riskProbability is None
    assert pred.status == "STABLE"
    assert pred.modelVersion == "baseline-seasonal-median-v1"


def test_base_04_baseline_invariant_enforcement_withheld() -> None:
    """BASE-04: Withheld record produces valid Prediction with null pointForecast and flags."""
    forecaster = NaiveLastWeekForecaster()
    rec = _sample_record(is_withheld=True)
    pred = forecaster.predict(rec, current_threshold=100.0, next_threshold=100.0)

    assert pred.status == "WITHHELD"
    assert pred.pointForecast is None
    assert pred.riskProbability is None
    assert pred.interval is None
    assert len(pred.qualityFlags) > 0
    # Confirms Pydantic model validator passes
    assert pred.check_invariants() == pred
