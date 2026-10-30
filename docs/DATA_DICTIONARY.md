# Data Dictionary — DengueAhead

**Phase:** 1 | **Last Updated:** 2025-01

---

## Collections

### `source_snapshots`

Tracks every raw document fetched from an upstream source. Keyed on `(sourceId, sha256)` — idempotent.

| Field            | Type              | Required | Description                                                                                              |
| ---------------- | ----------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `sourceId`       | string            | ✅       | Unique identifier for the data source (e.g., `ndcu-weekly`)                                              |
| `sourceUrl`      | string (URL)      | ✅       | Exact URL the document was fetched from                                                                  |
| `sha256`         | string (64 hex)   | ✅       | SHA-256 digest of raw fetched bytes — uniquely identifies a document version                             |
| `contentType`    | string            | ✅       | MIME type (`text/html`, `application/pdf`)                                                               |
| `observedPeriod` | string            | ✅       | Epi-week of the data in the document (e.g., `"2024-W01"`)                                                |
| `retrievedAt`    | ISO 8601 datetime | ✅       | UTC timestamp when the document was fetched                                                              |
| `licenceStatus`  | enum              | ✅       | `PUBLIC_DOMAIN` \| `OPEN_GOVERNMENT` \| `ATTRIBUTION_REQUIRED` \| `RESTRICTED` \| `PENDING_VERIFICATION` |
| `parserVersion`  | string            | ✅       | Parser version that processed this snapshot (e.g., `"1.0.0"`)                                            |
| `status`         | enum              | ✅       | `SUCCESS` \| `PARTIAL` \| `FAILED` \| `STALE`                                                            |
| `error`          | string \| null    | —        | Error message when `status=FAILED`                                                                       |

---

### `dengue_weekly`

One document per `(areaId, weekStart, revision)`. Uses `$setOnInsert` — a published revision is never overwritten silently.

| Field              | Type             | Required | Description                                                                 |
| ------------------ | ---------------- | -------- | --------------------------------------------------------------------------- |
| `areaId`           | string           | ✅       | Geographic unit (e.g., `LK-11`)                                             |
| `weekStart`        | YYYY-MM-DD       | ✅       | ISO date of Monday of the epi-week                                          |
| `weekEnd`          | YYYY-MM-DD       | ✅       | ISO date of Sunday of the epi-week (`weekStart + 6 days`)                   |
| `reportingWeek`    | int (1–53)       | ✅       | Epi-week number within `reportingYear`                                      |
| `reportingYear`    | int              | ✅       | Calendar year of the epi-week                                               |
| `cases`            | int ≥ 0 \| null  | ✅       | Reported dengue cases. **`null` means missing, NOT zero.**                  |
| `missingReason`    | string \| null   | ✅       | Required when `cases=null`. See Missing Reason Registry below.              |
| `sourceSnapshotId` | string           | ✅       | `sha256` of the `source_snapshots` document this row came from              |
| `reportedAt`       | ISO 8601 \| null | —        | When the source reported this data (may differ from `retrievedAt`)          |
| `revision`         | int ≥ 0          | ✅       | Version counter. `0` = initial import. Increment to correct published data. |
| `qualityFlags`     | string[]         | ✅       | See Quality Flag Registry below                                             |

> **Zero is not missing.** `cases=0` is a legitimate reported value. Missing data must always be `cases=null` with a `missingReason`.

---

### `weather_weekly`

One document per `(areaId, weekStart, provider)`. Aggregated from daily API values.

| Field          | Type                | Required | Description                                                                 |
| -------------- | ------------------- | -------- | --------------------------------------------------------------------------- |
| `areaId`       | string              | ✅       | Geographic unit (e.g., `LK-11`)                                             |
| `weekStart`    | YYYY-MM-DD          | ✅       | ISO date of the start of the week                                           |
| `rainMm`       | float ≥ 0 \| null   | ✅       | Total weekly precipitation in mm                                            |
| `tempC`        | float \| null       | ✅       | Mean weekly temperature in °C                                               |
| `humidityPct`  | float 0–100 \| null | ✅       | Mean weekly relative humidity (%)                                           |
| `provider`     | string              | ✅       | Data provider (e.g., `"open-meteo"`)                                        |
| `availableAt`  | ISO 8601 datetime   | ✅       | UTC timestamp when the data was fetched (≠ observation date for reanalysis) |
| `qualityFlags` | string[]            | ✅       | See Quality Flag Registry below                                             |

---

### `areas`

Reference table for geographic units. Populated from `configs/area_map.yaml`.

| Field            | Type                    | Required | Description                             |
| ---------------- | ----------------------- | -------- | --------------------------------------- |
| `areaId`         | string                  | ✅       | Canonical ID in `LK-{code}` format      |
| `name`           | string                  | ✅       | English district name                   |
| `level`          | enum                    | ✅       | `district` \| `moh`                     |
| `parentAreaId`   | string \| null          | —        | Parent area (e.g., province)            |
| `centroid`       | `{latitude, longitude}` | ✅       | Approximate centroid for weather fetch  |
| `geometryRef`    | string \| null          | —        | Reference to GeoJSON geometry (Phase 2) |
| `population`     | int \| null             | —        | Population estimate                     |
| `populationYear` | int \| null             | —        | Year of population estimate             |

---

## Quality Flag Registry

Flags are stored as string arrays on `dengue_weekly` and `weather_weekly` documents.

### Dengue quality flags

| Flag             | Severity | Source   | Description                                                                  |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `UNMATCHED_AREA` | WARNING  | parser   | District name could not be resolved to a canonical `areaId`                  |
| `INVALID_COUNT`  | WARNING  | parser   | Reported value was non-numeric or negative; `cases` coerced to `null`        |
| `QUARANTINE`     | ERROR    | area_map | Area placed under quarantine by `area_map.yaml` — row excluded from pipeline |

### Weather quality flags

| Flag                   | Severity | Source          | Description                                          |
| ---------------------- | -------- | --------------- | ---------------------------------------------------- |
| `PARTIAL_WEATHER_DATA` | WARNING  | weather_fetcher | One or more daily values within the week were `null` |
| `NO_WEATHER_DATA`      | ERROR    | weather_fetcher | All daily values for the week were `null`            |

---

## Missing Reason Registry

Used in `dengue_weekly.missingReason` when `cases=null`.

| Value                | Meaning                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `NOT_IN_REPORT`      | District was not present in the source report for this week             |
| `DELAYED`            | Report for this period has not yet been published                       |
| `INVALID_VALUE`      | The raw value was present but could not be parsed as a valid case count |
| `SOURCE_UNAVAILABLE` | The upstream source could not be fetched at ingestion time              |
| `NO_REPORT`          | The NDCU did not publish a report for this week                         |

---

## QC Check Registry

Checks implemented in `validation/data_quality.py`. Run via `dengueahead validate-data`.

| Code                         | Severity | Description                                              |
| ---------------------------- | -------- | -------------------------------------------------------- |
| `NEGATIVE_COUNT`             | ERROR    | `cases < 0`                                              |
| `MISSING_REASON_ABSENT`      | ERROR    | `cases=null` but `missingReason` is empty/absent         |
| `LONG_GAP`                   | WARNING  | 4+ consecutive missing weeks for one area                |
| `INVALID_WEEK_RANGE`         | ERROR    | `weekEnd ≠ weekStart + 6 days`                           |
| `DUPLICATE_KEY`              | ERROR    | Duplicate `(areaId, weekStart, revision)` in the dataset |
| `IMPLAUSIBLE_REPORTING_DATE` | WARNING  | `reportedAt < weekEnd`                                   |
| `LOW_COVERAGE`               | WARNING  | Area has < 50% non-null observations in the dataset      |
