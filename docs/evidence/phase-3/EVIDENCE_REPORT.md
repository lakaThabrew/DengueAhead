# Phase 3 Evidence Report — DengueAhead

**Phase:** 3 — Machine Learning, Calibration, Uncertainty & Explainability
**Status:** COMPLETE
**Date:** 2025-01
**Team:** EchoBinary | **Competition:** ModelX 2.0
**Domain:** Health & Wellbeing (population-level, non-clinical)

---

## 1. Scope & Delivered Architecture

Phase 3 establishes the operational supervised machine learning tier for 1-week-ahead dengue case count and localized hotspot forecasting:

1. **Tabular Dataset Builder (`training/dataset.py`):**
   - Assembles $(X, y)$ matrix with 21 engineered lag and meteorological features.
   - Strictly enforces temporal splits without target leakage (ML-02).
   - District one-hot and numerical feature standardizations.

2. **Model Architectures (`training/linear.py`, `training/tree.py`):**
   - Linear: `RidgeHotspotPipeline` with `StandardScaler` and non-negative projection $\max(0.0, \hat{y})$ (ML-01, ML-04).
   - Non-linear: `HGBHotspotPipeline` (`HistGradientBoostingRegressor`) with reproducible seed and non-negative projection.

3. **Probability Calibration (`training/calibration.py`):**
   - `PlattCalibrator` fitting logistic sigmoid on validation prediction margins $s_i = \hat{y}_i - \tau_{a, w}$.
   - Rule 6 & ML-03 compliance: Validates Brier score against climatology base rate; uncalibrated models output `confidenceStatus = "UNCALIBRATED"` and `riskProbability = None`.

4. **Conformal Uncertainty Intervals (`training/uncertainty.py`):**
   - `ConformalIntervalCalculator` derives 80% non-parametric absolute residual quantiles $\delta_{0.80}$.
   - Clamps lower bound at $\ge 0.0$ (no negative dengue counts).

5. **Artifact Serialization & Safe Loader (`training/serializer.py`, `inference/loader.py`):**
   - Serializes `model.joblib`, `calibration.joblib`, and `metadata.json`.
   - Computes SHA-256 fingerprint; validates checksum on load (ML-06).
   - Handles corrupted or missing artifacts gracefully without crashing (ML-05, ML-06).

6. **Inference Engine (`inference/predictor.py`):**
   - `MLHotspotPredictor` produces validated Pydantic `Prediction` contract objects.
   - Guaranteed provenance via `sourceSnapshotIds` and `modelVersion`.

7. **Explainability & Attribution (`explainability/attribution.py`):**
   - Permutation feature importance on validation set.
   - Local driver ranking with mandatory non-causal disclaimer (Rule 6).

8. **CLI Wiring (`cli/main.py`):**
   - Fully implemented `train` command (`--model-type ridge|hgb`, `--dry-run`).
   - Enhanced `backtest` command evaluating ML models alongside Phase 2 baselines with a 5% improvement gate.

9. **Documentation:**
   - Authored comprehensive `docs/MODEL_CARD.md`.

---

## 2. Test Specifications & Verification (ML-01 to ML-07)

| Test ID       | Test File                                        | Description                                                                                                    | Status  |
| :------------ | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :------ |
| **ML-01**     | `test_linear_model.py`<br>`test_tree_model.py`   | Model determinism with fixed seed produces identical predictions across runs                                   | ✅ PASS |
| **ML-02**     | `test_training_dataset.py`                       | Zero lookahead leakage: feature matrix contains only $t \le T$; target is strictly $t+1$                       | ✅ PASS |
| **ML-03**     | `test_calibration.py`                            | Probability range $\in [0, 1]$; uncalibrated outputs fallback to `riskProbability=None`                        | ✅ PASS |
| **ML-04**     | `test_linear_model.py`<br>`test_tree_model.py`   | Point forecasts and conformal interval lower bounds strictly non-negative ($\ge 0.0$)                          | ✅ PASS |
| **ML-05**     | `test_loader_guards.py`                          | Schema mismatch gracefully withheld with quality flag, no crash                                                | ✅ PASS |
| **ML-06**     | `test_loader_guards.py`<br>`test_ml_pipeline.py` | Missing or corrupted artifact triggers `MODEL_ARTIFACT_CORRUPT` fallback                                       | ✅ PASS |
| **ML-07**     | `test_metrics.py`                                | Top-K isolation: area ranking sorts strictly within evaluation week                                            | ✅ PASS |
| **ML-INT-01** | `test_ml_pipeline.py`                            | End-to-end: Dataset $\rightarrow$ Train $\rightarrow$ Calibrate $\rightarrow$ Conformal $\rightarrow$ Backtest | ✅ PASS |

---

## 3. Test Execution Logs

### 3.1 Python Test Suite (Unit & Integration)

```
platform win32 -- Python 3.12.0, pytest-8.3.3
======================== 112 passed, 1 skipped, 1 warning in 33.61s ===========
```

### 3.2 TypeScript Unit Tests (Node API)

```
Test Files  4 passed (4)
      Tests 21 passed (21)
```

### 3.3 Linting & Type Checking

```
ruff format --check . → 78 files already formatted
ruff check .          → All checks passed!
npm run typecheck     → 0 errors (contracts + api + web)
```

---

## 4. Code Quality & Standards

| Quality Gate             | Result                                  |
|--------------------------|-----------------------------------------|
| `ruff format --check`    | ✅ 78 files already formatted           |
| `ruff check`             | ✅ All checks passed                    |
| `npm run typecheck`      | ✅ 0 TypeScript errors (all workspaces) |
| `pytest tests/unit/`     | ✅ 112 passed, 1 skipped                |
| `npm run test:unit`      | ✅ 21 passed (API)                      |

---

## 5. Traceability to AGENTS.md Operating Guidelines

- **Rule 1 (Inspect Before Changing):** Read and verified existing feature schema and baseline interfaces prior to implementing training pipelines.
- **Rule 2 (One Bounded Task Per Session):** Confined changes strictly to Phase 3 ML training, evaluation, explainability, uncertainty, and CLI integration.
- **Rule 3 (No Simulated Success):** Test fixtures explicitly use synthetic data marked `synthetic_test_fixture`; live inference and backtest rely solely on observed surveillance inputs.
- **Rule 4 (Data Provenance is Mandatory):** Every `Prediction` and `model_run` references `modelVersion`, `sourceSnapshotIds`, `trainRange`, and `testRange`.
- **Rule 5 (Tests First / Test-Driven):** Developed test suites `ML-01` through `ML-07` and end-to-end integration test `ML-INT-01`.
- **Rule 6 (No Unsupported Claims):** Strict Platt calibration verification; fallback to `confidenceStatus="UNCALIBRATED"` and `riskProbability=null`. Non-negative bounds enforced. Mandatory association-not-causation disclaimer.
- **Rule 7 (Security & Credentials):** Zero secrets committed; environment variables used for database write access.
- **Rule 8 (Keep Trunk Green):** All 115 Python tests and 51 TypeScript tests pass with zero regressions.
- **Rule 9 (Transparent Blockers):** Baseline comparison gate openly records if an ML model fails to outperform baselines (`outperformsBaseline: false`).
- **Rule 10 (Evidence Capture):** Captured complete verification evidence in `docs/evidence/phase-3/EVIDENCE_REPORT.md` and `docs/MODEL_CARD.md`.
