"""Open-Meteo historical weather fetcher — daily → weekly aggregation."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, date, datetime

import requests

from dengueahead.common import logging as log

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"
PROVIDER = "open-meteo"


class WeatherFetchError(Exception):
    """Raised when the weather API returns an error or unexpected structure."""


@dataclass(frozen=True)
class WeatherWeeklyRecord:
    area_id: str
    week_start: date
    rain_mm: float | None
    temp_c: float | None
    humidity_pct: float | None
    provider: str
    available_at: datetime  # UTC timestamp of fetch
    quality_flags: list[str] = field(default_factory=list)


def fetch_weather_weekly(
    area_id: str,
    lat: float,
    lon: float,
    week_start: date,
    week_end: date,
) -> WeatherWeeklyRecord:
    """Fetch and aggregate daily weather into a single weekly record.

    Uses the Open-Meteo historical reanalysis archive.

    **Reanalysis caveat:** This data may incorporate information unavailable at
    the historic issuance date. ``available_at`` is set to the fetch timestamp,
    not the observation date. Document this limitation in DATA_SOURCES.md.

    Raises:
        WeatherFetchError: on HTTP error or unexpected API response structure.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": week_start.isoformat(),
        "end_date": week_end.isoformat(),
        "daily": "temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean",
        "timezone": "Asia/Colombo",
    }
    fetched_at = datetime.now(tz=UTC)

    log.info("Fetching weather", area_id=area_id, week_start=week_start.isoformat())
    try:
        response = requests.get(OPEN_METEO_URL, params=params, timeout=(10, 30))
    except requests.RequestException as exc:
        raise WeatherFetchError(f"Network error fetching weather for {area_id}: {exc}") from exc

    if not response.ok:
        raise WeatherFetchError(
            f"HTTP {response.status_code} from Open-Meteo for area {area_id}: {response.text[:200]}"
        )

    try:
        data = response.json()
        daily = data["daily"]
        temps: list[float | None] = daily.get("temperature_2m_mean", [])
        rains: list[float | None] = daily.get("precipitation_sum", [])
        humids: list[float | None] = daily.get("relative_humidity_2m_mean", [])
    except (KeyError, ValueError) as exc:
        raise WeatherFetchError(f"Unexpected Open-Meteo response structure: {exc}") from exc

    flags: list[str] = []

    def _mean(values: list[float | None]) -> float | None:
        valid = [v for v in values if v is not None]
        if not valid:
            return None
        if len(valid) < len(values):
            flags.append("PARTIAL_WEATHER_DATA")
        return sum(valid) / len(valid)

    def _sum(values: list[float | None]) -> float | None:
        valid = [v for v in values if v is not None]
        if not valid:
            return None
        if len(valid) < len(values):
            if "PARTIAL_WEATHER_DATA" not in flags:
                flags.append("PARTIAL_WEATHER_DATA")
        return sum(valid)

    rain_mm = _sum(rains)
    temp_c = _mean(temps)
    humidity_pct = _mean(humids)

    if rain_mm is None and temp_c is None and humidity_pct is None:
        # Replace PARTIAL with NO_WEATHER_DATA
        flags = ["NO_WEATHER_DATA"]

    log.info(
        "Weather fetched",
        area_id=area_id,
        week_start=week_start.isoformat(),
        flags=flags,
    )
    return WeatherWeeklyRecord(
        area_id=area_id,
        week_start=week_start,
        rain_mm=rain_mm,
        temp_c=temp_c,
        humidity_pct=humidity_pct,
        provider=PROVIDER,
        available_at=fetched_at,
        quality_flags=flags,
    )
