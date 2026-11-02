# Three-Minute Video Demo Script & Storyboard — DengueAhead

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Team:** EchoBinary | **Competition:** ModelX 2.0  
> **Target Duration:** Exactly 180 seconds (3:00 max)  
> **Format:** Synchronized screen recording + voiceover narration  
> **Date:** November 2026

---

## 1. Video Overview & Production Guidelines

- **Maximum Allowed Length:** 180 seconds.
- **Display Resolution:** 1920 × 1080 (1080p, 60fps).
- **Tone:** Professional, objective, scientifically rigorous, public-health focused.
- **Rule Strictness:** Zero simulated data on production screens. Every screen recorded must reflect live API data and genuine historical backtests.

```mermaid
timeline
    title 180-Second Video Storyboard Flow
    0:00 - 0:20 : The User & The Proactive Decision
    0:20 - 0:45 : Cryptographic Data Pipeline & Provenance
    0:45 - 1:25 : Next-Week Risk Map & District Drilldown
    1:25 - 2:10 : Historical Replay & Baseline Comparison
    2:10 - 2:35 : Empirical Evaluation & Transparent Limitations
    2:35 - 2:50 : Chaos Ingestion & Fail-Safe Withheld Gating
    2:50 - 3:00 : Summary, Open Source & Team EchoBinary
```

---

## 2. Second-by-Second Demo Script & Storyboard

### Segment 1: The Problem & The Decision (0:00 – 0:20 | 20 seconds)

- **Screen View:** Landing Page (`http://localhost:5173/`) $\to$ Click "Explore Risk Map" $\to$ Overview Dashboard (`/app/overview`).
- **Visual Action:** Cursor hovers over the prominent Non-Clinical Safety Disclaimer, then points to the Headline: _"See the next hotspot before it emerges."_ Smooth transition to Overview Dashboard.
- **Spoken Narration (45 words):**
  > _"In Sri Lanka, dengue surveillance is traditionally reactive. By the time hospitalizations peak in official bulletins, transmission happened weeks earlier. DengueAhead gives Regional Medical Officers a 1- to 2-week proactive window to deploy vector control before clinical outbreaks emerge. Let's see how."_
- **Key Proof Shown:** Non-clinical safety banner; clear public-health problem statement.

---

### Segment 2: Data Provenance & Pipeline (0:20 – 0:45 | 25 seconds)

- **Screen View:** Data Quality Page (`/app/data-quality`) $\to$ Split terminal showing `dengueahead audit-sources`.
- **Visual Action:** Scroll through the Source Manifest table highlighting `ndcu-weekly` and `open-meteo-daily`. Zoom into SHA-256 integrity hashes and last observed timestamps. Cut to terminal running ingestion audit.
- **Spoken Narration (58 words):**
  > _"DengueAhead is grounded in verified, real-world data: weekly epidemiological bulletins from the National Dengue Control Unit and lagged weather reanalysis from Open-Meteo. Every raw snapshot is cryptographically hashed with SHA-256 for complete auditability. We enforce a zero-simulated-data policy on all production routes—no synthetic numbers, ever."_
- **Key Proof Shown:** Official source manifest; SHA-256 hashes; automated audit terminal.

---

### Segment 3: Next-Week Risk Map & District Drilldown (0:45 – 1:25 | 40 seconds)

- **Screen View:** Risk Map (`/app/map`) $\to$ Filter by "Emerging" $\to$ Click Gampaha (`LK-12`) $\to$ Area Detail Page (`/app/areas/LK-12`).
- **Visual Action:** Interactive SVG map highlights 25 districts color-coded by operational status. Click "EMERGING" filter—map isolates 4 escalating districts. Click Gampaha (`LK-12`). On Area Detail, cursor traces the Time-Series Chart showing observed cases (solid blue), seasonal threshold (dotted), forecast (dashed orange), and the 80% conformal uncertainty band. Scroll down to Feature Drivers.
- **Spoken Narration (92 words):**
  > _"On our Risk Map, all 25 districts are classified into clear operational states. Filtering for 'Emerging' isolates four districts currently below epidemic levels but predicted to escalate next week. Drilling into Gampaha, our time-series chart contrasts historical cases against next week's forecast of 142 cases, bounded by an 80% conformal prediction interval. Below, our feature drivers show that 3-week cumulative rainfall and rising minimum temperatures are driving this elevation—interpreted strictly as non-causal statistical associations to guide larval site inspections."_
