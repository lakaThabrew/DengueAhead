# Phase 1 Implementation Plan — DengueAhead

> **Document:** Phase 1 Implementation Specification  
> **Location:** `plans/PHASE_1_IMPLEMENTATION_PLAN.md`  
> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Team:** EchoBinary | **Competition:** ModelX 2.0 | **Domain:** Health & Wellbeing (population-level, non-clinical)  
> **Implementation window:** 29–30 October 2026  
> **Stack:** Python 3.12 (`dengueahead` CLI, click, pydantic, requests), MongoDB 7, Node.js API read layer  
> **Precedence:** If this document and `IMPLEMENTATION_PLAN.md` (the master plan) disagree, the master plan wins; fix this document.  
> **Prerequisite:** Phase 0 gate must be fully passed and evidenced in `docs/evidence/phase-0/` before Phase 1 begins.

---

## 1. Executive Summary & Objective

Phase 1 answers a single critical question before any modelling begins:

> **"Do we have a real, legally usable, geographically consistent, machine-readable historical dengue case series for Sri Lanka, and can we reliably refresh it?"**

If the answer is **yes**, the phase ends with a clean `dengue_weekly` collection in MongoDB, a verified source manifest, a geography decision (district vs MOH), and passing integration tests. If the answer is **no**, or partially yes, the phase ends with an honest gap report, a revised scope, and no fake data anywhere in the pipeline.

### Non-negotiables

1. **No synthetic data in production paths.** Fixtures used in tests are clearly labelled `synthetic` and never written to the real DB.
2. **Source verification before ingestion.** Check `robots.txt`, terms of use, and licence before fetching any URL. Record the result either way.
3. **Provenance at every row.** Every `dengue_weekly` record references a `sourceSnapshotId`; every `source_snapshot` record has a SHA-256 hash of the raw document.
4. **Missing ≠ zero.** A week with no data is `null` with a `missingReason`; it is never stored as `0`.
5. **No silent failures.** Parsers must raise a typed `ParseError` on unexpected format changes, not return wrong numbers.
6. **Geography locked before Phase 2.** The district vs MOH decision must be recorded in `docs/DATA_SOURCES.md` before the phase gate closes.

---

## 2. Resolved Technical Decisions

| Topic                  | Decision                                                                              | Rationale                                                            |
| ---------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| HTTP fetch library     | `requests` with `urllib3` retry adapter                                               | Already in dependencies; well-tested backoff behaviour               |
| Fetch timeout          | Connect 10 s, read 30 s                                                               | Prevents hanging CI; NDCU PDFs are small                             |
| Max retries            | 3 with exponential backoff (1 s, 2 s, 4 s)                                            | Transient network failures without hammering the server              |
| Raw snapshot storage   | Local `data/raw/` (git-ignored); SHA-256 computed before parsing                      | Allows re-parse without re-fetch; immutable audit trail              |
| PDF parsing            | `pdfplumber` (preferred); fall back to `camelot-py` only if tables aren't extractable | Both are pure-Python, no OCR required for typed PDFs                 |
| HTML parsing           | `beautifulsoup4` with `lxml`                                                          | Robust for table scraping with encoding handling                     |
| Area ID format         | `LK-{district-code}` for districts (e.g. `LK-11` = Colombo); `LK-MOH-{code}` for MOH  | Stable, not display names; follows ISO 3166-2:LK district codes      |
| Reporting week         | ISO 8601 week; `weekStart` = Monday of the reported week                              | NDCU reports are Monday-to-Sunday; stored as `weekStart` + `weekEnd` |
| Weather coordinates    | District centroid from `areas` collection                                             | Verified against DCS boundary metadata; one coordinate per district  |
| Mongo write credential | `ML_MONGODB_WRITE_URI` (separate from read-only `MONGODB_URI`)                        | Master plan §5: Python jobs write; Node API reads only               |
| Idempotent upsert key  | `(sourceId, sha256)` for snapshots; `(areaId, weekStart, revision)` for observations  | Prevents duplicates on re-run                                        |
| Missing data policy    | Store `cases: null`, `missingReason: "NOT_IN_REPORT"` or `"PARSE_ERROR"`              | Spec: `0` never represents missing                                   |

---

## 3. Target Directory Layout (Phase 1 additions)

