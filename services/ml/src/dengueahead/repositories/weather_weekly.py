"""weather_weekly collection — idempotent upsert and time-series query."""

from __future__ import annotations

from datetime import date

from pymongo.database import Database

from dengueahead.ingestion.weather_fetcher import WeatherWeeklyRecord
from dengueahead.repositories.source_snapshots import UpsertResult


def upsert_weather(db: Database, record: WeatherWeeklyRecord) -> UpsertResult:  # type: ignore[type-arg]
    """Upsert a weather_weekly document keyed on ``(areaId, weekStart, provider)``."""
    doc = {
        "areaId": record.area_id,
        "weekStart": record.week_start.isoformat(),
        "rainMm": record.rain_mm,
        "tempC": record.temp_c,
        "humidityPct": record.humidity_pct,
        "provider": record.provider,
        "availableAt": record.available_at.isoformat(),
        "qualityFlags": record.quality_flags,
    }
    result = db["weather_weekly"].update_one(
        {
            "areaId": record.area_id,
            "weekStart": record.week_start.isoformat(),
            "provider": record.provider,
        },
        {"$setOnInsert": doc},
        upsert=True,
    )
    return UpsertResult(
        matched=result.matched_count,
        inserted=1 if result.upserted_id is not None else 0,
        modified=result.modified_count,
    )


def get_weather_series(
    db: Database,  # type: ignore[type-arg]
    area_id: str,
    from_date: date,
    to_date: date,
) -> list[dict]:  # type: ignore[return-value]
    return list(
        db["weather_weekly"]
        .find(
            {
                "areaId": area_id,
                "weekStart": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()},
            },
            {"_id": 0},
        )
        .sort("weekStart", 1)
    )