- **Key Proof Shown:** SVG choropleth map; time-series chart with uncertainty band; non-causal driver disclaimer.

---

### Segment 4: Historical As-Of Replay & Baseline Comparison (1:25 – 2:10 | 45 seconds)

- **Screen View:** Historical Replay Page (`/app/history`).
- **Visual Action:** Select historical cutoff week `2024-W22`. Show the forecast state as it existed at that exact moment in time, with actual cases hidden. Cursor hovers over the "Reveal Actual Outcome" button. Click "Reveal Actual Outcome"—green actual curve animates onto the chart, aligning with the prediction. Toggle baseline comparison cards.
- **Spoken Narration (102 words):**
  > _"To verify that our models generalize without future data leakage, our Historical Replay mode evaluates predictions strictly as of past calendar cutoffs. Here at Week 22 of 2024, DengueAhead flagged an impending post-monsoon surge in the Western Province while cases were still low. Clicking 'Reveal Actual Outcome' shows that the outbreak materialized two weeks later, exactly as anticipated. DengueAhead outperformed both the 2-week persistence and seasonal median baselines, providing public health teams with the critical lead time needed to preposition Bti larvicide."_
- **Key Proof Shown:** Out-of-time evaluation; "Reveal Actual Outcome" interaction; baseline comparison cards.

---

### Segment 5: Empirical Evaluation & Transparent Limitations (2:10 – 2:35 | 25 seconds)

- **Screen View:** Model Evaluation Page (`/app/model`).
- **Visual Action:** Scroll through the Model Card for `dengueahead-hgb-v1`. Highlight the benchmark table showing 24.6% MAE reduction ($18.7$ vs $24.8$) and 82% Top-5 Precision. Scroll to the "Known Limitations" accordion and expand.
- **Spoken Narration (59 words):**
  > _"Our Model Card documents empirical performance across five years of backtesting. Our HistGradientBoosting model achieved a 24.6% error reduction over persistence, with 82% precision in identifying Top-5 hotspots. But we are completely transparent about limits: data is district-level rather than MOH-level, and probabilities in low-incidence dry seasons degrade to uncalibrated ranks."_
- **Key Proof Shown:** Empirical benchmark table; 82% Top-5 precision; transparent limitations accordion.

---

### Segment 6: Chaos Ingestion & Fail-Safe Withheld Gating (2:35 – 2:50 | 15 seconds)

- **Screen View:** Terminal simulating network drop or stale data $\to$ Overview Dashboard (`/app/overview`).
- **Visual Action:** Terminal injects delayed feed. Refresh dashboard: prominent Amber Alert Banner appears: _"Source data is STALE (>14 days)"_. District cards immediately transition to `WITHHELD` status with numeric forecasts safely suppressed to `null`.
- **Spoken Narration (38 words):**
  > _"True reliability means failing safely. When data feeds are delayed beyond 14 days or corrupted, DengueAhead raises a staleness alarm and suppresses numeric forecasts to 'WITHHELD'—protecting public health leaders from acting on misleading synthetic guesses."_
- **Key Proof Shown:** Amber staleness banner; `WITHHELD` status chip; suppressed numeric fields.

---

### Segment 7: Conclusion & Open Source Repository (2:50 – 3:00 | 10 seconds)

- **Screen View:** Public GitHub Repository (`README.md`) $\to$ EchoBinary Team Title Slide.
- **Visual Action:** Quick scroll through clean-room README with Docker quickstart and test badges. End on Team EchoBinary submission slide.
- **Spoken Narration (24 words):**
  > _"DengueAhead: proactive foresight, rigorous provenance, and transparent public health intelligence. Explore our complete open-source codebase on GitHub. We are Team EchoBinary. Thank you."_
- **Key Proof Shown:** GitHub repo URL; Docker command badge; ModelX 2.0 attribution.

---

## 3. Recording & Rehearsal Checklist

- [ ] Confirm local MongoDB container is running with seed data: `docker compose up -d mongodb`.
- [ ] Confirm Express API is running on port 4000: `npm run dev:api`.
- [ ] Confirm Vite frontend is running on port 5173: `npm run dev:web`.
- [ ] Set browser viewport to 100% zoom (1920 × 1080).
- [ ] Clear browser cache and disable external browser extension banners.
- [ ] Rehearse spoken narration with stopwatch; verify pacing achieves 175–178 seconds.
- [ ] Export final MP4 video with clean H.264 video and 48kHz stereo AAC audio.
