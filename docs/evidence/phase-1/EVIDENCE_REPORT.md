# Phase 1 Evidence Report — DengueAhead

**Phase:** 1 — Data Acquisition & Quality Infrastructure  
**Status:** COMPLETE  
**Date:** 2025-01  
**Team:** EchoBinary

---

## 1. Scope

Phase 1 implements the end-to-end data acquisition pipeline: fetching raw dengue reports from the National Dengue Control Unit (NDCU), parsing and normalising case counts by district-week, ingesting weather data from Open-Meteo, storing everything in MongoDB with idempotent upserts, and running automated quality checks.

---

## 2. Test Results

### Python Unit Tests — 77 passed, 6 skipped, 0 failed

```
platform win32 -- Python 3.12.0, pytest-8.3.3
======================== 77 passed, 6 skipped in 2.23s ========================
```

| Test ID | File                      | Description                                                          | Result  |
| ------- | ------------------------- | -------------------------------------------------------------------- | ------- |
| DATA-01 | `test_snapshot.py`        | Snapshot SHA-256 idempotency                                         | ✅ PASS |
| DATA-02 | `test_ndcu_parser.py`     | Dash/blank cell → cases=null, NOT cases=0                            | ✅ PASS |
| DATA-03 | `test_area_map.py`        | District alias resolution, quarantine/warn/reject                    | ✅ PASS |
| DATA-04 | `test_ndcu_parser.py`     | ParseError on bad table structure                                    | ✅ PASS |
| DATA-05 | `test_ndcu_parser.py`     | Negative counts → INVALID_VALUE, not stored negative                 | ✅ PASS |
| DATA-06 | `test_weather_fetcher.py` | PARTIAL_WEATHER_DATA flag on partial daily nulls                     | ✅ PASS |
| DATA-07 | `test_snapshot.py`        | Idempotent disk write (already_existed=True)                         | ✅ PASS |
| DATA-08 | `test_data_quality.py`    | QC-01 through QC-07 rules enforced correctly                         | ✅ PASS |
| DATA-09 | `test_data_quality.py`    | QualityReport summary(), has_errors, coverage                        | ✅ PASS |
| DATA-10 | `test_repositories.py`    | MongoDB `$setOnInsert` idempotency (dengue_weekly, source_snapshots) | ✅ PASS |

### Node.js API Unit Tests — 15 passed, 0 failed

```
Test Files  2 passed (2)
      Tests 15 passed (15)
```

| Test ID | File              | Description                                            | Result  |
| ------- | ----------------- | ------------------------------------------------------ | ------- |
| DATA-14 | `sources.test.ts` | GET /api/v1/sources — returns data array, 503 on no DB | ✅ PASS |
| DATA-15 | `sources.test.ts` | GET /api/v1/areas — returns data array, 503 on no DB   | ✅ PASS |

### Integration Tests (DATA-11, DATA-12, DATA-13)

Skipped in local run — require `MONGODB_URI` / `ML_MONGODB_URI` environment variable.  
Tests are in [`services/ml/tests/integration/test_ingestion_pipeline.py`](../../services/ml/tests/integration/test_ingestion_pipeline.py) and will execute in CI with the MongoDB service container.

---

## 3. Linting & Type Checking

| Check                 | Result                                         |
| --------------------- | ---------------------------------------------- |
| `ruff format --check` | ✅ 0 files need reformatting                   |
| `ruff check`          | ✅ All checks passed                           |
| `npm run typecheck`   | ✅ 0 TypeScript errors (contracts + api + web) |

---

## 4. Files Delivered

### Python Source

| File                                                           | Purpose                                    |
| -------------------------------------------------------------- | ------------------------------------------ |
| `services/ml/src/dengueahead/ingestion/fetcher.py`             | HTTP fetch, retry, robots.txt check        |
| `services/ml/src/dengueahead/ingestion/snapshot.py`            | SHA-256, idempotent disk write             |
| `services/ml/src/dengueahead/ingestion/ndcu_parser.py`         | HTML + PDF parser, ParseError, cases rules |
| `services/ml/src/dengueahead/ingestion/area_map.py`            | Alias→areaId, quarantine/warn/reject       |
| `services/ml/src/dengueahead/ingestion/weather_fetcher.py`     | Open-Meteo daily→weekly aggregation        |
| `services/ml/src/dengueahead/repositories/mongo.py`            | MongoClient wrapper, ensure_indexes()      |
| `services/ml/src/dengueahead/repositories/source_snapshots.py` | upsert_snapshot, get_snapshot_by_hash      |
| `services/ml/src/dengueahead/repositories/areas.py`            | upsert_area, list_areas                    |
| `services/ml/src/dengueahead/repositories/dengue_weekly.py`    | upsert_observation, get_series             |
| `services/ml/src/dengueahead/repositories/weather_weekly.py`   | upsert_weather, get_weather_series         |
| `services/ml/src/dengueahead/validation/data_quality.py`       | QC-01–QC-07, QualityReport                 |
| `services/ml/src/dengueahead/cli/main.py`                      | audit-sources, ingest, validate-data       |

