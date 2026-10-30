"""MongoDB client wrapper for the dengueahead write pipeline."""

from __future__ import annotations

import os

from pymongo import MongoClient
from pymongo.database import Database

from dengueahead.common import logging as log

_client: MongoClient | None = None  # type: ignore[type-arg]


def get_db(uri: str | None = None, db_name: str = "dengueahead") -> Database:  # type: ignore[type-arg]
    """Return a MongoDB :class:`~pymongo.database.Database` using the write credential.

    Uses ``ML_MONGODB_WRITE_URI`` env var by default.  Pass *uri* explicitly in tests.

    The client is lazily created and reused within the same process.
    """
    global _client  # noqa: PLW0603
    resolved_uri = uri or os.environ.get("ML_MONGODB_WRITE_URI")
    if not resolved_uri:
        raise RuntimeError(
            "ML_MONGODB_WRITE_URI environment variable is not set. "
            "The Python pipeline uses a separate write credential from the Node API."
        )
    if _client is None:
        _client = MongoClient(resolved_uri, serverSelectionTimeoutMS=5000)
        log.info("MongoDB write client initialised")
    return _client[db_name]


def close_client() -> None:
    """Close the global client (call at process shutdown)."""
    global _client  # noqa: PLW0603
    if _client is not None:
        _client.close()
        _client = None
        log.info("MongoDB write client closed")


def ensure_indexes(db: Database) -> None:  # type: ignore[type-arg]
    """Create all Phase 1 indexes if they do not already exist."""
    from pymongo import ASCENDING

    db["source_snapshots"].create_index(
        [("sourceId", ASCENDING), ("sha256", ASCENDING)], unique=True, background=True
    )
    db["areas"].create_index([("areaId", ASCENDING)], unique=True, background=True)
    db["dengue_weekly"].create_index(
        [("areaId", ASCENDING), ("weekStart", ASCENDING), ("revision", ASCENDING)],
        unique=True,
        background=True,
    )
    db["dengue_weekly"].create_index(
        [("areaId", ASCENDING), ("weekStart", ASCENDING)], background=True
    )
    db["weather_weekly"].create_index(
        [("areaId", ASCENDING), ("weekStart", ASCENDING), ("provider", ASCENDING)],
        unique=True,
        background=True,
    )
    log.info("MongoDB indexes ensured")
