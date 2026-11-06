# DengueAhead — 3-Minute Video Demo Audio Script & Action Guide
## Two-Part Architecture: Web Interface First, CLI Toolchain Second

> **Structure:**  
> - **SECTION 1 (0:00 – 1:45 | 105s):** Fullscreen Web Application (Public Health Decision Support)  
> - **SECTION 2 (1:45 – 2:50 | 65s):** Fullscreen Python ML CLI Toolchain (`dengueahead`)  
> - **SECTION 3 (2:50 – 3:00 | 10s):** Summary, Open Source & Team EchoBinary  
> **Team:** EchoBinary | **Competition:** ModelX 2.0  
> **Total Length:** Exactly 180 seconds (03:00 Max) | **Target Speaking Rate:** ~145 words per minute

```mermaid
timeline
    title 180-Second Split Storyboard Flow
    SECTION 1 : 0:00 - 0:15 : Web Part 1 - Landing Page & The Problem
    SECTION 1 : 0:15 - 0:40 : Web Part 2 - Overview & 25-District Risk Map
    SECTION 1 : 0:40 - 1:05 : Web Part 3 - Gampaha Drilldown & Conformal Bands
    SECTION 1 : 1:05 - 1:30 : Web Part 4 - Multi-District Compare & Historical Replay
    SECTION 1 : 1:30 - 1:45 : Web Part 5 - Model Card & Transparent Limitations
    SECTION 2 : 1:45 - 2:10 : CLI Part 6 - Automated PDF Crawler & Data Audit
    SECTION 2 : 2:10 - 2:35 : CLI Part 7 - As-Of Feature Matrix, Training & Predict
    SECTION 2 : 2:35 - 2:50 : CLI Part 8 - Chaos Staleness & WITHHELD Gating
    OUTRO     : 2:50 - 3:00 : Summary - Open Source GitHub & Team EchoBinary
```

---

# 🌐 SECTION 1: THE WEB APPLICATION (0:00 – 1:45 | 105 Seconds)

---

### Part 1: Landing Page & The Surveillance Gap (0:00 – 0:15 | 15s)
- **Screen:** Fullscreen Web Browser (`http://localhost:5173/`)
- **Visual Action:**
  - `0:00 - 0:05`: Hover cursor over the prominent **Non-Clinical Safety Disclaimer** banner.
  - `0:05 - 0:10`: Scroll past the hero title *"See the next hotspot before it emerges"*.
  - `0:10 - 0:15`: Click the glowing primary CTA button **"Explore Risk Map"**. Smooth liquid glass transition to `/app/overview`.
- **Audio Voiceover (36 words):**
  > *"In Sri Lanka, dengue surveillance is traditionally reactive. Hospital bulletins document infections that happened weeks earlier. DengueAhead gives public health leaders a one- to two-week proactive decision window before clinical outbreaks emerge. Let's tour the web platform."*

---

### Part 2: Overview Dashboard & 25-District Risk Map (0:15 – 0:40 | 25s)
- **Screen:** Overview (`/app/overview`) $\to$ Risk Map (`/app/map`)
- **Visual Action:**
  - `0:15 - 0:22`: On `/app/overview`, showcase the 6 KPI metric cards, active forecast issuance week, and Top Emerging Hotspots table.
  - `0:22 - 0:30`: Click "Map" on the liquid glass navbar (`/app/map`). All 25 districts render on the interactive SVG choropleth map color-coded by operational state.
  - `0:30 - 0:40`: Click the **"EMERGING"** filter chip above the map. Watch the map instantly isolate the 4 escalating districts in bright amber.
- **Audio Voiceover (60 words):**
  > *"On our Overview dashboard, health officers monitor real-time operational states across all twenty-five administrative districts. Switching to our interactive Risk Map, districts are color-coded into clear categories: Emerging, Persistent, Cooling, and Stable. Filtering for 'Emerging' isolates four districts currently below epidemic levels but predicted to escalate next week, allowing teams to mobilize before hospitals see a surge."*

---