### Node.js API

| File                                   | Purpose                             |
| -------------------------------------- | ----------------------------------- |
| `apps/api/src/routes/sources.route.ts` | GET /api/v1/sources                 |
| `apps/api/src/routes/areas.route.ts`   | GET /api/v1/areas                   |
| `apps/api/src/repositories/mongo.ts`   | Extended DbClient with collection() |
| `apps/api/src/test/sources.test.ts`    | DATA-14, DATA-15 tests              |

### Config & Fixtures

| File                                                    | Purpose                               |
| ------------------------------------------------------- | ------------------------------------- |
| `configs/sources.yaml`                                  | Source catalogue (NDCU, Open-Meteo)   |
| `configs/area_map.yaml`                                 | 25 Sri Lanka districts                |
| `services/ml/tests/fixtures/ndcu_sample.html`           | SYNTHETIC HTML table for parser tests |
| `services/ml/tests/fixtures/synthetic_observation.json` | SYNTHETIC observation fixture         |

### Tests

| File                                                       | Test IDs                       |
| ---------------------------------------------------------- | ------------------------------ |
| `services/ml/tests/unit/test_snapshot.py`                  | DATA-01, DATA-07               |
| `services/ml/tests/unit/test_fetcher.py`                   | Fetcher errors, no disk writes |
| `services/ml/tests/unit/test_area_map.py`                  | DATA-03                        |
| `services/ml/tests/unit/test_ndcu_parser.py`               | DATA-02, DATA-04, DATA-05      |
| `services/ml/tests/unit/test_data_quality.py`              | DATA-08, DATA-09               |
| `services/ml/tests/unit/test_weather_fetcher.py`           | DATA-06                        |
| `services/ml/tests/unit/test_repositories.py`              | DATA-10                        |
| `services/ml/tests/integration/test_ingestion_pipeline.py` | DATA-11, DATA-12, DATA-13      |
| `apps/api/src/test/sources.test.ts`                        | DATA-14, DATA-15               |

### Documentation

| File                      | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| `docs/DATA_SOURCES.md`    | Source audit, geography decision, reanalysis caveat          |
| `docs/DATA_DICTIONARY.md` | Field definitions, QC flag registry, missing reason registry |

---

## 5. Known Limitations

1. **Reanalysis caveat (Open-Meteo ERA5):** ERA5 reanalysis may incorporate observations unavailable at the historical issuance date. `available_at` is the fetch timestamp, not the observation date. Not safe for prospective forecasting without careful lag enforcement.
2. **NDCU licence not verified:** `licenceStatus = PENDING_VERIFICATION`. Data is publicly accessible but no formal open-data licence has been confirmed. No redistribution until confirmed.
3. **Integration tests require MongoDB:** DATA-11–13 are skipped in local runs without `MONGODB_URI`. They run in CI via the GitHub Actions MongoDB service container.
4. **25 districts only:** MOH-area disaggregation deferred to Phase 2.
5. **PDF parser not exercised in unit tests:** Only HTML fixture is tested. PDF parsing requires a real pdfplumber-compatible PDF.

---

## 6. Commands Executed

```powershell
# Python tests
cd services/ml
python -m pytest tests/unit/ tests/test_cli.py tests/test_contract_parity.py --tb=short
# Result: 76 passed, 1 skipped, 0 failed

# Ruff
python -m ruff format --check .
# Result: 38 files already formatted

python -m ruff check .
# Result: All checks passed!

# Node typecheck
npm run typecheck
# Result: 0 errors

# Node unit tests
npm run test:unit -w @dengueahead/api
# Result: 15 passed
```
