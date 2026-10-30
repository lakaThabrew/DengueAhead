# Data Sources — DengueAhead

**Phase:** 1 | **Status:** Audited (not yet verified with licence holders)  
**Last Updated:** 2025-01  
**Geographic Scope:** 25 administrative districts of Sri Lanka (`LK-{code}`)

---

## 1. Primary Dengue Case Data

### 1.1 National Dengue Control Unit (NDCU) — Weekly Reports

| Field            | Value                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| Source ID        | `ndcu-weekly`                                                                        |
| Publisher        | National Dengue Control Unit, Sri Lanka Ministry of Health                           |
| URL              | <https://www.dengue.health.gov.lk/weekly-report/>                                    |
| Format           | HTML table (primary), typed PDF (fallback)                                           |
| Granularity      | District-week (Epi-week ISO 8601)                                                    |
| Update frequency | Weekly (typically Monday–Wednesday for prior week)                                   |
| Coverage         | 2005–present (historical HTML available from ~2016)                                  |
| Licence status   | `PENDING_VERIFICATION` — publicly accessible; formal open-data licence not confirmed |
| Access method    | HTTP fetch via `fetcher.py`; `robots.txt` respected                                  |
| Parser           | `ingestion/ndcu_parser.py` v1.0.0                                                    |

**Limitations:**

- Reports are sometimes delayed by 1–3 weeks; delayed weeks are stored with `cases=null, missingReason="DELAYED"`.
- District name spellings vary across years — resolved by `area_map.py` with quarantine/warn/reject policies.
- Historical data before 2016 is available only as PDF; parser accuracy may be lower.
- Cases of `0` are valid and stored as `cases=0`, not treated as missing.

---

## 2. Weather / Climate Data

### 2.1 Open-Meteo Historical Reanalysis Archive

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Source ID     | `open-meteo-daily`                                                                    |
| Publisher     | Open-Meteo (open-source weather API)                                                  |
| URL           | <https://archive-api.open-meteo.com/v1/archive>                                       |
| Format        | JSON (REST API)                                                                       |
| Variables     | `temperature_2m_mean` (°C), `precipitation_sum` (mm), `relative_humidity_2m_mean` (%) |
| Granularity   | District centroid (lat/lon) × day; aggregated to week in `weather_fetcher.py`         |
| Coverage      | 1940–present (ERA5 reanalysis)                                                        |
| Licence       | CC BY 4.0                                                                             |
| Access method | HTTP GET per district per week                                                        |
| Aggregation   | `rain_mm` = weekly sum; `temp_c`, `humidity_pct` = weekly mean                        |

**Limitations:**

- **Reanalysis caveat:** ERA5 reanalysis may incorporate observations unavailable at the historical issuance date. `available_at` is set to the actual fetch timestamp, not the observation period. This data **must not** be used in prospective forecasts as if it were operationally available.
- Partial day-level data within a week sets flag `PARTIAL_WEATHER_DATA`.
- All variables null within a week sets flag `NO_WEATHER_DATA`.
- Centroid-based coordinates approximate district-level conditions; mountainous districts (Nuwara Eliya, Kandy) may have high spatial variability.

---

## 3. Area / Geography Metadata

### 3.1 District Reference (`area_map.yaml`)

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Source         | Derived from Sri Lanka administrative divisions (ISO 3166-2:LK)       |
| Format         | YAML config (`configs/area_map.yaml`)                                 |
| Coverage       | 25 districts                                                          |
| Area ID format | `LK-{2-digit-code}` (e.g., `LK-11` = Colombo, `LK-23` = Nuwara Eliya) |
| Centroids      | Manual from district administrative boundaries                        |

**Geography decision:**  
The unit of analysis for Phase 1 is the **administrative district** (25 units). MOH-area disaggregation is deferred to Phase 2 pending availability of matching case data.

---

## 4. Provenance Requirements

Every ingested document must carry:

| Field              | Source                                              |
| ------------------ | --------------------------------------------------- |
| `sourceSnapshotId` | SHA-256 of raw fetched bytes                        |
| `parserVersion`    | Hardcoded in parser (`"1.0.0"`)                     |
| `retrievedAt`      | UTC timestamp of HTTP fetch                         |
| `observedPeriod`   | Epi-week string (e.g., `"2024-W01"`)                |
| `revision`         | Incremented manually when correcting published data |

> **Rule (AGENTS.md §4):** Every prediction must reference its `modelVersion`, `sourceSnapshotId`, `issuedAt`, `targetWeek`, and `areaId`.

---

## 5. Sources Not Yet Included

| Source                       | Reason deferred                                 |
| ---------------------------- | ----------------------------------------------- |
| MoH MOH-area case data       | Not publicly available in machine-readable form |
| NOAA CHIRPS rainfall         | Superseded by Open-Meteo for simplicity         |
| Population census (2022)     | Awaiting official digital release               |
| Aedes index (vector density) | No public real-time source identified           |
