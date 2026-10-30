"""Integration tests for the ingestion pipeline — DATA-11, DATA-12, DATA-13.

These tests require a running MongoDB instance. They are skipped automatically
when MONGODB_URI is not set in the environment.
"""

from __future__ import annotations

import os
from datetime import UTC, date, datetime

import pytest

MONGODB_URI = os.environ.get("ML_MONGODB_URI") or os.environ.get("MONGODB_URI")
pytestmark = pytest.mark.skipif(
    not MONGODB_URI,
    reason="MONGODB_URI / ML_MONGODB_URI not set — skipping integration tests",
)


@pytest.fixture(scope="module")
def db():
    """Yield a test MongoDB database and clean up after module tests finish."""
    from pymongo import MongoClient

    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
    database = client["dengueahead_test"]
    yield database
    # Cleanup test collections
    database["source_snapshots"].drop()
    database["dengue_weekly"].drop()
    database["weather_weekly"].drop()
    client.close()


# ── DATA-11: source_snapshots idempotent pipeline ────────────────────────────


def test_data11_snapshot_upsert_idempotent(db, tmp_path):
    """DATA-11: Ingesting the same snapshot twice inserts exactly one document."""
    from dengueahead.ingestion.fetcher import FetchResult
    from dengueahead.ingestion.snapshot import store_snapshot
    from dengueahead.repositories.source_snapshots import (
        get_snapshot_by_hash,
        upsert_snapshot,
    )

    content = b"<html><body>test</body></html>"
    fetch_result = FetchResult(
        url="https://example.com/report.html",
        content=content,
        content_type="text/html",
        fetched_at=datetime(2024, 1, 10, tzinfo=UTC),
        http_status=200,
    )
    stored = store_snapshot(fetch_result, "ndcu-test", tmp_path)

    # First upsert
    r1 = upsert_snapshot(db, stored, "2024-W01")
    assert r1.inserted == 1

    # Second upsert — identical (sourceId, sha256) → no new document
    r2 = upsert_snapshot(db, stored, "2024-W01")
    assert r2.inserted == 0

    # Exactly one document in the collection for this sha256
    count = db["source_snapshots"].count_documents({"sha256": stored.sha256})
    assert count == 1

    # Retrieve by hash
    doc = get_snapshot_by_hash(db, "ndcu-test", stored.sha256)
    assert doc is not None
    assert doc["sourceId"] == "ndcu-test"


# ── DATA-12: dengue_weekly upsert stores and retrieves correctly ──────────────


def test_data12_dengue_weekly_upsert_and_retrieve(db):
    """DATA-12: Upsert an observation and retrieve it via get_series."""
    from dengueahead.ingestion.ndcu_parser import ParsedObservation
    from dengueahead.repositories.dengue_weekly import get_series, upsert_observation

    obs = ParsedObservation(
        area_name_raw="Colombo",
        area_id="LK-11",
        week_start=date(2024, 3, 4),
        week_end=date(2024, 3, 10),
        reporting_week=10,
        reporting_year=2024,
        cases=88,
        missing_reason=None,
        snapshot_id="sha-integration-01",
        quality_flags=[],
    )
    r = upsert_observation(db, obs)
    assert r.inserted == 1

    series = get_series(db, "LK-11", date(2024, 3, 1), date(2024, 3, 31))
    assert any(o["areaId"] == "LK-11" and o["cases"] == 88 for o in series)


def test_data12_dengue_weekly_idempotent(db):
    """DATA-12: Calling upsert_observation twice stores only one document."""
    from dengueahead.ingestion.ndcu_parser import ParsedObservation
    from dengueahead.repositories.dengue_weekly import upsert_observation

    obs = ParsedObservation(
        area_name_raw="Gampaha",
        area_id="LK-12",
        week_start=date(2024, 3, 4),
        week_end=date(2024, 3, 10),
        reporting_week=10,
        reporting_year=2024,
        cases=55,
        missing_reason=None,
        snapshot_id="sha-integration-02",
        quality_flags=[],
    )
    r1 = upsert_observation(db, obs)
    r2 = upsert_observation(db, obs)
    assert r1.inserted == 1
    assert r2.inserted == 0
    count = db["dengue_weekly"].count_documents({"areaId": "LK-12", "weekStart": "2024-03-04"})
    assert count == 1


def test_data12_null_cases_stored_correctly(db):
    """DATA-12: cases=None is stored, not coerced to 0."""
    from dengueahead.ingestion.ndcu_parser import ParsedObservation
    from dengueahead.repositories.dengue_weekly import upsert_observation

    obs = ParsedObservation(
        area_name_raw="Kandy",
        area_id="LK-21",
        week_start=date(2024, 3, 11),
        week_end=date(2024, 3, 17),
        reporting_week=11,
        reporting_year=2024,
        cases=None,
        missing_reason="NO_REPORT",
        snapshot_id="sha-integration-03",
        quality_flags=[],
    )
    upsert_observation(db, obs)
    doc = db["dengue_weekly"].find_one({"areaId": "LK-21", "weekStart": "2024-03-11"})
    assert doc is not None
    assert doc["cases"] is None
    assert doc["missingReason"] == "NO_REPORT"


# ── DATA-13: weather_weekly upsert and retrieval ──────────────────────────────


def test_data13_weather_weekly_upsert_and_retrieve(db):
    """DATA-13: Upsert weather and retrieve it via get_weather_series."""
    from dengueahead.ingestion.weather_fetcher import WeatherWeeklyRecord
    from dengueahead.repositories.weather_weekly import get_weather_series, upsert_weather

    record = WeatherWeeklyRecord(
        area_id="LK-11",
        week_start=date(2024, 3, 4),
        rain_mm=12.5,
        temp_c=29.2,
        humidity_pct=78.0,
        provider="open-meteo",
        available_at=datetime(2024, 3, 11, tzinfo=UTC),
        quality_flags=[],
    )
    r = upsert_weather(db, record)
    assert r.inserted == 1

    series = get_weather_series(db, "LK-11", date(2024, 3, 1), date(2024, 3, 31))
    assert any(w["areaId"] == "LK-11" and w["rainMm"] == pytest.approx(12.5) for w in series)


def test_data13_weather_weekly_idempotent(db):
    """DATA-13: Duplicate weather upsert inserts only once."""
    from dengueahead.ingestion.weather_fetcher import WeatherWeeklyRecord
    from dengueahead.repositories.weather_weekly import upsert_weather

    record = WeatherWeeklyRecord(
        area_id="LK-11",
        week_start=date(2024, 3, 4),
        rain_mm=12.5,
        temp_c=29.2,
        humidity_pct=78.0,
        provider="open-meteo",
        available_at=datetime(2024, 3, 11, tzinfo=UTC),
        quality_flags=[],
    )
    upsert_weather(db, record)
    r2 = upsert_weather(db, record)
    # Second call: matched=1, inserted=0
    assert r2.inserted == 0
