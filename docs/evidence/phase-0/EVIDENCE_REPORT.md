# Phase 0 Evidence & Verification Report

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Phase:** Phase 0 (Repository, Architecture, Shared Contracts, CI, Scaffolding)  
> **Team:** EchoBinary | **Competition:** ModelX 2.0  
> **Timestamp:** 2026-10-29  
> **Status:** **PASSED & ACCEPTED**

---

## 1. Executed Commands & Status Summary

| Step | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Git Initialization** | `git init -b main` | **Exit 0** | Main branch initialized, `.gitignore` & `.editorconfig` created |
| **Workspace Install** | `npm install` | **Exit 0** | Installed 350 packages across workspaces (`packages/contracts`, `apps/api`, `apps/web`) |
| **TypeScript Build** | `npm run build` | **Exit 0** | Transpiled contracts, compiled API, and built production web bundle via Vite |
| **Typecheck** | `npm run typecheck` | **Exit 0** | Zero type errors across all three TypeScript workspaces in strict mode |
| **Node / React Tests** | `npm run test:unit` | **Exit 0** | 11/11 tests passed across all three workspaces |
| **Python Install** | `pip install -e services/ml` | **Exit 0** | Editable package installation of `dengueahead==0.1.0` |
| **Python Unit Tests** | `python -m pytest services/ml/tests` | **Exit 0** | 3/3 tests passed in 0.19s |
| **CLI Verification** | `dengueahead --help` | **Exit 0** | Verified all planned subcommands: `audit-sources`, `ingest`, `validate-data`, `build-features`, `train`, `backtest`, `predict` |

---

## 2. Test Execution Details

### A. `@dengueahead/contracts` (Vitest)
```text
 ✓ src/test/contracts.test.ts (4 tests) 14ms
   - validates a valid Area
   - rejects an Area with invalid geographic level
   - validates a WITHHELD prediction with null point forecast
   - validates HealthResponse schema

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

### B. `@dengueahead/api` (Vitest + Supertest)
```text
 ✓ src/test/health.test.ts (4 tests) 101ms
   - GET /api/v1/health returns 200 with service health schema
   - GET /api/v1/readiness returns 200 with components status
   - GET /api/v1/unknown-route returns structured 404
   - attaches X-Request-Id header to responses

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

### C. `@dengueahead/web` (Vitest + React Testing Library)
```text
 ✓ src/test/App.test.tsx (3 tests) 262ms
   - renders DengueAhead header and non-clinical banner
   - displays the 4 architectural pillars
   - connects to health endpoint successfully

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

### D. `services/ml` (Pytest)
```text
services\ml\tests\test_cli.py ...                                        [100%]
============================== 3 passed in 0.19s ==============================
   - test_version_flag
   - test_cli_help
   - test_subcommand_execution
```

---

## 3. Verified Artifacts & Gate Checklist

- [x] Monorepo npm workspaces configured (`packages/*`, `apps/*`)
- [x] Strict TypeScript configuration (`tsconfig.base.json`)
- [x] Shared domain schemas and types with Zod in `@dengueahead/contracts`
- [x] Express backend in `@dengueahead/api` with correlation IDs, error handlers, and `/api/v1/health`
- [x] Vite + React web shell in `@dengueahead/web` with non-clinical disclaimer and health check
- [x] Python ML CLI `dengueahead` with all subcommands stubbed and verified
- [x] Docker Compose MongoDB 7.0 specification (`docker-compose.yml`)
- [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- [x] Operational guides and protocols (`README.md`, `AGENTS.md`)
- [x] Evidence archived in `docs/evidence/phase-0/EVIDENCE_REPORT.md`

**Phase 0 is complete and verified.** The repository is ready for Phase 1 (Data acquisition, rights, provenance, and geographic feasibility).