```text
DengueAhead/
├── configs/
│   └── sources.yaml              # Updated with verified=true, licenceStatus, format details
├── data/
│   ├── raw/                      # git-ignored; fetched documents stored here by sourceId/date
│   │   └── ndcu/
│   │       └── {YYYY-WNN}-{sha256[:8]}.pdf   # naming convention
│   ├── manifests/
│   │   └── sources_manifest.json # machine-readable; committed (no raw documents)
│   └── samples/
│       └── ndcu_sample_week.json # sanitized 1-week synthetic fixture for tests
├── docs/
│   ├── DATA_SOURCES.md           # Source audit, rights, coverage, geography decision
│   └── DATA_DICTIONARY.md        # Field definitions, units, quality flags
├── services/ml/src/dengueahead/
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── fetcher.py            # HTTP fetch with retry, timeout, content-type check
│   │   ├── snapshot.py           # SHA-256, raw storage, SourceSnapshot Pydantic model
│   │   ├── ndcu_parser.py        # NDCU PDF/HTML → list[DengueWeeklyObservation]
│   │   └── area_map.py           # Area alias → canonical areaId mapping
│   ├── validation/
│   │   ├── __init__.py
│   │   └── data_quality.py       # Quality checks; returns list[QualityIssue]
│   └── repositories/
│       ├── __init__.py
│       ├── mongo.py              # MongoClient wrapper (write credential)
│       ├── source_snapshots.py   # upsert_snapshot(), get_snapshot_by_hash()
│       ├── areas.py              # upsert_area(), get_area()
│       ├── dengue_weekly.py      # upsert_observation(), get_series()
│       └── weather_weekly.py     # upsert_weather(), get_weather_series()
├── services/ml/tests/
│   ├── unit/
│   │   ├── test_fetcher.py
│   │   ├── test_ndcu_parser.py
│   │   ├── test_area_map.py
│   │   ├── test_snapshot.py
│   │   └── test_data_quality.py
│   ├── integration/
│   │   └── test_ingestion_pipeline.py
│   └── fixtures/
│       ├── ndcu_sample.pdf       # Single real or sanitized PDF page (legally shareable)
│       ├── ndcu_sample.html      # HTML table fixture for parser tests
│       └── synthetic_observation.json
└── docs/evidence/phase-1/
    ├── .gitkeep
    ├── EVIDENCE_REPORT.md        # Written at phase completion
    └── source_audit_log.md       # Rights/robots/terms verification per source
```

---

## 4. Detailed Work Breakdown

### Task 1.1 — Source audit and rights verification (human + automated)

**Automated (`dengueahead audit-sources --config configs/sources.yaml`):**

1. For each source in `configs/sources.yaml`:
   - Perform an HTTP HEAD request (5 s timeout) and record HTTP status, `Content-Type`, and `Last-Modified`.
   - Fetch and parse `robots.txt`; record whether the crawl path is disallowed.
   - Record the current date, URL, and response metadata to `data/manifests/sources_manifest.json`.
2. Update `configs/sources.yaml` with observed `format`, `httpStatus`, `robotsAllowed`, and `lastChecked` fields.
3. Log all findings via `common/logging.py` (structured JSON to stderr).
4. Exit 0 if all sources are reachable and not robots-disallowed; exit 1 with a clear summary if any source is blocked or unreachable (do not silently continue).

**Human tasks (cannot be automated):**

- [ ] Visit `https://www.dengue.health.gov.lk/weekly-report/` in a browser; manually inspect the page structure and confirm whether reports are downloadable PDFs, HTML tables, or both.
- [ ] Read the NDCU website's Terms of Use; verify whether downloading and processing weekly reports for non-commercial research is permitted. Record the outcome in `docs/evidence/phase-1/source_audit_log.md`.
- [ ] Check `https://open-meteo.com/` terms; confirm the non-commercial / attribution licence applies. Record attribution requirements.
- [ ] If accessing DCS population data (`https://www.statistics.gov.lk/`), verify download terms. Population data is optional in Phase 1; only include if readily available and clearly licensed.
- [ ] Record: URL, date visited, terms URL, licence type, attribution text required, and any restrictions.

### Task 1.2 — NDCU document fetcher (`ingestion/fetcher.py`)

Implement `fetch_document(url: str, config: FetchConfig) -> FetchResult`:

