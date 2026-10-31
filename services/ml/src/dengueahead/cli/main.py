"""DengueAhead ML & Data CLI."""

from __future__ import annotations

import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

import click
import yaml

from dengueahead import __version__

# ── Helpers ───────────────────────────────────────────────────────────────────


def _not_implemented(cmd: str, phase: int) -> None:
    """Print a 'not implemented' message to stderr and exit with code 3."""
    click.echo(f"{cmd}: not implemented (planned for Phase {phase})", err=True)
    sys.exit(3)


def _validate_date(ctx: click.Context, param: click.Parameter, value: str | None) -> str | None:
    """Validate YYYY-MM-DD format; exit 2 (UsageError) on bad input."""
    if value is None:
        return value
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise click.BadParameter(
            f"'{value}' is not a valid date - expected YYYY-MM-DD",
            ctx=ctx,
            param=param,
        )
    return value


# -- CLI group -----------------------------------------------------------------


@click.group()
@click.version_option(__version__, prog_name="dengueahead")
def cli() -> None:
    """DengueAhead - Early Warning for Emerging Dengue Hotspots in Sri Lanka."""


# -- Phase 1 commands ----------------------------------------------------------


@cli.command("audit-sources")
@click.option(
    "--config",
    default="configs/sources.yaml",
    show_default=True,
    help="Path to sources config YAML.",
)
def audit_sources(config: str) -> None:
    """Audit external official data sources - reachability, robots.txt, licence."""
    from datetime import datetime
    from urllib.parse import urlparse

    import requests

    from dengueahead.ingestion.fetcher import FetchConfig, check_robots

    config_path = Path(config)
    if not config_path.exists():
        click.echo(f"ERROR: Config file not found: {config}", err=True)
        sys.exit(1)

    raw = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    sources = raw.get("sources", {})
    if not sources:
        click.echo("ERROR: No sources found in config.", err=True)
        sys.exit(1)

    fc = FetchConfig()
    results = []
    any_failure = False

    for source_id, meta in sources.items():
        base_url: str = meta.get("baseUrl", "")
        click.echo(f"\nAuditing: {source_id} ({base_url})")

        row: dict = {
            "sourceId": source_id,
            "baseUrl": base_url,
            "auditedAt": datetime.now(tz=UTC).isoformat(),
            "httpStatus": None,
            "contentType": None,
            "robotsAllowed": None,
            "reachable": False,
            "error": None,
        }

        # HEAD request
        try:
            resp = requests.head(
                base_url, timeout=(fc.connect_timeout, fc.read_timeout), allow_redirects=True
            )
            row["httpStatus"] = resp.status_code
            row["contentType"] = resp.headers.get("Content-Type", "")
            row["reachable"] = resp.ok
            if not resp.ok:
                row["error"] = f"HTTP {resp.status_code}"
                any_failure = True
                click.echo(f"  [FAIL] HTTP {resp.status_code}")
            else:
                click.echo(f"  [OK] HTTP {resp.status_code}  Content-Type: {row['contentType']}")
        except Exception as exc:  # noqa: BLE001
            row["error"] = str(exc)
            row["reachable"] = False
            any_failure = True
            click.echo(f"  [FAIL] Network error: {exc}")

        # robots.txt
        parsed = urlparse(base_url)
        path = parsed.path or "/"
        allowed = check_robots(base_url, path, fc)
        row["robotsAllowed"] = allowed
        click.echo(f"  robots.txt: {'allowed' if allowed else 'DISALLOWED'}")
        if not allowed:
            any_failure = True

        results.append(row)

    # Write manifest
    manifest_path = Path("data/manifests/sources_manifest.json")
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps({"auditedAt": results[0]["auditedAt"], "sources": results}, indent=2) + "\n",
        encoding="utf-8",
    )
    click.echo(f"\nManifest written -> {manifest_path}")

    if any_failure:
        click.echo(
            "\nWARNING: One or more sources are unreachable or robots-disallowed. "
            "Review source_audit_log.md before proceeding.",
            err=True,
        )
        sys.exit(1)

    click.echo("\nAll sources passed audit.")


