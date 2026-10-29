"""DengueAhead ML & Data CLI — Phase 0 scaffolding."""

import re
import sys

import click

from dengueahead import __version__


@click.group()
@click.version_option(__version__, prog_name="dengueahead")
def cli() -> None:
    """DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka."""


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
            f"'{value}' is not a valid date — expected YYYY-MM-DD",
            ctx=ctx,
            param=param,
        )
    return value


# ── Phase 1 stubs ─────────────────────────────────────────────────────────────


@cli.command("audit-sources")
@click.option(
    "--config",
    default="configs/sources.yaml",
    show_default=True,
    help="Path to sources config YAML.",
)
def audit_sources(config: str) -> None:
    """Audit external official data sources and verify licences/access."""
    _not_implemented("audit-sources", 1)


@cli.command("ingest")
@click.option(
    "--config",
    default="configs/sources.yaml",
    show_default=True,
    help="Path to sources config YAML.",
)
def ingest(config: str) -> None:
    """Fetch official weekly dengue reports and weather data."""
    _not_implemented("ingest", 1)


@cli.command("validate-data")
def validate_data() -> None:
    """Run data-quality and schema validation on ingested records."""
    _not_implemented("validate-data", 1)


# ── Phase 2 stubs ─────────────────────────────────────────────────────────────


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


# ── Phase 3 stubs ─────────────────────────────────────────────────────────────


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


# ── Phase 4 stubs ─────────────────────────────────────────────────────────────


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
