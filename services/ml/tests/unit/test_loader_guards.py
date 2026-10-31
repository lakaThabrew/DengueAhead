"""Unit tests for artifact and schema loader failure guards (ML-05, ML-06)."""

from __future__ import annotations

from pathlib import Path

import pytest

from dengueahead.features.builder import FeatureRecord
from dengueahead.inference.loader import (
    ArtifactCorruptError,
    ArtifactMissingError,
    load_model_artifact,
)
from dengueahead.inference.predictor import MLHotspotPredictor
from dengueahead.training.linear import RidgeHotspotPipeline
from dengueahead.training.serializer import save_model_artifact


def test_ml_06_missing_artifact_raises_typed_error(tmp_path: Path) -> None:
    """ML-06: Missing model artifact directory raises ArtifactMissingError."""
    nonexistent = tmp_path / "nonexistent_model"
    with pytest.raises(ArtifactMissingError, match="not found"):
        load_model_artifact(nonexistent)


def test_ml_06_corrupted_artifact_raises_corrupt_error(tmp_path: Path) -> None:
    """ML-06: Tampered artifact binary fails SHA-256 checksum with ArtifactCorruptError."""
    model = RidgeHotspotPipeline(alpha=1.0)
    meta = {"modelVersion": "tampered-v1"}
    save_model_artifact(tmp_path, model, None, None, meta)

    # Tamper with the model.joblib file
    (tmp_path / "model.joblib").write_bytes(b"corrupted binary data")

    with pytest.raises(ArtifactCorruptError, match="SHA-256 mismatch"):
        load_model_artifact(tmp_path)


def test_ml_05_withheld_record_inference_graceful_fallback() -> None:
    """ML-05: Withheld FeatureRecord gracefully produces Prediction(status='WITHHELD')."""
    model = RidgeHotspotPipeline()
    predictor = MLHotspotPredictor(model=model, model_version="test-v1")

    withheld_rec = FeatureRecord(
        area_id="LK-11",
        issue_date="2024-06-17",
        target_week="2024-06-24",
        feature_set_version="v1.0.0",
        features={},
        quality_flags=["INSUFFICIENT_HISTORY"],
        is_withheld=True,
    )
    pred = predictor.predict(withheld_rec, current_threshold=100.0, next_threshold=100.0)

    assert pred.status == "WITHHELD"
    assert pred.pointForecast is None
    assert "INSUFFICIENT_HISTORY" in pred.qualityFlags
    assert pred.check_invariants() == pred