@cli.command("ingest")
@click.option(
    "--config",
    default="configs/sources.yaml",
    show_default=True,
    help="Path to sources config YAML.",
)
@click.option("--year", type=int, default=None, help="Reporting year (default: current year).")
@click.option(
    "--week", type=int, default=None, help="ISO week number to ingest (default: last week)."
)
@click.option(
    "--dry-run", is_flag=True, default=False, help="Parse and validate without writing to MongoDB."
)
def ingest(config: str, year: int | None, week: int | None, dry_run: bool) -> None:
    """Fetch official NDCU dengue reports and ingest into MongoDB."""
    from datetime import date

    from dengueahead.ingestion.area_map import load_area_map
    from dengueahead.ingestion.fetcher import FetchConfig, FetchError, fetch_document
    from dengueahead.ingestion.ndcu_parser import ParseError, parse_ndcu_report
    from dengueahead.ingestion.snapshot import store_snapshot
    from dengueahead.validation.data_quality import run_quality_checks

    config_path = Path(config)
    if not config_path.exists():
        click.echo(f"ERROR: Config file not found: {config}", err=True)
        sys.exit(1)

    raw_config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    ndcu_meta = raw_config.get("sources", {}).get("ndcu", {})

    if not ndcu_meta.get("verified", False):
        click.echo(
            "ERROR: NDCU source is not verified. "
            "A human must set verified=true in configs/sources.yaml after confirming "
            "rights, robots.txt, and terms of use.",
            err=True,
        )
        sys.exit(1)

    # Determine target year/week
    today = date.today()
    if year is None:
        year = today.isocalendar().year
    if week is None:
        # Default to last completed week
        last_week = today - __import__("datetime").timedelta(weeks=1)
        week = last_week.isocalendar().week

    area_map_path = Path("configs/area_map.yaml")
    if not area_map_path.exists():
        click.echo("ERROR: configs/area_map.yaml not found.", err=True)
        sys.exit(1)
    area_map = load_area_map(area_map_path)

    base_url: str = ndcu_meta["baseUrl"]
    parser_version: str = ndcu_meta.get("parserVersion", "1.0.0")
    raw_dir = Path("data/raw")

    click.echo(f"Ingesting NDCU report for year={year} week={week}")

    # Fetch
    try:
        fetch_cfg = FetchConfig()
        result = fetch_document(base_url, fetch_cfg)
    except FetchError as exc:
        click.echo(f"ERROR: Fetch failed: {exc}", err=True)
        sys.exit(1)

    # Store snapshot (idempotent)
    snap = store_snapshot(result, "ndcu", raw_dir)
    observed_period = f"{year}-W{week:02d}"
    click.echo(f"Snapshot SHA-256: {snap.sha256[:12]}... (already_existed={snap.already_existed})")

    # Parse
    try:
        parse_result = parse_ndcu_report(
            raw=result.content,
            content_type=result.content_type,
            snapshot_id=snap.sha256[:16],
            parser_version=parser_version,
            area_map=area_map,
            year=year,
            week=week,
        )
    except ParseError as exc:
        click.echo(f"ERROR: Parse failed: {exc}", err=True)
        sys.exit(1)

    for w in parse_result.parse_warnings:
        click.echo(f"  PARSE WARNING: {w}")

    click.echo(f"Parsed {len(parse_result.observations)} observations")

    # Quality check
    obs_dicts = [
        {
            "areaId": o.area_id,
            "weekStart": o.week_start.isoformat(),
            "weekEnd": o.week_end.isoformat(),
            "reportingWeek": o.reporting_week,
            "reportingYear": o.reporting_year,
            "cases": o.cases,
            "missingReason": o.missing_reason,
            "revision": 1,
            "reportedAt": None,
            "qualityFlags": o.quality_flags,
        }
        for o in parse_result.observations
    ]
    report = run_quality_checks(obs_dicts)
    click.echo(f"Quality: {report.summary()}")
    if report.has_errors:
        click.echo("WARNING: Quality errors found - see validate-data for details.")

    if dry_run:
        click.echo("Dry-run mode - skipping MongoDB write.")
        sys.exit(0)

    # Write to MongoDB
    from dengueahead.repositories.dengue_weekly import upsert_observation
    from dengueahead.repositories.mongo import ensure_indexes, get_db
    from dengueahead.repositories.source_snapshots import upsert_snapshot

    try:
        db = get_db()
        ensure_indexes(db)
    except Exception as exc:  # noqa: BLE001
        click.echo(f"ERROR: MongoDB connection failed: {exc}", err=True)
        sys.exit(1)

    snap_result = upsert_snapshot(db, snap, observed_period)
    click.echo(f"Snapshot upserted: {snap_result}")

    inserted = 0
    skipped = 0
    for obs in parse_result.observations:
        ur = upsert_observation(db, obs)
        if ur.inserted:
            inserted += 1
        else:
            skipped += 1

    click.echo(f"Observations: inserted={inserted} skipped={skipped}")
    click.echo("Ingest complete.")


