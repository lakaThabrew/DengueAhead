"""Integration tests for Phase 2 feature extraction and baseline evaluation.

Skipped automatically if no local MongoDB instance is reachable via ML_MONGODB_WRITE_URI.
"""

from __future__ import annotations

import os

import pytest
from pymongo import MongoClient

from dengueahead.baselines.naive import NaiveLastWeekForecaster
from dengueahead.evaluation.backtest import BacktestRunner
from dengueahead.evaluation.split import DateRange
from dengueahead.features.builder import build_features_for_area
from dengueahead.repositories.feature_snapshots import (
    get_feature_snapshot,
    upsert_feature_snapshot,
)
from dengueahead.repositories.model_runs import get_model_runs, upsert_model_run
from dengueahead.repositories.mongo import ensure_indexes
from dengueahead.repositories.predictions import (
    query_predictions,
    upsert_predictions_batch,
)

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
    db = client["dengueahead_phase2_test"]
    ensure_indexes(db)
    yield db
    client.drop_database("dengueahead_phase2_test")
    client.close()


@_mongo_skip
def test_feature_snapshot_upsert_idempotent(live_db) -> None:
    rec = build_features_for_area(
        area_id="LK-11",
        as_of="2024-06-17",
        observations=[
            {"areaId": "LK-11", "weekStart": "2024-05-27", "cases": 10},
            {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 20},
            {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 30},
            {"areaId": "LK-11", "weekStart": "2024-06-17", "cases": 40},
        ],
    )
    ur1 = upsert_feature_snapshot(live_db, rec)
    assert ur1.inserted == 1

    ur2 = upsert_feature_snapshot(live_db, rec)
    assert ur2.inserted == 0
    assert ur2.matched == 1

    doc = get_feature_snapshot(live_db, "LK-11", "2024-06-17")
    assert doc is not None
    assert doc["features"]["cases_lag_1"] == 40.0


@_mongo_skip
def test_baseline_backtest_mongo_persistence(live_db) -> None:
    obs = [
        {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 15},
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 20},
        {"areaId": "LK-11", "weekStart": "2024-06-17", "cases": 25},
        {"areaId": "LK-11", "weekStart": "2024-06-24", "cases": 30},
        {"areaId": "LK-11", "weekStart": "2024-07-01", "cases": 35},
        {"areaId": "LK-11", "weekStart": "2024-07-08", "cases": 40},
    ]
    runner = BacktestRunner(observations=obs, areas=["LK-11"], train_end_date="2024-06-17")
    forecaster = NaiveLastWeekForecaster()
    metrics, predictions = runner.run_backtest(
        forecaster,
        eval_range=DateRange(start_date="2024-06-24", end_date="2024-07-01"),
    )

    run_doc = runner.build_model_run_record(
        model_version=forecaster.model_version,
        model_name="Naive Baseline",
        metrics=metrics,
        train_range=DateRange(start_date="2024-06-03", end_date="2024-06-17"),
        test_range=DateRange(start_date="2024-06-24", end_date="2024-07-01"),
    )
    ur = upsert_model_run(live_db, run_doc)
    assert ur.inserted == 1

    batch_inserted = upsert_predictions_batch(live_db, predictions)
    assert batch_inserted > 0

    runs = get_model_runs(live_db)
    assert len(runs) >= 1

    stored_preds = query_predictions(live_db, model_version=forecaster.model_version)
    assert len(stored_preds) >= 1
