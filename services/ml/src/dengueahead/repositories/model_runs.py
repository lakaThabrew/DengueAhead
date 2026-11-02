"""model_runs collection — evaluation evidence and baseline comparison storage."""

from __future__ import annotations

from typing import Any

from pymongo.database import Database

from dengueahead.repositories.source_snapshots import UpsertResult


def upsert_model_run(
    db: Database,  # type: ignore[type-arg]
    run_doc: dict[str, Any],
) -> UpsertResult:
    """Upsert a model run document keyed on modelVersion."""
    version = run_doc.get("modelVersion")
    if not version:
        raise ValueError("Model run document missing 'modelVersion'")

    result = db["model_runs"].update_one(
        {"modelVersion": version},
        {"$set": run_doc},
        upsert=True,
    )
    return UpsertResult(
        matched=result.matched_count,
        inserted=1 if result.upserted_id is not None else 0,
        modified=result.modified_count,
    )


def get_model_runs(
    db: Database,  # type: ignore[type-arg]
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Return model runs sorted by trainedAt descending."""
    return list(db["model_runs"].find({}, {"_id": 0}).sort("trainedAt", -1).limit(limit))


def get_model_run_by_version(
    db: Database,  # type: ignore[type-arg]
    model_version: str,
) -> dict[str, Any] | None:
    """Return specific model run by its version string."""
    return db["model_runs"].find_one({"modelVersion": model_version}, {"_id": 0})
