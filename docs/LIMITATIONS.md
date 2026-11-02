# Limitations & Responsible Use Boundaries — DengueAhead

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Team:** EchoBinary | **Competition:** ModelX 2.0  
> **Classification:** Public Health Decision Support (Population-Level, Non-Clinical)  
> **Last Updated:** November 2026

---

## 1. Overview & Ethical Stance

DengueAhead is designed to provide actionable, evidence-based foresight for public health vector-control planning in Sri Lanka. In adherence to **Rule 6 ("No Unsupported Claims")** and **Rule 9 ("Transparent Blockers")** of the DengueAhead operating guidelines, this document transparently catalogs the operational, epidemiological, meteorological, and algorithmic boundaries of the system.

Public health tools that overstate their precision or conceal their blind spots endanger communities. The limitations outlined below are reflected directly in our user interface through explicit `WITHHELD` states, uncalibrated warnings, and non-causal driver disclosures.

---

## 2. Epidemiological & Surveillance Limitations

### 2.1 Geographic Resolution: District-Level vs. MOH-Area Granularity

- **Current Scope:** The system forecasts risk across the **25 administrative districts** of Sri Lanka (`LK-11` to `LK-92`).
- **The Limitation:** Dengue transmission is highly focal, often concentrating within specific urban wards or Medical Officer of Health (MOH) sub-districts (e.g., Colombo MC vs. Dehiwala within Colombo District).
- **Operational Reality:** Official public surveillance bulletins published weekly by the National Dengue Control Unit (NDCU) provide aggregated district totals. Machine-readable, verified weekly case feeds at the sub-district MOH level are not publicly accessible in real time. We strictly rejected synthetic spatial disaggregation per **Rule 3 ("No Simulated Success")**.

### 2.2 Reporting Lag & As-Of Latency

- **Surveillance Delays:** Official NDCU surveillance reports typically experience an operational publishing delay of 7 to 14 days following the close of an epidemiological week.
- **Impact on Forecasting:** Forward predictions issued on day $T$ rely on case reporting as of $T-7$ or $T-14$. While weather observations are real-time, surveillance momentum features incorporate this latency.
- **Fail-Safe Policy:** When reporting is delayed beyond 14 days, the platform flags `sourceFreshnessStatus: 'STALE'` and withholds numeric predictions rather than generating ungrounded estimates.

### 2.3 Under-Reporting & Asymptomatic Transmission

- **Case Definition:** Case counts reflect clinically diagnosed and hospitalized notifications received by the Ministry of Health.
- **Unobserved Infections:** Sub-clinical, mildly symptomatic, or patients seeking private outpatient care without notification are unobserved. DengueAhead models _reported clinical burden_, not total community viral transmission.

### 2.4 Viral Serotype Shifts & Genomic Blindness

- Dengue epidemiology in Sri Lanka is heavily modulated by serotype replacements (e.g., historical transitions between DENV-1, DENV-2, and DENV-3), which alter population herd immunity.
- DengueAhead operates solely on surveillance counts and meteorological features; it possesses **zero genomic or serological surveillance inputs**. A sudden outbreak caused by the introduction of a novel serotype cannot be anticipated purely through weather and autoregressive patterns.

---

## 3. Meteorological & Environmental Limitations

### 3.1 Spatial Aggregation & Microclimates

- **Centroid Sampling:** Weather variables (precipitation, temperature, humidity) are extracted from Open-Meteo ERA5 reanalysis based on district geometric centroids.
- **Topographic Complexity:** In mountainous districts such as Nuwara Eliya (`LK-23`) and Kandy (`LK-21`), elevation changes create microclimates where valley rainfall differs dramatically from ridge rainfall. Centroid aggregates provide a smoothed approximation.

### 3.2 Precipitation Dynamics: Flushing vs. Stagnation

- The model measures total weekly rainfall ($mm$).
- In vector biology, rainfall patterns matter as much as volume: a sudden $150\text{mm}$ tropical storm can flush larvae out of drains (suppressing mosquito populations), whereas $20\text{mm}$ of intermittent daily drizzle creates stagnant pools ideal for _Aedes aegypti_ breeding. Aggregate weekly totals cannot fully distinguish torrential flushing from puddle formation.

---

## 4. Algorithmic & Modeling Limitations

### 4.1 Extreme Outbreak Under-Prediction

- Tree-based gradient boosting models (HistGradientBoosting) predict output values bounded by the leaves observed during training.
- In unprecedented mega-outbreaks (e.g., case counts surpassing historical maximums by $>50\%$), the model will correctly flag the risk status as `EMERGING`, but will underestimate the absolute numeric peak. Conformal prediction intervals widen accordingly to communicate this uncertainty.

### 4.2 Probability Calibration Boundaries

- Platt scaling calibration was fit on the 2024 validation split.
- During low-incidence inter-epidemic periods or prolonged dry seasons, the empirical event rate is near zero. In these regimes, probability calibration breaks down. The platform explicitly sets `confidenceStatus: 'UNCALIBRATED'`, suppresses numeric probabilities, and presents relative risk ranks instead.

### 4.3 Feature Drivers are Non-Causal Associations

- The feature importance drivers displayed in the Area Detail view reflect model decision weights (e.g., split importance of 3-week cumulative rainfall and temperature lags).
- **These are statistical associations, not biological causal proofs.** High temperature and rainfall correlate with dengue, but intervening directly on these drivers (or misinterpreting local correlations) does not substitute for on-the-ground epidemiological investigation.

---

## 5. Non-Clinical & Operational Use Boundaries

> [!CAUTION]
> **DengueAhead is not a medical device and is not licensed for clinical diagnosis, patient triage, or healthcare prescription.**

1. **Intended Users:** Regional Medical Officers (RMOs), Public Health Inspectors (PHIs), and municipal vector-control coordinators.
2. **Decision Scope:** Planning preventative larval site inspections, scheduling community awareness campaigns, and prepositioning vector-control supplies 7 to 14 days in advance.
3. **Mandatory Human-in-the-Loop:** Predictions must never autonomously trigger chemical insecticide spraying or resource reallocations without review and sign-off by a qualified public health official.
