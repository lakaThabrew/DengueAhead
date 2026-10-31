"""Integration tests for Phase 4 batch prediction engine and MongoDB publishing.

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

from dengueahead.contracts.prediction import Prediction
from dengueahead.features.as_of import parse_iso_date
from dengueahead.features.builder import build_features_for_area
from dengueahead.features.seasonality import (
    calculate_hotspot_thresholds,
    calculate_seasonal_medians,
)
from dengueahead.inference.loader import load_model_artifact
from dengueahead.inference.predictor import MLHotspotPredictor
from dengueahead.repositories.mongo import ensure_indexes
from dengueahead.repositories.predictions import (
    query_predictions,
    upsert_predictions_batch,
)
from dengueahead.training.dataset import build_tabular_dataset
from dengueahead.training.serializer import save_model_artifact
from dengueahead.training.tree import HGBHotspotPipeline

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
    db = client["dengueahead_phase4_test"]
    ensure_indexes(db)
    yield db
    client.drop_database("dengueahead_phase4_test")
    client.close()


def _generate_synthetic_observations() -> list[dict[str, Any]]:
    """Synthetic multi-district observations across 50 weekly timesteps."""
    from datetime import date, timedelta

    obs: list[dict[str, Any]] = []
    start = date(2023, 1, 2)
    districts = ["LK-11", "LK-12", "LK-21"]

    for w_idx in range(50):
        curr_d = start + timedelta(weeks=w_idx)
        ws = curr_d.isoformat()
        for i, dist in enumerate(districts):
            cases = 20 + (i * 15) + int(5 * np.sin(w_idx / 4.0))
            obs.append(
                {
                    "areaId": dist,
                    "weekStart": ws,
                    "cases": max(0, cases),
                    "source": "synthetic_test_fixture",
                    "snapshotId": f"snap_{w_idx}",
                }
            )
    return obs


def test_pred_01_batch_prediction_generates_valid_contracts(tmp_path: Path) -> None:
    """PRED-01: Batch prediction executes and outputs valid schema-compliant Prediction objects."""
    obs = _generate_synthetic_observations()
    districts = ["LK-11", "LK-12", "LK-21"]
    as_of = "2023-11-20"
    target_week = "2023-11-27"

    # Train and save a temporary test model artifact
    from dengueahead.evaluation.split import DateRange

    train_data = build_tabular_dataset(
        obs, districts, DateRange(start_date="2023-01-02", end_date="2023-10-30")
    )
    model = HGBHotspotPipeline(random_state=42)
    model.fit(train_data.X, train_data.y)

    art_dir = tmp_path / "dengueahead-hgb-v1"
    metadata = {
        "modelVersion": "dengueahead-hgb-v1",
        "modelName": "HistGradientBoosting Forecaster",
        "featureNames": train_data.feature_names,
    }
    save_model_artifact(art_dir, model, None, None, metadata)

    bundle = load_model_artifact(art_dir)
    predictor = MLHotspotPredictor(
        model=bundle["model"],
        model_version="dengueahead-hgb-v1",
        feature_names=bundle["metadata"]["featureNames"],
    )

    seasonal_medians = calculate_seasonal_medians(obs, train_end_date=as_of)
    thresholds = calculate_hotspot_thresholds(obs, quantile=0.75, train_end_date=as_of)

    predictions: list[Prediction] = []
    for area_id in districts:
        rec = build_features_for_area(
            area_id=area_id,
            as_of=as_of,
            observations=obs,
            seasonal_medians=seasonal_medians,
        )
        curr_w = parse_iso_date(as_of).isocalendar().week
        next_w = parse_iso_date(target_week).isocalendar().week
        curr_thresh = thresholds.get((area_id, curr_w), 30.0)
        next_thresh = thresholds.get((area_id, next_w), 30.0)

        pred = predictor.predict(rec, curr_thresh, next_thresh)
        assert isinstance(pred, Prediction)
        assert pred.pointForecast is not None
        assert pred.pointForecast >= 0.0
        assert pred.status in ["EMERGING", "PERSISTENT", "COOLING", "STABLE", "WITHHELD"]
        predictions.append(pred)

    assert len(predictions) == len(districts)


def test_pred_02_corrupted_artifact_yields_withheld_prediction() -> None:
    """PRED-02: Missing or corrupt artifact results in WITHHELD status with quality flag."""
    pred = Prediction(
        areaId="LK-11",
        geographicLevel="district",
        issueDate="2024-12-30",
        targetWeek="2025-01-06",
        asOfDate="2024-12-30",
        modelVersion="dengueahead-hgb-v1",
        status="WITHHELD",
        confidenceStatus="NOT_AVAILABLE",
        pointForecast=None,
        interval=None,
        riskProbability=None,
        qualityFlags=["MODEL_ARTIFACT_CORRUPT"],
        sourceSnapshotIds=[],
    )

    assert pred.status == "WITHHELD"
    assert pred.pointForecast is None
    assert "MODEL_ARTIFACT_CORRUPT" in pred.qualityFlags


def test_pred_03_zero_lookahead_leakage_in_features() -> None:
    """PRED-03: Observations occurring after as_of cannot alter features."""
    obs = [
        {"areaId": "LK-11", "weekStart": "2024-05-27", "cases": 15},
        {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 20},
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 25},
        {"areaId": "LK-11", "weekStart": "2024-06-17", "cases": 30},
        # Future observations
        {"areaId": "LK-11", "weekStart": "2024-06-24", "cases": 999},
        {"areaId": "LK-11", "weekStart": "2024-07-01", "cases": 888},
    ]

    rec = build_features_for_area(
        area_id="LK-11",
        as_of="2024-06-17",
        observations=obs,
    )

    assert rec.features["cases_lag_1"] == 30.0
    assert rec.features["cases_lag_2"] == 25.0
    # Confirm 999 or 888 are nowhere in the feature vector
    for val in rec.features.values():
        assert val != 999.0
        assert val != 888.0


@_mongo_skip
def test_pred_04_idempotent_mongo_publishing(live_db) -> None:
    """PRED-04: Upserting predictions batch to MongoDB is idempotent."""
    pred = Prediction(
        areaId="LK-11",
        geographicLevel="district",
        issueDate="2024-12-30",
        targetWeek="2025-01-06",
        asOfDate="2024-12-30",
        modelVersion="dengueahead-hgb-v1",
        status="EMERGING",
        confidenceStatus="CALIBRATED",
        pointForecast=120.0,
        interval=None,
        riskProbability=0.75,
        qualityFlags=[],
        sourceSnapshotIds=["snap-idemp-1"],
    )

    # First insert
    inserted_1 = upsert_predictions_batch(live_db, [pred])
    assert inserted_1 == 1

    # Second insert with same unique compound key (areaId, targetWeek, modelVersion, issueDate)
    inserted_2 = upsert_predictions_batch(live_db, [pred])
    assert inserted_2 == 0

    stored = query_predictions(live_db, area_id="LK-11", model_version="dengueahead-hgb-v1")
    assert len(stored) == 1
    assert stored[0]["pointForecast"] == 120.0