- Uses a `requests.Session` with a `HTTPAdapter` retry policy (3 retries, backoff factor 1.0, retry on 429/500/502/503/504).
- Enforces `connect_timeout=10`, `read_timeout=30`.
- Validates `Content-Type` against expected types (`application/pdf`, `text/html`); raises `ContentTypeError` if mismatch.
- Returns a `FetchResult` with `url`, `content: bytes`, `content_type`, `fetched_at: datetime` (UTC), `http_status`.
- Never raises on retry-exhaustion silently — raises `FetchError` with the last HTTP status and URL.
- Does **not** write to disk; caller (snapshot module) decides storage.

### Task 1.3 — Raw snapshot storage (`ingestion/snapshot.py`)

Implement `store_snapshot(result: FetchResult, source_id: str, raw_dir: Path) -> StoredSnapshot`:

- Computes SHA-256 of `result.content`.
- Writes raw bytes to `data/raw/{source_id}/{fetched_at_date}-{sha256[:8]}.{ext}` (ext = `pdf` or `html`).
- Returns a `StoredSnapshot` (Pydantic model) with all `SourceSnapshot` fields populated, `status='SUCCESS'`, `error=None`.
- `store_snapshot` is idempotent: if the same SHA-256 already exists on disk, skip writing and return the existing record.

### Task 1.4 — NDCU report parser (`ingestion/ndcu_parser.py`)

The NDCU publishes weekly dengue case counts by district. Implement after confirming actual format in Task 1.1.

`parse_ndcu_report(raw: bytes, content_type: str, snapshot_id: str, parser_version: str) -> ParseResult`:

- **PDF path:** use `pdfplumber` to extract tables from all pages. Find the table containing district-level case counts.
- **HTML path:** use `BeautifulSoup` to find the report table; extract rows.
- Returns `ParseResult` with:
  - `observations: list[DengueWeeklyObservation]` — one per district per week in the report.
  - `parse_warnings: list[str]` — non-fatal issues (e.g. unrecognised district name).
  - `parser_version: str` — must match `parserVersion` stored in `SourceSnapshot`.
- Raises `ParseError(message, raw_excerpt)` on:
  - Expected table not found.
  - Cases column contains non-numeric values that cannot be coerced.
  - Zero districts extracted (format may have changed).
- **`cases` field rules:**
  - Negative or non-numeric values → `cases=null`, `missingReason="INVALID_VALUE"`, quality flag `INVALID_COUNT`.
  - Cell blank or dash → `cases=null`, `missingReason="NOT_IN_REPORT"`.
  - Valid non-negative integer → `cases=<int>`.
  - **Never store `0` to represent missing.**
- `weekStart` / `weekEnd` are derived from the report's stated period, not the fetch date.

### Task 1.5 — Area name mapping (`ingestion/area_map.py`)

NDCU reports use Sinhala-transliterated or abbreviated district names (e.g. "Colombo", "Col.", "Colombo District"). Implement:

`load_area_map(path: Path) -> AreaMap` — reads a YAML mapping file `configs/area_map.yaml` (created in this task):

```yaml
# configs/area_map.yaml
# Maps NDCU report name variants → canonical areaId
mappings:
  'Colombo': 'LK-11'
  'Col.': 'LK-11'
  'Colombo District': 'LK-11'
  'Gampaha': 'LK-12'
  # ... all 25 districts
unmatched_policy: 'quarantine' # quarantine | reject | warn
```

`resolve_area(name: str, area_map: AreaMap) -> str | None`:

- Returns the canonical `areaId` or `None` if unmatched.
- Unmatched names are logged via `common/logging.py` with `level=WARNING`.
- If `unmatched_policy=quarantine`: observation is stored with `qualityFlags=["UNMATCHED_AREA"]` and `areaId="QUARANTINE"`.
- If `unmatched_policy=reject`: `ParseError` is raised.

### Task 1.6 — Open-Meteo weather fetch (`ingestion/weather_fetcher.py`)

Implement `fetch_weather_weekly(area_id: str, lat: float, lon: float, week_start: date, week_end: date) -> WeatherFetchResult`:

- Calls `https://archive-api.open-meteo.com/v1/archive` with parameters:
  - `latitude`, `longitude`, `start_date`, `end_date` (ISO dates).
  - `daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean`
  - `timezone=Asia/Colombo`
