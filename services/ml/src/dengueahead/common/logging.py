"""Structured JSON-line logging helper for dengueahead CLI and pipeline steps."""

from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from typing import Any


def _log(level: str, message: str, **kwargs: Any) -> None:
    record = {
        "timestamp": datetime.now(tz=UTC).isoformat(),
        "level": level,
        "message": message,
        **kwargs,
    }
    print(json.dumps(record), file=sys.stderr, flush=True)


def info(message: str, **kwargs: Any) -> None:
    _log("INFO", message, **kwargs)


def warning(message: str, **kwargs: Any) -> None:
    _log("WARNING", message, **kwargs)


def error(message: str, **kwargs: Any) -> None:
    _log("ERROR", message, **kwargs)
