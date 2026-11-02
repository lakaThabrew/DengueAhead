"""Unit tests for hotspot taxonomy classification (FEAT-07)."""

from __future__ import annotations

from dengueahead.features.taxonomy import classify_status


def test_feat_07_classification_taxonomy() -> None:
    """FEAT-07: Consistent mapping for EMERGING, PERSISTENT, COOLING, STABLE, WITHHELD."""
    # Thresholds
    tau_curr = 100.0
    tau_next = 100.0

    # 1. EMERGING: current < tau, next >= tau
    assert (
        classify_status(
            current_cases=80.0,
            next_cases=110.0,
            current_threshold=tau_curr,
            next_threshold=tau_next,
        )
        == "EMERGING"
    )

    # 2. PERSISTENT: current >= tau, next >= tau
    assert (
        classify_status(
            current_cases=120.0,
            next_cases=130.0,
            current_threshold=tau_curr,
            next_threshold=tau_next,
        )
        == "PERSISTENT"
    )

    # 3. COOLING: current >= tau, next < tau
    assert (
        classify_status(
            current_cases=120.0,
            next_cases=90.0,
            current_threshold=tau_curr,
            next_threshold=tau_next,
        )
        == "COOLING"
    )

    # 4. STABLE: current < tau, next < tau
    assert (
        classify_status(
            current_cases=70.0,
            next_cases=75.0,
            current_threshold=tau_curr,
            next_threshold=tau_next,
        )
        == "STABLE"
    )

    # 5. WITHHELD: missing current observation
    assert (
        classify_status(
            current_cases=None,
            next_cases=100.0,
            current_threshold=tau_curr,
            next_threshold=tau_next,
        )
        == "WITHHELD"
    )

    # 6. WITHHELD: missing next prediction
    assert (
        classify_status(
            current_cases=100.0,
            next_cases=None,
            current_threshold=tau_curr,
            next_threshold=tau_next,
        )
        == "WITHHELD"
    )

    # 7. WITHHELD: flagged quality issues
    assert (
        classify_status(
            current_cases=80.0,
            next_cases=120.0,
            current_threshold=tau_curr,
            next_threshold=tau_next,
            has_quality_issues=True,
        )
        == "WITHHELD"
    )