- Aggregates 7 daily values into one weekly record: `rainMm=sum`, `tempC=mean`, `humidityPct=mean`.
- If any daily value is missing: sets the corresponding weekly field to `null` and adds `qualityFlags=["PARTIAL_WEATHER_DATA"]`.
- If the entire week is missing: sets all fields to `null`, adds `qualityFlags=["NO_WEATHER_DATA"]`.
- `availableAt` is set to the `fetched_at` timestamp, **not** the observation date (historical reanalysis caveat documented in `docs/DATA_SOURCES.md`).
- Raises `WeatherFetchError` on HTTP error or schema mismatch.

### Task 1.7 — MongoDB repositories (`repositories/`)

Implement idempotent upsert functions for all four Phase 1 collections. All use the write credential `ML_MONGODB_WRITE_URI`.

**`source_snapshots.py`:**

```python
def upsert_snapshot(db: Database, snapshot: SourceSnapshot) -> UpsertResult
# filter: {"sourceId": snapshot.sourceId, "sha256": snapshot.sha256}
# update: $setOnInsert all fields (never overwrite an existing snapshot)
# returns: UpsertResult(matched, inserted, modified)
```

**`areas.py`:**

```python
def upsert_area(db: Database, area: Area) -> UpsertResult
# filter: {"areaId": area.areaId}
# update: $set all non-id fields (area metadata may be corrected)
```

**`dengue_weekly.py`:**

```python
def upsert_observation(db: Database, obs: DengueWeeklyObservation) -> UpsertResult
# filter: {"areaId": obs.areaId, "weekStart": obs.weekStart, "revision": obs.revision}
# update: $setOnInsert — never silently overwrite a published revision
def get_series(db: Database, area_id: str, from_date: date, to_date: date) -> list[DengueWeeklyObservation]
```

**`weather_weekly.py`:**

```python
def upsert_weather(db: Database, weather: WeatherWeeklyObservation) -> UpsertResult
# filter: {"areaId": weather.areaId, "weekStart": weather.weekStart, "provider": weather.provider}
def get_weather_series(db: Database, area_id: str, from_date: date, to_date: date) -> list[WeatherWeeklyObservation]
```

**MongoDB indexes (created on first connect):**

| Collection         | Index                                    | Type   |
| ------------------ | ---------------------------------------- | ------ |
| `source_snapshots` | `{sourceId: 1, sha256: 1}`               | unique |
| `areas`            | `{areaId: 1}`                            | unique |
| `dengue_weekly`    | `{areaId: 1, weekStart: 1, revision: 1}` | unique |
| `dengue_weekly`    | `{areaId: 1, weekStart: 1}`              | query  |
| `weather_weekly`   | `{areaId: 1, weekStart: 1, provider: 1}` | unique |

### Task 1.8 — Data quality checker (`validation/data_quality.py`)

`run_quality_checks(observations: list[DengueWeeklyObservation]) -> QualityReport`:

Returns a `QualityReport` containing:

- `total_observations: int`
- `missing_count: int` — observations with `cases=null`
- `zero_count: int` — observations with `cases=0` (legitimate zero, not missing)
- `coverage: dict[str, float]` — per-area fraction of non-null weeks
- `gap_weeks: list[tuple[str, date, date]]` — `(areaId, gap_start, gap_end)` for contiguous missing runs > 2 weeks
- `issues: list[QualityIssue]` — each with `severity` (`ERROR`/`WARNING`/`INFO`), `areaId`, `weekStart`, `code`, `message`

Quality checks implemented:

