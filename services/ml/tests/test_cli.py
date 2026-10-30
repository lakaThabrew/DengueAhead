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


@pytest.mark.parametrize(
    "subcommand",
    [
        # audit-sources, ingest, validate-data are now implemented (Phase 1)
        ["build-features"],
        ["train"],
        ["backtest"],
        ["predict"],
    ],
)
def test_stubs_exit_3_with_not_implemented(runner: CliRunner, subcommand: list[str]) -> None:
    """Every stub must exit 3 and print 'not implemented' somewhere in its output."""
    result = runner.invoke(cli, subcommand)
    cmd = subcommand[0]
    assert result.exit_code == 3, f"{cmd} should exit 3, got {result.exit_code}"
    assert "not implemented" in result.output.lower(), f"{cmd} missing 'not implemented'"


@pytest.mark.parametrize("subcommand", ["build-features", "predict"])
def test_invalid_as_of_exits_2(runner: CliRunner, subcommand: str) -> None:
    """Invalid --as-of date format must exit 2 (UsageError), not 0 or 3."""
    result = runner.invoke(cli, [subcommand, "--as-of", "not-a-date"])
    assert result.exit_code == 2, (
        f"{subcommand} with bad --as-of should exit 2, got {result.exit_code}\n"
        f"Output: {result.output}"
    )


@pytest.mark.parametrize("subcommand", ["build-features", "predict"])
def test_valid_as_of_accepted(runner: CliRunner, subcommand: str) -> None:
    """Valid YYYY-MM-DD --as-of should be accepted (exits 3 = not implemented, not 2)."""
    result = runner.invoke(cli, [subcommand, "--as-of", "2026-10-25"])
    assert result.exit_code == 3, (
        f"{subcommand} with valid --as-of should exit 3, got {result.exit_code}\n"
        f"Output: {result.output}"
    )