### Part 3: District Drilldown, Conformal Intervals & Feature Drivers (0:40 – 1:05 | 25s)
- **Screen:** Area Detail Page (`/app/areas/LK-12`)
- **Visual Action:**
  - `0:40 - 0:45`: Click directly on **Gampaha District (`LK-12`)** on the map.
  - `0:45 - 0:55`: On `/app/areas/LK-12`, trace the SVG Time-Series Chart: solid blue line (past case history), dotted line (seasonal threshold), dashed orange line (forecast of 142 cases), and the amber shaded band (80% conformal prediction interval bounded $\ge 0$).
  - `0:55 - 1:05`: Scroll down to the **Feature Drivers** card: point to 3-week cumulative rainfall and minimum temperature bars; highlight the non-causal statistical correlation disclaimer.
- **Audio Voiceover (62 words):**
  > *"Drilling into Gampaha, our time-series chart contrasts historical surveillance against next week's forecast of 142 cases. Crucially, every forecast is bounded by an eighty percent conformal prediction interval, giving planners mathematically sound uncertainty bounds. Below, feature drivers identify three-week rainfall and temperature anomalies as key contributors, presented strictly as non-causal statistical associations to prioritize localized larval inspections."*

---

### Part 4: Multi-District Comparison & Historical As-Of Replay (1:05 – 1:30 | 25s)
- **Screen:** Comparative Analytics (`/app/compare`) $\to$ Historical Replay (`/app/history`)
- **Visual Action:**
  - `1:05 - 1:16`: Navigate to `/app/compare`. Select Western Province neighbors: **Colombo (`LK-11`)**, **Gampaha (`LK-12`)**, and **Kalutara (`LK-13`)**. Highlight side-by-side case deltas and vector-control priority action tags.
  - `1:16 - 1:24`: Navigate to `/app/history`. Select cutoff week **`2024-W22`** showing the forecast in blinded operational state.
  - `1:24 - 1:30`: Click the green button **"Reveal Actual Outcome"**. The actual curve animates onto the chart, landing right within the prediction interval and outperforming baseline cards.
- **Audio Voiceover (61 words):**
  > *"Our Multi-District Comparison tool enables side-by-side evaluation of neighboring districts, helping Regional Medical Officers balance larvicide squads in emerging areas against space-spraying teams in high-burden urban zones. On our Historical Replay page, users can test predictions as of past calendar weeks. Clicking 'Reveal Actual Outcome' confirms the model successfully anticipated the 2024 post-monsoon surge two weeks in advance."*

---

### Part 5: Model Card & Transparent Operational Boundaries (1:30 – 1:45 | 15s)
- **Screen:** Model Card & Evaluation (`/app/model`)
- **Visual Action:**
  - `1:30 - 1:38`: On `/app/model`, highlight the empirical benchmark table: **24.6% MAE reduction** ($18.7$ vs $24.8$ cases) and **82% Top-5 Precision**.
  - `1:38 - 1:45`: Expand the "Known Limitations" accordion: hover over district-level resolution boundaries and dry-season rank fallbacks.
- **Audio Voiceover (38 words):**
  > *"Our Model Card documents rigorous empirical benchmarks: a 24.6% error reduction over persistence and 82% Top-5 hotspot precision. We transparently communicate limits: forecasts are district-level, and probabilities in low-incidence dry seasons safely degrade to uncalibrated ranks."*

---

# 💻 SECTION 2: THE PYTHON ML CLI TOOLCHAIN (1:45 – 2:50 | 65 Seconds)

---

### Part 6: CLI Source Audit & Automated PDF Report Crawler (1:45 – 2:10 | 25s)
- **Screen:** Fullscreen Terminal (Dark Theme, High-Contrast Font)
- **CLI Commands to Run & Show:**
  ```powershell
  # 1. Audit cryptographic source integrity and robots.txt licenses
  dengueahead audit-sources

  # 2. Automatically crawl weekly PDF bulletin and aggregate health regions
  dengueahead ingest --source ndcu-weekly --year 2026 --week 44
  ```