- `QC-01` Any `cases` value < 0 → `ERROR` / `NEGATIVE_COUNT`
- `QC-02` `cases=null` without `missingReason` → `ERROR` / `MISSING_REASON_ABSENT`
- `QC-03` Gap ≥ 4 consecutive missing weeks for an area → `WARNING` / `LONG_GAP`
- `QC-04` `weekEnd` ≠ `weekStart` + 6 days → `ERROR` / `INVALID_WEEK_RANGE`
- `QC-05` Duplicate `(areaId, weekStart, revision)` in same batch → `ERROR` / `DUPLICATE_KEY`
- `QC-06` `reportedAt` < `weekEnd` (report can't exist before its period ends) → `WARNING` / `IMPLAUSIBLE_REPORTING_DATE`
- `QC-07` Area coverage < 50% over the available history → `WARNING` / `LOW_COVERAGE`

### Task 1.9 — CLI command implementations

Implement the three Phase 1 subcommands (replacing `_not_implemented` stubs):

**`dengueahead audit-sources --config PATH`** (Task 1.1):

- Reads `configs/sources.yaml`.
- Performs HEAD request + robots.txt check per source.
- Prints a formatted audit table to stdout.
- Writes findings to `data/manifests/sources_manifest.json`.
- Exits 0 on all sources reachable; exits 1 on any failure.

**`dengueahead ingest --config PATH`**:

1. Load `sources.yaml`; verify `verified=true` before fetching (fail with clear message if not).
2. For each source: fetch → store snapshot → parse → normalise areas → quality-check → upsert to Mongo.
3. After all sources: print `PipelineRun` summary (counts: fetched, parsed, upserted, skipped, errored).
4. Write a `pipeline_runs` record to Mongo with the full summary.
5. Exit 0 if at least one source completed without error; exit 1 if all sources failed.

**`dengueahead validate-data`**:

1. Read all `dengue_weekly` records from Mongo (or a date-bounded subset).
2. Run `run_quality_checks()`.
3. Print the `QualityReport` as formatted JSON to stdout.
4. Exit 0 if no `ERROR`-severity issues; exit 1 otherwise.

### Task 1.10 — Node API route: `/api/v1/sources`

Add the read-only sources endpoint to `apps/api/src/`:

**`routes/sources.route.ts`** — `GET /api/v1/sources`:

- Reads from `source_snapshots` collection via a new `SourceSnapshotRepository`.
- Returns paginated list of snapshots with fields: `sourceId`, `sourceUrl`, `retrievedAt`, `licenceStatus`, `status`, `observedPeriod`, `parserVersion`, `error`.
- If collection is empty or Mongo unavailable: returns `{ items: [], nextCursor: null, dataStatus: "NO_DATA" }` with HTTP 200 (not 500).
- Validates response shape with `SourceSnapshotSchema` before sending.

**`routes/areas.route.ts`** — `GET /api/v1/areas?query=&level=`:

- Returns paginated list from `areas` collection.
- Supports optional `level=district|moh` filter and `query=` substring match on `name`.
- Returns `AreaSchema[]` items with pagination envelope.

Register both routers in `createApp()` under `env.API_PREFIX`.

---

## 5. Data Fixtures for Testing

All test fixtures live in `services/ml/tests/fixtures/` and `packages/contracts/fixtures/`. They are clearly labelled `synthetic` and must never appear in production DB or dashboard.

### Synthetic observation fixture (`fixtures/synthetic_observation.json`)

```json
{
  "_comment": "SYNTHETIC TEST-ONLY — not real surveillance data.",
  "areaId": "LK-11",
  "weekStart": "2026-01-06",
  "weekEnd": "2026-01-12",
  "reportingWeek": 2,
  "reportingYear": 2026,
  "cases": 14,
  "sourceSnapshotId": "snap-synthetic-001",
  "reportedAt": "2026-01-15T00:00:00Z",
  "revision": 1,
  "qualityFlags": []
}
```

### Synthetic NDCU HTML fixture (`fixtures/ndcu_sample.html`)

A minimal 3-district HTML table replicating the NDCU report structure, with:

- One district with a numeric value.
- One district with a dash (missing → `null`).
- One district with an unrecognised alias (→ quarantined).

Used only for parser unit tests — **not derived from any real report**.

---

## 6. Verification and Testing Matrix

| Test ID   | Level       | Target                          | Expected result                                                                              | Command                                               |
| --------- | ----------- | ------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `DATA-01` | Unit        | `snapshot.py`                   | Same SHA-256 fetched twice → second call skips disk write, returns same `StoredSnapshot`     | `pytest tests/unit/test_snapshot.py`                  |
| `DATA-02` | Unit        | `ndcu_parser.py`                | Blank/dash cell → `cases=null`, `missingReason="NOT_IN_REPORT"`, no `0`                      | `pytest tests/unit/test_ndcu_parser.py`               |
| `DATA-03` | Unit        | `area_map.py`                   | Unrecognised alias → `None` returned; observation gets `UNMATCHED_AREA` flag                 | `pytest tests/unit/test_area_map.py`                  |
| `DATA-04` | Unit        | `ndcu_parser.py`                | Table structure changed (no expected column) → `ParseError` raised, not wrong data           | `pytest tests/unit/test_ndcu_parser.py`               |
| `DATA-05` | Unit        | `ndcu_parser.py`                | Negative count in cell → `cases=null`, `missingReason="INVALID_VALUE"`, flag `INVALID_COUNT` | `pytest tests/unit/test_ndcu_parser.py`               |
| `DATA-06` | Unit        | `weather_fetcher.py`            | One daily value `null` in API response → weekly field `null`, flag `PARTIAL_WEATHER_DATA`    | `pytest tests/unit/test_weather_fetcher.py`           |
| `DATA-07` | Unit        | `snapshot.py`                   | `fetched_at` and `observedPeriod` are always stored as distinct fields                       | `pytest tests/unit/test_snapshot.py`                  |
| `DATA-08` | Unit        | `data_quality.py`               | 5 consecutive missing weeks → `LONG_GAP` warning in `QualityReport`                          | `pytest tests/unit/test_data_quality.py`              |
| `DATA-09` | Unit        | `data_quality.py`               | `cases=null` without `missingReason` → `ERROR` / `MISSING_REASON_ABSENT`                     | `pytest tests/unit/test_data_quality.py`              |
| `DATA-10` | Unit        | `repositories/dengue_weekly.py` | Second upsert of same `(areaId, weekStart, revision)` → `matched=1, inserted=0, modified=0`  | `pytest tests/unit/test_repositories.py`              |
| `DATA-11` | Integration | Full pipeline                   | Fixture snapshot → parse → upsert → query back → counts match                                | `pytest tests/integration/test_ingestion_pipeline.py` |
| `DATA-12` | Integration | Full pipeline                   | Run pipeline twice with same fixture → no duplicate effective records                        | `pytest tests/integration/test_ingestion_pipeline.py` |
| `DATA-13` | Integration | Full pipeline                   | Mongo disconnect mid-pipeline → exit 1, partial results labelled, no silent success          | `pytest tests/integration/test_ingestion_pipeline.py` |
| `DATA-14` | API         | `/sources` route                | Response matches `SourceSnapshotSchema[]`; empty collection → `items=[]` not 500             | `npm run test:unit -w @dengueahead/api`               |
| `DATA-15` | API         | `/areas` route                  | Response matches `AreaSchema[]`; `level=district` filter works                               | `npm run test:unit -w @dengueahead/api`               |

**Failure injection (required by master §6 gate step 6):**

- Disconnect MongoDB during `dengueahead ingest` → must exit non-zero with a clear error, not hang.
- Feed a corrupted/blank PDF to the parser → must raise `ParseError`, not return empty observations silently.
- Run with a source whose `verified=false` in `sources.yaml` → must refuse to fetch with a clear message.

---

## 7. Configuration Updates

### `configs/sources.yaml` (updated in Task 1.1)

Add fields after human verification:

```yaml
sources:
  ndcu:
    name: 'National Dengue Control Unit (NDCU) Sri Lanka'
    baseUrl: 'https://www.dengue.health.gov.lk/weekly-report/'
    format: 'pdf' # confirmed after Task 1.1 manual check
    geographicLevel: 'district' # confirmed; update to 'moh' if MOH data found
    updateFrequency: 'weekly'
    licenceStatus: 'ATTRIBUTION_REQUIRED' # update after rights check
    verified: false # MUST be set to true by human before ingest runs
    attribution: '' # fill in required attribution text
    robotsAllowed: null # fill in after audit
    lastChecked: null # fill in after audit (ISO date)
    parserVersion: '1.0.0'
    reportUrlPattern: '' # e.g. 'weekly-report-{YYYY}-week-{WW}.pdf'

  open_meteo:
    name: 'Open-Meteo Historical Weather API'
    baseUrl: 'https://archive-api.open-meteo.com/v1/archive'
    timezone: 'Asia/Colombo'
    variables:
      - 'temperature_2m_mean'
      - 'precipitation_sum'
      - 'relative_humidity_2m_mean'
    licenceStatus: 'ATTRIBUTION_REQUIRED'
    verified: false # set true after rights check
    attribution: 'Weather data by Open-Meteo.com'
    robotsAllowed: null
    lastChecked: null
    rateLimit: '10000/day'
    caveat: >
      Historical reanalysis data may incorporate information unavailable at the
      historic issuance date. Document this limitation in docs/DATA_SOURCES.md.
```

### `configs/area_map.yaml` (new in Task 1.5)

Created with all 25 Sri Lanka districts mapped to `LK-{code}` IDs. Populated after manually verifying NDCU district name spellings against at least 3 reports from different years.

---

## 8. Documentation Deliverables

### `docs/DATA_SOURCES.md`

Must include:

- Source name, URL, owner, licence, attribution text, retrieval date.
- Observed format (PDF page structure, HTML table ID/class).
- Temporal coverage: earliest and latest week available.
- Geographic coverage: list of districts/MOH areas confirmed present.
- Reporting delay: estimated days between `weekEnd` and `reportedAt`.
- **Go/no-go decision:** district vs MOH, with explicit rationale.
- Known gaps and quality issues found during audit.
- Open-Meteo reanalysis caveat (data may not reflect what was published at the time).
- DCS population data status (available / not available / deferred to Phase 2+).

### `docs/DATA_DICTIONARY.md`

Field-by-field definitions for all four MongoDB collections:

| Collection      | Field           | Type     | Unit  | Nullable | Notes                                     |
| --------------- | --------------- | -------- | ----- | -------- | ----------------------------------------- |
| `dengue_weekly` | `areaId`        | string   | —     | No       | Stable canonical code; not a display name |
| `dengue_weekly` | `cases`         | int      | count | Yes      | `null` = missing; `0` = legitimate zero   |
| `dengue_weekly` | `missingReason` | string   | —     | Yes      | Required iff `cases=null`                 |
| `dengue_weekly` | `qualityFlags`  | string[] | —     | No       | See Quality Flag Registry below           |
| …               | …               | …        | …     | …        | …                                         |

**Quality Flag Registry:**

| Flag                           | Collection       | Meaning                                             |
| ------------------------------ | ---------------- | --------------------------------------------------- |
| `INVALID_COUNT`                | `dengue_weekly`  | Count was non-numeric or negative in source         |
| `NOT_IN_REPORT`                | `dengue_weekly`  | Week/area absent from source document               |
| `UNMATCHED_AREA`               | `dengue_weekly`  | Area name could not be resolved to a canonical ID   |
| `PARSE_ERROR`                  | `dengue_weekly`  | Parser encountered an unexpected table format       |
| `PARTIAL_WEATHER_DATA`         | `weather_weekly` | One or more daily values missing for the week       |
| `NO_WEATHER_DATA`              | `weather_weekly` | Entire week missing from weather provider           |
| `INSUFFICIENT_SOURCE_COVERAGE` | `predictions`    | Fewer area-weeks than minimum required for forecast |

---

## 9. API Integration Tests (Node)

Add to `apps/api/src/test/sources.test.ts`:

```typescript
// Unit tests — no real Mongo needed (fake repository injected)
describe('GET /api/v1/sources', () => {
  it('returns 200 with empty items when collection is empty');
  it('returns paginated SourceSnapshot items matching schema');
  it('returns 503 when DB is unavailable');
  it('rejects invalid cursor with 400');
});

describe('GET /api/v1/areas', () => {
  it('returns 200 with area list matching AreaSchema');
  it('filters by level=district');
  it('returns 400 for invalid level value');
  it('returns empty items gracefully when no areas loaded');
});
```

---

## 10. Acceptance Gate Checklist for Phase 1

Phase 1 is complete, and Phase 2 may start, only when **all** of the following hold and are evidenced in `docs/evidence/phase-1/`:

**Source audit & rights**

- [ ] `dengueahead audit-sources` exits 0 for all sources and writes `data/manifests/sources_manifest.json`.
- [ ] Human has verified terms of use for NDCU and Open-Meteo; findings recorded in `source_audit_log.md`.
- [ ] `configs/sources.yaml` has `verified: true`, `licenceStatus`, and `attribution` populated for all ingested sources.
- [ ] `robots.txt` status recorded for every source.

**Ingestion & parsing**

- [ ] `dengueahead ingest` runs end-to-end against at least one real NDCU report without error.
- [ ] Parser correctly extracts case counts; human has manually verified at least 3 reports' numbers match the source PDF/HTML.
- [ ] All 25 Sri Lanka districts are present in `configs/area_map.yaml`; unmatched names are logged and quarantined, not silently dropped.
- [ ] `dengue_weekly` collection has records; `cases=null` is used for missing weeks, never `0`.
- [ ] `source_snapshots` collection has the ingested document's SHA-256 and metadata.

**Data quality**

- [ ] `dengueahead validate-data` exits 0 (no ERROR-severity issues) on the ingested dataset.
- [ ] Coverage table (unique areas × weeks) is published in `docs/DATA_SOURCES.md`.
- [ ] Reporting delay (days from `weekEnd` to `reportedAt`) is estimated and documented.

**Geography decision**

- [ ] Go/no-go decision (district vs MOH) is recorded in `docs/DATA_SOURCES.md` with explicit rationale.
- [ ] If MOH chosen: ≥ 50 MOH areas with ≥ 52 weeks of history confirmed.
- [ ] If district chosen: all 25 districts with ≥ 52 weeks of history confirmed or gap table documented.

**Weather**

- [ ] Open-Meteo sample fetch for at least 3 district centroids succeeds.
- [ ] `weather_weekly` collection has records for tested districts.
- [ ] Reanalysis caveat is documented in `docs/DATA_SOURCES.md`.

**Tests**

- [ ] All `DATA-01` through `DATA-15` tests pass (`pytest services/ml/tests -v`).
- [ ] `npm run test:unit` passes with new `/sources` and `/areas` route tests.
- [ ] Failure injection cases (disconnected Mongo, corrupted PDF, unverified source) all behave truthfully.

**Documentation**

- [ ] `docs/DATA_SOURCES.md` is published with all required sections.
- [ ] `docs/DATA_DICTIONARY.md` is published with all four collection schemas.
- [ ] `docs/evidence/phase-1/EVIDENCE_REPORT.md` contains: date, git SHA, OS/Python/Node versions, all commands run with pass/fail counts, failure injection results, manual spot-check log, and open defects.
- [ ] Human has inspected 10 randomly sampled `dengue_weekly` records for accuracy against the source documents.

**Blocker rule:** If no real usable historical case series with ≥ 52 weeks and ≥ 10 areas can be obtained by the end of Phase 1, **STOP** and file an honest re-scope report before proceeding to Phase 2. Do not generate synthetic training data.

---

## 11. Traceability to the Master Plan (Phase 1, §7)

| Master requirement                                                      | Covered by                           |
| ----------------------------------------------------------------------- | ------------------------------------ |
| Inspect NDCU downloadable reports; find actual case counts + coverage   | Task 1.1, `audit-sources`            |
| Write machine-readable source manifest                                  | Task 1.1, `sources_manifest.json`    |
| Implement document fetch with retries, timeout, content-type validation | Task 1.2, `fetcher.py`               |
| Implement parsers per confirmed format                                  | Task 1.4, `ndcu_parser.py`           |
| Normalize area names; log unmatched values                              | Task 1.5, `area_map.py`              |
| Audit unique areas/weeks, zero/missing, gaps                            | Task 1.8, `data_quality.py`          |
| Query Open-Meteo; aggregate daily → weekly                              | Task 1.6, `weather_fetcher.py`       |
| Mongo schemas and idempotent upserts                                    | Task 1.7, `repositories/`            |
| Human: verify parser numbers against 3 reports                          | Gate checklist, manual               |
| Human: verify rights/terms/robots                                       | Task 1.1 human tasks                 |
| Human: go/no-go geography decision                                      | Gate checklist, `DATA_SOURCES.md`    |
| Human: verify reporting dates vs observed-week dates                    | Gate checklist, `EVIDENCE_REPORT.md` |
| Human: inspect 10 sampled records for accuracy                          | Gate checklist, manual               |
| Unit tests DATA-01 through DATA-07                                      | §6 test matrix                       |
| Integration: fixture → parse → Mongo → API; run twice; offline stale    | `DATA-11`, `DATA-12`, `DATA-13`      |
| Gate: publish DATA_SOURCES.md, DATA_DICTIONARY.md, coverage table       | §10 gate checklist                   |
