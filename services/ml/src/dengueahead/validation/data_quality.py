"""Data quality checker — QC-01 through QC-07 as per Phase 1 plan."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal

QCSeverity = Literal["ERROR", "WARNING", "INFO"]

LONG_GAP_THRESHOLD = 4  # consecutive missing weeks before WARNING
LOW_COVERAGE_THRESHOLD = 0.50  # < 50% non-null weeks → WARNING


@dataclass(frozen=True)
class QualityIssue:
    severity: QCSeverity
    area_id: str
    week_start: str  # ISO date string; empty for batch-level issues
    code: str
    message: str


@dataclass
class QualityReport:
    total_observations: int
    missing_count: int
    zero_count: int
    coverage: dict[str, float]  # areaId → fraction non-null
    gap_weeks: list[tuple[str, date, date]]  # (areaId, gap_start, gap_end)
    issues: list[QualityIssue]

    @property
    def has_errors(self) -> bool:
        return any(i.severity == "ERROR" for i in self.issues)

    def summary(self) -> dict:
        return {
            "total": self.total_observations,
            "missing": self.missing_count,
            "zeros": self.zero_count,
            "errors": sum(1 for i in self.issues if i.severity == "ERROR"),
            "warnings": sum(1 for i in self.issues if i.severity == "WARNING"),
        }


def run_quality_checks(observations: list[dict]) -> QualityReport:
    """Run all QC checks on a list of dengue_weekly dicts from MongoDB.

    Args:
        observations: Raw MongoDB documents (list of dicts with at least
            ``areaId``, ``weekStart``, ``weekEnd``, ``cases``,
            ``missingReason``, ``revision``, ``reportedAt``).

    Returns:
        :class:`QualityReport` with per-area coverage, gap analysis, and issues.
    """
    issues: list[QualityIssue] = []
    total = len(observations)
    missing_count = 0
    zero_count = 0

    # Group by area for gap/coverage analysis
    by_area: dict[str, list[dict]] = defaultdict(list)
    seen_keys: set[tuple] = set()

    for obs in observations:
        area_id = obs.get("areaId", "UNKNOWN")
        week_start = obs.get("weekStart", "")
        week_end = obs.get("weekEnd", "")
        cases = obs.get("cases")
        missing_reason = obs.get("missingReason")
        revision = obs.get("revision", 1)
        reported_at = obs.get("reportedAt")

        # QC-01: Negative cases
        if cases is not None and cases < 0:
            issues.append(
                QualityIssue(
                    severity="ERROR",
                    area_id=area_id,
                    week_start=week_start,
                    code="NEGATIVE_COUNT",
                    message=f"cases={cases} is negative",
                )
            )

        # QC-02: null cases without missingReason
        if cases is None:
            missing_count += 1
            if not missing_reason:
                issues.append(
                    QualityIssue(
                        severity="ERROR",
                        area_id=area_id,
                        week_start=week_start,
                        code="MISSING_REASON_ABSENT",
                        message="cases=null but missingReason is absent",
                    )
                )
        elif cases == 0:
            zero_count += 1

        # QC-04: weekEnd ≠ weekStart + 6 days
        if week_start and week_end:
            try:
                ws = date.fromisoformat(week_start)
                we = date.fromisoformat(week_end)
                if we != ws + timedelta(days=6):
                    issues.append(
                        QualityIssue(
                            severity="ERROR",
                            area_id=area_id,
                            week_start=week_start,
                            code="INVALID_WEEK_RANGE",
                            message=(
                                f"weekEnd={week_end} ≠ weekStart+6"
                                f" ({(ws + timedelta(days=6)).isoformat()})"
                            ),
                        )
                    )
            except ValueError:
                pass  # bad date format handled elsewhere

        # QC-05: Duplicate (areaId, weekStart, revision)
        key = (area_id, week_start, revision)
        if key in seen_keys:
            issues.append(
                QualityIssue(
                    severity="ERROR",
                    area_id=area_id,
                    week_start=week_start,
                    code="DUPLICATE_KEY",
                    message=(
                        f"Duplicate (areaId={area_id},"
                        f" weekStart={week_start}, revision={revision})"
                    ),
                )
            )
        seen_keys.add(key)

        # QC-06: reportedAt < weekEnd
        if reported_at and week_end:
            try:
                # Accept ISO strings with or without timezone
                from datetime import datetime

                rt = datetime.fromisoformat(reported_at.replace("Z", "+00:00"))
                we_dt = datetime.fromisoformat(week_end + "T23:59:59+00:00")
                if rt < we_dt:
                    issues.append(
                        QualityIssue(
                            severity="WARNING",
                            area_id=area_id,
                            week_start=week_start,
                            code="IMPLAUSIBLE_REPORTING_DATE",
                            message=f"reportedAt={reported_at} is before weekEnd={week_end}",
                        )
                    )
            except (ValueError, TypeError):
                pass

        by_area[area_id].append(obs)

    # Per-area coverage and gap analysis
    coverage: dict[str, float] = {}
    gap_weeks: list[tuple[str, date, date]] = []

    for area_id, area_obs in by_area.items():
        non_null = sum(1 for o in area_obs if o.get("cases") is not None)
        cov = non_null / len(area_obs) if area_obs else 0.0
        coverage[area_id] = cov

        # QC-07: Low coverage
        if cov < LOW_COVERAGE_THRESHOLD:
            issues.append(
                QualityIssue(
                    severity="WARNING",
                    area_id=area_id,
                    week_start="",
                    code="LOW_COVERAGE",
                    message=f"Area coverage {cov:.0%} < {LOW_COVERAGE_THRESHOLD:.0%}",
                )
            )

        # QC-03: Long gaps
        sorted_obs = sorted(area_obs, key=lambda o: o.get("weekStart", ""))
        consecutive_missing = 0
        gap_start: date | None = None

        for o in sorted_obs:
            if o.get("cases") is None:
                consecutive_missing += 1
                if gap_start is None:
                    try:
                        gap_start = date.fromisoformat(o["weekStart"])
                    except (KeyError, ValueError):
                        gap_start = None
            else:
                if consecutive_missing >= LONG_GAP_THRESHOLD and gap_start is not None:
                    try:
                        gap_end = date.fromisoformat(o["weekStart"]) - timedelta(days=1)
                        gap_weeks.append((area_id, gap_start, gap_end))
                        issues.append(
                            QualityIssue(
                                severity="WARNING",
                                area_id=area_id,
                                week_start=gap_start.isoformat(),
                                code="LONG_GAP",
                                message=(
                                    f"{consecutive_missing} consecutive missing weeks "
                                    f"from {gap_start.isoformat()}"
                                ),
                            )
                        )
                    except (ValueError, TypeError):
                        pass
                consecutive_missing = 0
                gap_start = None

        # Trailing gap
        if consecutive_missing >= LONG_GAP_THRESHOLD and gap_start is not None and sorted_obs:
            try:
                last_end = date.fromisoformat(
                    sorted_obs[-1].get("weekEnd", sorted_obs[-1]["weekStart"])
                )
                gap_weeks.append((area_id, gap_start, last_end))
                issues.append(
                    QualityIssue(
                        severity="WARNING",
                        area_id=area_id,
                        week_start=gap_start.isoformat(),
                        code="LONG_GAP",
                        message=(
                            f"{consecutive_missing} consecutive missing weeks"
                            f" from {gap_start.isoformat()} (trailing)"
                        ),
                    )
                )
            except (ValueError, TypeError):
                pass

    return QualityReport(
        total_observations=total,
        missing_count=missing_count,
        zero_count=zero_count,
        coverage=coverage,
        gap_weeks=gap_weeks,
        issues=issues,
    )
