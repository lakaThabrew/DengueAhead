"""Unit tests for data_quality — DATA-08, DATA-09."""

from __future__ import annotations

import pytest

from dengueahead.validation.data_quality import run_quality_checks


def _obs(
    area_id: str = "LK-11",
    week_start: str = "2024-01-01",
    week_end: str = "2024-01-07",
    cases: int | None = 10,
    missing_reason: str | None = None,
    revision: int = 1,
    reported_at: str | None = "2024-01-10T00:00:00",
) -> dict:
    return {
        "areaId": area_id,
        "weekStart": week_start,
        "weekEnd": week_end,
        "cases": cases,
        "missingReason": missing_reason,
        "revision": revision,
        "reportedAt": reported_at,
    }


# ── DATA-08: QC check rules ──────────────────────────────────────────────────


def test_no_issues_on_clean_data():
    """Clean single observation produces no issues."""
    report = run_quality_checks([_obs()])
    assert not report.issues
    assert not report.has_errors


def test_qc01_negative_cases():
    """QC-01: negative cases → ERROR NEGATIVE_COUNT."""
    report = run_quality_checks([_obs(cases=-1)])
    codes = [i.code for i in report.issues]
    assert "NEGATIVE_COUNT" in codes
    assert any(i.severity == "ERROR" for i in report.issues if i.code == "NEGATIVE_COUNT")


def test_qc02_null_cases_without_missing_reason():
    """QC-02: null cases without missingReason → ERROR MISSING_REASON_ABSENT."""
    report = run_quality_checks([_obs(cases=None, missing_reason=None)])
    codes = [i.code for i in report.issues]
    assert "MISSING_REASON_ABSENT" in codes


def test_qc02_null_cases_with_missing_reason_ok():
    """QC-02: null cases with missingReason present → no MISSING_REASON_ABSENT."""
    report = run_quality_checks([_obs(cases=None, missing_reason="NO_REPORT")])
    codes = [i.code for i in report.issues]
    assert "MISSING_REASON_ABSENT" not in codes


def test_qc03_long_gap_triggers_warning():
    """QC-03: 4+ consecutive missing weeks → WARNING LONG_GAP."""
    obs = []
    for i in range(6):
        ws = f"2024-0{1 + i}-01"
        we = f"2024-0{1 + i}-07"
        obs.append(_obs(week_start=ws, week_end=we, cases=None, missing_reason="DELAYED"))
    # Add a real observation after the gap so gap is detected
    obs.append(_obs(week_start="2024-07-01", week_end="2024-07-07", cases=5))
    report = run_quality_checks(obs)
    codes = [i.code for i in report.issues]
    assert "LONG_GAP" in codes


def test_qc04_invalid_week_range():
    """QC-04: weekEnd ≠ weekStart+6 → ERROR INVALID_WEEK_RANGE."""
    report = run_quality_checks([_obs(week_start="2024-01-01", week_end="2024-01-08")])
    codes = [i.code for i in report.issues]
    assert "INVALID_WEEK_RANGE" in codes


def test_qc05_duplicate_key():
    """QC-05: duplicate (areaId, weekStart, revision) → ERROR DUPLICATE_KEY."""
    report = run_quality_checks([_obs(), _obs()])
    codes = [i.code for i in report.issues]
    assert "DUPLICATE_KEY" in codes


def test_qc06_implausible_reporting_date():
    """QC-06: reportedAt before weekEnd → WARNING IMPLAUSIBLE_REPORTING_DATE."""
    # reportedAt must be timezone-aware to avoid TypeError in fromisoformat comparison
    report = run_quality_checks(
        [_obs(week_end="2024-01-07", reported_at="2024-01-05T00:00:00+00:00")]
    )
    codes = [i.code for i in report.issues]
    assert "IMPLAUSIBLE_REPORTING_DATE" in codes


def test_qc07_low_coverage():
    """QC-07: area coverage < 50% → WARNING LOW_COVERAGE."""
    obs = []
    for i in range(4):
        ws = f"2024-01-{1 + i * 7:02d}"
        we = f"2024-01-{7 + i * 7:02d}"
        # Only first observation has cases; 3 out of 4 are null → 25% coverage
        obs.append(
            _obs(
                week_start=ws,
                week_end=we,
                cases=None if i > 0 else 5,
                missing_reason="DELAYED" if i > 0 else None,
            )
        )
    report = run_quality_checks(obs)
    codes = [i.code for i in report.issues]
    assert "LOW_COVERAGE" in codes


# ── DATA-09: QualityReport summary & counters ────────────────────────────────


def test_summary_counts_missing_and_zeros():
    """DATA-09: summary() returns correct missing/zero counts."""
    observations = [
        _obs(
            cases=None, missing_reason="NO_REPORT", week_start="2024-01-01", week_end="2024-01-07"
        ),
        _obs(cases=0, week_start="2024-01-08", week_end="2024-01-14", revision=1, area_id="LK-12"),
        _obs(cases=5, week_start="2024-01-15", week_end="2024-01-21", revision=1, area_id="LK-13"),
    ]
    report = run_quality_checks(observations)
    s = report.summary()
    assert s["total"] == 3
    assert s["missing"] == 1
    assert s["zeros"] == 1


def test_has_errors_false_when_clean():
    """has_errors is False when no ERROR-severity issues."""
    report = run_quality_checks([_obs()])
    assert report.has_errors is False


def test_has_errors_true_on_negative_cases():
    """has_errors is True when there is an ERROR issue."""
    report = run_quality_checks([_obs(cases=-5)])
    assert report.has_errors is True


def test_coverage_per_area():
    """coverage dict reports correct fraction per area."""
    obs = [
        _obs(area_id="LK-11", cases=5, week_start="2024-01-01", week_end="2024-01-07"),
        _obs(
            area_id="LK-11",
            cases=None,
            missing_reason="DELAYED",
            week_start="2024-01-08",
            week_end="2024-01-14",
            revision=2,
        ),
    ]
    report = run_quality_checks(obs)
    assert report.coverage["LK-11"] == pytest.approx(0.5)
