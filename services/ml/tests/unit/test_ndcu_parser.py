"""Unit tests for ingestion/ndcu_parser.py — DATA-02, DATA-04, DATA-05."""

from __future__ import annotations

from pathlib import Path

import pytest

from dengueahead.ingestion.area_map import AreaMap
from dengueahead.ingestion.ndcu_parser import ParseError, parse_ndcu_report


def _default_area_map() -> AreaMap:
    return AreaMap(
        mappings={
            "Colombo": "LK-11",
            "Gampaha": "LK-12",
            "Kandy": "LK-21",
            "Matale": "LK-22",
        },
        unmatched_policy="quarantine",
    )


FIXTURE_HTML = Path(__file__).parent.parent / "fixtures" / "ndcu_sample.html"


def _load_html() -> bytes:
    return FIXTURE_HTML.read_bytes()


# ── DATA-02: blank/dash cell → cases=null, missingReason="NOT_IN_REPORT" ──────


class TestMissingCells:
    def test_dash_cell_yields_null_cases(self) -> None:
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43
        )
        gampaha = next((o for o in result.observations if o.area_id == "LK-12"), None)
        assert gampaha is not None, "Gampaha row should be parsed"
        assert gampaha.cases is None
        assert gampaha.missing_reason == "NOT_IN_REPORT"

    def test_dash_never_stored_as_zero(self) -> None:
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43
        )
        for obs in result.observations:
            if obs.missing_reason == "NOT_IN_REPORT":
                assert obs.cases is None, "Missing data must be None, never 0"

    def test_legitimate_zero_stored(self) -> None:
        """cases=0 is a real count and must be kept as 0, not treated as missing."""
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43
        )
        kandy = next((o for o in result.observations if o.area_id == "LK-21"), None)
        assert kandy is not None
        assert kandy.cases == 0
        assert kandy.missing_reason is None


# ── DATA-04: table structure changed → ParseError raised ──────────────────────


class TestParseErrors:
    def test_no_tables_raises(self) -> None:
        raw = b"<html><body><p>No tables here</p></body></html>"
        with pytest.raises(ParseError, match="No HTML tables found"):
            parse_ndcu_report(raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43)

    def test_empty_table_raises(self) -> None:
        raw = b"<html><body><table><tr><th>District</th></tr></table></body></html>"
        with pytest.raises(ParseError):
            parse_ndcu_report(raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43)

    def test_unsupported_content_type_raises(self) -> None:
        with pytest.raises(ParseError, match="Unsupported content_type"):
            parse_ndcu_report(
                b"data", "application/json", "snap-001", "1.0.0", _default_area_map(), 2026, 43
            )

    def test_zero_observations_raises(self) -> None:
        """A table with only a Total row (no district rows) must raise ParseError."""
        raw = (
            b"<html><body><table>"
            b"<tr><th>District</th><th>Dengue Cases</th></tr>"
            b"<tr><td>Total</td><td>100</td></tr>"
            b"</table></body></html>"
        )
        with pytest.raises(ParseError):
            parse_ndcu_report(raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43)


# ── DATA-05: negative count → cases=null, INVALID_VALUE, INVALID_COUNT flag ───


class TestNegativeCounts:
    def test_negative_value_yields_null(self) -> None:
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43
        )
        matale = next((o for o in result.observations if o.area_id == "LK-22"), None)
        assert matale is not None, "Matale row should be parsed"
        assert matale.cases is None
        assert matale.missing_reason == "INVALID_VALUE"
        assert "INVALID_COUNT" in matale.quality_flags

    def test_negative_never_stored_as_negative(self) -> None:
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43
        )
        for obs in result.observations:
            if obs.cases is not None:
                assert obs.cases >= 0, f"cases={obs.cases} is negative"


# ── Unmatched area → QUARANTINE + UNMATCHED_AREA flag ─────────────────────────


class TestUnmatchedArea:
    def test_unknown_district_quarantined(self) -> None:
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43
        )
        quarantined = [o for o in result.observations if o.area_id == "QUARANTINE"]
        assert len(quarantined) >= 1
        for o in quarantined:
            assert "UNMATCHED_AREA" in o.quality_flags


# ── Parser version propagated ─────────────────────────────────────────────────


class TestMetadata:
    def test_parser_version_propagated(self) -> None:
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "2.0.0", _default_area_map(), 2026, 43
        )
        assert result.parser_version == "2.0.0"
        for obs in result.observations:
            assert obs.parser_version == "2.0.0"

    def test_week_bounds_correct(self) -> None:
        """weekEnd must be exactly weekStart + 6 days."""
        from datetime import timedelta

        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-001", "1.0.0", _default_area_map(), 2026, 43
        )
        for obs in result.observations:
            assert obs.week_end == obs.week_start + timedelta(days=6)

    def test_snapshot_id_propagated(self) -> None:
        raw = _load_html()
        result = parse_ndcu_report(
            raw, "text/html", "snap-snap-xyz", "1.0.0", _default_area_map(), 2026, 43
        )
        for obs in result.observations:
            assert obs.snapshot_id == "snap-snap-xyz"
