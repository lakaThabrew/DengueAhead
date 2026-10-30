"""Unit tests for Phase 2 repositories (feature_snapshots, model_runs, predictions)."""

from __future__ import annotations

from unittest.mock import MagicMock

from dengueahead.contracts.prediction import Prediction
from dengueahead.features.builder import FeatureRecord
from dengueahead.repositories.feature_snapshots import (
    get_feature_snapshot,
    upsert_feature_snapshot,
)
from dengueahead.repositories.model_runs import get_model_runs, upsert_model_run
from dengueahead.repositories.predictions import (
    query_predictions,
    upsert_prediction,
    upsert_predictions_batch,
)


def _mock_db() -> MagicMock:
    db = MagicMock()
    collections: dict[str, MagicMock] = {}
    for col in ("feature_snapshots", "model_runs", "predictions"):
        col_mock = MagicMock()
        update_result = MagicMock()
        update_result.matched_count = 0
        update_result.upserted_id = "test-id"
        update_result.modified_count = 0
        col_mock.update_one.return_value = update_result
        col_mock.find_one.return_value = {"mock": "data"}
        # For cursor chaining .sort().limit()
        cursor_mock = MagicMock()
        cursor_mock.__iter__.return_value = [{"mock": "data"}]
        cursor_mock.sort.return_value = cursor_mock
        cursor_mock.limit.return_value = cursor_mock
        col_mock.find.return_value = cursor_mock
        collections[col] = col_mock

    db.__getitem__.side_effect = lambda key: collections[key]
    return db


def test_upsert_feature_snapshot() -> None:
    db = _mock_db()
    rec = FeatureRecord(
        area_id="LK-11",
        issue_date="2024-06-17",
        target_week="2024-06-24",
        feature_set_version="v1.0.0",
        features={"cases_lag_1": 50.0},
        source_snapshot_ids=["snap-1"],
    )
    res = upsert_feature_snapshot(db, rec)
    assert res.inserted == 1
    db["feature_snapshots"].update_one.assert_called_once()


def test_get_feature_snapshot() -> None:
    db = _mock_db()
    doc = get_feature_snapshot(db, "LK-11", "2024-06-17")
    assert doc == {"mock": "data"}


def test_upsert_model_run() -> None:
    db = _mock_db()
    run_doc = {
        "modelVersion": "baseline-naive-last-week-v1",
        "modelName": "Naive Last Week Baseline",
        "mae": 15.0,
    }
    res = upsert_model_run(db, run_doc)
    assert res.inserted == 1
    runs = get_model_runs(db)
    assert len(runs) == 1


def test_upsert_prediction_and_query() -> None:
    db = _mock_db()
    pred = Prediction(
        areaId="LK-11",
        geographicLevel="district",
        issueDate="2024-06-17",
        targetWeek="2024-06-24",
        asOfDate="2024-06-17",
        modelVersion="baseline-naive-last-week-v1",
        status="STABLE",
        confidenceStatus="NOT_AVAILABLE",
        pointForecast=45.0,
        sourceSnapshotIds=["snap-1"],
    )
    res = upsert_prediction(db, pred)
    assert res.inserted == 1
    batch_count = upsert_predictions_batch(db, [pred])
    assert batch_count == 1
    results = query_predictions(db, as_of="2024-06-17")
    assert len(results) == 1
