"""Raw snapshot storage — SHA-256, disk persistence, idempotent write."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from dengueahead.common import logging as log
from dengueahead.ingestion.fetcher import FetchResult

_EXT_MAP = {
    "application/pdf": "pdf",
    "text/html": "html",
}


@dataclass(frozen=True)
class StoredSnapshot:
    """Everything needed to populate a source_snapshots MongoDB document."""

    source_id: str
    source_url: str
    sha256: str
    content_type: str
    file_path: Path
    fetched_at: datetime  # UTC
    already_existed: bool  # True when the SHA-256 was already on disk


def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def store_snapshot(
    result: FetchResult,
    source_id: str,
    raw_dir: Path,
) -> StoredSnapshot:
    """Persist *result* to *raw_dir/{source_id}/* and return a :class:`StoredSnapshot`.

    Idempotent: if a file with the same SHA-256 already exists the bytes are not
    rewritten and ``already_existed=True`` is set on the returned snapshot.
    """
    sha = compute_sha256(result.content)
    ext = _EXT_MAP.get(result.content_type, "bin")
    date_str = result.fetched_at.strftime("%Y-%m-%d")
    filename = f"{date_str}-{sha[:8]}.{ext}"

    dest_dir = raw_dir / source_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    already_existed = False
    if dest_path.exists():
        existing_sha = compute_sha256(dest_path.read_bytes())
        if existing_sha == sha:
            already_existed = True
            log.info(
                "Snapshot already on disk — skipping write",
                source_id=source_id,
                sha256=sha[:12],
                path=str(dest_path),
            )
        else:
            # Hash collision on filename prefix — should never happen; overwrite safely
            log.warning(
                "Filename exists but SHA-256 differs — overwriting",
                path=str(dest_path),
            )

    if not already_existed:
        dest_path.write_bytes(result.content)
        log.info(
            "Snapshot written",
            source_id=source_id,
            sha256=sha[:12],
            bytes=len(result.content),
            path=str(dest_path),
        )

    return StoredSnapshot(
        source_id=source_id,
        source_url=result.url,
        sha256=sha,
        content_type=result.content_type,
        file_path=dest_path,
        fetched_at=result.fetched_at,
        already_existed=already_existed,
    )


def load_snapshot_from_disk(path: Path, source_id: str, source_url: str) -> StoredSnapshot:
    """Re-create a :class:`StoredSnapshot` from an existing file on disk (for re-parse)."""
    content = path.read_bytes()
    sha = compute_sha256(content)
    ct_map = {"pdf": "application/pdf", "html": "text/html"}
    content_type = ct_map.get(path.suffix.lstrip("."), "application/octet-stream")
    # Derive fetched_at from filename prefix YYYY-MM-DD if present
    try:
        date_part = path.stem.split("-")[:3]
        fetched_at = datetime.fromisoformat("-".join(date_part)).replace(tzinfo=UTC)
    except (ValueError, IndexError):
        fetched_at = datetime.now(tz=UTC)

    return StoredSnapshot(
        source_id=source_id,
        source_url=source_url,
        sha256=sha,
        content_type=content_type,
        file_path=path,
        fetched_at=fetched_at,
        already_existed=True,
    )
