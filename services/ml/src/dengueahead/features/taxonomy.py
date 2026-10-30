"""Hotspot status classification taxonomy.

Classifies epidemiological transition states between current week and forecast week:
EMERGING, PERSISTENT, COOLING, STABLE, or WITHHELD (FEAT-07).
"""

from __future__ import annotations

from dengueahead.contracts.prediction import PredictionStatus


def classify_status(
    current_cases: float | None,
    next_cases: float | None,
    current_threshold: float,
    next_threshold: float,
    has_quality_issues: bool = False,
) -> PredictionStatus:
    """Classify district hotspot status based on current observation and forecasted count.

    - EMERGING: not currently a hotspot (< threshold), but predicted to become one (>= threshold)
    - PERSISTENT: currently a hotspot (>= threshold), and predicted to remain one (>= threshold)
    - COOLING: currently a hotspot (>= threshold), but predicted to subside (< threshold)
    - STABLE: not currently a hotspot (< threshold), and predicted to remain below (< threshold)
    - WITHHELD: missing current observation, null prediction, or quality issues
    """
    if has_quality_issues or current_cases is None or next_cases is None:
        return "WITHHELD"

    curr_is_hotspot = current_cases >= current_threshold
    next_is_hotspot = next_cases >= next_threshold

    if not curr_is_hotspot and next_is_hotspot:
        return "EMERGING"
    if curr_is_hotspot and next_is_hotspot:
        return "PERSISTENT"
    if curr_is_hotspot and not next_is_hotspot:
        return "COOLING"
    return "STABLE"
