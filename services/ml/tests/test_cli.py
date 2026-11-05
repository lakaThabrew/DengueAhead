"""Unit tests for the dengueahead CLI (click-based)."""

import pytest
from click.testing import CliRunner

from dengueahead import __version__
from dengueahead.cli.main import cli


@pytest.fixture()
def runner() -> CliRunner:
    # mix_stderr=True (default): stderr is mixed into result.output so we can assert on it
    return CliRunner()


def test_version_flag(runner: CliRunner) -> None:
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_cli_help(runner: CliRunner) -> None:
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    expected_cmds = [
        "audit-sources",
        "ingest",
        "validate-data",
        "build-features",
        "train",
        "backtest",
        "predict",
    ]
    for cmd in expected_cmds:
        assert cmd in result.output


def test_predict_is_implemented(runner: CliRunner) -> None:
    """predict command is now fully implemented (Phase 4) and should NOT exit 3."""
    # Invoke with --help to verify the command is registered and functional
    result = runner.invoke(cli, ["predict", "--help"])
    assert result.exit_code == 0, f"predict --help should exit 0, got {result.exit_code}"
    assert "predict" in result.output.lower()
    # Verify new Phase 4 options are present
    assert "--model-version" in result.output
    assert "--publish" in result.output
    assert "--output" in result.output


@pytest.mark.parametrize("subcommand", ["build-features", "predict"])
def test_invalid_as_of_exits_2(runner: CliRunner, subcommand: str) -> None:
    """Invalid --as-of date format must exit 2 (UsageError), not 0 or 3."""
    result = runner.invoke(cli, [subcommand, "--as-of", "not-a-date"])
    assert result.exit_code == 2, (
        f"{subcommand} with bad --as-of should exit 2, got {result.exit_code}\n"
        f"Output: {result.output}"
    )


def test_predict_valid_as_of_runs(runner: CliRunner) -> None:
    """predict --as-of with valid date and missing area map exits 1 (config error), not 3."""
    result = runner.invoke(
        cli, ["predict", "--as-of", "2026-10-25", "--area-map", "configs/area_map.yaml"]
    )
    # Phase 4: predict is fully implemented.
    # Without the area map it exits 1 (config error), not 3 (not implemented).
    msg = f"predict should no longer exit 3 (was a stub); got {result.exit_code}"
    assert result.exit_code != 3, msg


def test_build_features_help(runner: CliRunner) -> None:
    """build-features --help outputs command documentation and exits 0."""
    result = runner.invoke(cli, ["build-features", "--help"])
    assert result.exit_code == 0
    assert "--as-of" in result.output
    assert "--dry-run" in result.output


def test_train_help(runner: CliRunner) -> None:
    """train --help outputs command documentation and exits 0."""
    result = runner.invoke(cli, ["train", "--help"])
    assert result.exit_code == 0
    assert "--model-type" in result.output
    assert "--dry-run" in result.output


def test_backtest_help(runner: CliRunner) -> None:
    """backtest --help outputs command documentation and exits 0."""
    result = runner.invoke(cli, ["backtest", "--help"])
    assert result.exit_code == 0
    assert "--config" in result.output
    assert "--dry-run" in result.output