@cli.command("validate-data")
@click.option("--limit", default=10_000, show_default=True, help="Maximum observations to load.")
def validate_data(limit: int) -> None:
    """Run data-quality checks on ingested dengue_weekly records."""
    from dengueahead.repositories.dengue_weekly import get_all_observations
    from dengueahead.repositories.mongo import get_db
    from dengueahead.validation.data_quality import run_quality_checks

    try:
        db = get_db()
        observations = get_all_observations(db, limit=limit)
    except Exception as exc:  # noqa: BLE001
        click.echo(f"ERROR: MongoDB connection failed: {exc}", err=True)
        sys.exit(1)

    if not observations:
        click.echo("No observations found in dengue_weekly collection.")
        sys.exit(0)

    report = run_quality_checks(observations)
    output = {
        "summary": report.summary(),
        "coverage": {k: round(v, 4) for k, v in report.coverage.items()},
        "gaps": [(a, s.isoformat(), e.isoformat()) for a, s, e in report.gap_weeks],
        "issues": [
            {
                "severity": i.severity,
                "areaId": i.area_id,
                "weekStart": i.week_start,
                "code": i.code,
                "message": i.message,
            }
            for i in report.issues
        ],
    }
    click.echo(json.dumps(output, indent=2))

    if report.has_errors:
        click.echo(
            f"\n{sum(1 for i in report.issues if i.severity == 'ERROR')} ERROR(s) found.", err=True
        )
        sys.exit(1)

    click.echo("\nAll quality checks passed.")


# -- Phase 2 commands ----------------------------------------------------------


