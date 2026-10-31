"""Safe model artifact loader with SHA-256 fingerprint validation (ML-05, ML-06)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib

from dengueahead.training.serializer import compute_file_sha256


class ArtifactError(Exception):
    """Base error for artifact issues."""


class ArtifactMissingError(ArtifactError):
    """Artifact file or directory does not exist."""


class ArtifactCorruptError(ArtifactError):
    """Artifact file is unreadable or SHA-256 fingerprint does not match metadata."""


class SchemaMismatchError(ArtifactError):
    """Features provided do not match the trained model feature schema."""


def load_model_artifact(artifact_dir: Path) -> dict[str, Any]:
    """Load model, calibration, and metadata from disk with SHA-256 verification."""
    if not artifact_dir.exists():
        raise ArtifactMissingError(f"Model artifact directory not found: {artifact_dir}")

    model_path = artifact_dir / "model.joblib"
    calib_path = artifact_dir / "calibration.joblib"
    meta_path = artifact_dir / "metadata.json"

    if not model_path.exists() or not meta_path.exists():
        raise ArtifactMissingError(f"Missing required artifact files in {artifact_dir}")

    try:
        metadata = json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ArtifactCorruptError(f"Failed to read metadata.json: {exc}") from exc

    expected_sha = metadata.get("artifactSha256")
    actual_sha = compute_file_sha256(model_path)
    if expected_sha and actual_sha != expected_sha:
        raise ArtifactCorruptError(
            f"SHA-256 mismatch for {model_path}: expected {expected_sha}, got {actual_sha}"
        )

    try:
        model = joblib.load(model_path)
    except Exception as exc:
        raise ArtifactCorruptError(f"Failed to load model binary: {exc}") from exc

    calibrator = None
    interval_calc = None
    if calib_path.exists():
        try:
            calib_bundle = joblib.load(calib_path)
            calibrator = calib_bundle.get("calibrator")
            interval_calc = calib_bundle.get("interval_calc")
        except Exception:  # noqa: BLE001
            pass

    return {
        "model": model,
        "calibrator": calibrator,
        "interval_calc": interval_calc,
        "metadata": metadata,
    }
