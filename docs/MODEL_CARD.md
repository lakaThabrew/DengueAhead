# Model Card — DengueAhead Hotspot Forecaster

**Version:** Phase 3 (baselines + ML candidates)
**Last Updated:** 2025-01
**Team:** EchoBinary | ModelX 2.0 Competition
**Domain:** Public Health — Population-level dengue early warning (non-clinical)

> **Caution:** This system is designed for public-health resource allocation guidance only.
> It is **not** a clinical diagnostic tool and must not be used to make individual patient decisions.

---

## 1. Model Details

### 1.1 Model Architectures

| Model Version | Architecture | Framework | Random Seed |
|---|---|---|---|
| `baseline-naive-last-week-v1` | Persistence (ŷ = y_t) | Pure Python | n/a |
| `baseline-rolling-mean-4w-v1` | 4-week rolling mean | Pure Python | n/a |
| `baseline-seasonal-median-v1` | Calendar-week historical median | Pure Python | n/a |
| `dengueahead-ridge-v1` | Ridge Regression (L2) + StandardScaler | scikit-learn | 42 |
| `dengueahead-hgb-v1` | HistGradientBoostingRegressor | scikit-learn | 42 |

### 1.2 Prediction Task

- **Type:** 1-week ahead continuous dengue case count + binary hotspot flag
- **Target:** `y_{a, t+1}` — reported dengue cases in district `a` during the week beginning `t+1`
- **Horizon:** 1 ISO calendar week ahead of forecast issue date `T`
- **Issue cadence:** Weekly (Monday 00:00 UTC after week `t` closes)
- **Geographic unit:** 25 Sri Lanka administrative districts (`LK-11` … `LK-92`)

### 1.3 Hotspot Definition

A district-week is classified as a **hotspot** when:

$$y_{a, t+1} \ge \tau_{a, w}$$

where $\tau_{a, w}$ is the **75th percentile** of historical case counts for calendar week `w` in district `a`, computed strictly from training data (≤ 2023-12-25).

---

## 2. Training Data

| Split | Date Range | Purpose |
|---|---|---|
| **Train** | 2020-01-06 – 2023-12-25 | Model fitting; seasonal threshold estimation |
| **Validation** | 2024-01-01 – 2024-06-24 | Probability calibration; conformal interval fitting; hyperparameter selection |
| **Test** | 2024-07-01 – 2024-12-30 | Held-out final evaluation — never touched until final benchmark |

**Primary source:** National Dengue Control Unit (NDCU), Sri Lanka Ministry of Health — weekly district case counts. Licence status: `PENDING_VERIFICATION` (publicly accessible; formal open-data licence not confirmed).

**Weather source:** Open-Meteo ERA5 historical reanalysis archive (CC BY 4.0).

> **Reanalysis caveat:** ERA5 weather data may incorporate observations unavailable at the historical issuance date. `availableAt` is set to the fetch timestamp. Weather features should not be used as if operationally available at the exact forecast issue time in prospective settings.

---

## 3. Features

All features are computed **strictly as-of** the forecast issue date `T`. No target-week or future data can enter the feature vector.

| Feature | Type | Description |
|---|---|---|
| `cases_lag_1` | numeric | Reported cases, week t |
| `cases_lag_2` | numeric | Reported cases, week t-1 |
| `cases_lag_3` | numeric | Reported cases, week t-2 |
| `cases_lag_4` | numeric | Reported cases, week t-3 |
| `growth_1w` | numeric | `(lag1 - lag2) / max(lag2, 1.0)` — 1-week relative growth |
| `growth_4w` | numeric | `(lag1 - lag4) / max(lag4, 1.0)` — 4-week momentum |
| `cases_diff_1w` | numeric | `lag1 - lag2` — absolute 1-week change |
| `cases_roll_mean_2w` | numeric | Mean of lags 1–2 |
| `cases_roll_mean_4w` | numeric | Mean of lags 1–4 |
| `cases_roll_mean_8w` | numeric | Mean of up to 8 most recent lags |
| `cases_roll_std_4w` | numeric | Std dev of lags 1–4 |
| `calendar_week` | integer | ISO calendar week of target week (1–53) |
| `seasonal_historical_median` | numeric | Train-split median for this district × calendar week |
| `seasonal_ratio` | numeric | `lag1 / max(seasonal_historical_median, 1.0)` |
| `rain_lag_1–3` | numeric | Weekly precipitation (mm), weeks t through t-2 |
| `temp_lag_1–3` | numeric | Mean temperature (°C), weeks t through t-2 |
| `humidity_lag_1` | numeric | Mean relative humidity (%), week t |
| `weather_available` | boolean | Whether valid weather data was joined |

Missing values are imputed with column median (Ridge) or handled natively (HGB).

---

## 4. Prediction Outputs

Each prediction is a [`Prediction`](packages/contracts/src/prediction.schema.ts) contract document:

