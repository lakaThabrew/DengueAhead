"""Unit tests for weather_fetcher — DATA-06."""

from __future__ import annotations

from datetime import UTC, date
from unittest.mock import MagicMock, patch

import pytest

from dengueahead.ingestion.weather_fetcher import (
    WeatherFetchError,
    WeatherWeeklyRecord,
    fetch_weather_weekly,
)

WEEK_START = date(2024, 1, 1)
WEEK_END = date(2024, 1, 7)


def _make_response(daily: dict, status_code: int = 200) -> MagicMock:
    resp = MagicMock()
    resp.ok = status_code < 400
    resp.status_code = status_code
    resp.json.return_value = {"daily": daily}
    resp.text = ""
    return resp


def _full_daily() -> dict:
    return {
        "temperature_2m_mean": [28.0, 29.0, 27.5, 30.0, 28.5, 29.5, 27.0],
        "precipitation_sum": [2.0, 0.0, 5.0, 1.0, 0.0, 3.0, 0.5],
        "relative_humidity_2m_mean": [80.0, 78.0, 82.0, 75.0, 79.0, 81.0, 77.0],
    }


@patch("dengueahead.ingestion.weather_fetcher.requests.get")
def test_successful_fetch_returns_weekly_record(mock_get):
    """Happy path: full 7-day data aggregates correctly."""
    mock_get.return_value = _make_response(_full_daily())
    record = fetch_weather_weekly("LK-11", 6.9, 79.8, WEEK_START, WEEK_END)

    assert isinstance(record, WeatherWeeklyRecord)
    assert record.area_id == "LK-11"
    assert record.week_start == WEEK_START
    assert record.rain_mm == pytest.approx(11.5)
    assert record.temp_c == pytest.approx(sum([28.0, 29.0, 27.5, 30.0, 28.5, 29.5, 27.0]) / 7)
    assert record.humidity_pct is not None
    assert record.quality_flags == []
    assert record.provider == "open-meteo"


@patch("dengueahead.ingestion.weather_fetcher.requests.get")
def test_partial_data_sets_partial_flag(mock_get):
    """DATA-06: partial daily data → PARTIAL_WEATHER_DATA flag."""
    daily = _full_daily()
    daily["precipitation_sum"][2] = None  # one missing rain day
    mock_get.return_value = _make_response(daily)

    record = fetch_weather_weekly("LK-11", 6.9, 79.8, WEEK_START, WEEK_END)
    assert "PARTIAL_WEATHER_DATA" in record.quality_flags


@patch("dengueahead.ingestion.weather_fetcher.requests.get")
def test_all_null_daily_sets_no_weather_flag(mock_get):
    """All nulls → NO_WEATHER_DATA flag, all values None."""
    daily = {
        "temperature_2m_mean": [None] * 7,
        "precipitation_sum": [None] * 7,
        "relative_humidity_2m_mean": [None] * 7,
    }
    mock_get.return_value = _make_response(daily)

    record = fetch_weather_weekly("LK-11", 6.9, 79.8, WEEK_START, WEEK_END)
    assert "NO_WEATHER_DATA" in record.quality_flags
    assert "PARTIAL_WEATHER_DATA" not in record.quality_flags
    assert record.rain_mm is None
    assert record.temp_c is None
    assert record.humidity_pct is None


@patch("dengueahead.ingestion.weather_fetcher.requests.get")
def test_http_error_raises_weather_fetch_error(mock_get):
    """HTTP 500 → WeatherFetchError."""
    resp = MagicMock()
    resp.ok = False
    resp.status_code = 500
    resp.text = "Internal Server Error"
    mock_get.return_value = resp

    with pytest.raises(WeatherFetchError, match="HTTP 500"):
        fetch_weather_weekly("LK-11", 6.9, 79.8, WEEK_START, WEEK_END)


@patch("dengueahead.ingestion.weather_fetcher.requests.get")
def test_network_error_raises_weather_fetch_error(mock_get):
    """Network exception → WeatherFetchError."""
    import requests as req_lib

    mock_get.side_effect = req_lib.ConnectionError("timeout")

    with pytest.raises(WeatherFetchError, match="Network error"):
        fetch_weather_weekly("LK-11", 6.9, 79.8, WEEK_START, WEEK_END)


@patch("dengueahead.ingestion.weather_fetcher.requests.get")
def test_missing_daily_key_raises_weather_fetch_error(mock_get):
    """Response without 'daily' key → WeatherFetchError."""
    resp = MagicMock()
    resp.ok = True
    resp.status_code = 200
    resp.json.return_value = {"hourly": {}}
    mock_get.return_value = resp

    with pytest.raises(WeatherFetchError, match="Unexpected"):
        fetch_weather_weekly("LK-11", 6.9, 79.8, WEEK_START, WEEK_END)


@patch("dengueahead.ingestion.weather_fetcher.requests.get")
def test_available_at_is_set(mock_get):
    """available_at is a UTC datetime after fetch."""

    mock_get.return_value = _make_response(_full_daily())
    record = fetch_weather_weekly("LK-11", 6.9, 79.8, WEEK_START, WEEK_END)
    assert record.available_at.tzinfo is not None
    assert record.available_at.tzinfo == UTC
