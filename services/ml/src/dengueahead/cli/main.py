"""DengueAhead ML & Data CLI."""

from __future__ import annotations

import json
import re
import sys
from datetime import UTC
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


# -- Phase 2 stubs -------------------------------------------------------------


@cli.command("build-features")
@click.option(
    "--as-of",
    "as_of",
    default=None,
    callback=_validate_date,
    help="Forecast cutoff date in YYYY-MM-DD format.",
)
def build_features(as_of: str | None) -> None:
    """Construct temporal and meteorological lag features (as-of safe)."""
    _not_implemented("build-features", 2)


# -- Phase 3 stubs -------------------------------------------------------------


@cli.command("train")
@click.option(
    "--config",
    default="configs/model.yaml",
    show_default=True,
    help="Path to model config YAML.",
)
def train(config: str) -> None:
    """Fit baselines and hotspot classification models."""
    _not_implemented("train", 3)


@cli.command("backtest")
@click.option(
    "--config",
    default="configs/model.yaml",
    show_default=True,
    help="Path to model config YAML.",
)
def backtest(config: str) -> None:
    """Execute out-of-time rolling evaluation."""
    _not_implemented("backtest", 3)


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
