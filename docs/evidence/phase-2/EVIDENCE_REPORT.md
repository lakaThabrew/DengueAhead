# Phase 2 Evidence Report — DengueAhead

**Phase:** 2 — Core Analytical Engine (Feature Extraction, Baselines, Backtest)
**Status:** COMPLETE
**Date:** 2025-01
**Team:** EchoBinary

---

## 1. Scope

Phase 2 implements the full core analytical engine before any ML model is introduced:

- Strictly as-of safe temporal filtering (zero data leakage)
- Feature vector extraction (lags, growth rates, rolling means, weather, seasonality)
- Localized seasonal hotspot thresholds (district × calendar-week 75th percentile)
- Hotspot status taxonomy (EMERGING / PERSISTENT / COOLING / STABLE / WITHHELD)
- Three transparent statistical baselines: `naive_last_week`, `rolling_mean_4w`, `seasonal_historical_median`
- Rolling origin backtest harness with MAE, precision, recall, top-3 recall metrics
- MongoDB repositories: `feature_snapshots`, `model_runs`, `predictions`
- CLI commands: `build-features` and `backtest`
- Node API endpoints: `GET /api/v1/evaluation`, `GET /api/v1/predictions`

---

## 2. Test Results

### Python Unit Tests — 96 passed, 1 skipped, 0 failed

```
platform win32 -- Python 3.12.0, pytest-8.3.3
======================== 96 passed, 1 skipped in 2.28s ========================
```

| Test ID | File                      | Description                                               | Result  |
| ------- | ------------------------- | --------------------------------------------------------- | ------- |
| FEAT-01 | `test_as_of.py`           | Modifying target-week data cannot affect as-of view       | ✅ PASS |
| FEAT-02 | `test_as_of.py`           | Future obs + weather publication delay blocked            | ✅ PASS |
| FEAT-03 | `test_feature_builder.py` | 4w moving average excludes target week t+1                | ✅ PASS |
| FEAT-04 | `test_seasonality.py`     | Test-period spikes cannot alter train-fitted threshold    | ✅ PASS |
| FEAT-05 | `test_feature_builder.py` | WITHHELD on <4 obs and null lag-1                         | ✅ PASS |
| FEAT-06 | `test_feature_builder.py` | Zero denominator → growth_1w=15.0, no ZeroDivision        | ✅ PASS |
| FEAT-07 | `test_taxonomy.py`        | All 7 taxonomy cases incl. quality-flag WITHHELD          | ✅ PASS |
| BASE-01 | `test_baselines.py`       | Naive: ŷ=c1, NOT_AVAILABLE, PERSISTENT status             | ✅ PASS |
| BASE-02 | `test_baselines.py`       | Rolling mean: ŷ=105.5, EMERGING status                    | ✅ PASS |
| BASE-03 | `test_baselines.py`       | Seasonal median: ŷ=95.0, STABLE status                    | ✅ PASS |
| BASE-04 | `test_baselines.py`       | Withheld → pointForecast=None, passes Pydantic invariants | ✅ PASS |
| EVAL-01 | `test_metrics.py`         | MAE=13.33, Prec=0.5, Rec=1.0, Top2Recall=1.0              | ✅ PASS |

Phase 2 repository tests (`test_phase2_repositories.py`) — 4 tests — also pass.

### Node.js API Unit Tests — 21 passed, 0 failed

```
Test Files  4 passed (4)
      Tests 21 passed (21)
```

| Test ID     | File                  | Description                                         | Result  |
| ----------- | --------------------- | --------------------------------------------------- | ------- |
| API-EVAL-01 | `evaluation.test.ts`  | GET /api/v1/evaluation → 200 with EvaluationMetrics | ✅ PASS |
| API-EVAL-02 | `evaluation.test.ts`  | GET /api/v1/evaluation → 503 when DB offline        | ✅ PASS |
| API-EVAL-03 | `evaluation.test.ts`  | GET /api/v1/evaluation → 503 on DB query error      | ✅ PASS |
| API-PRED-01 | `predictions.test.ts` | GET /api/v1/predictions?asOf=2024-07-01 → 200       | ✅ PASS |
| API-PRED-02 | `predictions.test.ts` | GET /api/v1/predictions?asOf=not-a-date → 400       | ✅ PASS |
| API-PRED-03 | `predictions.test.ts` | GET /api/v1/predictions → 503 when DB offline       | ✅ PASS |

---

## 3. Linting & Type Checking

| Check                 | Result                                  |
| --------------------- | --------------------------------------- |
| `ruff format --check` | ✅ 60 files already formatted           |
| `ruff check`          | ✅ All checks passed                    |
| `npm run typecheck`   | ✅ 0 TypeScript errors (all workspaces) |

---

## 4. Files Delivered

### Python Source

