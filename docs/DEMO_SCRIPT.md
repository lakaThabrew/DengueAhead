# Three-Minute Video Demo Script & Storyboard — DengueAhead

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Team:** EchoBinary | **Competition:** ModelX 2.0 | **Track:** Health & Wellbeing (Population-Level, Non-Clinical)  
> **Target Duration:** Exactly 180 seconds (3:00 max)  
> **Format:** Synchronized 1080p60 screen recording + voiceover narration  
> **Date:** November 2026  
> **Repository:** [https://github.com/echobinary/DengueAhead](https://github.com/echobinary/DengueAhead)

---

## 1. Video Overview & Production Guidelines

- **Maximum Allowed Length:** 180 seconds (3:00).
- **Target Video Resolution:** 1920 × 1080 (1080p, 60fps).
- **Tone:** Professional, scientifically rigorous, objective, public-health focused.
- **Rule Strictness:** Zero simulated data on production routes. Every screen recorded reflects live API data, genuine historical backtests across 4-year dual-monsoon cycles (2022–2025), and immutable SHA-256 data provenance.
- **Visual Aesthetic:** Liquid glass modern UI, responsive drawer, icons-only minimalist navigation, and custom high-resolution public health imagery across all views.

```mermaid
timeline
    title 180-Second Video Storyboard Flow
    0:00 - 0:20 : The User & The Proactive Window (Landing Page & Overview)
    0:20 - 0:45 : Automated PDF Crawler, Recency Weighting & Cryptographic Provenance
    0:45 - 1:20 : Next-Week Risk Map & District Drilldown (Gampaha LK-12)
    1:20 - 1:45 : Multi-District Comparative Analytics (/app/compare)
    1:45 - 2:15 : Historical Replay & Baseline Comparison (/app/history)
    2:15 - 2:35 : Empirical Evaluation, HGB Model Card & Transparent Limitations
    2:35 - 2:50 : Chaos Ingestion & Fail-Safe Withheld Gating
    2:50 - 3:00 : Summary, Open Source & Team EchoBinary
```

---

## 2. Second-by-Second Demo Script & Storyboard

### Segment 1: The Problem & The Decision Window (0:00 – 0:20 | 20 seconds)

- **Screen View:** Landing Page (`http://localhost:5173/`) $\to$ Smooth scroll past Hero Command Center $\to$ Click "Explore Risk Map" $\to$ Overview Dashboard (`/app/overview`).
- **Visual Action:**
  - Cursor highlights the prominent Non-Clinical Safety Disclaimer banner.
  - Hover over the Headline: *"See the next hotspot before it emerges."*
  - Click the CTA button. The modern liquid glass navigation smoothly highlights the active Overview view.
  - Show the 6 summary KPI cards and Top Emerging Hotspots table.
- **Spoken Narration (47 words | ~140 wpm):**
  > *"In Sri Lanka, dengue surveillance is traditionally reactive. By the time hospitalizations peak in weekly health bulletins, transmission happened weeks earlier. DengueAhead gives Regional Medical Officers a 1- to 2-week proactive decision window to deploy vector control before clinical outbreaks emerge. Let's see how it works."*
- **Key Proof Shown:** Prominent non-clinical advisory; liquid glass UI; operational state cards (`EMERGING`, `PERSISTENT`, `COOLING`, `STABLE`).

---

### Segment 2: Data Provenance, Automated Crawler & Recency Weights (0:20 – 0:45 | 25 seconds)

- **Screen View:** Data Quality Page (`/app/data-quality`) $\to$ Split terminal showing automated ingestion CLI:
  `dengueahead ingest --source ndcu-weekly --year 2026 --week 44` $\to$ `dengueahead audit-sources`.
- **Visual Action:**
  - On `/app/data-quality`, highlight the Source Manifest table: `ndcu-weekly` (MoH Sri Lanka) and `open-meteo-daily` (ERA5 climate reanalysis).
  - Zoom into SHA-256 cryptographic integrity hashes, zero-synthetic audit badge, and last observed timestamps.
  - Split screen with terminal: execute the automated NDCU weekly bulletin crawler. Show the crawler automatically discovering the PDF bulletin from the MoH index, extracting tabular data, and canonically aggregating health divisions (e.g. Kalmunai RDHS + Ampara into canonical district `LK-52`).
  - Terminal briefly highlights the training engine utilizing exponential recency time-decay sample weighting (prioritizing the most recent 8 weeks while leveraging 4 full years of dual-monsoon historical data).
- **Spoken Narration (62 words | ~148 wpm):**
  > *"DengueAhead is grounded in verified real-world data: weekly bulletins from the National Dengue Control Unit and lagged weather reanalysis from Open-Meteo. Our automated crawler parses official weekly PDF reports, aggregates regional health divisions into canonical districts, and hashes every raw payload with SHA-256. Models train across four years of dual-monsoon history with exponential recency weighting—strictly zero simulated numbers."*
- **Key Proof Shown:** Automated PDF ingestion; Kalmunai RDHS canonical aggregation; SHA-256 hashes; recency weighting; zero-synthetic-data guarantee.

---

### Segment 3: Next-Week Risk Map & District Drilldown (0:45 – 1:20 | 35 seconds)

- **Screen View:** 25-District Risk Map (`/app/map`) $\to$ Filter by "Emerging" $\to$ Click Gampaha (`LK-12`) $\to$ Area Detail Page (`/app/areas/LK-12`).
- **Visual Action:**
  - Interactive SVG choropleth map displays all 25 administrative districts color-coded by operational status.
  - Click the "EMERGING" state filter chip: the map isolates 4 escalating districts.
  - Click on Gampaha District (`LK-12`).
  - On the District Detail view, trace the SVG Time-Series Chart showing observed case history (solid blue), seasonal epidemic threshold (dotted gray line), point forecast (dashed orange line), and the 80% split conformal prediction band (shaded amber).
  - Scroll down to the Feature Importance Drivers panel (showing 3-week cumulative rainfall and minimum temperature lags) and highlight the non-causal statistical correlation disclaimer.
- **Spoken Narration (85 words | ~145 wpm):**
  > *"On our Risk Map, all 25 districts are mapped to actionable operational states. Filtering for 'Emerging' isolates four districts currently below epidemic levels but predicted to escalate next week. Drilling into Gampaha, our time-series chart contrasts historical cases against next week's forecast of 142 cases, bounded by an 80% conformal uncertainty interval. Below, feature drivers show that 3-week cumulative rainfall and rising minimum temperatures are driving this elevation—interpreted strictly as non-causal statistical associations to guide larval site inspections."*
- **Key Proof Shown:** Interactive SVG choropleth map; conformal prediction interval (bounded $\ge 0$); feature drivers with explicit non-causal disclaimer.

---

### Segment 4: Multi-District Comparative Analytics (1:20 – 1:45 | 25 seconds)

- **Screen View:** Comparative Analytics Page (`/app/compare`).
- **Visual Action:**
  - Navigate to Compare view via liquid glass navigation.
  - Select Colombo (`LK-11`), Gampaha (`LK-12`), and Kalutara (`LK-13`) for side-by-side comparison.
  - Show the comparative metric matrix: current incidence vs. forecasted next-week delta, 3-week cumulative rainfall anomalies, and prioritized operational action tags.
  - Cursor highlights how RMOs can balance intervention squads between high-volume urban centers (`LK-11`) and fast-accelerating suburban corridors (`LK-12`).
- **Spoken Narration (58 words | ~140 wpm):**
  > *"In our Multi-District Comparison view, health planners evaluate high-risk regions side-by-side. Comparing Western Province neighbors—Colombo, Gampaha, and Kalutara—reveals differing transmission velocities and localized rainfall anomalies. This allows regional directors to optimize vector-control logistics, prepositioning larvicide in emerging hotspots while maintaining space-spraying equipment in persistently high-burden municipal zones."*
- **Key Proof Shown:** Multi-district side-by-side comparison; synchronized URL query params; public-health resource allocation matrix.

---

### Segment 5: Historical As-Of Replay & Baseline Comparison (1:45 – 2:15 | 30 seconds)

- **Screen View:** Historical Replay Page (`/app/history`).
- **Visual Action:**
  - Select historical cutoff week `2024-W22` from the calendar selector.
  - Show the forecast state as it existed at that exact moment in time, with actual cases hidden to simulate real-time operations.
  - Cursor moves to the "Reveal Actual Outcome" button.
  - Click "Reveal Actual Outcome": the actual observed curve animates onto the chart, aligning precisely with the prediction interval.
  - Highlight the baseline comparison cards showing DengueAhead HGB outperforming both the 2-week persistence baseline and the 4-week rolling mean.
- **Spoken Narration (75 words | ~150 wpm):**
  > *"To verify that our models generalize without future data leakage, Historical Replay evaluates forecasts strictly as of past calendar cutoffs. Here at Week 22 of 2024, DengueAhead flagged an impending post-monsoon surge in the Western Province while cases were still low. Revealing actual outcomes demonstrates how the model anticipated the surge two weeks in advance, outperforming both persistence and seasonal baselines to give field teams critical lead time."*
- **Key Proof Shown:** Strict out-of-time evaluation; interactive "Reveal Actual Outcome" mechanism; baseline benchmarking.

---

### Segment 6: Empirical Evaluation, Model Card & Transparent Limitations (2:15 – 2:35 | 20 seconds)

- **Screen View:** Model Card & Evaluation Page (`/app/model`).
- **Visual Action:**
  - Display the Model Card for `dengueahead-hgb-v1`.
  - Highlight the empirical benchmark table: **24.6% MAE reduction** ($18.7$ vs $24.8$ cases) and **82% Top-5 Precision** across Sri Lanka's 25 districts.
  - Show the Platt calibration curve and Brier score ($0.118$).
  - Expand the "Known Limitations" accordion: highlight district-level resolution boundaries, uncalibrated dry-season fallbacks, and non-clinical use restrictions.
- **Spoken Narration (52 words | ~155 wpm):**
  > *"Our Model Card documents rigorous empirical performance across four years of backtesting. HistGradientBoosting achieves a 24.6% error reduction over persistence, with 82% precision in identifying Top-5 hotspots. But we are transparent about limitations: predictions are district-level, and probabilities in low-incidence dry seasons safely degrade to uncalibrated ranks."*
- **Key Proof Shown:** Empirical benchmark metrics table; Platt calibration curve; transparent limitations accordion.

---

### Segment 7: Chaos Ingestion, Fail-Safe Withheld Gating & Conclusion (2:35 – 3:00 | 25 seconds)

- **Screen View:** Terminal simulating stale feed $\to$ Overview Dashboard (`/app/overview`) $\to$ Clean GitHub Repository (`README.md`) $\to$ Team EchoBinary Title Slide.
- **Visual Action:**
  - Terminal injects delayed feed (>14 days stale). Refresh dashboard: prominent Amber Alert Banner appears: *"Source data is STALE (>14 days)"*.
  - District cards immediately transition to `WITHHELD` status with numeric forecasts safely suppressed to `null`.
  - Smooth cut to the public GitHub repository: highlight green CI badge, 175 passing tests, full documentation suite, and Docker one-command quickstart.
  - Final transition to Team EchoBinary ModelX 2.0 slide.
- **Spoken Narration (58 words | ~140 wpm):**
  > *"True public-health reliability means failing safely. When data feeds are delayed beyond 14 days, DengueAhead raises a staleness alarm and suppresses numeric forecasts to 'WITHHELD'—preventing guesswork. DengueAhead delivers proactive foresight, cryptographic provenance, and transparent AI intelligence. Explore our open-source codebase on GitHub. We are Team EchoBinary for ModelX 2.0. Thank you."*
- **Key Proof Shown:** Fail-safe `WITHHELD` gating; staleness alert banner; 175 passing tests; open-source GitHub repository.

---

## 3. Total Timing & Word Count Verification

| Segment | Topic / Screen View | Allocated Time | Word Count | Speaking Pace |
| :---: | :--- | :---: | :---: | :---: |
| **1** | Problem, Decision Window & Landing Page | 0:00 – 0:20 (20s) | 47 words | ~141 wpm |
| **2** | Provenance, Automated Crawler & Recency Weights | 0:20 – 0:45 (25s) | 62 words | ~148 wpm |
| **3** | 25-District Risk Map & Gampaha Drilldown | 0:45 – 1:20 (35s) | 85 words | ~145 wpm |
| **4** | Multi-District Comparative Analytics (`/app/compare`) | 1:20 – 1:45 (25s) | 58 words | ~140 wpm |
| **5** | Historical As-Of Replay (`2024-W22`) & Reveal Outcome | 1:45 – 2:15 (30s) | 75 words | ~150 wpm |
| **6** | Model Card, Empirical Benchmark & Limitations | 2:15 – 2:35 (20s) | 52 words | ~156 wpm |
| **7** | Chaos Ingestion, Fail-Safe Withholding & Open Source | 2:35 – 3:00 (25s) | 58 words | ~139 wpm |
| **Total** | **Full DengueAhead Demonstration** | **180 seconds (3:00)** | **437 words** | **~145 wpm (Target: 140–150 wpm)** |

---

## 4. Live Recording & Rehearsal Checklist

### Pre-Recording Setup:
- [ ] **MongoDB Container Running:** Ensure local Docker MongoDB contains full 4-year dual-monsoon historical seed data:
  ```bash
  docker compose up -d mongodb
  ```
- [ ] **Express REST API Running:** Verify backend is live on port 4000:
  ```bash
  npm run dev:api
  ```
- [ ] **React Web Application Running:** Verify frontend is live on port 5173:
  ```bash
  npm run dev:web
  ```
- [ ] **Pre-test Test Suites:** Verify zero test failures across the monorepo:
  ```bash
  npm run typecheck && npm run test:unit && pytest services/ml/tests
  ```
- [ ] **Display Setup:** Set browser resolution to 1920 × 1080 (1080p, 100% zoom). Hide browser bookmark bar and disable browser extension popups.
- [ ] **Audio Setup:** High-fidelity external microphone, 48 kHz 24-bit recording, pop-filter equipped, noise floor < -50 dB.

### Rehearsal Pacing & Action Prompts:
1. **0:00:** Start on `http://localhost:5173/`. Point to non-clinical banner. Click "Explore Risk Map".
2. **0:20:** Navigate to `/app/data-quality`. Open split terminal. Run:
   ```bash
   dengueahead ingest --source ndcu-weekly --year 2026 --week 44
   dengueahead audit-sources
   ```
3. **0:45:** Navigate to `/app/map`. Click "EMERGING". Click "Gampaha (`LK-12`)". Show conformal interval.
4. **1:20:** Click "Compare" in navbar (`/app/compare`). Select Colombo, Gampaha, Kalutara.
5. **1:45:** Click "Historical Replay" (`/app/history`). Select `2024-W22`. Click "Reveal Actual Outcome".
6. **2:15:** Click "Model Card" (`/app/model`). Highlight benchmark table (24.6% MAE reduction). Expand limitations.
7. **2:35:** Run terminal test simulating stale data. Refresh `/app/overview`. Show `WITHHELD` status chip and amber alert banner.
8. **2:50:** Switch to GitHub README and Team EchoBinary closing slide.
9. **3:00:** Conclude recording cleanly at 03:00.00.


---

## 5. Dedicated Voiceover & Teleprompter Audio Recording Scripts

This section provides a **direct teleprompter voiceover guide** for recording your narration audio track. Each part includes exact start/end timestamps, target duration, on-screen cues, vocal delivery directions (pitch, pauses, emphasis), phonetic pronunciations, and verbatim script lines.

### 🎙️ Audio Recording Guidelines
- **Delivery Style:** Confident, objective, scientifically grounded, calm public-health authority.
- **Pacing:** Moderate (~140 to 150 words per minute). Never rush; let pauses align with screen transitions.
- **Audio Spec:** 48,000 Hz, 24-bit WAV, Mono/Stereo, -16 LUFS integrated loudness.

---

### Part 1: The Problem & The Decision Window
- **Timecode:** `0:00 – 0:20` (Total: 20 seconds)
- **Word Count:** 47 words (~141 wpm)
- **Screen View:** Landing Page (`http://localhost:5173/`) $	o$ Smooth scroll past Hero Command Center $	o$ Click "Explore Risk Map" $	o$ Overview Dashboard (`/app/overview`).
- **Synchronized Visual Action:**
  - `0:00 - 0:05`: Mouse cursor hovers briefly over the **Non-Clinical Safety Disclaimer** banner at the top of the landing page.
  - `0:05 - 0:11`: Scroll gently to the headline *"See the next hotspot before it emerges"*.
  - `0:11 - 0:15`: Click the primary CTA button **"Explore Risk Map"**. Liquid glass navigation lights up.
  - `0:15 - 0:20`: Overview dashboard loads, revealing the 6 KPI metric cards and Top Emerging Hotspots table.
- **Vocal Delivery:** Empathetic yet serious opening. Moderate pace. Crisp diction.
- **Phonetics:** *DengueAhead* = `"Deng-gay-a-head"` | *Surveillance* = `"Ser-VAY-lance"`
- **Verbatim Audio Script:**
  > *"In Sri Lanka, dengue surveillance is traditionally **reactive**. [PAUSE 0.5s]*  
  > *By the time hospitalizations peak in weekly health bulletins, transmission happened **weeks earlier**. [PAUSE 0.5s]*  
  > *DengueAhead gives Regional Medical Officers a **one- to two-week proactive decision window** to deploy vector control before clinical outbreaks emerge. [PAUSE 0.5s]*  
  > *Let's see how it works."*

---

### Part 2: Automated Crawler, Recency Weights & Provenance
- **Timecode:** `0:20 – 0:45` (Total: 25 seconds)
- **Word Count:** 62 words (~148 wpm)
- **Screen View:** Data Quality Page (`/app/data-quality`) $	o$ Split terminal running ingestion CLI.
- **Synchronized Visual Action:**
  - `0:20 - 0:26`: On `/app/data-quality`, mouse highlights the Source Manifest entries: `ndcu-weekly` (MoH Sri Lanka) and `open-meteo-daily` (ERA5).
  - `0:26 - 0:31`: Cursor zooms into the SHA-256 cryptographic hash pills and the zero-synthetic audit badge.
  - `0:31 - 0:38`: Split screen with terminal. Show `dengueahead ingest --source ndcu-weekly --year 2026 --week 44` discovering the MoH PDF bulletin and aggregating Kalmunai RDHS + Ampara into `LK-52`.
  - `0:38 - 0:45`: Terminal highlights `compute_recency_weights` (8-week half-life exponential decay) across 4 years of historical data.
- **Vocal Delivery:** Technical, precise, confident. Emphasize data integrity and zero synthetic data.
- **Phonetics:** *Kalmunai* = `"Kal-MOO-nye"` | *Ampara* = `"UHM-pa-ra"` | *SHA-256* = `"Shah-Two-Fifty-Six"` | *ERA5* = `"Ee-Ar-Ay-Five"`
- **Verbatim Audio Script:**
  > *"DengueAhead is grounded in verified, real-world data: [PAUSE 0.3s] weekly bulletins from the National Dengue Control Unit and lagged weather reanalysis from Open-Meteo. [PAUSE 0.5s]*  
  > *Our automated crawler parses official weekly PDF reports, aggregates regional health divisions into canonical districts, and hashes every raw payload with **SHA-256**. [PAUSE 0.5s]*  
  > *Models train across **four years** of dual-monsoon history with exponential recency weighting—**strictly zero simulated numbers**."*

---

### Part 3: 25-District Risk Map & District Drilldown
- **Timecode:** `0:45 – 1:20` (Total: 35 seconds)
- **Word Count:** 85 words (~145 wpm)
- **Screen View:** 25-District Risk Map (`/app/map`) $	o$ Click "EMERGING" filter $	o$ Select Gampaha (`LK-12`) $	o$ Area Detail Page (`/app/areas/LK-12`).
- **Synchronized Visual Action:**
  - `0:45 - 0:52`: Navigate to `/app/map`. 25-district SVG choropleth map displays operational colors.
  - `0:52 - 0:58`: Click the "EMERGING" status filter chip. Map isolates 4 escalating districts in amber.
  - `0:58 - 1:04`: Click on Gampaha District (`LK-12`). Smooth transition to Area Detail view.
  - `1:04 - 1:12`: Cursor traces the SVG Time-Series Chart: solid blue (past cases), dotted line (seasonal epidemic threshold), dashed orange (142 case forecast), and amber shaded band (80% conformal interval).
  - `1:12 - 1:20`: Scroll to the Feature Drivers panel. Highlight 3-week rainfall and temperature bars; point to the non-causal disclaimer.
- **Vocal Delivery:** Analytical, explanatory, steady cadence. Keep tone measured when explaining uncertainty bounds and non-causal drivers.
- **Phonetics:** *Gampaha* = `"GUM-pa-ha"` (`LK-12`) | *Conformal* = `"Con-FOR-mal"` | *Larval* = `"LAR-vuhl"`
- **Verbatim Audio Script:**
  > *"On our Risk Map, all twenty-five districts are mapped to actionable operational states. [PAUSE 0.4s]*  
  > *Filtering for 'Emerging' isolates four districts currently below epidemic levels but predicted to escalate next week. [PAUSE 0.5s]*  
  > *Drilling into Gampaha, our time-series chart contrasts historical cases against next week's forecast of **142 cases**, bounded by an **eighty percent conformal uncertainty interval**. [PAUSE 0.5s]*  
  > *Below, feature drivers show that three-week cumulative rainfall and rising minimum temperatures are driving this elevation—interpreted strictly as **non-causal statistical associations** to guide larval site inspections."*

---

### Part 4: Multi-District Comparative Analytics
- **Timecode:** `1:20 – 1:45` (Total: 25 seconds)
- **Word Count:** 58 words (~140 wpm)
- **Screen View:** Comparative Analytics Page (`/app/compare`).
- **Synchronized Visual Action:**
  - `1:20 - 1:25`: Click "Compare" in the liquid glass navbar (`/app/compare`).
  - `1:25 - 1:33`: Select Colombo (`LK-11`), Gampaha (`LK-12`), and Kalutara (`LK-13`). The comparison matrix populates instantly.
  - `1:33 - 1:40`: Cursor highlights side-by-side metric tiles: current vs forecasted weekly case delta and 3-week rainfall anomaly indicators.
  - `1:40 - 1:45`: Hover over operational recommendation chips showing tailored interventions across urban and suburban zones.
- **Vocal Delivery:** Strategic, decision-oriented, practical public-health perspective.
- **Phonetics:** *Kalutara* = `"KA-loo-ta-ra"` (`LK-13`) | *Bti* = `"Bee-Tee-Eye"` | *Larvicide* = `"LAR-vi-side"`
- **Verbatim Audio Script:**
  > *"In our Multi-District Comparison view, health planners evaluate high-risk regions side-by-side. [PAUSE 0.4s]*  
  > *Comparing Western Province neighbors—Colombo, Gampaha, and Kalutara—reveals differing transmission velocities and localized rainfall anomalies. [PAUSE 0.5s]*  
  > *This allows regional directors to optimize vector-control logistics, prepositioning larvicide in emerging hotspots while maintaining space-spraying equipment in persistently high-burden municipal zones."*

---

### Part 5: Historical As-Of Replay & Baseline Comparison
- **Timecode:** `1:45 – 2:15` (Total: 30 seconds)
- **Word Count:** 75 words (~150 wpm)
- **Screen View:** Historical Replay Page (`/app/history`).
- **Synchronized Visual Action:**
  - `1:45 - 1:52`: Navigate to `/app/history`. Select cutoff week `2024-W22` from the calendar dropdown.
  - `1:52 - 1:58`: Show the chart in "blinded" state: the forecast curve is visible, but actual future cases are concealed to simulate live operations.
  - `1:58 - 2:05`: Cursor hovers over and clicks the green button **"Reveal Actual Outcome"**.
  - `2:05 - 2:10`: The actual observed case trajectory animates onto the chart, tracking snugly within the model's conformal interval.
  - `2:10 - 2:15`: Highlight the baseline comparison cards below the chart, showing DengueAhead beating persistence and 4-week rolling mean.
- **Vocal Delivery:** Engaging, clear, triumphant yet grounded proof of empirical validity.
- **Phonetics:** *Out-of-time* = `"Out-of-time"` | *Monsoon* = `"Mon-SOON"` | *Preposition* = `"Pree-po-ZISH-un"`
- **Verbatim Audio Script:**
  > *"To verify that our models generalize without future data leakage, Historical Replay evaluates forecasts **strictly as of past calendar cutoffs**. [PAUSE 0.4s]*  
  > *Here at Week 22 of 2024, DengueAhead flagged an impending post-monsoon surge in the Western Province while cases were still low. [PAUSE 0.5s]*  
  > *Revealing actual outcomes demonstrates how the model anticipated the surge **two weeks in advance**, outperforming both persistence and seasonal baselines to give field teams critical lead time."*

---

### Part 6: Empirical Evaluation & Transparent Limitations
- **Timecode:** `2:15 – 2:35` (Total: 20 seconds)
- **Word Count:** 52 words (~156 wpm)
- **Screen View:** Model Card & Evaluation Page (`/app/model`).
- **Synchronized Visual Action:**
  - `2:15 - 2:21`: Navigate to `/app/model`. Display the Model Card header for `dengueahead-hgb-v1`.
  - `2:21 - 2:27`: Highlight the benchmark results table: cursor highlights the **24.6% MAE reduction** ($18.7$ vs $24.8$) and **82% Top-5 Precision**.
  - `2:27 - 2:31`: Briefly show the Platt Sigmoid calibration curve and Brier score ($0.118$).
  - `2:31 - 2:35`: Expand the "Known Limitations" accordion: hover over district-level resolution and dry-season uncalibrated fallbacks.
- **Vocal Delivery:** Authoritative, transparent, scientifically honest.
- **Phonetics:** *HistGradientBoosting* = `"Hist-Gradient-Boosting"` | *MAE* = `"M-A-E"` | *Precision* = `"Pre-SIZH-un"`
- **Verbatim Audio Script:**
  > *"Our Model Card documents rigorous empirical performance across four years of backtesting. [PAUSE 0.3s]*  
  > *HistGradientBoosting achieves a **24.6% error reduction** over persistence, with **82% precision** in identifying Top-5 hotspots. [PAUSE 0.4s]*  
  > *But we are transparent about limitations: predictions are district-level, and probabilities in low-incidence dry seasons safely degrade to **uncalibrated ranks**."*

---

### Part 7: Chaos Ingestion, Fail-Safe Withheld Gating & Conclusion
- **Timecode:** `2:35 – 3:00` (Total: 25 seconds)
- **Word Count:** 58 words (~139 wpm)
- **Screen View:** Terminal stale-data simulation $	o$ Overview Dashboard (`/app/overview`) with alert $	o$ GitHub Repository (`README.md`) $	o$ Team EchoBinary Slide.
- **Synchronized Visual Action:**
  - `2:35 - 2:41`: Terminal simulates stale data (>14 days). Refresh `/app/overview`: prominent amber banner appears: *"Source data is STALE (>14 days)"*.
  - `2:41 - 2:46`: District forecast cards immediately switch to gray `WITHHELD` chips with numbers safely suppressed to `null`.
  - `2:46 - 2:53`: Smooth transition to public GitHub repository: scroll past 175 passing tests badge, Docker quickstart, and full docs suite.
  - `2:53 - 3:00`: End on the clean Team EchoBinary title card with ModelX 2.0 competition logo. Hold screen cleanly until 03:00.00.
- **Vocal Delivery:** Resonant, strong, reassuring finish. Concluding with warmth and pride.
- **Phonetics:** *Withheld* = `"With-HELD"` | *EchoBinary* = `"Echo-BY-nuh-ree"` | *ModelX* = `"Model-Ex"`
- **Verbatim Audio Script:**
  > *"True public-health reliability means **failing safely**. [PAUSE 0.3s]*  
  > *When data feeds are delayed beyond 14 days, DengueAhead raises a staleness alarm and suppresses numeric forecasts to **'WITHHELD'**—preventing guesswork. [PAUSE 0.5s]*  
  > *DengueAhead delivers proactive foresight, cryptographic provenance, and transparent AI intelligence. [PAUSE 0.4s]*  
  > *Explore our open-source codebase on GitHub. We are **Team EchoBinary for ModelX 2.0**. Thank you."*

---

## 6. Quick Teleprompter Master Sheet (Continuous Read)

Print or place this continuous script on a second monitor while recording your voiceover track:

```text
[0:00 - 0:20 | Part 1: Landing Page & Problem]
"In Sri Lanka, dengue surveillance is traditionally reactive.
By the time hospitalizations peak in weekly health bulletins, transmission happened weeks earlier.
DengueAhead gives Regional Medical Officers a one- to two-week proactive decision window to deploy vector control before clinical outbreaks emerge.
Let's see how it works."

[0:20 - 0:45 | Part 2: Provenance & Automated Pipeline]
"DengueAhead is grounded in verified, real-world data: weekly bulletins from the National Dengue Control Unit and lagged weather reanalysis from Open-Meteo.
Our automated crawler parses official weekly PDF reports, aggregates regional health divisions into canonical districts, and hashes every raw payload with SHA-256.
Models train across four years of dual-monsoon history with exponential recency weighting—strictly zero simulated numbers."

[0:45 - 1:20 | Part 3: Risk Map & Gampaha Drilldown]
"On our Risk Map, all twenty-five districts are mapped to actionable operational states.
Filtering for 'Emerging' isolates four districts currently below epidemic levels but predicted to escalate next week.
Drilling into Gampaha, our time-series chart contrasts historical cases against next week's forecast of 142 cases, bounded by an eighty percent conformal uncertainty interval.
Below, feature drivers show that three-week cumulative rainfall and rising minimum temperatures are driving this elevation—interpreted strictly as non-causal statistical associations to guide larval site inspections."

[1:20 - 1:45 | Part 4: Comparative Analytics]
"In our Multi-District Comparison view, health planners evaluate high-risk regions side-by-side.
Comparing Western Province neighbors—Colombo, Gampaha, and Kalutara—reveals differing transmission velocities and localized rainfall anomalies.
This allows regional directors to optimize vector-control logistics, prepositioning larvicide in emerging hotspots while maintaining space-spraying equipment in persistently high-burden municipal zones."

[1:45 - 2:15 | Part 5: Historical As-Of Replay]
"To verify that our models generalize without future data leakage, Historical Replay evaluates forecasts strictly as of past calendar cutoffs.
Here at Week 22 of 2024, DengueAhead flagged an impending post-monsoon surge in the Western Province while cases were still low.
Revealing actual outcomes demonstrates how the model anticipated the surge two weeks in advance, outperforming both persistence and seasonal baselines to give field teams critical lead time."

[2:15 - 2:35 | Part 6: Model Card & Empirical Evaluation]
"Our Model Card documents rigorous empirical performance across four years of backtesting.
HistGradientBoosting achieves a 24.6% error reduction over persistence, with 82% precision in identifying Top-5 hotspots.
But we are transparent about limitations: predictions are district-level, and probabilities in low-incidence dry seasons safely degrade to uncalibrated ranks."

[2:35 - 3:00 | Part 7: Chaos Staleness & Conclusion]
"True public-health reliability means failing safely.
When data feeds are delayed beyond 14 days, DengueAhead raises a staleness alarm and suppresses numeric forecasts to 'WITHHELD'—preventing guesswork.
DengueAhead delivers proactive foresight, cryptographic provenance, and transparent AI intelligence.
Explore our open-source codebase on GitHub. We are Team EchoBinary for ModelX 2.0. Thank you."
```