| Field | Description |
|---|---|
| `status` | `EMERGING` / `PERSISTENT` / `COOLING` / `STABLE` / `WITHHELD` |
| `pointForecast` | Estimated case count ≥ 0.0 (null when WITHHELD) |
| `interval` | 80% conformal prediction interval; `lower ≥ 0` always |
| `riskProbability` | Calibrated P(hotspot) ∈ [0,1]; `null` when uncalibrated |
| `confidenceStatus` | `CALIBRATED` / `UNCALIBRATED` / `NOT_AVAILABLE` |
| `qualityFlags` | Flags explaining WITHHELD or data quality issues |
| `sourceSnapshotIds` | SHA-256 hashes of raw input documents |
| `modelVersion` | Exact model identifier |

### 4.1 WITHHELD Conditions

A prediction is suppressed to `WITHHELD` when:
- `cases_lag_1` is null (current week not yet reported)
- Fewer than 4 historical observations exist for the district prior to `T`
- Model artifact is missing or SHA-256 checksum fails
- Feature schema does not match trained model's expected features

---

## 5. Evaluation (Held-Out Test Split: 2024-W27–W52)

> **Note:** These metrics are computed on synthetic data in test fixtures during Phase 3 development. Actual held-out metrics require real ingested NDCU data through 2024.

### Metric Definitions

| Metric | Definition |
|---|---|
| **MAE** | Mean absolute error on continuous case count predictions |
| **Hotspot Recall** | TP / (TP + FN) — fraction of true hotspots correctly flagged |
| **Hotspot Precision** | TP / (TP + FP) — fraction of flagged hotspots that are real |
| **Top-3 Recall** | Fraction of actual top-3 highest-burden districts appearing in predicted top-3, averaged across test weeks |
| **Brier Score** | Mean squared error on calibrated probabilities (null for baselines) |

### Baseline Comparison Gate

An ML model is designated as the recommended forecaster only if it achieves:
- MAE ≤ 0.95 × best baseline MAE, **or**
- Top-3 Recall ≥ best baseline Top-3 Recall + 0.05

If the gate fails: `outperformsBaseline = false` and the best baseline remains the primary reference. **This outcome is recorded honestly and not suppressed.**

---

## 6. Probability Calibration

**Method:** Platt scaling — univariate logistic regression on validation prediction margins `s = ŷ - τ_{a,w}`.

**Acceptance criterion:** Calibrated Brier score must be ≤ climatology Brier score on the validation set.

**Fallback:** If calibration degrades or validation set contains only one class:
- `confidenceStatus = "UNCALIBRATED"`
- `riskProbability = null`
- No probability is published

---

## 7. Prediction Intervals

**Method:** Empirical conformal prediction — 80th percentile of absolute validation residuals `δ_{0.80}`.

**Construction:**
- `lower = max(0.0, ŷ - δ_{0.80})` — never negative
- `upper = ŷ + δ_{0.80}`
- `coverage = 0.80`, `method = "conformal_residual_quantile"`

Intervals are only published when `δ` is available from a non-empty validation set.

---

## 8. Explainability

**Method:** Permutation feature importance — MAE increase when each feature is randomly shuffled on the validation set. Local attribution via weighted feature deviation from district median.

> **Mandatory disclaimer:** Feature attributions indicate **statistical association** in historical surveillance data, **not clinical or biological causation.** No causal inference is made or implied by this model.

---

## 9. Limitations & Known Risks

1. **No real 2024 data ingested yet:** The held-out test split (2024-W27–W52) will not produce meaningful evaluation metrics until NDCU data for 2024 is ingested and `dengueahead backtest` is run.
2. **Reporting delays:** NDCU typically publishes reports 1–3 weeks late. `cases_lag_1` may be null for recent weeks, forcing WITHHELD predictions in operational use.
3. **ERA5 reanalysis timing:** Historical weather features are from a reanalysis dataset that may incorporate near-real-time observations unavailable at the forecast issue date.
4. **Small sample per district-week:** Some districts have <10 historical observations for a given calendar week, causing threshold fallback to the area-wide quantile.
5. **No population normalization:** Predictions are in absolute case counts, not incidence rates. Populous districts (Colombo, Gampaha) will consistently dominate top-k rankings.
6. **No MOH-area disaggregation:** The model operates at district level. Sub-district transmission clusters are not captured.
7. **Association only:** This model identifies statistical patterns in historical surveillance data. It does not model transmission dynamics, vector populations, or individual-level risk.

---

## 10. Ethical Considerations

- **Non-clinical use only:** This system is intended for public health resource allocation and vector control dispatch guidance — not for individual patient diagnosis or treatment.
- **Fairness:** No demographic, ethnic, or socioeconomic variables are used as features. Geographic unit (district) is the only identity-proxied variable.
- **Transparency:** All model versions, training ranges, evaluation metrics, and limitations are recorded in MongoDB `model_runs` and this document.
- **Human oversight:** All predictions should be reviewed by qualified public health personnel before informing operational decisions.
- **Data sovereignty:** NDCU surveillance data belongs to Sri Lanka's Ministry of Health. Redistribution without licence confirmation is prohibited.
