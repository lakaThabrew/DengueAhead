"""NDCU weekly dengue report parser — HTML and PDF formats.

The NDCU (National Dengue Control Unit, Sri Lanka) publishes weekly case counts
by district on https://www.dengue.health.gov.lk/weekly-report/.

This parser handles:
  - HTML table format (primary — embedded in the weekly report page)
  - PDF format (fallback — typed PDFs extractable with pdfplumber)

Cases field rules (enforced here, not just in validation):
  - Blank cell / dash / "N/A" → cases=None, missingReason="NOT_IN_REPORT"
  - Negative or non-numeric  → cases=None, missingReason="INVALID_VALUE", flag INVALID_COUNT
  - Valid non-negative int   → cases=<int>
  - Zero (0) is a legitimate value and is stored as 0.
  - Missing data is NEVER stored as 0.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, timedelta

import pdfplumber
from bs4 import BeautifulSoup

from dengueahead.ingestion.area_map import QUARANTINE_ID, UNMATCHED_FLAG, AreaMap, resolve_area

# ── Typed errors ──────────────────────────────────────────────────────────────


class ParseError(Exception):
    """Raised when the document structure cannot be parsed reliably."""

    def __init__(self, message: str, raw_excerpt: str = "") -> None:
        super().__init__(message)
        self.raw_excerpt = raw_excerpt


# ── Result types ──────────────────────────────────────────────────────────────


@dataclass
class ParsedObservation:
    """A single district–week case count extracted from a report."""

    area_name_raw: str
    area_id: str
    week_start: date
    week_end: date
    reporting_week: int
    reporting_year: int
    cases: int | None
    missing_reason: str | None
    quality_flags: list[str] = field(default_factory=list)
    snapshot_id: str = ""
    parser_version: str = ""


@dataclass
class ParseResult:
    observations: list[ParsedObservation]
    parse_warnings: list[str]
    parser_version: str
    source_format: str  # "html" | "pdf"


# ── Cell normalisation ────────────────────────────────────────────────────────

_MISSING_PATTERNS = re.compile(r"^\s*(-+|n/?a|nil|—|–|not\s+available|no\s+data)?\s*$", re.I)


def _parse_cell(raw: str) -> tuple[int | None, str | None, list[str]]:
    """Return (cases, missing_reason, quality_flags) from a raw table cell string."""
    stripped = raw.strip()
    if _MISSING_PATTERNS.match(stripped):
        return None, "NOT_IN_REPORT", []

    # Remove commas (thousands separator) and whitespace
    cleaned = stripped.replace(",", "").replace(" ", "")
    try:
        value = int(float(cleaned))
    except ValueError:
        return None, "INVALID_VALUE", ["INVALID_COUNT"]

    if value < 0:
        return None, "INVALID_VALUE", ["INVALID_COUNT"]

    return value, None, []


# ── Week period helpers ───────────────────────────────────────────────────────


def _week_bounds(year: int, week: int) -> tuple[date, date]:
    """Return (week_start Monday, week_end Sunday) for ISO week *week* of *year*."""
    week_start = date.fromisocalendar(year, week, 1)  # Monday
    week_end = week_start + timedelta(days=6)  # Sunday
    return week_start, week_end


def _extract_week_year(text: str) -> tuple[int, int] | None:
    """Try to extract (year, week_number) from a header string like 'Week 43 - 2026'."""
    m = re.search(r"[Ww]eek\s*[:-]?\s*(\d{1,2}).*?(\d{4})", text)
    if m:
        return int(m.group(2)), int(m.group(1))
    # Try "2026-W43"
    m2 = re.search(r"(\d{4})-W(\d{1,2})", text)
    if m2:
        return int(m2.group(1)), int(m2.group(2))
    return None


# ── HTML parser ───────────────────────────────────────────────────────────────

_CASES_HEADER_PATTERN = re.compile(r"(cases|dengue|count|reported)", re.I)
_DISTRICT_HEADER_PATTERN = re.compile(r"(district|area|region)", re.I)


def _parse_html(
    html_bytes: bytes,
    snapshot_id: str,
    parser_version: str,
    area_map: AreaMap,
    year: int,
    week: int,
) -> ParseResult:
    soup = BeautifulSoup(html_bytes, "lxml")
    tables = soup.find_all("table")
    if not tables:
        raise ParseError(
            "No HTML tables found in document",
            raw_excerpt=html_bytes[:200].decode("utf-8", errors="replace"),
        )

    week_start, week_end = _week_bounds(year, week)
    warnings: list[str] = []
    observations: list[ParsedObservation] = []

    # Find the table most likely to contain district case counts
    best_table = None
    for tbl in tables:
        headers = [th.get_text(strip=True) for th in tbl.find_all("th")]
        header_text = " ".join(headers).lower()
        if any(kw in header_text for kw in ("district", "area", "dengue", "cases")):
            best_table = tbl
            break

    if best_table is None:
        # Fallback: use the largest table
        best_table = max(tables, key=lambda t: len(t.find_all("tr")))
        warnings.append("Could not identify district table by headers; using largest table")

    rows = best_table.find_all("tr")
    if len(rows) < 2:
        raise ParseError("Table has fewer than 2 rows — format may have changed")

    # Determine column indices from header row
    header_cells = [td.get_text(strip=True) for td in rows[0].find_all(["th", "td"])]
    district_col = 0  # default: first column
    cases_col = -1

    for i, h in enumerate(header_cells):
        if _DISTRICT_HEADER_PATTERN.search(h):
            district_col = i
        if _CASES_HEADER_PATTERN.search(h):
            cases_col = i

    if cases_col == -1:
        # Guess: last numeric-looking column
        cases_col = len(header_cells) - 1
        warnings.append(f"Cases column not identified; guessing column index {cases_col}")

    for row in rows[1:]:
        cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
        if len(cells) <= max(district_col, cases_col):
            continue
        raw_name = cells[district_col].strip()
        if not raw_name or raw_name.lower() in ("total", "grand total", ""):
            continue

        area_id = resolve_area(raw_name, area_map)
        if area_id is None:
            warnings.append(f"Skipped unresolvable area '{raw_name}' (policy=warn)")
            continue

        cases, missing_reason, flags = _parse_cell(cells[cases_col])
        if area_id == QUARANTINE_ID:
            flags = list(set(flags + [UNMATCHED_FLAG]))

        observations.append(
            ParsedObservation(
                area_name_raw=raw_name,
                area_id=area_id,
                week_start=week_start,
                week_end=week_end,
                reporting_week=week,
                reporting_year=year,
                cases=cases,
                missing_reason=missing_reason,
                quality_flags=flags,
                snapshot_id=snapshot_id,
                parser_version=parser_version,
            )
        )

    if not observations:
        raise ParseError("Zero observations extracted — table format may have changed")

    return ParseResult(
        observations=observations,
        parse_warnings=warnings,
        parser_version=parser_version,
        source_format="html",
    )


# ── PDF parser ────────────────────────────────────────────────────────────────


def _parse_pdf(
    pdf_bytes: bytes,
    snapshot_id: str,
    parser_version: str,
    area_map: AreaMap,
    year: int,
    week: int,
) -> ParseResult:
    import io

    week_start, week_end = _week_bounds(year, week)
    warnings: list[str] = []
    observations: list[ParsedObservation] = []

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        all_tables: list[list[list[str | None]]] = []
        for page in pdf.pages:
            tables = page.extract_tables()
            if tables:
                all_tables.extend(tables)

    if not all_tables:
        raise ParseError("No tables found in PDF document")

    # Find the table with the most rows (likely the district case table)
    best = max(all_tables, key=len)
    if len(best) < 2:
        raise ParseError("PDF table has fewer than 2 rows — format may have changed")

    header = [str(c or "").strip() for c in best[0]]
    district_col = 0
    cases_col = len(header) - 1

    for i, h in enumerate(header):
        if _DISTRICT_HEADER_PATTERN.search(h):
            district_col = i
        if _CASES_HEADER_PATTERN.search(h):
            cases_col = i

    for row in best[1:]:
        str_row = [str(c or "").strip() for c in row]
        if len(str_row) <= max(district_col, cases_col):
            continue
        raw_name = str_row[district_col]
        if not raw_name or raw_name.lower() in ("total", "grand total"):
            continue

        area_id = resolve_area(raw_name, area_map)
        if area_id is None:
            warnings.append(f"Skipped unresolvable area '{raw_name}' (policy=warn)")
            continue

        cases, missing_reason, flags = _parse_cell(str_row[cases_col])
        if area_id == QUARANTINE_ID:
            flags = list(set(flags + [UNMATCHED_FLAG]))

        observations.append(
            ParsedObservation(
                area_name_raw=raw_name,
                area_id=area_id,
                week_start=week_start,
                week_end=week_end,
                reporting_week=week,
                reporting_year=year,
                cases=cases,
                missing_reason=missing_reason,
                quality_flags=flags,
                snapshot_id=snapshot_id,
                parser_version=parser_version,
            )
        )

    if not observations:
        raise ParseError("Zero observations extracted from PDF — format may have changed")

    return ParseResult(
        observations=observations,
        parse_warnings=warnings,
        parser_version=parser_version,
        source_format="pdf",
    )


# ── Public entry point ────────────────────────────────────────────────────────


def parse_ndcu_report(
    raw: bytes,
    content_type: str,
    snapshot_id: str,
    parser_version: str,
    area_map: AreaMap,
    year: int,
    week: int,
) -> ParseResult:
    """Parse an NDCU weekly report from raw bytes.

    Args:
        raw: Raw document bytes.
        content_type: MIME type ("text/html" or "application/pdf").
        snapshot_id: The ``source_snapshot._id`` referencing this document.
        parser_version: Version string stored alongside the snapshot.
        area_map: Pre-loaded :class:`~dengueahead.ingestion.area_map.AreaMap`.
        year: Reporting year (e.g. 2026).
        week: ISO week number (1–53).

    Returns:
        :class:`ParseResult` with one :class:`ParsedObservation` per district row.

    Raises:
        ParseError: When the document structure cannot be parsed reliably.
    """
    if content_type == "text/html":
        return _parse_html(raw, snapshot_id, parser_version, area_map, year, week)
    if content_type == "application/pdf":
        return _parse_pdf(raw, snapshot_id, parser_version, area_map, year, week)
    raise ParseError(f"Unsupported content_type '{content_type}' for NDCU parser")
