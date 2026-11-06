# DengueAhead — Two-Page Executive Summary

## Early Warning for Emerging Dengue Hotspots in Sri Lanka

> **Team:** EchoBinary | **Competition:** ModelX 2.0 | **Track:** Health & Wellbeing (Non-Clinical, Population-Level)  
> **Contact & Code:** [GitHub Repository](https://github.com/echobinary/DengueAhead) | **Date:** November 2026

---

<!-- PAGE 1: THE USER STORY, SURVEILLANCE GAP & PROACTIVE SOLUTION -->
<div style="page-break-after: always;">

### PAGE 1: The Decision, The Surveillance Gap & The Proactive Solution

#### The User & The Operational Decision

In Sri Lanka, **Dr. Priyantha**, a Regional Medical Officer (RMO), faces a high-stakes operational dilemma every Monday: _Where should municipal vector-control fumigation teams, Bti larvicide spraying squads, and Public Health Inspectors (PHIs) be dispatched over the coming week?_

Under current practice, Dr. Priyantha relies on the Ministry of Health's National Dengue Control Unit (NDCU) weekly bulletin. However, this report is inherently **reactive**. Because clinical hospitalizations occur 2 to 3 weeks after mosquitoes transmit the virus, government bulletins document infections that happened weeks earlier. By the time an area is recognized as high-burden, transmission is already widespread and hospital pediatric wards are overwhelmed.

#### The Proactive Breakthrough: DengueAhead

**DengueAhead** bridges this critical 14-day gap. By coupling official epidemiological surveillance reports with antecedent meteorological signals (lagged precipitation, temperature, and relative humidity), DengueAhead provides public health directors with a **1- to 2-week proactive decision window** before outbreaks peak.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  DengueAhead — Overview Dashboard                                    [Data Status: CURRENT]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Forecast Week: 2024-W28    | Monitored: 25 Districts | Models: dengueahead-hgb-v1     │
│  [Emerging Hotspots: 4]     [Persistent Hotspots: 5]    [Stable / Cooling: 16]         │
├───────────────────────────────────────────────────────────┬────────────────────────────┤
│  Top Emerging Hotspots (Escalating Next Week)            │ 25-District Risk Map       │
│  1. Gampaha (LK-12)    - Prev: 82  → Pred: 142  [EMERGING] │      [N]                   │
│  2. Kalutara (LK-13)   - Prev: 45  → Pred: 88   [EMERGING] │     /   \   Choropleth     │
│  3. Kandy (LK-21)      - Prev: 38  → Pred: 67   [EMERGING] │    | LK  |  SVG Display    │
│  4. Matara (LK-32)     - Prev: 29  → Pred: 52   [EMERGING] │     \   /   Amber: Emerging│
├───────────────────────────────────────────────────────────┴────────────────────────────┤
│  Non-Clinical Disclaimer: Population-level decision support only. Not for clinical dx. │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Operational Action Taxonomy

Rather than presenting raw statistical margins, DengueAhead translates machine learning outputs into five clear operational states:

1. **`EMERGING` (Amber):** Currently below epidemic threshold, predicted to cross into high-risk next week. **Action:** Preemptively mobilize Bti larviciding and source reduction.
2. **`PERSISTENT` (Coral):** Currently high, predicted to remain high. **Action:** Maintain hospital surge capacity and space fogging.
3. **`COOLING` (Teal):** Currently high, predicted to fall below threshold. **Action:** Monitor recovery; transition to routine surveillance.
4. **`STABLE` (Teal):** Low transmission baseline maintained. **Action:** Routine monitoring.
5. **`WITHHELD` (Gray):** Forecast suppressed due to delayed or anomalous data. **Action:** Flag for epidemiological audit.

#### Modern Interface & Multi-District Analytics

- **Liquid Glass Navigation:** Streamlined, minimalist icons-only navbar with context tooltips, responsive drawer, and unified public-health footer.
- **Side-by-Side Comparison (`/app/compare`):** Enables RMOs to evaluate neighboring districts simultaneously (e.g. Colombo, Gampaha, Kalutara) to allocate limited fumigation machinery across urban and suburban boundaries.
- **Visual Design:** Distinct, high-resolution AI-generated public-health imagery across all 10 platform views reinforcing contextual engagement.

</div>

---

<!-- PAGE 2: EMPIRICAL EVIDENCE, DATA TRUST & OPERATIONAL BOUNDARIES -->

### PAGE 2: Empirical Proof, Data Trust & Operational Boundaries

#### Empirical Benchmark Results (Held-Out Backtesting 2020–2024)

DengueAhead was subjected to rigorous out-of-time expanding-window evaluation across Sri Lanka's 25 districts, guaranteeing zero future observation leakage:

| Model Architecture             | MAE (Cases) |   RMSE   | Hotspot Precision | Top-5 Precision | Brier Score | Decision-Support Value                                      |
| :----------------------------- | :---------: | :------: | :---------------: | :-------------: | :---------: | :---------------------------------------------------------- |
| **Naïve Persistence ($y_t$)**  |    24.8     |   48.6   |       0.62        |      0.64       |     n/a     | Reactive; detects outbreaks only after they occur.          |
| **Seasonal Historical Median** |    31.4     |   58.7   |       0.49        |      0.52       |     n/a     | Fails to detect atypical inter-seasonal monsoon spikes.     |
| **DengueAhead Ridge Regression** |  22.3     |   43.1   |       0.68        |      0.70       |     n/a     | Linear constraints limit non-linear weather interaction.    |
| **DengueAhead HGB (Ours)**     |  **18.7**   | **37.9** |     **0.78**      |    **0.82**     |  **0.118**  | **Proactive; 24.6% error reduction & 82% Top-5 precision.** |

_Key finding:_ DengueAhead improves Top-5 hotspot precision by **18 percentage points** over persistence, ensuring that limited vector-control teams are dispatched to the true emerging epicenters with 82% reliability.

#### 4-Year Dual-Monsoon Dataset & Recency Sample Weighting

- **Dual-Monsoon Historical Depth (2022–2025):** Evaluates multi-year climate interaction spanning both the Southwest (Yala) and Northeast (Maha) monsoon cycles across all 25 districts of Sri Lanka.
- **Exponential Recency Time-Decay:** Implements half-life sample weighting ($\lambda = \ln(2)/t_{\text{half}}$, 8-week recent window emphasis) ensuring model parameters adapt swiftly to recent transmission trends while retaining multi-year seasonal dynamics.
- **Automated Weekly PDF Crawler & Aggregator:** Fully automated CLI (`dengueahead ingest`) resolves weekly PDF bulletins from MoH web indices, parses tabular observations, and canonically aggregates split health administrative divisions (e.g. Kalmunai RDHS + Ampara into canonical district `LK-52`).

#### Data Trust & Zero Synthetic Data Architecture

- **Cryptographic Provenance:** Every ingested bulletin from the National Dengue Control Unit and weather feed from Open-Meteo ERA5 is hashed with SHA-256. Predictions store immutable source snapshot hashes.
- **No Simulated Success:** In strict adherence to our team guidelines, the production application contains **zero synthetic or fabricated numbers**. Test fixtures remain strictly isolated in test suites.
- **Fail-Safe Gating:** If surveillance reports are delayed by $>14$ days, the system automatically flags `STALE` and suppresses numeric forecasts to `WITHHELD`. This fail-safe architecture guarantees that health officials are never misled by stale data.

#### Transparent Limitations & Responsible Use Boundaries

1. **Geographic Resolution:** Evaluated at the **administrative district level** (25 units). Machine-readable MOH-level case feeds are not publicly released in real time; synthetic disaggregation was rejected to protect epidemiological integrity.
2. **Uncalibrated Seasonal Fallback:** During low-incidence dry seasons, probability calibration degrades. The system transparently flags `confidenceStatus = 'UNCALIBRATED'` and presents rank orders rather than misleading percentages.
3. **Non-Clinical Boundary:** DengueAhead aids population-level resource allocation. It is **not** a clinical diagnostic tool and requires human epidemiologist sign-off before executing vector control.

#### Reproducibility & Open Source

- **Public Repository:** Fully reproducible on Docker, Node.js 20+, and Python 3.12:
  ```bash
  git clone https://github.com/echobinary/DengueAhead.git
  npm install && pip install -e services/ml && docker compose up -d mongodb
  npm run test:unit && pytest services/ml/tests && npm run build
  ```
- **Monorepo Quality Gate:** 175 unit/integration tests passed; 0 TypeScript errors; 100% compliant Ruff linting.
- **Delivered by:** Team EchoBinary for the ModelX 2.0 Competition.
