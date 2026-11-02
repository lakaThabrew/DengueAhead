"""Unit tests for artifact serialization and SHA-256 fingerprinting."""

from __future__ import annotations

from pathlib import Path

from dengueahead.inference.loader import load_model_artifact
from dengueahead.training.linear import RidgeHotspotPipeline
from dengueahead.training.serializer import compute_file_sha256, save_model_artifact


def test_serializer_roundtrip(tmp_path: Path) -> None:
    model = RidgeHotspotPipeline(alpha=1.0)
    meta = {"modelVersion": "test-model-v1", "testKey": "testVal"}

    saved_meta = save_model_artifact(
        artifact_dir=tmp_path,
        model=model,
        calibrator=None,
        interval_calc=None,
        metadata=meta,
    )

    assert "artifactSha256" in saved_meta
    sha = compute_file_sha256(tmp_path / "model.joblib")
    assert saved_meta["artifactSha256"] == sha

    loaded = load_model_artifact(tmp_path)
    assert loaded["metadata"]["modelVersion"] == "test-model-v1"
    assert isinstance(loaded["model"], RidgeHotspotPipeline)