- **Visual Action:**
  - `1:45 - 1:55`: Run `dengueahead audit-sources`. Highlight terminal output verifying SHA-256 hashes, MoH and Open-Meteo license compliance, and zero synthetic data enforcement.
  - `1:55 - 2:10`: Run `dengueahead ingest --source ndcu-weekly --year 2026 --week 44`. Terminal shows automated discovery of official weekly PDF bulletins, table extraction, and canonical aggregation of Kalmunai RDHS + Ampara into district `LK-52`.
- **Audio Voiceover (60 words):**
  > *"Now let's examine the engine powering DengueAhead: our production Python CLI. Running 'audit-sources' verifies upstream data licenses and cryptographic SHA-256 integrity, enforcing our zero-simulated-data policy. Next, our automated ingest crawler scans official health ministry portals, downloads weekly PDF bulletins, extracts district tables, and canonically aggregates split regional divisions like Kalmunai and Ampara into unified administrative districts."*

---

### Part 7: Feature Builder, Recency-Weighted Training & Predict (2:10 – 2:35 | 25s)
- **Screen:** Fullscreen Terminal
- **CLI Commands to Run & Show:**
  ```powershell
  # 1. Build as-of lag features with zero future leakage
  dengueahead build-features --as-of 2026-11-02

  # 2. Train HistGradientBoosting with 8-week exponential recency weights
  dengueahead train --model-type hgb --as-of 2026-11-02

  # 3. Predict next-week district risk and publish to database
  dengueahead predict --as-of 2026-11-02
  ```
- **Visual Action:**
  - `2:10 - 2:17`: Run `dengueahead build-features --as-of 2026-11-02`. Terminal logs show 18 temporal lag features created with strict as-of cutoff.
  - `2:17 - 2:27`: Run `dengueahead train --model-type hgb --as-of 2026-11-02`. Terminal logs show fitting across 4 years of dual-monsoon historical data with 8-week exponential recency weighting (`compute_recency_weights`).
  - `2:27 - 2:35`: Run `dengueahead predict --as-of 2026-11-02`. Terminal prints next-week district predictions with conformal bounds and Platt calibrated probabilities published to MongoDB.
- **Audio Voiceover (62 words):**
  > *"The CLI enforces strict temporal integrity. 'build-features' constructs 18 lag features strictly as-of the cutoff date, guaranteeing zero future leakage. 'train' fits our HistGradientBoosting pipeline across four years of dual-monsoon history, applying exponential recency weighting to emphasize the last eight weeks. Finally, 'predict' calculates conformal intervals and Platt calibrated probabilities, publishing validated forecasts directly to our database."*

---

### Part 8: Chaos Engineering & Fail-Safe Withheld Gating (2:35 – 2:50 | 15s)
- **Screen:** Split Screen (Left: Web Dashboard | Right: Terminal)
- **CLI Command to Run:**
  ```powershell
  # Inject delayed/stale data (>14 days)
  dengueahead predict --as-of 2026-11-02 --force-stale
  ```
- **Visual Action:**
  - `2:35 - 2:42`: Terminal executes stale prediction check. 
  - `2:42 - 2:50`: Browser refreshes `/app/overview`: prominent amber banner alerts *"Source data is STALE (>14 days)"*. Forecast cards instantly switch to gray `WITHHELD` chips with numbers safely suppressed to `null`.
- **Audio Voiceover (38 words):**
  > *"Reliability requires failing safely. In the CLI, when upstream feeds are corrupted or delayed past 14 days, DengueAhead raises a staleness alarm and suppresses numeric forecasts to 'WITHHELD'—protecting public health officials from acting on ungrounded guesswork."*

---

# 🏆 SECTION 3: CONCLUSION & OPEN SOURCE (2:50 – 3:00 | 10 Seconds)

---

### Outro & Team EchoBinary Slide (2:50 – 3:00 | 10s)
- **Screen:** GitHub Repository (`README.md`) $\to$ Team EchoBinary ModelX 2.0 Title Card
- **Visual Action:**
  - `2:50 - 2:55`: Smooth scroll past public GitHub repository: highlight green CI badge, 175 passing tests, and Docker one-command quickstart.
  - `2:55 - 3:00`: Transition to official Team EchoBinary submission slide. Hold cleanly until 03:00.00.
