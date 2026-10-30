"""areas collection — idempotent upsert and query."""

from __future__ import annotations

from pymongo.database import Database

from dengueahead.repositories.source_snapshots import UpsertResult


def upsert_area(
    db: Database,  # type: ignore[type-arg]
    area_id: str,
    name: str,
    level: str,
    lat: float | None = None,
    lon: float | None = None,
    parent_area_id: str | None = None,
    population: int | None = None,
    population_year: int | None = None,
) -> UpsertResult:
    """Upsert an area document keyed on ``areaId``.

    Uses ``$set`` so metadata corrections can be applied on re-run.
    """
    doc: dict = {
        "areaId": area_id,
        "name": name,
        "level": level,
        "parentAreaId": parent_area_id,
        "centroid": {"latitude": lat, "longitude": lon} if lat is not None else None,
        "population": population,
        "populationYear": population_year,
    }
    result = db["areas"].update_one(
        {"areaId": area_id},
        {"$set": {k: v for k, v in doc.items() if k != "areaId"}},
        upsert=True,
    )
    return UpsertResult(
        matched=result.matched_count,
        inserted=1 if result.upserted_id is not None else 0,
        modified=result.modified_count,
    )


def get_area(db: Database, area_id: str) -> dict | None:  # type: ignore[type-arg]
    return db["areas"].find_one({"areaId": area_id}, {"_id": 0})  # type: ignore[return-value]


def list_areas(
    db: Database,  # type: ignore[type-arg]
    level: str | None = None,
    query: str | None = None,
    limit: int = 100,
    skip: int = 0,
) -> list[dict]:  # type: ignore[return-value]
    filt: dict = {}
    if level:
        filt["level"] = level
    if query:
        filt["name"] = {"$regex": query, "$options": "i"}
    return list(db["areas"].find(filt, {"_id": 0}).sort("areaId", 1).skip(skip).limit(limit))
