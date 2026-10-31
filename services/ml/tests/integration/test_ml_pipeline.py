"""Integration tests for Phase 3 ML pipeline: dataset assembly, model training,
calibration, conformal uncertainty, serialization, and inference.

Rule 3 compliance: Test data is explicitly identified as synthetic fixture data.
Skipped automatically if no local MongoDB instance is reachable for DB persistence tests.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np
import pytest
from pymongo import MongoClient

from dengueahead.baselines.naive import NaiveLastWeekForecaster
from dengueahead.baselines.rolling_mean import RollingMean4wForecaster
from dengueahead.contracts.prediction import Prediction
from dengueahead.evaluation.backtest import BacktestRunner
from dengueahead.evaluation.split import DateRange
from dengueahead.features.as_of import parse_iso_date
from dengueahead.features.seasonality import (
    calculate_hotspot_thresholds,
    calculate_seasonal_medians,
)
from dengueahead.inference.loader import (
    ArtifactCorruptError,
    load_model_artifact,
)
from dengueahead.inference.predictor import MLHotspotPredictor
from dengueahead.repositories.model_runs import get_model_runs, upsert_model_run
from dengueahead.repositories.mongo import ensure_indexes
from dengueahead.repositories.predictions import (
    query_predictions,
    upsert_predictions_batch,
)
from dengueahead.training.calibration import PlattCalibrator
from dengueahead.training.dataset import build_tabular_dataset
from dengueahead.training.linear import RidgeHotspotPipeline
from dengueahead.training.serializer import save_model_artifact
from dengueahead.training.tree import HGBHotspotPipeline
from dengueahead.training.uncertainty import ConformalIntervalCalculator

_URI = os.environ.get("ML_MONGODB_WRITE_URI")


def _is_mongo_reachable() -> bool:
    if not _URI:
        return False
    try:
        c = MongoClient(_URI, serverSelectionTimeoutMS=1000)
        c.admin.command("ping")
        return True
    except Exception:
        return False


_mongo_skip = pytest.mark.skipif(
    not _is_mongo_reachable(),
    reason="MongoDB instance not reachable via ML_MONGODB_WRITE_URI",
)


@pytest.fixture(scope="module")
def live_db():
    client = MongoClient(_URI, serverSelectionTimeoutMS=2000)
    db = client["dengueahead_phase3_test"]
    ensure_indexes(db)
    yield db
    client.drop_database("dengueahead_phase3_test")
    client.close()


def _generate_synthetic_observations() -> list[dict[str, Any]]:
    """Synthetic observations across 3 districts over 80 weekly timesteps (2023 to 2024).

    Strictly labeled synthetic for testing per Rule 3.
    """
    obs: list[dict[str, Any]] = []
    from datetime import date, timedelta

    start = date(2023, 1, 2)  # Monday
    areas = ["LK-11", "LK-12", "LK-21"]

    for week_idx in range(80):
        current_date = start + timedelta(weeks=week_idx)
        ws = current_date.isoformat()
        for i, a in enumerate(areas):
            # Synthetic periodic dengue trend
            base = 15.0 + (i * 10.0)
            seasonal_wave = 10.0 * np.sin(2 * np.pi * week_idx / 52.0)
            noise = np.random.RandomState(week_idx + i).normal(0, 2.0)
            cases = max(0, int(round(base + seasonal_wave + noise)))
            obs.append(
                {
                    "areaId": a,
                    "weekStart": ws,
                    "cases": cases,
                    "source": "synthetic_test_fixture",
                    "snapshotId": f"synthetic_snap_{week_idx}",
                }
            )
    return obs


def test_end_to_end_ml_pipeline_execution(tmp_path: Path) -> None:
    """Full Phase 3 pipeline: Dataset -> Train -> Calibrate -> Conformal -> Serialize -> Predict."""
    obs = _generate_synthetic_observations()
    districts = ["LK-11", "LK-12", "LK-21"]

    train_range = DateRange(start_date="2023-01-02", end_date="2023-10-30")
    val_range = DateRange(start_date="2023-11-06", end_date="2024-03-25")
    test_range = DateRange(start_date="2024-04-01", end_date="2024-07-08")

    seasonal_medians = calculate_seasonal_medians(obs, train_end_date=train_range.end_date)
    thresholds = calculate_hotspot_thresholds(
        obs, quantile=0.75, train_end_date=train_range.end_date
    )

    # 1. Dataset assembly (ML-02 zero leakage)
    train_data = build_tabular_dataset(
        obs, districts, train_range, seasonal_medians=seasonal_medians
    )
    val_data = build_tabular_dataset(obs, districts, val_range, seasonal_medians=seasonal_medians)
    assert len(train_data) > 0
    assert len(val_data) > 0

    # 2. Train HGB model
    hgb_pipeline = HGBHotspotPipeline(
        learning_rate=0.05, max_depth=3, min_samples_leaf=3, random_state=42
    )
    hgb_pipeline.fit(train_data.X, train_data.y)

    # 3. Fit Platt calibrator and Conformal interval calculator
    val_preds = hgb_pipeline.predict_counts(val_data.X)
    val_thresholds = np.array(
        [
            thresholds.get((a, parse_iso_date(tw).isocalendar().week), 30.0)
            for a, tw in zip(val_data.area_ids, val_data.target_weeks)
        ]
    )
    val_binary = (val_data.y >= val_thresholds).astype(int)
    val_margins = val_preds - val_thresholds

    calibrator = PlattCalibrator(random_state=42).fit(val_margins, val_binary)
    interval_calc = ConformalIntervalCalculator(target_coverage=0.80).fit(val_data.y, val_preds)

    assert interval_calc.delta is not None
    assert interval_calc.delta >= 0.0

    # 4. Serialize artifact
    art_dir = tmp_path / "dengueahead-hgb-v1"
    metadata = {
        "modelVersion": "dengueahead-hgb-v1",
        "modelName": "HistGradientBoosting Forecaster",
        "trainRange": {"startWeek": train_range.start_date, "endWeek": train_range.end_date},
        "testRange": {"startWeek": test_range.start_date, "endWeek": test_range.end_date},
        "featureNames": train_data.feature_names,
    }
    saved_meta = save_model_artifact(art_dir, hgb_pipeline, calibrator, interval_calc, metadata)
    assert "artifactSha256" in saved_meta

    # 5. Load artifact back and verify SHA-256 integrity
    bundle = load_model_artifact(art_dir)
    assert bundle["model"].model_version == "dengueahead-hgb-v1"

    # 6. Predictor inference
    predictor = MLHotspotPredictor(
        model=bundle["model"],
        calibrator=bundle.get("calibrator"),
        interval_calc=bundle.get("interval_calc"),
        model_version="dengueahead-hgb-v1",
        feature_names=bundle["metadata"]["featureNames"],
    )

    runner = BacktestRunner(
        observations=obs,
        areas=districts,
        train_end_date=train_range.end_date,
    )
    ml_metrics, ml_predictions = runner.run_backtest(predictor, test_range)

    assert len(ml_predictions) > 0
    assert ml_metrics.total_instances > 0

    # 7. Check Prediction contract invariants
    for p in ml_predictions:
        assert isinstance(p, Prediction)
        assert p.pointForecast is not None
        assert p.pointForecast >= 0.0  # ML-04 non-negative constraint
        if p.interval is not None:
            assert p.interval.lower >= 0.0  # Conformal interval non-negative
            assert p.interval.upper >= p.interval.lower
        if p.riskProbability is not None:
            assert 0.0 <= p.riskProbability <= 1.0  # ML-03 calibrated range
            assert p.confidenceStatus == "CALIBRATED"
        assert len(p.sourceSnapshotIds) >= 1

    # 8. Compare against baseline forecasters (Gate logic)
    naive = NaiveLastWeekForecaster()
    naive_metrics, _ = runner.run_backtest(naive, test_range)
    rolling = RollingMean4wForecaster()
    rolling_metrics, _ = runner.run_backtest(rolling, test_range)

    best_base_mae = min(naive_metrics.mae, rolling_metrics.mae)
    outperforms = ml_metrics.mae <= (0.95 * best_base_mae)

    model_run = runner.build_model_run_record(
        model_version="dengueahead-hgb-v1",
        model_name="HistGradientBoosting Forecaster",
        metrics=ml_metrics,
        train_range=train_range,
        test_range=test_range,
        baseline_metrics_list=[
            {"baselineName": "naive", "mae": naive_metrics.mae},
            {"baselineName": "rolling_mean_4w", "mae": rolling_metrics.mae},
        ],
        outperforms_baseline=outperforms,
    )
    assert model_run["modelVersion"] == "dengueahead-hgb-v1"
    assert "outperformsBaseline" in model_run


def test_corrupted_model_artifact_triggers_guard(tmp_path: Path) -> None:
    """ML-06: Corrupted model binary raises ArtifactCorruptError on load."""
    art_dir = tmp_path / "corrupt_model"
    art_dir.mkdir(parents=True)

    # Save initial valid artifact
    model = RidgeHotspotPipeline()
    metadata = {"modelVersion": "test-ridge"}
    save_model_artifact(art_dir, model, None, None, metadata)

    # Tamper with the model.joblib file
    model_file = art_dir / "model.joblib"
    model_file.write_bytes(b"corrupted binary payload that changes SHA256")

    with pytest.raises(ArtifactCorruptError) as exc_info:
        load_model_artifact(art_dir)
    assert "SHA-256 mismatch" in str(exc_info.value) or "Failed to load model" in str(
        exc_info.value
    )


@_mongo_skip
def test_mongo_persistence_for_ml_model_run_and_predictions(live_db) -> None:
    """Verify storing and querying Phase 3 ML model run and predictions in MongoDB."""
    obs = _generate_synthetic_observations()
    runner = BacktestRunner(
        observations=obs,
        areas=["LK-11", "LK-12"],
        train_end_date="2023-10-30",
    )
    forecaster = RidgeHotspotPipeline()
    train_range = DateRange(start_date="2023-01-02", end_date="2023-10-30")
    test_range = DateRange(start_date="2024-04-01", end_date="2024-05-06")

    train_data = build_tabular_dataset(obs, ["LK-11", "LK-12"], train_range)
    forecaster.fit(train_data.X, train_data.y)

    predictor = MLHotspotPredictor(
        model=forecaster,
        model_version=forecaster.model_version,
        feature_names=train_data.feature_names,
    )

    metrics, predictions = runner.run_backtest(predictor, test_range)
    run_doc = runner.build_model_run_record(
        model_version=forecaster.model_version,
        model_name="Linear Ridge Forecaster",
        metrics=metrics,
        train_range=train_range,
        test_range=test_range,
        outperforms_baseline=False,
    )

    ur = upsert_model_run(live_db, run_doc)
    assert ur.inserted == 1

    stored_runs = get_model_runs(live_db)
    assert len(stored_runs) >= 1

    inserted_preds = upsert_predictions_batch(live_db, predictions)
    assert inserted_preds > 0

    queried_preds = query_predictions(live_db, model_version=forecaster.model_version)
    assert len(queried_preds) >= 1
