"""Unit tests for as-of filtering and temporal isolation (FEAT-01, FEAT-02)."""

from __future__ import annotations

import pytest

from dengueahead.features.as_of import (
    filter_observations_as_of,
    filter_weather_as_of,
    parse_iso_date,
)


def test_parse_iso_date_valid() -> None:
    assert str(parse_iso_date("2024-06-17")) == "2024-06-17"
    assert str(parse_iso_date("2024-06-17T12:00:00Z")) == "2024-06-17"


def test_parse_iso_date_invalid() -> None:
    with pytest.raises(ValueError, match="Invalid date format"):
        parse_iso_date("17-06-2024")


def test_feat_01_changing_target_week_cannot_affect_as_of_filtered_data() -> None:
    """FEAT-01: Modifying target-week cases cannot change current-week observations."""
    as_of = "2024-06-17"  # current week t
    base_observations = [
        {"areaId": "LK-11", "weekStart": "2024-06-03", "cases": 120},
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 130},
        {"areaId": "LK-11", "weekStart": "2024-06-17", "cases": 140},
    ]

    obs_target_a = base_observations + [
        {"areaId": "LK-11", "weekStart": "2024-06-24", "cases": 150}  # target week t+1
    ]
    obs_target_b = base_observations + [
        {"areaId": "LK-11", "weekStart": "2024-06-24", "cases": 9999}  # altered target week
    ]

    filtered_a = filter_observations_as_of(obs_target_a, as_of)
    filtered_b = filter_observations_as_of(obs_target_b, as_of)

    assert filtered_a == filtered_b
    assert len(filtered_a) == 3
    assert all(o["weekStart"] <= as_of for o in filtered_a)


def test_feat_02_lags_never_use_data_after_issue_cutoff() -> None:
    """FEAT-02: Lags never use data after issue cutoff, including weather publication delay."""
    as_of = "2024-06-17"
    observations = [
        {"areaId": "LK-11", "weekStart": "2024-06-10", "cases": 100},
        {"areaId": "LK-11", "weekStart": "2024-06-17", "cases": 110},
        {"areaId": "LK-11", "weekStart": "2024-06-24", "cases": 120},
        {"areaId": "LK-11", "weekStart": "2024-07-01", "cases": 130},
    ]
    filtered_obs = filter_observations_as_of(observations, as_of)
    assert len(filtered_obs) == 2
    assert [o["weekStart"] for o in filtered_obs] == ["2024-06-10", "2024-06-17"]

    # Weather: record for 2024-06-17 was published on 2024-06-18 (after as_of cutoff)
    weather_records = [
        {
            "areaId": "LK-11",
            "weekStart": "2024-06-10",
            "availableAt": "2024-06-11",
            "tempC": 28.5,
        },
        {
            "areaId": "LK-11",
            "weekStart": "2024-06-17",
            "availableAt": "2024-06-18",
            "tempC": 29.0,
        },
    ]
    filtered_weather = filter_weather_as_of(weather_records, as_of)
    assert len(filtered_weather) == 1
    assert filtered_weather[0]["weekStart"] == "2024-06-10"
