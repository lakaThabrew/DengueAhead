"""Model artifact serialization with SHA-256 fingerprinting."""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib


def compute_file_sha256(path: Path) -> str:
    """Compute SHA-256 hex digest of a file."""
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def save_model_artifact(
    artifact_dir: Path,
    model: Any,
    calibrator: Any,
    interval_calc: Any,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    """Serialize model components and metadata JSON to disk."""
    artifact_dir.mkdir(parents=True, exist_ok=True)
    model_path = artifact_dir / "model.joblib"
    calib_path = artifact_dir / "calibration.joblib"
    meta_path = artifact_dir / "metadata.json"

    # Save model pipeline and calibrator
    joblib.dump(model, model_path)
    joblib.dump({"calibrator": calibrator, "interval_calc": interval_calc}, calib_path)

    # Compute SHA-256
    sha256 = compute_file_sha256(model_path)
    metadata["artifactSha256"] = sha256
    metadata["savedAt"] = datetime.now(UTC).isoformat()

    meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata
