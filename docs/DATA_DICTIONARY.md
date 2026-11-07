# Data Dictionary — DengueAhead

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Team:** EchoBinary | **Competition:** ModelX 2.0  
> **Status:** Phase 7 Final Delivery  
> **Last Updated:** November 2026

---

## 1. Overview & Data Philosophy

DengueAhead adheres to a strict data contract governed by **Rule 3 ("No Simulated Success")**, **Rule 4 ("Data Provenance is Mandatory")**, and **Rule 6 ("No Unsupported Claims")** of the DengueAhead operating guidelines:

- **Zero Synthetic Counts:** Production collections contain strictly verified figures ingested from official public surveillance and meteorological APIs.
- **Null Means Missing:** An explicit `null` indicates missing or withheld observations. A numeric `0` is strictly reserved for legitimate zero case notifications.
- **Cryptographic Provenance:** Every prediction and observation links directly to immutable upstream source snapshots via SHA-256 digests.

---

## 2. Core Collections

### 2.1 `areas`

Stores the official geographic registry of Sri Lanka's 25 administrative districts. Populated from `configs/area_map.yaml`.

- **Index:** `{ areaId: 1 }` (Unique)

| Field            | Type            | Required | Nullable | Description                                                      |
| :--------------- | :-------------- | :------: | :------: | :--------------------------------------------------------------- |
| `areaId`         | `string`        |    ✅    |    ❌    | Canonical ISO 3166-2:LK code (e.g., `"LK-11"`, `"LK-12"`).       |
| `name`           | `string`        |    ✅    |    ❌    | Official English district name (e.g., `"Colombo"`, `"Gampaha"`). |
| `level`          | `string` (enum) |    ✅    |    ❌    | Geographic administrative level: `"district"` \| `"moh"`.        |
| `province`       | `string`        |    ✅    |    ❌    | Province name (e.g., `"Western"`, `"Central"`, `"Southern"`).    |
| `parentAreaId`   | `string`        |    ❌    |    ✅    | ID of parent administrative boundary if applicable.              |
| `centroid`       | `object`        |    ✅    |    ❌    | Centroid coordinates: `{ latitude: number, longitude: number }`. |
| `geometryRef`    | `string`        |    ❌    |    ✅    | Reference to GeoJSON / SVG boundary definition.                  |
| `population`     | `number` (int)  |    ❌    |    ✅    | District population from Department of Census and Statistics.    |
| `populationYear` | `number` (int)  |    ❌    |    ✅    | Reference year of population estimate (e.g., `2021`).            |

---

### 2.2 `dengue_observations`

Normalized weekly case counts published by the National Dengue Control Unit (NDCU).

- **Indexes:**
  - `{ areaId: 1, weekStart: 1, revision: 1 }` (Unique compound)
  - `{ areaId: 1, weekStart: 1 }` (Compound query index)
  - `{ weekStart: -1 }` (Temporal query index)

| Field              | Type                   | Required | Nullable | Description                                                                                                                                                                                 |
| :----------------- | :--------------------- | :------: | :------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `areaId`           | `string`               |    ✅    |    ❌    | District identifier matching `areas.areaId` (`LK-11` to `LK-92`). Peripheral health divisions (e.g. Kalmunai RDHS) are canonically aggregated into their administrative district (`LK-52`). |
| `weekStart`        | `string` (YYYY-MM-DD)  |    ✅    |    ❌    | Monday start date of the epidemiological reporting week.                                                                                                                                    |
| `weekEnd`          | `string` (YYYY-MM-DD)  |    ✅    |    ❌    | Sunday end date of the epidemiological reporting week.                                                                                                                                      |
| `reportingWeek`    | `number` (int 1–53)    |    ✅    |    ❌    | ISO 8601 calendar epidemiological week number.                                                                                                                                              |
| `reportingYear`    | `number` (int)         |    ✅    |    ❌    | Four-digit calendar reporting year.                                                                                                                                                         |
| `cases`            | `number` (int $\ge 0$) |    ✅    |    ❌    | Formally notified clinical dengue cases.                                                                                                                                                    |
| `sourceSnapshotId` | `string` (64 hex)      |    ✅    |    ❌    | SHA-256 hash of the raw `sources` snapshot document.                                                                                                                                        |
| `reportedAt`       | `string` (ISO 8601)    |    ✅    |    ❌    | Timestamp when the bulletin was officially recorded.                                                                                                                                        |
| `revision`         | `number` (int $\ge 0$) |    ✅    |    ❌    | Revision counter. Defaults to `0`; incremented for official retrospective revisions.                                                                                                        |
| `qualityFlags`     | `string[]`             |    ✅    |    ❌    | Diagnostic quality flags (e.g., `['UNMATCHED_AREA']`, `['DATA_DELAYED']`).                                                                                                                  |

---

### 2.3 `weather_observations`

Meteorological variables aggregated from Open-Meteo ERA5 daily reanalysis to weekly district centroid totals.

- **Indexes:**
  - `{ areaId: 1, weekStart: 1, provider: 1 }` (Unique compound)
  - `{ weekStart: -1 }` (Temporal query index)

| Field          | Type                     | Required | Nullable | Description                                                                       |
| :------------- | :----------------------- | :------: | :------: | :-------------------------------------------------------------------------------- |
| `areaId`       | `string`                 |    ✅    |    ❌    | District identifier matching `areas.areaId`.                                      |
| `weekStart`    | `string` (YYYY-MM-DD)    |    ✅    |    ❌    | Monday start date of the calendar week.                                           |
| `rainMm`       | `number` (float $\ge 0$) |    ✅    |    ✅    | Total cumulative precipitation over the week in millimeters ($mm$).               |
| `tempC`        | `number` (float)         |    ✅    |    ✅    | Mean 2-meter air temperature over the week in degrees Celsius ($^\circ\text{C}$). |
| `humidityPct`  | `number` (float 0–100)   |    ✅    |    ✅    | Mean 2-meter relative humidity percentage ($\%$).                                 |
| `provider`     | `string`                 |    ✅    |    ❌    | Data provider identifier (e.g., `"open-meteo"`).                                  |
| `availableAt`  | `string` (ISO 8601)      |    ✅    |    ❌    | UTC timestamp when data was fetched (preserves as-of integrity).                  |
| `qualityFlags` | `string[]`               |    ✅    |    ❌    | Weather flags: `['PARTIAL_WEATHER_DATA']`, `['NO_WEATHER_DATA']`.                 |

---

### 2.4 `predictions`

Published operational forecasts issued by `dengueahead predict`.

- **Indexes:**
  - `{ areaId: 1, targetWeek: 1, modelVersion: 1, issueDate: 1 }` (Unique compound)
  - `{ areaId: 1, issueDate: -1 }` (Compound district history)
  - `{ targetWeek: 1, issueDate: -1 }` (Compound leaderboard query)
  - `{ status: 1 }` (Filter index)

| Field               | Type                     | Required | Nullable | Description                                                                                      |
| :------------------ | :----------------------- | :------: | :------: | :----------------------------------------------------------------------------------------------- |
| `areaId`            | `string`                 |    ✅    |    ❌    | District identifier matching `areas.areaId`.                                                     |
| `geographicLevel`   | `string` (enum)          |    ✅    |    ❌    | `"district"` \| `"moh"`.                                                                         |
| `issueDate`         | `string` (YYYY-MM-DD)    |    ✅    |    ❌    | Date on which the forecast was generated.                                                        |
| `targetWeek`        | `string` (YYYY-MM-DD)    |    ✅    |    ❌    | Monday start date of the forecasted week ($t+1$).                                                |
| `asOfDate`          | `string` (YYYY-MM-DD)    |    ✅    |    ❌    | Strict temporal cutoff date for feature observation eligibility.                                 |
| `modelVersion`      | `string`                 |    ✅    |    ❌    | Identifier of the model that produced the forecast.                                              |
| `status`            | `string` (enum)          |    ✅    |    ❌    | Operational status: `"EMERGING"`, `"PERSISTENT"`, `"COOLING"`, `"STABLE"`, `"WITHHELD"`.         |
| `confidenceStatus`  | `string` (enum)          |    ✅    |    ❌    | `"CALIBRATED"`, `"UNCALIBRATED"`, `"NOT_AVAILABLE"`.                                             |
| `pointForecast`     | `number` (float $\ge 0$) |    ✅    |    ✅    | Predicted absolute dengue cases (strictly `null` when `WITHHELD`).                               |
| `interval`          | `object`                 |    ✅    |    ✅    | Conformal interval: `{ lower: float >= 0, upper: float >= 0, method: string, coverage: float }`. |
| `riskProbability`   | `number` (float 0–1)     |    ✅    |    ✅    | Calibrated hotspot probability (strictly `null` unless `CALIBRATED`).                            |
| `qualityFlags`      | `string[]`               |    ✅    |    ❌    | Operational flags (mandatory if status is `WITHHELD`).                                           |
| `sourceSnapshotIds` | `string[]`               |    ✅    |    ❌    | SHA-256 hashes of input source snapshots used to construct features.                             |

---

### 2.5 `model_runs`

Audit trail of model training, validation, and evaluation runs.

- **Index:** `{ modelVersion: 1 }` (Unique)

| Field                     | Type                     | Required | Nullable | Description                                                                        |
| :------------------------ | :----------------------- | :------: | :------: | :--------------------------------------------------------------------------------- |
| `modelVersion`            | `string`                 |    ✅    |    ❌    | Unique version string (e.g., `"dengueahead-hgb-v1"`).                              |
| `modelName`               | `string`                 |    ✅    |    ❌    | Descriptive name of the model architecture.                                        |
| `trainedAt`               | `string` (ISO 8601)      |    ✅    |    ❌    | Timestamp when model fitting completed.                                            |
| `trainRange`              | `object`                 |    ✅    |    ❌    | `{ startWeek: YYYY-MM-DD, endWeek: YYYY-MM-DD }`.                                  |
| `testRange`               | `object`                 |    ✅    |    ❌    | `{ startWeek: YYYY-MM-DD, endWeek: YYYY-MM-DD }`.                                  |
| `totalEvaluatedInstances` | `number` (int)           |    ✅    |    ❌    | Total district-week samples in evaluation split.                                   |
| `mae`                     | `number` (float $\ge 0$) |    ✅    |    ❌    | Mean Absolute Error across continuous evaluation targets.                          |
| `topKRecall`              | `number` (float 0–1)     |    ✅    |    ❌    | Fraction of true high-burden districts captured in Top-K.                          |
| `precision`               | `number` (float 0–1)     |    ✅    |    ❌    | Hotspot classification precision.                                                  |
| `recall`                  | `number` (float 0–1)     |    ✅    |    ❌    | Hotspot classification recall.                                                     |
| `brierScore`              | `number` (float 0–1)     |    ❌    |    ✅    | Brier score of calibrated probabilities.                                           |
| `baselines`               | `object[]`               |    ✅    |    ❌    | Array of benchmark baseline metric objects.                                        |
| `outperformsBaseline`     | `boolean`                |    ✅    |    ❌    | Whether model outperformed the best baseline on pre-registered criteria.           |
| `sampleWeighting`         | `string`                 |    ❌    |    ✅    | Description of sample weighting scheme (e.g., `"exponential_decay_half_life_8w"`). |
| `notes`                   | `string`                 |    ❌    |    ❌    | Additional contextual or limitation notes.                                         |

---

### 2.6 `sources`

Immutable cryptographic audit log of raw upstream payloads retrieved by `fetcher.py`.

- **Index:** `{ sourceId: 1, sha256: 1 }` (Unique compound)

| Field            | Type                | Required | Nullable | Description                                                                                                 |
| :--------------- | :------------------ | :------: | :------: | :---------------------------------------------------------------------------------------------------------- |
| `sourceId`       | `string`            |    ✅    |    ❌    | Feed identifier: `"ndcu-weekly"`, `"open-meteo-daily"`.                                                     |
| `sourceUrl`      | `string` (URL)      |    ✅    |    ❌    | Exact HTTP URL from which payload was fetched.                                                              |
| `sha256`         | `string` (64 hex)   |    ✅    |    ❌    | SHA-256 cryptographic digest of raw response bytes.                                                         |
| `observedPeriod` | `string`            |    ✅    |    ❌    | Epidemiological period represented (e.g., `"2024-W24"`).                                                    |
| `retrievedAt`    | `string` (ISO 8601) |    ✅    |    ❌    | UTC timestamp of the retrieval request.                                                                     |
| `licenceStatus`  | `string` (enum)     |    ✅    |    ❌    | `"PUBLIC_DOMAIN"`, `"OPEN_GOVERNMENT"`, `"ATTRIBUTION_REQUIRED"`, `"RESTRICTED"`, `"PENDING_VERIFICATION"`. |
| `parserVersion`  | `string`            |    ✅    |    ❌    | Semantic version of parser that extracted the records.                                                      |
| `status`         | `string` (enum)     |    ✅    |    ❌    | Status: `"SUCCESS"`, `"PARTIAL"`, `"FAILED"`, `"STALE"`.                                                    |
| `error`          | `string`            |    ❌    |    ✅    | Diagnostic error string if extraction failed.                                                               |

---

## 3. Standard Quality Flags Registry

| Quality Flag           | Source Component   | Severity | Description                                                                                                |
| :--------------------- | :----------------- | :------- | :--------------------------------------------------------------------------------------------------------- |
| `INSUFFICIENT_HISTORY` | Feature Builder    | ERROR    | District has $< 4$ historical weekly observations prior to cutoff date; forecast suppressed to `WITHHELD`. |
| `DATA_DELAYED`         | Ingestion / API    | WARNING  | Upstream reporting delayed $> 7$ days past expected publication date.                                      |
| `SOURCE_STALE`         | API (`/meta`)      | WARNING  | Surveillance reports delayed $> 14$ days; triggers UI alert banner and `WITHHELD` gating.                  |
| `PARTIAL_WEATHER_DATA` | Weather Aggregator | WARNING  | One or more daily observations missing in weekly centroid aggregation.                                     |
| `WEATHER_UNAVAILABLE`  | Feature Builder    | WARNING  | Weather feed offline; fallback to baseline autoregressive features.                                        |
| `UNMATCHED_AREA`       | Parser / Mapping   | ERROR    | Raw district name spelling not recognized in `area_map.yaml`; row diverted to quarantine.                  |
| `FALLBACK_BASELINE`    | Predictor CLI      | WARNING  | ML model unavailable; output derived strictly from historical seasonal median baseline.                    |
