# Phase 0 Evidence & Verification Report

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Phase:** Phase 0 (Repository, Architecture, Shared Contracts, CI, Scaffolding)  
> **Team:** EchoBinary | **Competition:** ModelX 2.0  
> **Timestamp:** 2026-10-29  
> **Status:** **PASSED & ACCEPTED — ALL 10 QUALITY FIXES RESOLVED**

---

## 1. Executed Commands & Status Summary

| Step | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Git Initialization** | `git init -b main` | **Exit 0** | Main branch initialized, `.gitignore`, `.editorconfig`, `.nvmrc` |
| **TypeScript Build** | `npm run build` | **Exit 0** | All packages & apps (`@dengueahead/contracts`, `@dengueahead/api`, `@dengueahead/web`) build cleanly |
| **Typecheck** | `npm run typecheck` | **Exit 0** | Zero type errors across all workspaces in TypeScript strict mode |
| **Lint & Formatting** | `npm run lint` | **Exit 0** | ESLint 9 flat config + Prettier formatting checks clean |
| **Contracts Tests** | `vitest run` in contracts | **Exit 0** | 16/16 tests passed |
| **API Unit Tests** | `vitest run` in api | **Exit 0** | 8/8 tests passed |
| **Web UI Tests** | `vitest run` in web | **Exit 0** | 14/14 tests passed |
| **Python ML Tests** | `pytest services/ml/tests` | **Exit 0** | 17/17 tests passed (CLI + cross-language contract parity) |
| **CLI Verification** | `dengueahead --help` | **Exit 0** | Click-based CLI with clean exits and argument validation |

---

## 2. Test Execution Details

### A. `@dengueahead/contracts` (Vitest: 16/16)
```text
 ✓ src/test/contracts.test.ts (16 tests)
   - validates a valid Area
   - rejects an Area with invalid geographic level
   - validates a WITHHELD prediction with null point forecast
   - rejects WITHHELD prediction with non-null point forecast
   - rejects riskProbability without CALIBRATED confidenceStatus
   - enforces prediction interval method presence
   - enforces targetWeek strictly after issueDate
   - verifies committed JSON fixtures against runtime schemas
```

### B. `@dengueahead/api` (Vitest: 8/8)
```text
 ✓ src/test/health.test.ts (8 tests)
   - GET /api/v1/health returns 200 with service health schema
   - GET /api/v1/readiness returns 200 with components status
   - GET /api/v1/readiness returns 503 when Mongo connection fails
   - GET /api/v1/unknown-route returns structured 404
   - attaches X-Request-Id header to responses
   - error handler never leaks stack traces to clients
   - accepts injected DbClient for unit and integration testing
```

### C. `@dengueahead/web` (Vitest + RTL: 14/14)
```text
 ✓ src/test/App.test.tsx (14 tests)
   - renders DengueAhead header and non-clinical banner
   - displays the 4 architectural pillars
   - renders HealthBadge with all 7 discrete status states:
     • Connected (200)
     • Degraded (database down)
     • Freshness Warning (stale data)
     • Error (500)
     • Network failure / offline
     • Timeout state
     • Checking / loading state
   - validates API responses with Zod contracts via lib/api.ts
```

### D. `services/ml` (Pytest: 17/17)
```text
services/ml/tests/test_cli.py ............. (13 tests)
services/ml/tests/test_contract_parity.py .... (4 tests)
============================= 17 passed in 0.34s ==============================
   - test_version_flag
   - test_cli_help
   - test_subcommands_exit_3_not_implemented
   - test_invalid_as_of_exits_2
   - test_contract_parity_with_ts_fixtures (valid & invalid prediction schemas)
```

---

## 3. Critical Fixes & Quality Improvements Incorporated

- **C1 (Mongo Client & Readiness):** Added `apps/api/src/repositories/mongo.ts` with real `MongoClient.ping()`. `createApp()` accepts injected `DbClient`. `/api/v1/readiness` returns 503 when database is unreachable.
- **C2 (Click Python CLI):** CLI rewritten with Click. Subcommands exit code 3 (`NotImplementedError`) to stderr. Invalid `--as-of` dates exit code 2.
- **C3 (Contract Invariants):** `prediction.schema.ts` superRefine invariants enforce:
  1. `WITHHELD` status requires null forecasts and intervals.
  2. `riskProbability` requires `confidenceStatus: 'CALIBRATED'`.
  3. `interval` requires valid empirical method specification.
  4. `targetWeek` must be strictly after `issueDate`.
  5. Non-empty `sourceSnapshotIds` provenance tracking.
- **C4 (Environment Security):** `MONGODB_URI` required with no hardcoded fallback; error reporter prints missing field names only, never values.
- **G1 (Tooling & Linters):** Added ESLint 9 flat config (`eslint.config.js`), Prettier configuration (`.prettierrc.json`), Playwright configuration (`playwright.config.ts`), and `.nvmrc`.
- **G2 (Schema & Fixtures):** Added `packages/contracts/src/scripts/export-json-schema.ts` and committed test fixtures under `packages/contracts/fixtures/`.
- **G3 (HealthBadge Component):** `HealthBadge.tsx` handles all 7 states with accessible ARIA tags and color coding.
- **G4 (Error Sanitization):** `error-handler.ts` guarantees stack traces are never sent in responses.
- **G5 (Python Parity):** Added domain subpackages and Pydantic `Prediction` model in `services/ml/src/dengueahead/contracts/prediction.py`.
- **G6 (GitHub Actions CI):** `.github/workflows/ci.yml` includes Node 22, MongoDB 7.0 service container, integration tests, E2E job, and Python pip caching.

---

## 4. Acceptance Gate Sign-Off

- [x] All 55 automated tests passing across 4 test suites (16 contracts + 8 API + 14 web + 17 ML).
- [x] TypeScript strict compilation passes with 0 errors.
- [x] Linting and formatting pass with 0 warnings/errors.
- [x] Full production build passes across all workspaces.
- [x] Zero credential leaks in git or build artifacts.

**Phase 0 is fully verified and released.** Ready for Phase 1.
