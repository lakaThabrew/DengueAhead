"""dengue_weekly collection — idempotent upsert and time-series query."""

from __future__ import annotations

from datetime import date

from pymongo.database import Database

from dengueahead.ingestion.ndcu_parser import ParsedObservation
from dengueahead.repositories.source_snapshots import UpsertResult


def upsert_observation(db: Database, obs: ParsedObservation, revision: int = 1) -> UpsertResult:  # type: ignore[type-arg]
    """Upsert a dengue_weekly document keyed on ``(areaId, weekStart, revision)``.

    Uses ``$setOnInsert`` — a published revision is never silently overwritten.
    To correct data, increment the *revision* number.
    """
    doc = {
        "areaId": obs.area_id,
        "weekStart": obs.week_start.isoformat(),
        "weekEnd": obs.week_end.isoformat(),
        "reportingWeek": obs.reporting_week,
        "reportingYear": obs.reporting_year,
        "cases": obs.cases,
        "missingReason": obs.missing_reason,
        "sourceSnapshotId": obs.snapshot_id,
        "reportedAt": None,  # set by caller if known
        "revision": revision,
        "qualityFlags": obs.quality_flags,
    }
    result = db["dengue_weekly"].update_one(
        {
            "areaId": obs.area_id,
            "weekStart": obs.week_start.isoformat(),
            "revision": revision,
        },
        {"$setOnInsert": doc},
        upsert=True,
    )
    return UpsertResult(
        matched=result.matched_count,
        inserted=1 if result.upserted_id is not None else 0,
        modified=result.modified_count,
    )


def get_series(
    db: Database,  # type: ignore[type-arg]
    area_id: str,
    from_date: date,
    to_date: date,
) -> list[dict]:  # type: ignore[return-value]
    """Return dengue_weekly records for *area_id* between *from_date* and *to_date* inclusive."""
    return list(
        db["dengue_weekly"]
        .find(
            {
                "areaId": area_id,
                "weekStart": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()},
            },
            {"_id": 0},
        )
        .sort("weekStart", 1)
    )


def get_all_observations(db: Database, limit: int = 10_000) -> list[dict]:  # type: ignore[type-arg]
    """Return up to *limit* observations for quality-check and validation commands."""
    return list(db["dengue_weekly"].find({}, {"_id": 0}).sort("weekStart", 1).limit(limit))
