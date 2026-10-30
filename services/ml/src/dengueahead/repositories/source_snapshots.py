"""source_snapshots collection — idempotent upsert and query."""

from __future__ import annotations

from dataclasses import dataclass

from pymongo.database import Database

from dengueahead.ingestion.snapshot import StoredSnapshot


@dataclass(frozen=True)
class UpsertResult:
    matched: int
    inserted: int
    modified: int


def upsert_snapshot(db: Database, snapshot: StoredSnapshot, observed_period: str) -> UpsertResult:  # type: ignore[type-arg]
    """Upsert a source_snapshot document using ``(sourceId, sha256)`` as the idempotent key.

    Uses ``$setOnInsert`` so an existing document is never overwritten.
    """
    doc = {
        "sourceId": snapshot.source_id,
        "sourceUrl": snapshot.source_url,
        "sha256": snapshot.sha256,
        "contentType": snapshot.content_type,
        "observedPeriod": observed_period,
        "retrievedAt": snapshot.fetched_at.isoformat(),
        "licenceStatus": "PENDING_VERIFICATION",
        "parserVersion": "1.0.0",
        "status": "SUCCESS",
        "error": None,
    }
    result = db["source_snapshots"].update_one(
        {"sourceId": snapshot.source_id, "sha256": snapshot.sha256},
        {"$setOnInsert": doc},
        upsert=True,
    )
    return UpsertResult(
        matched=result.matched_count,
        inserted=1 if result.upserted_id is not None else 0,
        modified=result.modified_count,
    )


def get_snapshot_by_hash(db: Database, source_id: str, sha256: str) -> dict | None:  # type: ignore[type-arg]
    return db["source_snapshots"].find_one(  # type: ignore[return-value]
        {"sourceId": source_id, "sha256": sha256}, {"_id": 0}
    )


def list_snapshots(db: Database, limit: int = 100) -> list[dict]:  # type: ignore[type-arg]
    return list(db["source_snapshots"].find({}, {"_id": 0}).sort("retrievedAt", -1).limit(limit))
