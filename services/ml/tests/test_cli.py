import pytest
from dengueahead.cli.main import build_parser, main
from dengueahead import __version__

def test_version_flag(capsys):
    parser = build_parser()
    with pytest.raises(SystemExit) as exc_info:
        parser.parse_args(["--version"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert f"dengueahead {__version__}" in captured.out

def test_cli_help(capsys):
    parser = build_parser()
    with pytest.raises(SystemExit) as exc_info:
        parser.parse_args(["--help"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert "audit-sources" in captured.out
    assert "ingest" in captured.out
    assert "validate-data" in captured.out
    assert "build-features" in captured.out
    assert "train" in captured.out
    assert "backtest" in captured.out
    assert "predict" in captured.out

def test_subcommand_execution(capsys):
    ret = main(["audit-sources"])
    assert ret == 0
    captured = capsys.readouterr()
    assert "Executing subcommand: audit-sources" in captured.out

