"""Unit tests for ingestion/snapshot.py — DATA-01, DATA-07."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from dengueahead.ingestion.fetcher import FetchResult
from dengueahead.ingestion.snapshot import compute_sha256, store_snapshot


def _make_result(
    content: bytes = b"hello pdf", content_type: str = "application/pdf"
) -> FetchResult:
    return FetchResult(
        url="https://example.com/report.pdf",
        content=content,
        content_type=content_type,
        http_status=200,
        fetched_at=datetime(2026, 10, 25, 12, 0, 0, tzinfo=UTC),
    )


# DATA-01: Same SHA-256 fetched twice → second call skips disk write
def test_store_snapshot_idempotent(tmp_path: Path) -> None:
    result = _make_result()
    snap1 = store_snapshot(result, "ndcu", tmp_path)
    assert snap1.already_existed is False
    assert snap1.file_path.exists()

    snap2 = store_snapshot(result, "ndcu", tmp_path)
    assert snap2.already_existed is True
    assert snap2.sha256 == snap1.sha256
    assert snap2.file_path == snap1.file_path
    # Only one file on disk
    files = list((tmp_path / "ndcu").iterdir())
    assert len(files) == 1


# DATA-07: fetched_at and observedPeriod are distinct fields
def test_snapshot_fields_distinct(tmp_path: Path) -> None:
    result = _make_result()
    snap = store_snapshot(result, "ndcu", tmp_path)
    # fetched_at is the fetch timestamp
    assert snap.fetched_at == datetime(2026, 10, 25, 12, 0, 0, tzinfo=UTC)
    # source_url is the URL, not a period
    assert snap.source_url == result.url
    # sha256 matches content
    assert snap.sha256 == compute_sha256(result.content)


def test_store_snapshot_creates_directory(tmp_path: Path) -> None:
    result = _make_result(content_type="text/html", content=b"<html></html>")
    snap = store_snapshot(result, "open_meteo", tmp_path)
    assert (tmp_path / "open_meteo").is_dir()
    assert snap.file_path.suffix == ".html"


def test_store_snapshot_pdf_extension(tmp_path: Path) -> None:
    result = _make_result(content_type="application/pdf")
    snap = store_snapshot(result, "ndcu", tmp_path)
    assert snap.file_path.suffix == ".pdf"


def test_different_content_creates_new_file(tmp_path: Path) -> None:
    snap1 = store_snapshot(_make_result(b"content_a"), "ndcu", tmp_path)
    snap2 = store_snapshot(_make_result(b"content_b"), "ndcu", tmp_path)
    assert snap1.sha256 != snap2.sha256
    files = list((tmp_path / "ndcu").iterdir())
    assert len(files) == 2