- **Audio Voiceover (25 words):**
  > *"DengueAhead combines proactive web decision intelligence with a battle-tested ML CLI toolchain. Explore our complete open-source codebase on GitHub. We are Team EchoBinary. Thank you."*

---

## 📜 Continuous Master Teleprompter Script (One-Take Recording)

```text
[SECTION 1: WEB APPLICATION | 0:00 - 1:45]

In Sri Lanka, dengue surveillance is traditionally reactive.
Hospital bulletins document infections that happened weeks earlier.
DengueAhead gives public health leaders a one- to two-week proactive decision window before clinical outbreaks emerge.
Let's tour the web platform.

On our Overview dashboard, health officers monitor real-time operational states across all twenty-five administrative districts.
Switching to our interactive Risk Map, districts are color-coded into clear categories: Emerging, Persistent, Cooling, and Stable.
Filtering for 'Emerging' isolates four districts currently below epidemic levels but predicted to escalate next week, allowing teams to mobilize before hospitals see a surge.

Drilling into Gampaha, our time-series chart contrasts historical surveillance against next week's forecast of 142 cases.
Crucially, every forecast is bounded by an eighty percent conformal prediction interval, giving planners mathematically sound uncertainty bounds.
Below, feature drivers identify three-week rainfall and temperature anomalies as key contributors, presented strictly as non-causal statistical associations to prioritize localized larval inspections.

Our Multi-District Comparison tool enables side-by-side evaluation of neighboring districts, helping Regional Medical Officers balance larvicide squads in emerging areas against space-spraying teams in high-burden urban zones.
On our Historical Replay page, users can test predictions as of past calendar weeks.
Clicking 'Reveal Actual Outcome' confirms the model successfully anticipated the 2024 post-monsoon surge two weeks in advance.

Our Model Card documents rigorous empirical benchmarks: a 24.6% error reduction over persistence and 82% Top-5 hotspot precision.
We transparently communicate limits: forecasts are district-level, and probabilities in low-incidence dry seasons safely degrade to uncalibrated ranks.


[SECTION 2: PYTHON ML CLI TOOLCHAIN | 1:45 - 2:50]

Now let's examine the engine powering DengueAhead: our production Python CLI.
Running 'audit-sources' verifies upstream data licenses and cryptographic SHA-256 integrity, enforcing our zero-simulated-data policy.
Next, our automated ingest crawler scans official health ministry portals, downloads weekly PDF bulletins, extracts district tables, and canonically aggregates split regional divisions like Kalmunai and Ampara into unified administrative districts.

The CLI enforces strict temporal integrity.
'build-features' constructs 18 lag features strictly as-of the cutoff date, guaranteeing zero future leakage.
'train' fits our HistGradientBoosting pipeline across four years of dual-monsoon history, applying exponential recency weighting to emphasize the last eight weeks.
Finally, 'predict' calculates conformal intervals and Platt calibrated probabilities, publishing validated forecasts directly to our database.

Reliability requires failing safely.
In the CLI, when upstream feeds are corrupted or delayed past 14 days, DengueAhead raises a staleness alarm and suppresses numeric forecasts to 'WITHHELD'—protecting public health officials from acting on ungrounded guesswork.


[SECTION 3: OUTRO | 2:50 - 3:00]

DengueAhead combines proactive web decision intelligence with a battle-tested ML CLI toolchain.
Explore our complete open-source codebase on GitHub.
We are Team EchoBinary.
Thank you.
```

---

## ⌨️ Quick CLI Commands Run-Sheet (For Terminal Recording)

```powershell
# Part 6:
dengueahead audit-sources
dengueahead ingest --source ndcu-weekly --year 2026 --week 44

# Part 7:
dengueahead build-features --as-of 2026-11-02
dengueahead train --model-type hgb --as-of 2026-11-02
dengueahead predict --as-of 2026-11-02

# Part 8:
dengueahead predict --as-of 2026-11-02 --force-stale
```
