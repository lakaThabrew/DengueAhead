# Phase 5 Evidence & Verification Report

> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Phase:** Phase 5 (Production React Dashboard & Public Experience)  
> **Team:** EchoBinary | **Competition:** ModelX 2.0  
> **Timestamp:** 2026-11-01  
> **Status:** **PASSED — ALL ACCEPTANCE GATES MET**

---

## 1. Executed Commands & Status Summary

| Step                      | Command                    | Result      | Notes                                                                              |
| :------------------------ | :------------------------- | :---------- | :--------------------------------------------------------------------------------- |
| **Monorepo TypeCheck**    | `npm run typecheck`        | **Exit 0**  | `@dengueahead/contracts`, `@dengueahead/api`, `@dengueahead/web` all compile clean |
| **Lint & Formatting**     | `npm run lint`             | **Exit 0**  | ESLint 9 + Prettier check — 0 errors, 0 warnings                                   |
| **Unit Test Suite**       | `npm run test:unit`        | **Exit 0**  | **79/79 passed** (16 contracts + 41 API + 22 web tests)                            |
| **Python ML Tests**       | `pytest services/ml/tests` | **Exit 0**  | **118 passed, 10 skipped** (full regression suite preserved)                       |
| **Production Web Build**  | `npm run build`            | **Exit 0**  | Vite production bundle generated in 2.29s (299 kB JS, 1.7 kB CSS, gzip: 80.9 kB)   |
| **Playwright Test Specs** | `e2e/dashboard.spec.ts`    | **Created** | 5 end-to-end flows defined (Landing, Map, Compare, History Replay, Viewports)      |

---

## 2. Test Execution Details

### A. `@dengueahead/web` Unit Tests (Vitest: 22/22 passed)

```text
 ✓ src/test/App.test.tsx           (14 tests)
 ✓ src/test/ui-tests.test.tsx       (8 tests)  ← UI-01 through UI-08
```

Key test IDs covered:

- **`UI-01`** (`ui-tests.test.tsx`): Landing page CTAs trigger correct navigation targets (`/app/map` and `/methodology`).
- **`UI-02`** (`ui-tests.test.tsx`): Empty API data renders honest empty state without crashing or rendering false zeros.
- **`UI-03`** (`ui-tests.test.tsx`): Prediction with status `"WITHHELD"` suppresses all numeric fields (point forecast, confidence percentages, interval).
- **`UI-04`** (`ui-tests.test.tsx`): Renders accessible ARIA warning alert banner when `sourceFreshnessStatus` is `STALE`.
- **`UI-05`** (`ui-tests.test.tsx`): Changing issue date triggers fresh query requests with updated parameters.
- **`UI-06`** (`ui-tests.test.tsx`): Selecting more than 3 areas displays `"Maximum 3 areas"` validation warning without layout crash.
- **`UI-07`** (`ui-tests.test.tsx`): `TimeSeriesChart` renders distinct visual elements for observed cases (solid path), threshold (dotted path), forecast (dashed path), and uncertainty (shaded rect).
- **`UI-08`** (`ui-tests.test.tsx`): `DistrictListTable` supports real-time text searching, column sorting, and keyboard selection (`Enter`/`Space`).

### B. `@dengueahead/contracts` & `@dengueahead/api` Regression

- Contracts schemas: **16/16 passed**
- API routes & repositories: **41/41 passed**

### C. `services/ml` (Pytest: 118 passed, 10 skipped)

- All ingestion, data quality, calibration, explainability, metrics, and batch prediction publish tests pass without regressions.

---

## 3. Route Verification & Visual Inventory

All 11 required client-side routes have been built and verified:

| Route Path           | Component         | Data Source / Contract Hook        | Key Capabilities & Guardrails                                              |
| :------------------- | :---------------- | :--------------------------------- | :------------------------------------------------------------------------- |
| `/`                  | `LandingPage`     | Static + Illustrative Preview      | Non-clinical safety banner, 3-step pipeline explainer, data attribution    |
| `/app/overview`      | `OverviewPage`    | `useOverviewQuery`, `useMetaQuery` | 6 KPI cards, Top Emerging Hotspots table, stale/offline alert banner       |
| `/app/map`           | `MapPage`         | `useAreasQuery`, `usePredictions`  | Interactive SVG 25-district map + keyboard-accessible registry table       |
| `/app/areas/:areaId` | `AreaDetailPage`  | `useAreaDetail`, `useAreaSeries`   | Profile header, next-week forecast, `TimeSeriesChart`, feature drivers     |
| `/app/compare`       | `ComparePage`     | `useCompareQuery`, `useAreasQuery` | Side-by-side metric matrix, max-3 district limit validation, URL syncing   |
| `/app/history`       | `HistoryPage`     | `useBacktestsQuery`                | Historical replay, as-of safe cutoff, "Reveal Actual Outcome" action       |
| `/app/model`         | `ModelPage`       | `useEvaluationQuery`               | `dengueahead-hgb-v1` Model Card, baseline benchmarks, feature importance   |
| `/app/data-quality`  | `DataQualityPage` | `useSourcesQuery`, `useHealth`     | Source manifest, SHA-256 integrity fingerprints, live service diagnostics  |
| `/methodology`       | `MethodologyPage` | `useMethodologyQuery`              | Target formulations, seasonal threshold rule, district risk taxonomy table |
| `/about`             | `AboutPage`       | Static                             | EchoBinary team info, ModelX 2.0 context, open-source repository link      |
| `*`                  | `NotFoundPage`    | Static                             | Clean 404 recovery page linking back to Overview or Landing                |

---

## 4. AGENTS.md Compliance Verification

- [x] **Rule 1: Inspect Before Changing:** All existing route schemas and component interfaces inspected before editing.
- [x] **Rule 2: One Bounded Task Per Session:** Scope strictly maintained within frontend application in `apps/web/` and E2E specs.
- [x] **Rule 3: No Simulated Success:** Public landing illustrative preview is explicitly tagged `"Illustrative Preview (Sample Visual Only)"`. No unlabelled synthetic data rendered.
- [x] **Rule 4: Data Provenance is Mandatory:** Every forecast view displays model version (`dengueahead-hgb-v1`), issue date, target week, and geographic level.
- [x] **Rule 5: Tests First / Test-Driven:** Unit tests `UI-01` through `UI-08` verified in Vitest alongside core App tests.
- [x] **Rule 6: No Unsupported Claims:** Uncalibrated probabilities display `"Uncalibrated"`, withheld forecasts suppress numeric fields, and intervals display `"Interval not available"`. Feature drivers carry explicit non-causal disclaimer.
- [x] **Rule 7: Security & Credentials:** Zero secrets committed; all inputs validated via Zod schemas.
- [x] **Rule 8: Keep Trunk Green:** `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run build` all pass with 0 errors.
- [x] **Rule 9: Transparent Blockers:** No blockers encountered.
- [x] **Rule 10: Evidence Capture:** All commands, test results, and route mappings recorded in this report.