@cli.command("build-features")
@click.option(
    "--as-of",
    "as_of",
    default=None,
    callback=_validate_date,
    help="Forecast cutoff date in YYYY-MM-DD format.",
)
@click.option(
    "--area-map",
    default="configs/area_map.yaml",
    show_default=True,
    help="Path to area map YAML.",
)
@click.option(
    "--dry-run", is_flag=True, default=False, help="Extract features without writing to MongoDB."
)
def build_features(as_of: str | None, area_map: str, dry_run: bool) -> None:
    """Construct temporal and meteorological lag features (as-of safe)."""
    from datetime import date, timedelta

    from dengueahead.features.builder import build_features_for_area
    from dengueahead.features.seasonality import calculate_seasonal_medians
    from dengueahead.ingestion.area_map import load_area_map
    from dengueahead.repositories.dengue_weekly import get_all_observations
    from dengueahead.repositories.feature_snapshots import upsert_feature_snapshot
    from dengueahead.repositories.mongo import ensure_indexes, get_db

    # Determine cutoff date
    if as_of is None:
        today = date.today()
        # Default to last Monday
        last_monday = today - timedelta(days=today.weekday())
        cutoff = last_monday.isoformat()
    else:
        cutoff = as_of

    area_map_path = Path(area_map)
    if not area_map_path.exists():
        click.echo(f"ERROR: Area map not found: {area_map}", err=True)
        sys.exit(1)
    am = load_area_map(area_map_path)
    districts = [a.area_id for a in am.areas]

    click.echo(f"Building as-of safe features for as_of={cutoff} across {len(districts)} districts")

    # Connect to Mongo
    try:
        db = get_db()
        ensure_indexes(db)
        observations = get_all_observations(db, limit=50_000)
    except Exception as exc:  # noqa: BLE001
        click.echo(f"ERROR: MongoDB connection failed: {exc}", err=True)
        sys.exit(1)

    seasonal_medians = calculate_seasonal_medians(observations)
    weather_records: list[dict] = []
    try:
        weather_records = list(db["weather_weekly"].find({}, {"_id": 0}))
    except Exception:  # noqa: BLE001
        pass

    built_count = 0
    withheld_count = 0
    inserted_count = 0

    for area_id in districts:
        record = build_features_for_area(
            area_id=area_id,
            as_of=cutoff,
            observations=observations,
            weather_records=weather_records,
            seasonal_medians=seasonal_medians,
        )
        built_count += 1
        if record.is_withheld:
            withheld_count += 1

        if not dry_run:
            ur = upsert_feature_snapshot(db, record)
            if ur.inserted:
                inserted_count += 1

    click.echo(
        f"Features built: total={built_count} withheld={withheld_count} "
        f"{'(dry-run, not written to DB)' if dry_run else f'inserted={inserted_count}'}"
    )


# -- Phase 3 commands ----------------------------------------------------------


