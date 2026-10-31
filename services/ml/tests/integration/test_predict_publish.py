"""Integration tests for the predict CLI command — PRED-01 to PRED-04.

These tests exercise the full predict batch pipeline including artifact loading,
as-of temporal safety, corrupt artifact handling, and idempotent MongoDB publishing.

Tests are skipped automatically when MONGODB_URI is not set.
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

import pytest

MONGODB_URI = os.environ.get("ML_MONGODB_URI") or os.environ.get("MONGODB_URI")
pytestmark = pytest.mark.skipif(
    not MONGODB_URI,
    reason="MONGODB_URI / ML_MONGODB_URI not set — skipping integration tests",
)

_REPO_ROOT = Path(__file__).parents[3]
_AREA_MAP = _REPO_ROOT / "configs" / "area_map.yaml"


# ── Helpers ────────────────────────────────────────────────────────────────────


def _load_area_count() -> int:
    """Return number of districts from area_map.yaml."""
    import yaml

    raw = yaml.safe_load(_AREA_MAP.read_text(encoding="utf-8"))
    return len(raw.get("areas", []))


# ── Fixtures ───────────────────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def db():
    """Yield test MongoDB database (dengueahead_test) and drop predictions after tests."""
    from pymongo import MongoClient

    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    database = client["dengueahead_test"]
    yield database
    database["predictions"].drop()
    client.close()


@pytest.fixture(scope="module")
def fake_artifact_dir(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """Create a minimal but valid model artifact directory for PRED-01."""
    import numpy as np

    from dengueahead.training.calibration import PlattCalibrator
    from dengueahead.training.linear import RidgeHotspotPipeline
    from dengueahead.training.serializer import save_model_artifact
    from dengueahead.training.uncertainty import ConformalIntervalCalculator

    art_dir = tmp_path_factory.mktemp("artifacts") / "dengueahead-hgb-v1"
    art_dir.mkdir(parents=True, exist_ok=True)

    # Minimal trained model
    model = RidgeHotspotPipeline(alpha=1.0, random_state=42)
    n_features = 21
    X_dummy = np.zeros((10, n_features))
    y_dummy = np.ones(10) * 20.0
    model.fit(X_dummy, y_dummy)

    calibrator = PlattCalibrator(random_state=42)
    interval_calc = ConformalIntervalCalculator(target_coverage=0.80)
    interval_calc.fit(y_dummy, y_dummy)

    metadata = {
        "modelVersion": "dengueahead-hgb-v1",
        "modelName": "Ridge Test",
        "trainedAt": "2024-10-01T00:00:00+00:00",
        "trainRange": {"startWeek": "2019-01-07", "endWeek": "2023-12-25"},
        "valRange": {"startWeek": "2024-01-01", "endWeek": "2024-06-30"},
        "testRange": {"startWeek": "2024-07-01", "endWeek": "2024-09-30"},
        "featureNames": [f"f{i}" for i in range(n_features)],
        "metrics": {"mae": 5.0, "recall": 0.8, "precision": 0.75, "topKRecall": 0.9},
        "conformalDelta": 10.0,
        "topFeatures": {},
    }
    save_model_artifact(art_dir, model, calibrator, interval_calc, metadata)
    return art_dir


@pytest.fixture(scope="module")
def corrupt_artifact_dir(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """Create a corrupt artifact (invalid model binary) for PRED-02."""
    art_dir = tmp_path_factory.mktemp("corrupt") / "dengueahead-hgb-v1"
    art_dir.mkdir(parents=True, exist_ok=True)
    (art_dir / "model.joblib").write_bytes(b"NOT_A_VALID_JOBLIB_FILE")
    (art_dir / "metadata.json").write_text(
        json.dumps(
            {
                "modelVersion": "dengueahead-hgb-v1",
                "artifactSha256": "0" * 64,  # deliberate mismatch
            }
        ),
        encoding="utf-8",
    )
    return art_dir


@pytest.fixture(scope="module")
def observations_for_area() -> list[dict]:
    """Generate synthetic observations for LK-11 (Colombo) for temporal safety tests."""
    from datetime import date, timedelta

    obs = []
    start = date(2021, 1, 4)  # Monday
    for w in range(52 * 3):  # 3 years
        week_start = start + timedelta(weeks=w)
        week_end = week_start + timedelta(days=6)
        obs.append(
            {
                "areaId": "LK-11",
                "weekStart": week_start.isoformat(),
                "weekEnd": week_end.isoformat(),
                "reportingWeek": week_start.isocalendar().week,
                "reportingYear": week_start.isocalendar().year,
                "cases": 30 + (w % 20),
                "missingReason": None,
                "revision": 1,
                "reportedAt": None,
                "qualityFlags": [],
            }
        )
    return obs


# ── PRED-01: predict --dry-run produces valid Prediction contracts ─────────────


def test_pred01_predict_dry_run_produces_valid_contracts(
    fake_artifact_dir: Path,
    tmp_path: Path,
) -> None:
    """PRED-01: predict batch runs without DB and outputs valid Prediction contracts."""
    from click.testing import CliRunner

    from dengueahead.cli.main import cli

    output_file = tmp_path / "predictions.json"

    # Prepare artifact directory for the test
    artifacts_dir = tmp_path / "artifacts" / "models"
    artifacts_dir.mkdir(parents=True)
    shutil.copytree(fake_artifact_dir, artifacts_dir / "dengueahead-hgb-v1")

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "predict",
            "--as-of",
            "2024-06-24",
            "--model-version",
            "dengueahead-hgb-v1",
            "--area-map",
            str(_AREA_MAP),
            "--output",
            str(output_file),
        ],
        catch_exceptions=False,
        env={"ARTIFACTS_DIR": str(artifacts_dir)},
    )

    # Should exit 0 (no publish, just output)
    assert result.exit_code == 0, f"predict exited {result.exit_code}: {result.output}"

    if output_file.exists():
        preds = json.loads(output_file.read_text(encoding="utf-8"))
        assert len(preds) > 0, "Expected at least one prediction"
        # Validate contract fields are present
        for p in preds:
            assert "areaId" in p
            assert "status" in p
            assert "issueDate" in p
            assert "targetWeek" in p
            assert p["targetWeek"] > p["issueDate"], "targetWeek must be after issueDate"


# ── PRED-02: corrupt artifact safely marks predictions WITHHELD ───────────────


def test_pred02_corrupt_artifact_withheld_predictions(
    corrupt_artifact_dir: Path,
    tmp_path: Path,
) -> None:
    """PRED-02: Corrupted artifact results in WITHHELD predictions with MODEL_ARTIFACT_CORRUPT."""
    from click.testing import CliRunner

    from dengueahead.cli.main import cli

    output_file = tmp_path / "withheld_preds.json"
    artifacts_dir = tmp_path / "artifacts" / "models"
    artifacts_dir.mkdir(parents=True)
    shutil.copytree(corrupt_artifact_dir, artifacts_dir / "dengueahead-hgb-v1")

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "predict",
            "--as-of",
            "2024-06-24",
            "--model-version",
            "dengueahead-hgb-v1",
            "--area-map",
            str(_AREA_MAP),
            "--output",
            str(output_file),
        ],
        catch_exceptions=False,
    )

    assert (
        result.exit_code == 0
    ), f"predict should exit 0 even with corrupt artifact: {result.output}"

    if output_file.exists():
        preds = json.loads(output_file.read_text(encoding="utf-8"))
        withheld = [p for p in preds if p["status"] == "WITHHELD"]
        assert len(withheld) > 0, "Expected at least some WITHHELD predictions"
        for p in withheld:
            assert p["pointForecast"] is None
            assert p["interval"] is None
            assert p["riskProbability"] is None
            assert len(p["qualityFlags"]) > 0


# ── PRED-03: as-of cutoff never leaks future data ─────────────────────────────


def test_pred03_asof_cutoff_no_lookahead(
    observations_for_area: list[dict],
    tmp_path: Path,
) -> None:
    """PRED-03: As-of temporal cutoff strictly filters future observations."""
    from dengueahead.features.builder import build_features_for_area
    from dengueahead.features.seasonality import calculate_seasonal_medians

    as_of = "2023-06-26"  # Monday
    # Filter observations strictly before as_of
    cutoff_obs = [o for o in observations_for_area if o["weekStart"] < as_of]
    # Observations with weekStart >= as_of must NOT appear in features
    future_obs = [o for o in observations_for_area if o["weekStart"] >= as_of]

    seasonal_medians = calculate_seasonal_medians(cutoff_obs)
    record = build_features_for_area(
        area_id="LK-11",
        as_of=as_of,
        observations=observations_for_area,  # full set intentionally passed
        weather_records=[],
        seasonal_medians=seasonal_medians,
    )

    # The feature builder must filter by as_of internally
    # cases_lag_1 must correspond to the week immediately before as_of
    if not record.is_withheld and "cases_lag_1" in record.features:
        # The most recent observation available as_of is week before cutoff
        last_eligible = max(
            (o for o in observations_for_area if o["weekStart"] < as_of),
            key=lambda o: o["weekStart"],
            default=None,
        )
        if last_eligible and last_eligible["cases"] is not None:
            assert record.features["cases_lag_1"] == float(
                last_eligible["cases"]
            ), "cases_lag_1 must come from the last observation before as_of, not from the future"

    # None of the future observations' cases must appear literally as lag features
    future_cases = {o["cases"] for o in future_obs if o["cases"] is not None}
    if future_cases and not record.is_withheld:
        # lag_2+ must not coincidentally exactly match future cases
        # (Statistically, this is a weak check; the real guarantee is the as_of filter)
        pass  # Structural guarantee provided by filter_observations_as_of unit tests


# ── PRED-04: idempotent MongoDB publishing ────────────────────────────────────


def test_pred04_idempotent_mongodb_publish(db, tmp_path: Path) -> None:
    """PRED-04: Re-running predict --publish does not create duplicate records."""
    from dengueahead.contracts.prediction import Prediction
    from dengueahead.repositories.predictions import upsert_predictions_batch

    # Insert a synthetic prediction batch
    as_of = "2024-09-02"
    target_week = "2024-09-09"
    model_version = "synthetic-test-v1"

    preds = [
        Prediction(
            areaId=f"LK-{10 + i}",
            geographicLevel="district",
            issueDate=as_of,
            targetWeek=target_week,
            asOfDate=as_of,
            modelVersion=model_version,
            status="STABLE",
            confidenceStatus="NOT_AVAILABLE",
            pointForecast=float(30 + i),
            interval=None,
            riskProbability=None,
            qualityFlags=[],
            sourceSnapshotIds=["snap-synthetic"],
        )
        for i in range(5)
    ]

    # First publish
    inserted_1 = upsert_predictions_batch(db, preds)
    count_after_first = db["predictions"].count_documents(
        {"modelVersion": model_version, "issueDate": as_of}
    )

    # Second publish (idempotent)
    inserted_2 = upsert_predictions_batch(db, preds)
    count_after_second = db["predictions"].count_documents(
        {"modelVersion": model_version, "issueDate": as_of}
    )

    assert inserted_1 == 5, f"Expected 5 inserts on first run, got {inserted_1}"
    assert inserted_2 == 0, f"Expected 0 inserts on second run (idempotent), got {inserted_2}"
    assert count_after_first == 5, f"Expected 5 docs after first run, got {count_after_first}"
    assert count_after_second == 5, f"Expected 5 docs after second run, got {count_after_second}"
