# DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka

> **Team:** EchoBinary | **Competition:** ModelX 2.0 | **Domain:** Health & Wellbeing (population-level, non-clinical)  
> **Mission:** Build a working and honestly evaluated decision-support application that helps Sri Lankan public-health planners identify areas likely to become unusually high-risk for dengue 1–2 weeks ahead.

---

## Non-Clinical Safety & Ethical Disclaimer
**DengueAhead is an educational decision-support research application.** It does not provide medical diagnosis, clinical triage, or patient prescription. It does not autonomously direct public-health interventions or replace professional epidemiological judgement.

---

## Monorepo Architecture

```text
DengueAhead/
├── apps/
│   ├── api/                # Express + Node.js + TypeScript backend
│   └── web/                # Vite + React + TypeScript frontend
├── packages/
│   └── contracts/          # Shared Zod schemas and TypeScript domain contracts
├── services/
│   └── ml/                 # Python 3.12 ML package (CLI: dengueahead)
├── data/
│   ├── manifests/          # Verifiable data provenance inventory & hashes
│   └── samples/            # Sanitized test fixtures
├── artifacts/              # Serialized model metadata, cards, and evaluation metrics
├── configs/                # Source and model configuration definitions
├── docs/                   # System documentation & phase evidence
└── plans/                  # Implementation master specifications
```

---

## Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: 3.10+ (3.12 recommended)
- **MongoDB**: 7.0+ (Local instance or Docker container)

### 2. Install Dependencies
```bash
# Install Node workspaces dependencies
npm install

# Install Python ML package in editable mode
pip install -e services/ml
```

### 3. Start Database
```bash
docker compose up -d mongodb
```

### 4. Run Development Servers
```bash
# Start API backend (runs on http://localhost:4000)
npm run dev:api

# Start Web frontend (runs on http://localhost:5173)
npm run dev:web
```

---

## Testing & Verification
```bash
# Typecheck all TypeScript workspaces
npm run typecheck

# Run unit tests across all TypeScript workspaces
npm run test:unit

# Run Python unit tests
pytest services/ml/tests
```

---

## Python ML CLI (`dengueahead`)
```bash
# Display help and available commands
dengueahead --help

# Subcommands:
dengueahead audit-sources    # Check external data source availability and licenses
dengueahead ingest           # Fetch official dengue and weather reports
dengueahead validate-data    # Run data quality and schema validation
dengueahead build-features   # Construct temporal and meteorological lag features
dengueahead train            # Fit baselines and hotspot classification models
dengueahead backtest         # Execute out-of-time rolling evaluation
dengueahead predict          # Generate next-week hotspot predictions
```