@cli.command("train")
@click.option(
    "--config",
    default="configs/model.yaml",
    show_default=True,
    help="Path to model config YAML.",
)
@click.option(
    "--model-type",
    type=click.Choice(["ridge", "hgb"], case_sensitive=False),
    default="hgb",
    show_default=True,
    help="Model architecture: 'ridge' (linear) or 'hgb' (HistGradientBoosting).",
)
@click.option(
    "--area-map",
    default="configs/area_map.yaml",
    show_default=True,
    help="Path to area map YAML.",
)
@click.option(
    "--dry-run",
    is_flag=True,
    default=False,
    help="Train and evaluate without saving artifact or DB.",
)
def train(config: str, model_type: str, area_map: str, dry_run: bool) -> None:
    """Train regularized linear or gradient boosted model and evaluate on validation/test."""
    import numpy as np

    from dengueahead.evaluation.metrics import EvaluationInstance, compute_metrics
    from dengueahead.evaluation.split import DEFAULT_SPLIT
    from dengueahead.explainability.attribution import compute_permutation_importance
    from dengueahead.features.seasonality import (
        calculate_hotspot_thresholds,
        calculate_seasonal_medians,
    )
    from dengueahead.ingestion.area_map import load_area_map
    from dengueahead.repositories.dengue_weekly import get_all_observations
    from dengueahead.repositories.model_runs import upsert_model_run
    from dengueahead.repositories.mongo import ensure_indexes, get_db
    from dengueahead.training.calibration import PlattCalibrator
    from dengueahead.training.dataset import build_tabular_dataset
    from dengueahead.training.linear import RidgeHotspotPipeline
    from dengueahead.training.serializer import save_model_artifact
    from dengueahead.training.tree import HGBHotspotPipeline
    from dengueahead.training.uncertainty import ConformalIntervalCalculator

    area_map_path = Path(area_map)
    if not area_map_path.exists():
        click.echo(f"ERROR: Area map not found: {area_map}", err=True)
        sys.exit(1)
    am = load_area_map(area_map_path)
    districts = [a.area_id for a in am.areas]

    click.echo(f"Starting ML training pipeline for model_type={model_type}...")

    try:
        db = get_db()
        ensure_indexes(db)
        observations = get_all_observations(db, limit=50_000)
    except Exception as exc:  # noqa: BLE001
        click.echo(f"ERROR: MongoDB connection failed: {exc}", err=True)
        sys.exit(1)

    seasonal_medians = calculate_seasonal_medians(
        observations, train_end_date=DEFAULT_SPLIT.train_range.end_date
    )
    thresholds = calculate_hotspot_thresholds(
        observations, quantile=0.75, train_end_date=DEFAULT_SPLIT.train_range.end_date
    )

    # 1. Assemble Train, Val, Test datasets (ML-02 zero leakage)
    train_data = build_tabular_dataset(
        observations, districts, DEFAULT_SPLIT.train_range, seasonal_medians=seasonal_medians
    )
    val_data = build_tabular_dataset(
        observations, districts, DEFAULT_SPLIT.val_range, seasonal_medians=seasonal_medians
    )
    test_data = build_tabular_dataset(
        observations, districts, DEFAULT_SPLIT.test_range, seasonal_medians=seasonal_medians
    )

    click.echo(f"Data splits: Train={len(train_data)} Val={len(val_data)} Test={len(test_data)}")

    if len(train_data) == 0:
        click.echo("ERROR: Train dataset has 0 instances. Ensure data is ingested.", err=True)
        sys.exit(1)

    # 2. Instantiate and fit model
    if model_type.lower() == "ridge":
        model: RidgeHotspotPipeline | HGBHotspotPipeline = RidgeHotspotPipeline(
            alpha=10.0, random_state=42
        )
    else:
        model = HGBHotspotPipeline(
            learning_rate=0.05, max_depth=4, min_samples_leaf=5, random_state=42
        )

    model.fit(train_data.X, train_data.y)
    click.echo(f"Model {model.model_version} fitted on {len(train_data)} historical rows.")

    # 3. Fit probability calibrator & prediction intervals on validation set (ML-03)
    val_preds = model.predict_counts(val_data.X) if len(val_data) > 0 else np.array([])
    calibrator = PlattCalibrator(random_state=42)
    interval_calc = ConformalIntervalCalculator(target_coverage=0.80)

    if len(val_data) > 0:
        # Binary hotspot ground truth for validation
        val_thresholds = np.array([thresholds.get((a, 20), 50.0) for a in val_data.area_ids])
        val_binary = (val_data.y >= val_thresholds).astype(int)
        val_margins = val_preds - val_thresholds

        calibrator.fit(val_margins, val_binary)
        interval_calc.fit(val_data.y, val_preds)

    click.echo(
        f"Calibration status: {calibrator.get_confidence_status()} "
        f"(Brier: {calibrator.brier_score}) Conformal delta: {interval_calc.delta}"
    )

    # 4. Evaluate on held-out test split
    test_instances = []
    if len(test_data) > 0:
        test_preds = model.predict_counts(test_data.X)
        for i in range(len(test_data)):
            a = test_data.area_ids[i]
            tw = test_data.target_weeks[i]
            tau = thresholds.get((a, 20), 50.0)
            test_instances.append(
                EvaluationInstance(
                    area_id=a,
                    target_week=tw,
                    actual_cases=test_data.y[i],
                    predicted_cases=test_preds[i],
                    threshold=tau,
                )
            )

    test_metrics = compute_metrics(test_instances, top_k=3)
    click.echo(
        f"Held-out test metrics: MAE={test_metrics.mae} "
        f"Recall={test_metrics.recall} Prec={test_metrics.precision} "
        f"Top3Recall={test_metrics.top_k_recall}"
    )

    # 5. Feature importances
    importances = compute_permutation_importance(
        model,
        val_data.X if len(val_data) > 0 else train_data.X[:200],
        val_data.y if len(val_data) > 0 else train_data.y[:200],
        feature_names=train_data.feature_names,
    )
    sorted_imp = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
    click.echo(f"Top 5 feature importances: {sorted_imp}")

    if dry_run:
        click.echo("Dry-run mode: skipping artifact serialization and database write.")
        sys.exit(0)

    # 6. Save artifact to disk
    artifact_dir = Path(f"artifacts/models/{model.model_version}")
    metadata = {
        "modelVersion": model.model_version,
        "modelName": f"{model_type.upper()} Hotspot Forecaster",
        "trainedAt": datetime.now(UTC).isoformat(),
        "trainRange": {
            "startWeek": DEFAULT_SPLIT.train_range.start_date,
            "endWeek": DEFAULT_SPLIT.train_range.end_date,
        },
        "valRange": {
            "startWeek": DEFAULT_SPLIT.val_range.start_date,
            "endWeek": DEFAULT_SPLIT.val_range.end_date,
        },
        "testRange": {
            "startWeek": DEFAULT_SPLIT.test_range.start_date,
            "endWeek": DEFAULT_SPLIT.test_range.end_date,
        },
        "featureNames": train_data.feature_names,
        "metrics": test_metrics.to_dict(),
        "conformalDelta": interval_calc.delta,
        "topFeatures": dict(sorted_imp),
    }
    save_model_artifact(artifact_dir, model, calibrator, interval_calc, metadata)
    click.echo(f"Artifact serialized to {artifact_dir}")

    # 7. Upsert model run in Mongo
    run_doc = {
        "modelVersion": model.model_version,
        "modelName": f"{model_type.upper()} Hotspot Forecaster",
        "trainedAt": metadata["trainedAt"],
        "trainRange": metadata["trainRange"],
        "testRange": metadata["testRange"],
        "totalEvaluatedInstances": test_metrics.total_instances,
        "mae": test_metrics.mae,
        "topKRecall": test_metrics.top_k_recall,
        "precision": test_metrics.precision,
        "recall": test_metrics.recall,
        "brierScore": calibrator.brier_score,
        "baselines": [],
        "outperformsBaseline": False,
        "notes": f"Trained on historical data through {DEFAULT_SPLIT.train_range.end_date}",
    }
    upsert_model_run(db, run_doc)
    click.echo("Model run recorded in MongoDB.")


