# DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka

> **Team:** EchoBinary | **Competition:** ModelX 2.0 | **Track:** Health & Wellbeing (Population-Level, Non-Clinical)  
> **Mission:** Deliver an evidence-driven, scientifically evaluated decision-support platform that provides Sri Lankan public-health planners with a 1- to 2-week proactive decision window before clinical dengue hotspots emerge.

[![CI Pipeline](https://github.com/echobinary/DengueAhead/actions/workflows/ci.yml/badge.svg)](https://github.com/echobinary/DengueAhead/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-brightgreen.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Non-Clinical Safety & Ethical Disclaimer

> [!CAUTION]
> **DengueAhead is an educational decision-support research application.** It does not provide medical diagnosis, clinical triage, or patient prescription. It does not autonomously direct public-health interventions or replace professional epidemiological judgement. All resource allocations must be validated by qualified public health authorities.

---

## 1. System Overview

DengueAhead couples weekly epidemiological surveillance bulletins from Sri Lanka's **National Dengue Control Unit (NDCU)** with antecedent meteorological signals (lagged precipitation, temperature, relative humidity) from **Open-Meteo ERA5 Reanalysis**.

It classifies all **25 administrative districts** (`LK-11` to `LK-92`) into five clear operational states:

- **`EMERGING` (Amber):** Currently below epidemic threshold; predicted to cross threshold next week. Prioritized for preemptive larviciding and premise inspections.
- **`PERSISTENT` (Coral):** Currently high; predicted to remain high. Prioritized for hospital surge capacity and space spraying.
- **`COOLING` (Teal):** Currently high; predicted to fall below threshold.
- **`STABLE` (Teal):** Low transmission baseline maintained.
- **`WITHHELD` (Gray):** Prediction suppressed due to delayed or anomalous data feeds.

In retrospective expanding-window backtesting across 2020–2024, our primary **HistGradientBoosting model with post-hoc Platt scaling** achieved a **24.6% reduction in Mean Absolute Error (MAE)** over naïve persistence and an **82% precision in identifying the Top-5 highest risk districts** 7 days in advance.

```text
DengueAhead/
├── apps/
│   ├── api/                # Express 4 + Node.js + TypeScript backend (Port 4000)
│   └── web/                # Vite + React 18 + TypeScript frontend (Port 5173)
├── packages/
│   └── contracts/          # Shared Zod schemas and TypeScript domain contracts
├── services/
│   └── ml/                 # Python 3.12 ML package (CLI: dengueahead)
├── configs/                # Source, model, and area map configurations
├── data/
│   ├── manifests/          # Verifiable data provenance inventory & hashes
│   └── samples/            # Sanitized, legally shareable test fixtures
├── artifacts/              # Versioned model metadata & serialized artifacts
├── docs/                   # Complete scientific specifications, reports, and evidence
└── scripts/                # Benchmarking, secret audit, and E2E smoke runners
```

---

## 2. Mandatory Submission Deliverables

| Deliverable       | Description                                                                                               | File Link                                              |
| :---------------- | :-------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- |
| **Deliverable A** | **Technical Report** — Full scientific and architectural specification reflecting the actual built system | [`docs/TECHNICAL_REPORT.md`](docs/TECHNICAL_REPORT.md) |
| **Deliverable B** | **Public Git Repository** — Clean-room runnable codebase with complete instructions                       | [Repository Root](.)                                   |
| **Deliverable C** | **Two-Page Executive Summary** — Concise problem, insight, proof, and limitations brief                   | [`docs/TWO_PAGE_SUMMARY.md`](docs/TWO_PAGE_SUMMARY.md) |
| **Deliverable D** | **Three-Minute Video Script** — Second-by-second 180s recorded demo script & storyboard                   | [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)           |

### Supporting Scientific Documentation:

- **System Architecture & Data Flows:** [`docs/architecture.md`](docs/architecture.md)
- **Model Evaluation & Backtest Protocol:** [`docs/EVALUATION.md`](docs/EVALUATION.md)
- **Model Card (`dengueahead-hgb-v1`):** [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md)
- **Known Limitations & Responsible Use:** [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md)
- **AI Assistance & Verification Disclosure:** [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md)
- **Data Sources & Licensing Manifest:** [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)
- **Data Dictionary:** [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md)
- **Phase Evidence Reports:** [`docs/evidence/`](docs/evidence/)

---

## 3. Quickstart & Clean-Room Setup

### 3.1 Prerequisites

- **Node.js:** $\ge 20.0.0$ (v22 recommended)
- **Python:** $\ge 3.10$ ($3.12$ recommended)
- **Docker & Docker Compose:** $\ge 24.0$ (for local MongoDB)
- **Git**

### 3.2 Installation

```bash
# 1. Clone the repository
git clone https://github.com/echobinary/DengueAhead.git
cd DengueAhead

# 2. Install Node.js workspaces dependencies
npm install

# 3. Install Python ML package in editable mode
pip install -e services/ml

# 4. Start local MongoDB container
docker compose up -d mongodb
```

### 3.3 Run Development Applications

```bash
# Start Express API backend (runs on http://localhost:4000)
npm run dev:api

# Start React web dashboard (runs on http://localhost:5173)
npm run dev:web

# Or run both concurrently
npm run dev
```

---

## 4. Verification & Testing

DengueAhead enforces strict continuous integration gates. Execute all verification suites locally:

```bash
# 1. Verify TypeScript strict mode compilation (0 errors)
npm run typecheck

# 2. Verify ESLint and Prettier formatting (0 errors, 0 warnings)
npm run lint

# 3. Execute monorepo unit test suites (86/86 TypeScript tests)
npm run test:unit

# 4. Execute Python ML test suite (118/118 tests pass)
pytest services/ml/tests

# 5. Execute automated credential and secret audit (0 leaks)
python scripts/audit-secrets.py

# 6. Execute full production bundle build
npm run build
```

---

## 5. Python ML CLI Toolchain (`dengueahead`)

The `services/ml` package exposes the `dengueahead` CLI entrypoint for operational execution:

```bash
# Display CLI commands and help
dengueahead --help

# Audit source availability and licensing status
dengueahead audit-sources --config configs/sources.yaml

# Ingest weekly surveillance and weather data
dengueahead ingest --config configs/sources.yaml

# Run automated schema and epidemiological data validation
dengueahead validate-data

# Construct as-of temporal lag feature matrix
dengueahead build-features --as-of 2024-06-24

# Train baseline and HistGradientBoosting models
dengueahead train --config configs/model.yaml

# Execute rolling out-of-time historical backtest
dengueahead backtest --config configs/model.yaml

# Generate and publish next-week district risk forecasts
dengueahead predict --as-of 2024-06-24 --publish
```

---

## 6. Ten Operating Rules (`AGENTS.md`)

All development adheres to the DengueAhead operating guidelines:

1. **Inspect Before Changing:** Read code, configs, and tests before editing.
2. **One Bounded Task Per Session:** Maintain clear task boundaries and never alter architecture schemas silently.
3. **No Simulated Success:** Synthetic data is used **only in isolated test fixtures**. Production routes never serve unlabelled fake numbers.
4. **Data Provenance is Mandatory:** Every prediction references model version, source snapshot hash, issue date, target week, and area ID.
5. **Tests First / Test-Driven:** Provide unit tests and ensure integration tests pass before completing phases.
6. **No Unsupported Claims:** Uncalibrated probabilities display forecast rank; unvalidated intervals display "interval not available".
7. **Security & Credentials:** Zero secrets committed; all inputs sanitized via Zod.
8. **Keep Trunk Green:** All code merged into trunk compiles clean and passes all unit tests.
9. **Transparent Blockers:** Report limitations and deviations honestly.
10. **Evidence Capture:** Record executed commands and test outputs in `docs/evidence/phase-N/`.

---

## 7. License & Attribution

- **Source Code:** Released under the [MIT License](LICENSE).
- **Surveillance Data:** Sourced from the [National Dengue Control Unit (NDCU)](https://www.dengue.health.gov.lk/weekly-report/), Ministry of Health, Sri Lanka.
- **Weather Data:** Sourced from [Open-Meteo](https://open-meteo.com/) ERA5 Reanalysis Archive, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Developed by:** Team EchoBinary for the **ModelX 2.0 Competition**.
