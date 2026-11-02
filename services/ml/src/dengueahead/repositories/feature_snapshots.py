"""feature_snapshots collection — idempotent upsert and query."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pymongo.database import Database

from dengueahead.features.builder import FeatureRecord
from dengueahead.repositories.source_snapshots import UpsertResult


def upsert_feature_snapshot(
    db: Database,  # type: ignore[type-arg]
    record: FeatureRecord,
) -> UpsertResult:
    """Upsert a feature snapshot document keyed on (areaId, issueDate, featureSetVersion)."""
    doc = {
        "areaId": record.area_id,
        "issueDate": record.issue_date,
        "targetWeek": record.target_week,
        "featureSetVersion": record.feature_set_version,
        "features": record.features,
        "sourceSnapshotIds": record.source_snapshot_ids,
        "qualityFlags": record.quality_flags,
        "isWithheld": record.is_withheld,
        "createdAt": datetime.now(UTC).isoformat(),
    }
    result = db["feature_snapshots"].update_one(
        {
            "areaId": record.area_id,
            "issueDate": record.issue_date,
            "featureSetVersion": record.feature_set_version,
        },
        {"$setOnInsert": doc},
        upsert=True,
    )
    return UpsertResult(
        matched=result.matched_count,
        inserted=1 if result.upserted_id is not None else 0,
        modified=result.modified_count,
    )


def get_feature_snapshot(
    db: Database,  # type: ignore[type-arg]
    area_id: str,
    issue_date: str,
    feature_set_version: str = "v1.0.0",
) -> dict[str, Any] | None:
    """Retrieve stored feature snapshot document."""
    return db["feature_snapshots"].find_one(
        {
            "areaId": area_id,
            "issueDate": issue_date,
            "featureSetVersion": feature_set_version,
        },
        {"_id": 0},
    )