@cli.command("backtest")
@click.option(
    "--config",
    default="configs/model.yaml",
    show_default=True,
    help="Path to model config YAML.",
)
@click.option(
    "--area-map",
    default="configs/area_map.yaml",
    show_default=True,
    help="Path to area map YAML.",
)
@click.option(
    "--dry-run", is_flag=True, default=False, help="Run backtest without writing to MongoDB."
)
def backtest(config: str, area_map: str, dry_run: bool) -> None:
    """Execute out-of-time rolling evaluation for baseline and ML models."""
    from dengueahead.baselines.naive import NaiveLastWeekForecaster
    from dengueahead.baselines.rolling_mean import RollingMean4wForecaster
    from dengueahead.baselines.seasonal_median import SeasonalMedianForecaster
    from dengueahead.evaluation.backtest import BacktestRunner
    from dengueahead.evaluation.split import DEFAULT_SPLIT
    from dengueahead.inference.loader import load_model_artifact
    from dengueahead.inference.predictor import MLHotspotPredictor
    from dengueahead.ingestion.area_map import load_area_map
    from dengueahead.repositories.dengue_weekly import get_all_observations
    from dengueahead.repositories.model_runs import upsert_model_run
    from dengueahead.repositories.mongo import ensure_indexes, get_db
    from dengueahead.repositories.predictions import upsert_predictions_batch

    area_map_path = Path(area_map)
    if not area_map_path.exists():
        click.echo(f"ERROR: Area map not found: {area_map}", err=True)
        sys.exit(1)
    am = load_area_map(area_map_path)
    districts = [a.area_id for a in am.areas]

    click.echo("Running rolling backtest across evaluation window...")
    click.echo(
        f"Evaluation window: {DEFAULT_SPLIT.test_range.start_date} "
        f"to {DEFAULT_SPLIT.test_range.end_date}"
    )

    try:
        db = get_db()
        ensure_indexes(db)
        observations = get_all_observations(db, limit=50_000)
    except Exception as exc:  # noqa: BLE001
        click.echo(f"ERROR: MongoDB connection failed: {exc}", err=True)
        sys.exit(1)

    runner = BacktestRunner(
        observations=observations,
        areas=districts,
        train_end_date=DEFAULT_SPLIT.train_range.end_date,
    )

    models: list[tuple[str, object]] = [
        ("naive", NaiveLastWeekForecaster()),
        ("rolling_mean_4w", RollingMean4wForecaster()),
        ("seasonal_median", SeasonalMedianForecaster()),
    ]

    # Check for trained ML artifacts
    for m_ver in ["dengueahead-hgb-v1", "dengueahead-ridge-v1"]:
        art_path = Path(f"artifacts/models/{m_ver}")
        if art_path.exists():
            try:
                bundle = load_model_artifact(art_path)
                ml_pred = MLHotspotPredictor(
                    model=bundle["model"],
                    calibrator=bundle.get("calibrator"),
                    interval_calc=bundle.get("interval_calc"),
                    model_version=m_ver,
                    feature_names=bundle["metadata"].get("featureNames"),
                )
                models.append((m_ver, ml_pred))
            except Exception as exc:  # noqa: BLE001
                click.echo(f"Notice: Could not load artifact {m_ver}: {exc}")

    baseline_metrics_summary = []
    best_baseline_mae = float("inf")

    for name, model in models:
        metrics, predictions = runner.run_backtest(model, DEFAULT_SPLIT.test_range)
        b_entry = {
            "baselineName": name,
            "mae": metrics.mae,
            "topKRecall": metrics.top_k_recall,
            "precision": metrics.precision,
            "recall": metrics.recall,
        }
        baseline_metrics_summary.append(b_entry)

        if name in ("naive", "rolling_mean_4w", "seasonal_median"):
            if metrics.mae < best_baseline_mae:
                best_baseline_mae = metrics.mae

        outperforms = False
        if name not in ("naive", "rolling_mean_4w", "seasonal_median"):
            # Check 5% improvement gate
            outperforms = metrics.mae <= (0.95 * best_baseline_mae)

        is_ml = name not in ("naive", "rolling_mean_4w", "seasonal_median")
        suffix = f" Outperforms={outperforms}" if is_ml else ""
        click.echo(
            f"[{name}] instances={metrics.total_instances} MAE={metrics.mae} "
            f"Recall={metrics.recall} Prec={metrics.precision} "
            f"Top3Recall={metrics.top_k_recall}{suffix}"
        )

        if not dry_run:
            run_doc = runner.build_model_run_record(
                model_version=getattr(model, "model_version", name),
                model_name=f"{name.replace('_', ' ').title()} Model",
                metrics=metrics,
                train_range=DEFAULT_SPLIT.train_range,
                test_range=DEFAULT_SPLIT.test_range,
                baseline_metrics_list=baseline_metrics_summary,
                outperforms_baseline=outperforms,
                notes="Phase 3 comparative evaluation run",
            )
            upsert_model_run(db, run_doc)
            upsert_predictions_batch(db, predictions)

    click.echo("Rolling backtest completed successfully.")


# -- Phase 4 stubs -------------------------------------------------------------


@cli.command("predict")
@click.option(
    "--as-of",
    "as_of",
    default=None,
    callback=_validate_date,
    help="Forecast issue date in YYYY-MM-DD format.",
)
@click.option("--publish", is_flag=True, default=False, help="Publish predictions to MongoDB.")
def predict(as_of: str | None, publish: bool) -> None:
    """Generate next-week hotspot predictions and optionally publish to DB."""
    _not_implemented("predict", 4)


if __name__ == "__main__":
    cli()
