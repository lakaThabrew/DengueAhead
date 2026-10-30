"""Unit tests for MongoDB repositories — DATA-10 (idempotent upsert)."""

from __future__ import annotations

from datetime import UTC, date, datetime
from pathlib import Path
from unittest.mock import MagicMock

from dengueahead.ingestion.ndcu_parser import ParsedObservation
from dengueahead.ingestion.snapshot import StoredSnapshot
from dengueahead.repositories.dengue_weekly import upsert_observation
from dengueahead.repositories.source_snapshots import UpsertResult, upsert_snapshot


def _make_db() -> MagicMock:
    """Return a MagicMock mimicking a pymongo Database."""
    db = MagicMock()
    return db


def _make_snapshot() -> StoredSnapshot:
    return StoredSnapshot(
        source_id="ndcu-weekly",
        source_url="https://www.epid.gov.lk/dengue",
        sha256="abc123",
        content_type="text/html",
        file_path=Path("/tmp/snapshot.html"),
        fetched_at=datetime(2024, 1, 10, 0, 0, 0, tzinfo=UTC),
        already_existed=False,
    )


def _make_obs() -> ParsedObservation:
    return ParsedObservation(
        area_name_raw="Colombo",
        area_id="LK-11",
        week_start=date(2024, 1, 1),
        week_end=date(2024, 1, 7),
        reporting_week=1,
        reporting_year=2024,
        cases=42,
        missing_reason=None,
        snapshot_id="abc123",
        quality_flags=[],
    )


# ── source_snapshots repository ───────────────────────────────────────────────


def test_upsert_snapshot_new_document():
    """DATA-10: First upsert inserts document with correct fields."""
    db = _make_db()
    update_result = MagicMock()
    update_result.matched_count = 0
    update_result.upserted_id = "some-id"
    update_result.modified_count = 0
    db["source_snapshots"].update_one.return_value = update_result

    result = upsert_snapshot(db, _make_snapshot(), "2024-W01")

    assert isinstance(result, UpsertResult)
    assert result.inserted == 1
    assert result.matched == 0

    call_args = db["source_snapshots"].update_one.call_args
    filter_doc, update_doc = call_args[0]
    assert filter_doc["sourceId"] == "ndcu-weekly"
    assert filter_doc["sha256"] == "abc123"
    assert "$setOnInsert" in update_doc


def test_upsert_snapshot_idempotent_second_call():
    """DATA-10: Second upsert with same (sourceId, sha256) does not re-insert."""
    db = _make_db()
    update_result = MagicMock()
    update_result.matched_count = 1
    update_result.upserted_id = None  # already exists
    update_result.modified_count = 0
    db["source_snapshots"].update_one.return_value = update_result

    result = upsert_snapshot(db, _make_snapshot(), "2024-W01")

    assert result.inserted == 0
    assert result.matched == 1


def test_upsert_snapshot_uses_set_on_insert():
    """DATA-10: upsert uses $setOnInsert — existing doc not overwritten."""
    db = _make_db()
    update_result = MagicMock()
    update_result.matched_count = 1
    update_result.upserted_id = None
    update_result.modified_count = 0
    db["source_snapshots"].update_one.return_value = update_result

    upsert_snapshot(db, _make_snapshot(), "2024-W01")

    _, update_doc = db["source_snapshots"].update_one.call_args[0]
    # Must not use $set (which would overwrite)
    assert "$set" not in update_doc
    assert "$setOnInsert" in update_doc


# ── dengue_weekly repository ──────────────────────────────────────────────────


def test_upsert_observation_new_document():
    """upsert_observation inserts new doc with correct fields."""
    db = _make_db()
    update_result = MagicMock()
    update_result.matched_count = 0
    update_result.upserted_id = "new-id"
    update_result.modified_count = 0
    db["dengue_weekly"].update_one.return_value = update_result

    result = upsert_observation(db, _make_obs())

    assert result.inserted == 1
    _, update_doc = db["dengue_weekly"].update_one.call_args[0]
    set_on_insert = update_doc["$setOnInsert"]
    assert set_on_insert["areaId"] == "LK-11"
    assert set_on_insert["weekStart"] == "2024-01-01"
    assert set_on_insert["cases"] == 42


def test_upsert_observation_idempotent():
    """DATA-10: identical upsert_observation call does not re-insert."""
    db = _make_db()
    update_result = MagicMock()
    update_result.matched_count = 1
    update_result.upserted_id = None
    update_result.modified_count = 0
    db["dengue_weekly"].update_one.return_value = update_result

    result = upsert_observation(db, _make_obs())
    assert result.inserted == 0
    assert result.matched == 1


def test_upsert_observation_uses_set_on_insert():
    """dengue_weekly upsert uses $setOnInsert — never $set."""
    db = _make_db()
    update_result = MagicMock()
    update_result.matched_count = 0
    update_result.upserted_id = "x"
    update_result.modified_count = 0
    db["dengue_weekly"].update_one.return_value = update_result

    upsert_observation(db, _make_obs())

    _, update_doc = db["dengue_weekly"].update_one.call_args[0]
    assert "$set" not in update_doc
    assert "$setOnInsert" in update_doc


def test_upsert_observation_missing_cases():
    """Null cases stored correctly in $setOnInsert."""
    db = _make_db()
    update_result = MagicMock()
    update_result.matched_count = 0
    update_result.upserted_id = "x"
    update_result.modified_count = 0
    db["dengue_weekly"].update_one.return_value = update_result

    obs = ParsedObservation(
        area_name_raw="Gampaha",
        area_id="LK-12",
        week_start=date(2024, 2, 1),
        week_end=date(2024, 2, 7),
        reporting_week=5,
        reporting_year=2024,
        cases=None,
        missing_reason="DELAYED",
        snapshot_id="xyz",
        quality_flags=[],
    )
    upsert_observation(db, obs)

    _, update_doc = db["dengue_weekly"].update_one.call_args[0]
    set_on_insert = update_doc["$setOnInsert"]
    assert set_on_insert["cases"] is None
    assert set_on_insert["missingReason"] == "DELAYED"
