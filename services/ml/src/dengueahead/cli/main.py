import argparse
import sys
from dengueahead import __version__

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="dengueahead",
        description="DengueAhead ML & Data CLI — Early Warning for Emerging Dengue Hotspots in Sri Lanka",
    )
    parser.add_argument("--version", action="version", version=f"dengueahead {__version__}")

    subparsers = parser.add_subparsers(dest="subcommand", help="Available subcommands")

    # audit-sources
    audit_parser = subparsers.add_parser("audit-sources", help="Audit external official data sources and manifest")
    audit_parser.add_argument("--config", default="configs/sources.yaml", help="Path to sources config")

    # ingest
    ingest_parser = subparsers.add_parser("ingest", help="Ingest official weekly reports and weather data")
    ingest_parser.add_argument("--config", default="configs/sources.yaml", help="Path to sources config")

    # validate-data
    subparsers.add_parser("validate-data", help="Validate ingested records against schema and quality checks")

    # build-features
    feat_parser = subparsers.add_parser("build-features", help="Construct as-of temporal and weather lag features")
    feat_parser.add_argument("--as-of", required=False, help="Cutoff date in YYYY-MM-DD")

    # train
    train_parser = subparsers.add_parser("train", help="Train baseline and ML hotspot prediction models")
    train_parser.add_argument("--config", default="configs/model.yaml", help="Path to model config")

    # backtest
    backtest_parser = subparsers.add_parser("backtest", help="Run historical out-of-time evaluation and backtests")
    backtest_parser.add_argument("--config", default="configs/model.yaml", help="Path to model config")

    # predict
    predict_parser = subparsers.add_parser("predict", help="Generate and publish batch predictions")
    predict_parser.add_argument("--as-of", required=False, help="Issue date in YYYY-MM-DD")
    predict_parser.add_argument("--publish", action="store_true", help="Publish predictions to database")

    return parser

def main(args=None):
    parser = build_parser()
    parsed_args = parser.parse_args(args)

    if not parsed_args.subcommand:
        parser.print_help()
        sys.exit(0)

    print(f"[DengueAhead CLI] Executing subcommand: {parsed_args.subcommand}")
    # Phase 0 subcommand stub
    print(f"[DengueAhead CLI] Subcommand '{parsed_args.subcommand}' successfully scaffolded for Phase 0.")
    return 0

if __name__ == "__main__":
    main()

