# Three-Minute Video Demo Script & Storyboard — DengueAhead
## Structured Two-Part Presentation: Web Application First, CLI Toolchain Second

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Team:** EchoBinary | **Competition:** ModelX 2.0 | **Track:** Health & Wellbeing (Population-Level, Non-Clinical)  
> **Target Duration:** Exactly 180 seconds (3:00 max)  
> **Format:** 1080p60 Screen Recording + Synchronized Voiceover Narration  
> **Structure:**  
> - **SECTION 1 (0:00 – 1:45 | 105s):** The Interactive Public Health Web Application  
> - **SECTION 2 (1:45 – 2:50 | 65s):** The Python ML CLI Toolchain (`dengueahead`)  
> - **SECTION 3 (2:50 – 3:00 | 10s):** Summary, Open Source & Team EchoBinary  
> **Repository:** [https://github.com/echobinary/DengueAhead](https://github.com/echobinary/DengueAhead)

---

## 1. Video Overview & Production Guidelines

- **Maximum Allowed Length:** 180 seconds (3:00).
- **Target Video Resolution:** 1920 × 1080 (1080p, 60fps).
- **Pacing:** ~145 words per minute.
- **Rule Strictness:** Zero simulated data on production routes. Every screen recorded reflects live API data, genuine historical backtests across 4-year dual-monsoon cycles (2022–2025), and immutable SHA-256 data provenance.
- **Visual Aesthetic:** Liquid glass modern UI, responsive drawer, icons-only minimalist navigation, and custom high-resolution public health imagery across all views.

```mermaid
timeline
    title 180-Second Split Storyboard Flow
    SECTION 1 (Web UI)  : 0:00 - 0:15 : Web Part 1 - Landing Page & The Problem
    SECTION 1 (Web UI)  : 0:15 - 0:40 : Web Part 2 - Overview & 25-District Risk Map
    SECTION 1 (Web UI)  : 0:40 - 1:05 : Web Part 3 - Gampaha Drilldown & Conformal Bands
    SECTION 1 (Web UI)  : 1:05 - 1:30 : Web Part 4 - Multi-District Compare & Historical Replay
    SECTION 1 (Web UI)  : 1:30 - 1:45 : Web Part 5 - Model Card & Transparent Limitations
    SECTION 2 (CLI ML)  : 1:45 - 2:10 : CLI Part 6 - Automated PDF Crawler & Data Audit
    SECTION 2 (CLI ML)  : 2:10 - 2:35 : CLI Part 7 - As-Of Feature Matrix, Training & Predict
    SECTION 2 (CLI ML)  : 2:35 - 2:50 : CLI Part 8 - Chaos Staleness & WITHHELD Gating
    OUTRO               : 2:50 - 3:00 : Summary - Open Source GitHub & Team EchoBinary
```

---

## 2. Second-by-Second Demo Script & Storyboard

---

### SECTION 1: THE WEB APPLICATION (0:00 – 1:45 | 105s)

#### Segment 1: The Problem & The Decision Window (0:00 – 0:15 | 15s)
- **Screen View:** Landing Page (`http://localhost:5173/`) $\to$ Click "Explore Risk Map" $\to$ Overview Dashboard (`/app/overview`).
- **Visual Action:**
  - Cursor highlights the prominent Non-Clinical Safety Disclaimer banner.
  - Hover over headline: *"See the next hotspot before it emerges."*
  - Click primary CTA button. Liquid glass navigation smoothly transitions to Overview.
- **Spoken Narration (36 words):**
  > *"In Sri Lanka, dengue surveillance is traditionally reactive. Hospital bulletins document infections that happened weeks earlier. DengueAhead gives public health leaders a one- to two-week proactive decision window before clinical outbreaks emerge. Let's tour the web platform."*

---

#### Segment 2: Overview Dashboard & 25-District Risk Map (0:15 – 0:40 | 25s)
- **Screen View:** Overview (`/app/overview`) $\to$ Risk Map (`/app/map`).
- **Visual Action:**
  - On `/app/overview`, showcase the 6 KPI metric cards and Top Emerging Hotspots table.
  - Navigate to `/app/map`. All 25 districts render on the SVG choropleth map.
  - Click the **"EMERGING"** filter chip: the map isolates the 4 escalating districts in amber.
- **Spoken Narration (60 words):**
  > *"On our Overview dashboard, health officers monitor real-time operational states across all twenty-five administrative districts. Switching to our interactive Risk Map, districts are color-coded into clear categories: Emerging, Persistent, Cooling, and Stable. Filtering for 'Emerging' isolates four districts currently below epidemic levels but predicted to escalate next week, allowing teams to mobilize before hospitals see a surge."*

---

#### Segment 3: District Drilldown & Conformal Uncertainty (0:40 – 1:05 | 25s)
- **Screen View:** Area Detail Page (`/app/areas/LK-12`).
- **Visual Action:**
  - Click on Gampaha District (`LK-12`).
  - On the District Detail view, trace the SVG Time-Series Chart: past cases, seasonal threshold, next-week forecast of 142 cases, and the 80% conformal uncertainty band.
  - Scroll down to the Feature Drivers panel: point to 3-week cumulative rainfall and temperature bars; highlight the non-causal disclaimer.
- **Spoken Narration (62 words):**
  > *"Drilling into Gampaha, our time-series chart contrasts historical surveillance against next week's forecast of 142 cases. Crucially, every forecast is bounded by an eighty percent conformal prediction interval, giving planners mathematically sound uncertainty bounds. Below, feature drivers identify three-week rainfall and temperature anomalies as key contributors, presented strictly as non-causal statistical associations to prioritize localized larval inspections."*

---

#### Segment 4: Multi-District Compare & Historical Replay (1:05 – 1:30 | 25s)
- **Screen View:** Compare Page (`/app/compare`) $\to$ History Page (`/app/history`).
- **Visual Action:**
  - Navigate to `/app/compare`. Select Colombo, Gampaha, and Kalutara for side-by-side comparison of case deltas and vector-control priority action tags.
  - Switch to `/app/history`. Select cutoff week `2024-W22` showing the forecast in blinded state.
  - Click the green button **"Reveal Actual Outcome"**: the actual curve animates onto the chart, validating the prediction lead time.
- **Spoken Narration (61 words):**
  > *"Our Multi-District Comparison tool enables side-by-side evaluation of neighboring districts, helping Regional Medical Officers balance larvicide squads in emerging areas against space-spraying teams in high-burden urban zones. On our Historical Replay page, users can test predictions as of past calendar weeks. Clicking 'Reveal Actual Outcome' confirms the model successfully anticipated the 2024 post-monsoon surge two weeks in advance."*

---

#### Segment 5: Model Card & Transparent Limitations (1:30 – 1:45 | 15s)
- **Screen View:** Model Card & Evaluation Page (`/app/model`).
- **Visual Action:**
  - Highlight the empirical benchmark table showing **24.6% MAE reduction** ($18.7$ vs $24.8$) and **82% Top-5 Precision**.
  - Expand the "Known Limitations" accordion: highlight district-level resolution and dry-season uncalibrated fallbacks.
- **Spoken Narration (38 words):**
  > *"Our Model Card documents rigorous empirical benchmarks: a 24.6% error reduction over persistence and 82% Top-5 hotspot precision. We transparently communicate limits: forecasts are district-level, and probabilities in low-incidence dry seasons safely degrade to uncalibrated ranks."*

---

### SECTION 2: THE PYTHON ML CLI TOOLCHAIN (1:45 – 2:50 | 65s)

#### Segment 6: CLI Audit & Automated PDF Report Crawler (1:45 – 2:10 | 25s)
- **Screen View:** Fullscreen Terminal (CLI).
- **Visual Action:**
  - Run `dengueahead audit-sources`: highlight SHA-256 integrity verification, MoH and Open-Meteo licenses.
  - Run `dengueahead ingest --source ndcu-weekly --year 2026 --week 44`: show automated PDF bulletin discovery, table extraction, and canonical aggregation of Kalmunai RDHS + Ampara into district `LK-52`.
- **Spoken Narration (60 words):**
  > *"Now let's examine the engine powering DengueAhead: our production Python CLI. Running 'audit-sources' verifies upstream data licenses and cryptographic SHA-256 integrity, enforcing our zero-simulated-data policy. Next, our automated ingest crawler scans official health ministry portals, downloads weekly PDF bulletins, extracts district tables, and canonically aggregates split regional divisions like Kalmunai and Ampara into unified administrative districts."*

---

#### Segment 7: CLI Feature Builder, Recency-Weighted Training & Predict (2:10 – 2:35 | 25s)
- **Screen View:** Fullscreen Terminal (CLI).
- **Visual Action:**
  - Run `dengueahead build-features --as-of 2026-11-02`: show 18 temporal lag features created with strict as-of cutoff.
  - Run `dengueahead train --model-type hgb --as-of 2026-11-02`: show fitting across 4 years of dual-monsoon historical data with 8-week exponential recency weighting (`compute_recency_weights`).
  - Run `dengueahead predict --as-of 2026-11-02`: show next-week predictions published to database with conformal bounds and Platt probabilities.
- **Spoken Narration (62 words):**
  > *"The CLI enforces strict temporal integrity. 'build-features' constructs 18 lag features strictly as-of the cutoff date, guaranteeing zero future leakage. 'train' fits our HistGradientBoosting pipeline across four years of dual-monsoon history, applying exponential recency weighting to emphasize the last eight weeks. Finally, 'predict' calculates conformal intervals and Platt calibrated probabilities, publishing validated forecasts directly to our database."*

---

#### Segment 8: CLI Chaos Ingestion & Fail-Safe Withheld Gating (2:35 – 2:50 | 15s)
- **Screen View:** Split Screen (Left: Web Dashboard | Right: Terminal).
- **Visual Action:**
  - In terminal, simulate stale data (>14 days delayed): `dengueahead predict --as-of 2026-11-02 --force-stale`.
  - Refresh web dashboard: prominent amber banner alerts *"Source data is STALE (>14 days)"*. Forecast cards switch to gray `WITHHELD` chips with numbers suppressed to `null`.
- **Spoken Narration (38 words):**
  > *"Reliability requires failing safely. In the CLI, when upstream feeds are corrupted or delayed past 14 days, DengueAhead raises a staleness alarm and suppresses numeric forecasts to 'WITHHELD'—protecting public health officials from acting on ungrounded guesswork."*

---

### SECTION 3: OUTRO & CONCLUSION (2:50 – 3:00 | 10s)

#### Segment 9: Summary & Team EchoBinary (2:50 – 3:00 | 10s)
- **Screen View:** Public GitHub Repository (`README.md`) $\to$ Team EchoBinary ModelX 2.0 Title Card.
- **Visual Action:** Scroll through clean-room README with Docker quickstart and test badges. End on Team EchoBinary submission slide.
- **Spoken Narration (25 words):**
  > *"DengueAhead combines proactive web decision intelligence with a battle-tested ML CLI toolchain. Explore our complete open-source codebase on GitHub. We are Team EchoBinary. Thank you."*

---

## 3. Total Timing & Word Count Verification

| Section | Segment / Feature | Allocated Time | Word Count | Speaking Pace |
| :---: | :--- | :---: | :---: | :---: |
| **Web 1** | Problem, Landing Page & Disclaimer | 0:00 – 0:15 (15s) | 36 words | ~144 wpm |
| **Web 2** | Overview Dashboard & 25-District Risk Map | 0:15 – 0:40 (25s) | 60 words | ~144 wpm |
| **Web 3** | Gampaha Drilldown & Conformal Bands | 0:40 – 1:05 (25s) | 62 words | ~148 wpm |
| **Web 4** | Compare View & Historical Replay | 1:05 – 1:30 (25s) | 61 words | ~146 wpm |
| **Web 5** | Model Card & Transparent Limits | 1:30 – 1:45 (15s) | 38 words | ~152 wpm |
| **CLI 6** | CLI Audit & Automated PDF Bulletin Crawler | 1:45 – 2:10 (25s) | 60 words | ~144 wpm |
| **CLI 7** | CLI Feature Builder, Training & Predict | 2:10 – 2:35 (25s) | 62 words | ~148 wpm |
| **CLI 8** | Chaos Staleness & Fail-Safe Withheld Gating | 2:35 – 2:50 (15s) | 38 words | ~152 wpm |
| **Outro** | Summary, GitHub & Team EchoBinary | 2:50 – 3:00 (10s) | 25 words | ~150 wpm |
| **Total** | **Full 2-Part DengueAhead Demonstration** | **180 seconds (3:00)** | **442 words** | **~147 wpm** |