| File                                                            | Purpose                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `services/ml/src/dengueahead/features/as_of.py`                 | `filter_observations_as_of`, `filter_weather_as_of` — strict temporal cutoff          |
| `services/ml/src/dengueahead/features/builder.py`               | `build_features_for_area` — all 21 features; WITHHELD logic; div-zero guards          |
| `services/ml/src/dengueahead/features/seasonality.py`           | `calculate_seasonal_medians`, `calculate_hotspot_thresholds` — train-split isolated   |
| `services/ml/src/dengueahead/features/taxonomy.py`              | `classify_status` — 5-way state classifier                                            |
| `services/ml/src/dengueahead/baselines/naive.py`                | `NaiveLastWeekForecaster` — ŷ = y_t                                                   |
| `services/ml/src/dengueahead/baselines/rolling_mean.py`         | `RollingMean4wForecaster` — ŷ = mean(lags 1..4)                                       |
| `services/ml/src/dengueahead/baselines/seasonal_median.py`      | `SeasonalMedianForecaster` — ŷ = train-split calendar-week median                     |
| `services/ml/src/dengueahead/evaluation/split.py`               | `DEFAULT_SPLIT`: Train≤2023 · Val 2024-W01–W26 · Test 2024-W27–W52                    |
| `services/ml/src/dengueahead/evaluation/metrics.py`             | `compute_metrics` — MAE, precision, recall, top-k recall, brier=None                  |
| `services/ml/src/dengueahead/evaluation/backtest.py`            | `BacktestRunner` — rolling-origin harness; thresholds fitted on train only            |
| `services/ml/src/dengueahead/repositories/feature_snapshots.py` | `$setOnInsert` on `(areaId, issueDate, featureSetVersion)`                            |
| `services/ml/src/dengueahead/repositories/model_runs.py`        | `$set` on `modelVersion` — re-running backtest updates metrics                        |
| `services/ml/src/dengueahead/repositories/predictions.py`       | `$setOnInsert` on `(areaId, targetWeek, modelVersion, issueDate)`                     |
| `services/ml/src/dengueahead/repositories/mongo.py`             | Phase 2 indexes added for all 3 new collections                                       |
| `services/ml/src/dengueahead/cli/main.py`                       | `build-features` and `backtest` fully wired; `train`/`predict` remain Phase 3/4 stubs |

### Node.js API

| File                                       | Purpose                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `apps/api/src/routes/evaluation.route.ts`  | `GET /api/v1/evaluation` — returns `EvaluationMetricsSchema`-validated docs      |
| `apps/api/src/routes/predictions.route.ts` | `GET /api/v1/predictions` — Zod query validation + `PredictionSchema` validation |
| `apps/api/src/test/evaluation.test.ts`     | API-EVAL tests                                                                   |
| `apps/api/src/test/predictions.test.ts`    | API-PRED tests                                                                   |

### Unit Tests

| File                                                 | Test IDs                  |
| ---------------------------------------------------- | ------------------------- |
| `services/ml/tests/unit/test_as_of.py`               | FEAT-01, FEAT-02          |
| `services/ml/tests/unit/test_feature_builder.py`     | FEAT-03, FEAT-05, FEAT-06 |
| `services/ml/tests/unit/test_seasonality.py`         | FEAT-04                   |
| `services/ml/tests/unit/test_taxonomy.py`            | FEAT-07                   |
| `services/ml/tests/unit/test_baselines.py`           | BASE-01 through BASE-04   |
| `services/ml/tests/unit/test_metrics.py`             | EVAL-01                   |
| `services/ml/tests/unit/test_phase2_repositories.py` | Phase 2 repo mocks        |

---

## 5. Acceptance Gate — All Criteria Met

| Criterion                                                                                   | Status |
| ------------------------------------------------------------------------------------------- | ------ |
| Leakage proof: FEAT-01, FEAT-02 pass                                                        | ✅     |
| Division-by-zero safety: FEAT-06 passes                                                     | ✅     |
| All Prediction + EvaluationMetrics instances validate against Pydantic + Zod contracts      | ✅     |
| Three baselines implemented and backtest CLI wired                                          | ✅     |
| GET /api/v1/evaluation and GET /api/v1/predictions return 200/400/503 correctly             | ✅     |
| `ruff format --check`, `ruff check`, `npm run typecheck`, `pytest`, Node test:unit all pass | ✅     |
| Evidence documented in this file                                                            | ✅     |

**Phase 2 gate: PASSED. Ready for Phase 3.**

---

## 6. Known Limitations

1. **Backtest requires real data:** `dengueahead backtest` requires `ML_MONGODB_WRITE_URI` and ingested `dengue_weekly` observations. No synthetic data is generated by the CLI.
2. **Weather data optional:** Feature builder runs without weather records (sets `weather_available=False`). ERA5 reanalysis data is not operationally real-time.
3. **Integration backtest tests:** Full DB-backed integration tests for the backtest pipeline require MongoDB — skipped locally when `MONGODB_URI` is unset (CI only).
4. **`configs/model.yaml` not yet created:** CLI `backtest` command reads from code defaults (`DEFAULT_SPLIT`). A `configs/model.yaml` for configurable thresholds is deferred to Phase 3.

---

## 7. Commands Executed

```powershell
cd services/ml
python -m ruff format .
# Result: 12 files reformatted, 48 files left unchanged

python -m ruff check .
# Result: All checks passed!

python -m pytest tests/unit/ tests/test_cli.py tests/test_contract_parity.py -q
# Result: 96 passed, 1 skipped

# From repo root
npm run typecheck
# Result: 0 errors (contracts + api + web)

npm run test:unit -w @dengueahead/api
# Result: 21 passed (4 test files)
```
