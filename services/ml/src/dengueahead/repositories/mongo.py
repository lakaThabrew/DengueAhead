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
    resolved_uri = (
        uri
        or os.environ.get("ML_MONGODB_WRITE_URI")
        or os.environ.get("MONGODB_URI")
        or "mongodb://localhost:27017/dengueahead"
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
    """Create all required MongoDB indexes if they do not already exist."""
    from pymongo import ASCENDING
    from pymongo.errors import OperationFailure

    index_specs = [
        ("source_snapshots", [("sourceId", ASCENDING), ("sha256", ASCENDING)], {"unique": True, "name": "source_snapshots_id_sha_unique"}),
        ("areas", [("areaId", ASCENDING)], {"unique": True, "name": "areas_areaId_unique"}),
        ("dengue_weekly", [("areaId", ASCENDING), ("weekStart", ASCENDING), ("revision", ASCENDING)], {"unique": True}),
        ("dengue_weekly", [("areaId", ASCENDING), ("weekStart", ASCENDING)], {}),
        ("weather_weekly", [("areaId", ASCENDING), ("weekStart", ASCENDING), ("provider", ASCENDING)], {"unique": True}),
        ("feature_snapshots", [("areaId", ASCENDING), ("issueDate", ASCENDING), ("featureSetVersion", ASCENDING)], {"unique": True}),
        ("model_runs", [("modelVersion", ASCENDING)], {"unique": True, "name": "model_runs_version_unique"}),
        ("predictions", [("areaId", ASCENDING), ("targetWeek", ASCENDING), ("modelVersion", ASCENDING), ("issueDate", ASCENDING)], {"unique": True}),
        ("predictions", [("issueDate", ASCENDING), ("areaId", ASCENDING)], {}),
    ]

    for col_name, keys, options in index_specs:
        try:
            opts = dict(background=True, **options)
            db[col_name].create_index(keys, **opts)
        except OperationFailure as exc:
            msg = str(exc)
            if "already exists" in msg or "IndexOptionsConflict" in msg:
                pass
            else:
                log.warning(f"Index creation warning for {col_name}: {exc}")
    log.info("MongoDB indexes ensured")
