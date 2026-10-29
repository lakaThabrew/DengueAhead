# Phase 0 Implementation Plan — DengueAhead

> **Document:** Phase 0 Implementation Specification (revision 2 — aligned with `IMPLEMENTATION_PLAN.md`)  
> **Location:** `plans/PHASE_0_IMPLEMENTATION_PLAN.md`  
> **Project:** DengueAhead — Early Warning for Emerging Dengue Hotspots in Sri Lanka  
> **Team:** EchoBinary | **Competition:** ModelX 2.0 | **Domain:** Health & Wellbeing (population-level, non-clinical)  
> **Implementation window:** 29 October 2026 (first block)  
> **Stack:** React + TypeScript (Vite), Node.js + TypeScript (Express 5), Python 3.12 (`dengueahead` CLI, click), MongoDB 7, Docker Compose  
> **Precedence:** If this document and `IMPLEMENTATION_PLAN.md` (the master plan) disagree, the master plan wins; fix this document.

---

## 1. Executive Summary & Objective

Phase 0 builds the foundational infrastructure of the repository. By the end, any developer or evaluator must be able to clone the repo, follow the README, and verify that `contracts`, `api`, `web` and `ml` build, lint, type-check, pass unit tests, and connect end-to-end (Mongo → API → web).

Phase 0 contains **no business logic**: no real or synthetic epidemiological data is ingested, displayed, or forecast. The only data are test fixtures, labeled synthetic and used in tests only.

### Non-negotiables

1. **Zero-ambiguity shared contracts.** Schemas for `Area`, `WeeklyObservation`, `SourceSnapshot`, `Prediction`, `EvaluationMetrics` and the API envelope types live in `packages/contracts` (Zod + TypeScript), mirror the master plan's data design (§3) and API contract (§5), and enforce the provenance and "no unsupported claims" rules in code.
2. **Independent testability.** Node packages and the Python package test independently with no circular dependencies. No test needs a live external network.
3. **Reproducibility.** On a fresh clone, the documented commands (§6) pass with no hidden manual steps.
4. **Transparent governance.** `.gitignore`, `.env.example`, `README.md`, `AGENTS.md`, CI and evidence folders exist before any application logic is written.
5. **No simulated success.** Python CLI stubs must fail loudly ("not implemented"), never print fake success.

---

## 2. Resolved Technical Decisions

These were ambiguous in revision 1. They are now fixed so parallel agents do not diverge.

| Topic                      | Decision                                                                                                | Rationale                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Node version               | Node 22 LTS (`.nvmrc` = `22`, `engines.node >= 22`)                                                     | Single pinned runtime in local + CI                |
| Module system              | ESM everywhere (`"type": "module"`), `module: NodeNext` for Node packages, `Bundler` resolution for web | One system; avoids dual-package issues             |
| Express                    | Express **5.x**                                                                                         | Stable; async handler errors propagate natively    |
| Validation                 | Zod (v4 line)                                                                                           | Single source of truth; native `z.toJSONSchema`    |
| Contracts consumption      | `exports` points at compiled `dist/`; build order enforced by root scripts (§3.2)                       | `npm run <x> --workspaces` is not dependency-aware |
| Python CLI framework       | `click` (group named `cli`)                                                                             | Matches `dengueahead.cli.main:cli` entrypoint      |
| Python ↔ TS contract drift | Shared JSON fixtures consumed by both Zod tests and pytest, plus committed JSON Schema                  | Guards against the two type systems diverging      |
| Logging                    | `pino` + `pino-http` (structured JSON)                                                                  | Structured logs with correlation ID                |
| Mongo driver               | Official `mongodb` driver, used only for readiness ping in Phase 0                                      | Keeps API able to start while Mongo is down        |
| Health vs readiness        | `/health` = liveness only (no DB). `/readiness` = DB check; **503** when any component is down          | Master §5, E2E-13                                  |
| Lint/format                | ESLint (flat config) + Prettier at repo root; Ruff for Python                                           | Master Phase 0 requirement                         |
| Browser tests              | Playwright at repo root `e2e/`                                                                          | Master Phase 0 + §6                                |
| Repo directory names       | Lowercase `plans/`; master plan file is `IMPLEMENTATION_PLAN.md` at repo root                           | Case-sensitive filesystems/CI; master §1           |

---

## 3. Target Monorepo Architecture & Directory Layout

```text
DengueAhead/
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc                              # 22
├── .prettierrc.json / .prettierignore
├── eslint.config.js                    # flat config, TS + React + a11y rules
├── .github/
│   └── workflows/ci.yml                # node, python, e2e jobs
├── docker-compose.yml                  # service `mongodb` (mongo:7.0)
├── package.json                        # npm workspaces + stable root scripts
├── tsconfig.base.json
├── playwright.config.ts
├── README.md
├── AGENTS.md
├── IMPLEMENTATION_PLAN.md              # master plan
├── plans/
│   └── PHASE_0_IMPLEMENTATION_PLAN.md  # this document
├── configs/
│   ├── sources.yaml                    # TEMPLATE; all licenceStatus: unverified
│   └── model.yaml                      # TEMPLATE; no tuned values
├── e2e/
│   └── shell.spec.ts                   # Playwright smoke: web → API health
├── scripts/                            # {dev,seed-test,run-ingestion,train,backtest,predict,smoke}/ (.gitkeep)
├── packages/
│   └── contracts/
│       ├── package.json
│       ├── tsconfig.json
│       ├── json-schema/                # generated, committed, drift-checked
│       ├── fixtures/                   # TEST-ONLY synthetic JSON (valid/ + invalid/) + README.md
│       └── src/
│           ├── index.ts
│           ├── common.schema.ts        # ids, ISO dates, QualityFlag, Level enum
│           ├── area.schema.ts
│           ├── observation.schema.ts   # WeeklyObservation
│           ├── source.schema.ts
│           ├── prediction.schema.ts
│           ├── evaluation.schema.ts
│           ├── api.schema.ts           # health, readiness, error, pagination
│           ├── scripts/export-json-schema.ts
│           └── *.test.ts
├── apps/
│   ├── api/
│   │   ├── package.json / tsconfig.json / tsconfig.build.json
│   │   └── src/
│   │       ├── server.ts               # entrypoint; env load; graceful exit
│   │       ├── app/createApp.ts        # app factory (dependency-injected)
│   │       ├── config/env.ts           # loadEnv(source) – pure, testable
│   │       ├── routes/health.route.ts  # /health, /readiness
│   │       ├── middleware/             # requestId, logger, cors, rateLimit, notFound, errorHandler, readOnly
│   │       ├── repositories/mongo.ts   # connection + ping(); lazy
│   │       ├── controllers/ services/ schemas/   # .gitkeep (reserved per master layout)
│   │       └── test/                   # env.test.ts, health.test.ts, readiness.test.ts, errors.test.ts, readiness.integration.test.ts
│   └── web/
│       ├── package.json / tsconfig.json / vite.config.ts / index.html
│       └── src/
│           ├── main.tsx
│           ├── app/App.tsx
│           ├── components/             # Badge, Card, Button, StatusBadge
│           ├── features/health/        # useHealth hook + HealthBadge
│           ├── pages/ lib/             # lib/api.ts (typed fetch + contract validation)
│           ├── styles/index.css        # tokens + Inter via @fontsource/inter
│           └── test/                   # App.test.tsx, HealthBadge.test.tsx, setup.ts
├── services/
│   └── ml/
│       ├── pyproject.toml
│       ├── src/dengueahead/
│       │   ├── __init__.py             # __version__
│       │   ├── cli/{__init__.py,main.py}
│       │   ├── common/logging.py
│       │   ├── contracts/prediction.py # pydantic Prediction (parity with Zod)
│       │   └── {ingestion,validation,features,training,evaluation,inference}/__init__.py
│       └── tests/
│           ├── conftest.py
│           ├── fixtures/               # (symlink-free) tests read ../../packages/contracts/fixtures
│           ├── integration/            # .gitkeep
│           └── unit/{test_cli.py,test_contract_parity.py}
├── data/{manifests,samples}/           # .gitkeep
├── artifacts/                          # .gitkeep
└── docs/
    └── evidence/phase-0/               # verification log, report, screenshots
```

---

## 4. Detailed Work Breakdown

### Task 0.1 — Repository & environment initialization

1. `git init -b main`.
2. `.gitignore` must cover: `node_modules/`, `dist/`, `build/`, `coverage/`, `playwright-report/`, `test-results/`, `.venv/`, `__pycache__/`, `*.egg-info/`, `.pytest_cache/`, `.ruff_cache/`, `.env`, `.env.*` (except `.env.example`), OS files (`.DS_Store`, `Thumbs.db`), editor folders, `data/raw/`, large model binaries in `artifacts/` (`artifacts/**/*.pkl|*.joblib|*.bin`, keeping `.gitkeep` and metadata JSON), and mongo dumps.
3. `.editorconfig`: UTF-8, LF, final newline, 2 spaces for JS/TS/JSON/YAML/MD, 4 spaces for Python.
4. `.nvmrc` = `22`.
5. `.env.example` (no real secrets; each var commented):

   | Variable                                  | Example                                      | Consumer                                                             |
   | ----------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
   | `NODE_ENV`                                | `development`                                | api                                                                  |
   | `PORT`                                    | `4000`                                       | api                                                                  |
   | `LOG_LEVEL`                               | `info`                                       | api                                                                  |
   | `MONGODB_URI`                             | `mongodb://localhost:27017/dengueahead`      | api (**read-only** credential in non-dev) — **required, no default** |
   | `ML_MONGODB_WRITE_URI`                    | `mongodb://localhost:27017/dengueahead`      | Python jobs (separate write credential; never used by API)           |
   | `MONGODB_TEST_URI`                        | `mongodb://localhost:27017/dengueahead_test` | integration tests only                                               |
   | `CORS_ORIGIN`                             | `http://localhost:5173`                      | api (comma-separated allowlist)                                      |
   | `API_BODY_LIMIT`                          | `100kb`                                      | api                                                                  |
   | `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `60000` / `120`                              | api                                                                  |
   | `VITE_API_BASE_URL`                       | `http://localhost:4000/api/v1`               | web                                                                  |

6. `docker-compose.yml`:
   - Service **`mongodb`** (name is mandatory: master runs `docker compose up -d mongodb`), image `mongo:7.0`.
   - Port `127.0.0.1:27017:27017` (loopback only).
   - Named volume `mongodb_data`.
   - Healthcheck: `mongosh --quiet --eval "db.adminCommand('ping').ok"` (interval 5s, retries 10).
   - README notes that auth is off for local dev only and credentials/roles are introduced in Phase 4.

### Task 0.2 — Root workspace, scripts and tooling

1. Root `package.json` (`private`, `"type": "module"`, `engines.node >=22`, workspaces `packages/*`, `apps/*`).
2. **Scripts** — all use `--if-present` so a workspace without a script never breaks the run, and `contracts` is always built first because `api`/`web` import its `dist/`:

   ```json
   {
     "scripts": {
       "build:contracts": "npm run build -w @dengueahead/contracts",
       "build": "npm run build:contracts && npm run build -w @dengueahead/api -w @dengueahead/web",
       "typecheck": "npm run build:contracts && npm run typecheck --workspaces --if-present",
       "lint": "eslint . && prettier --check .",
       "format": "prettier --write .",
       "test:unit": "npm run build:contracts && npm run test:unit --workspaces --if-present",
       "test:integration": "npm run build:contracts && npm run test:integration --workspaces --if-present",
       "test:e2e": "playwright test",
       "dev": "concurrently -n api,web \"npm run dev:api\" \"npm run dev:web\"",
       "dev:api": "npm run dev -w @dengueahead/api",
       "dev:web": "npm run dev -w @dengueahead/web",
       "test:py": "python -m pytest services/ml/tests"
     }
   }
   ```

3. `tsconfig.base.json`: `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `esModuleInterop: true`, `forceConsistentCasingInFileNames: true`, `isolatedModules: true`, `skipLibCheck: true`, `target: ES2022`.
4. ESLint flat config (typescript-eslint, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`) and Prettier config at the root. Python linting is Ruff (Task 0.6).
5. Playwright installed at root with `playwright.config.ts` using `webServer` entries to start API (port 4000) and web (port 5173).
6. `configs/sources.yaml` and `configs/model.yaml` templates. `sources.yaml` lists the sources from master §0 (NDCU weekly reports, Open-Meteo archive, DCS population) with `licenceStatus: unverified`, `verified: false`, and a header comment: _"Template. Nothing here is verified. Phase 1 must audit access, robots/terms and reuse rights before ingestion."_ `model.yaml` holds only placeholder keys with `null` values, and no tuned numbers.

### Task 0.3 — `@dengueahead/contracts`

**Package:** ESM, `exports` → `dist/index.js` + `dist/index.d.ts`, scripts: `build` (tsc), `typecheck`, `test:unit` (vitest), `schema:export`. Exports Zod schemas **and** inferred types (`export type Prediction = z.infer<typeof PredictionSchema>`).

**Common (`common.schema.ts`)**: `AreaId` (non-empty stable code; not a display name), `IsoDate` (`YYYY-MM-DD`), `IsoInstant` (UTC ISO-8601), `GeographicLevel` (`'district' | 'moh'`), `QualityFlag` (string matching `^[A-Z][A-Z0-9_]*$`, e.g. `INSUFFICIENT_SOURCE_COVERAGE`).

**Schemas** (fields follow master §3 collections and §5 API):

| Schema                    | Fields and rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AreaSchema`              | `areaId`, `name`, `level`, `parentAreaId` (nullable), `centroid` (`{lat, lon}` nullable, range-checked), `geometryRef` (nullable), `population` (nonneg int, **nullable**), `populationYear` (nullable; required iff `population` non-null)                                                                                                                                                                                                                                     |
| `WeeklyObservationSchema` | `areaId`, `weekStart`, `weekEnd` (= `weekStart`+6d), `cases` (**nonneg int or `null`**), `missingReason` (required iff `cases` null, else absent/null), `sourceSnapshotId`, `reportedAt`, `revision` (int ≥ 1), `qualityFlags`. **`0` never represents missing.**                                                                                                                                                                                                               |
| `SourceSnapshotSchema`    | `sourceId`, `sourceUrl`, `observedPeriod` (`{from,to}`), `retrievedAt`, `sha256` (64 hex), `licenceStatus` (`'verified_open' \| 'permission_granted' \| 'restricted' \| 'unverified'`), `parserVersion`, `status` (`'success' \| 'partial' \| 'failed'`), `error` (nullable; required iff `status !== 'success'`)                                                                                                                                                               |
| `PredictionSchema`        | `areaId`, `geographicLevel`, `issueDate`, `targetWeek`, `asOfDate` (≤ `issueDate`), `modelVersion`, `status` (`EMERGING \| PERSISTENT \| COOLING \| STABLE \| WITHHELD`), `pointForecast` (nonneg or null), `interval` (null or `{lower, upper, method, coverage}` with `0 ≤ lower ≤ upper`, `coverage ∈ (0,1)`), `riskProbability` (null or `[0,1]`), `confidenceStatus` (`'CALIBRATED' \| 'UNCALIBRATED' \| 'NOT_AVAILABLE'`), `qualityFlags`, `sourceSnapshotIds` (string[]) |
| `EvaluationMetricsSchema` | `modelVersion`, `trainedAt`, `trainRange`, `testRange` (`{from,to}`), `targetDefinition`, `featureVersion`, `artifactSha256` (nullable for baselines), `metrics` (`mae`, `topKRecall` + `k`, `precision`, `recall`, `leadTimeWeeks`, `brierScore` — **each nullable** = "not supported/not computed"), `baselinesComparison` (must contain all of `last_observation`, `rolling_average`, `seasonal`, each with its own `metrics`)                                               |

**Cross-field invariants (enforced with `superRefine`, each with a unit test):**

- `WITHHELD` ⇒ `pointForecast`, `interval`, `riskProbability` are all `null`, `qualityFlags` non-empty. Never coerced to `0`.
- `riskProbability !== null` ⇒ `confidenceStatus === 'CALIBRATED'` (no uncalibrated percentages).
- `interval !== null` ⇒ `method` and `coverage` present (no undocumented intervals).
- Any status other than `WITHHELD` ⇒ `sourceSnapshotIds.length ≥ 1` and `pointForecast !== null` (provenance is mandatory).
- `targetWeek` is later than `issueDate`.

**API envelope types (`api.schema.ts`):**

| Schema                                       | Shape                                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HealthResponseSchema`                       | `{ status: 'ok' \| 'degraded' \| 'error', apiVersion: string, timestamp: IsoInstant }` (master §5: `status`, `apiVersion`; §5 requires timestamps)                   |
| `ReadinessResponseSchema`                    | `{ status: 'ok' \| 'error', apiVersion, timestamp, components: { database: { status: 'up' \| 'down', latencyMs: number \| null } } }` — `status: 'error'` ⇔ HTTP 503 |
| `ErrorResponseSchema`                        | `{ error: { code: string, message: string, requestId: string } }`                                                                                                    |
| `PaginationQuerySchema` / `PageSchema(item)` | `limit` (int 1–100, default 50), `cursor` (optional opaque string); page = `{ items, nextCursor \| null }`                                                           |

**JSON Schema & parity:**

- `npm run schema:export -w @dengueahead/contracts` writes `json-schema/*.json` using `z.toJSONSchema`. Files are committed; a test regenerates them and fails on drift.
- JSON Schema cannot express the `superRefine` invariants, so the **fixtures are the cross-language contract**: `fixtures/valid/*.json` must parse, `fixtures/invalid/*.json` must be rejected, in **both** Zod tests (TS) and pytest (Python, Task 0.6).
- `fixtures/README.md` states: _"Synthetic, test-only data. Not real surveillance data. Never import into any dashboard, database seed for production, or demo."_ Fixtures use obviously fake IDs (`TEST_AREA_001`). The sample WITHHELD shape from master §5 is one valid fixture.

### Task 0.4 — `@dengueahead/api`

**Dependencies:** `express@5`, `zod`, `cors`, `helmet`, `express-rate-limit`, `pino`, `pino-http`, `mongodb`, `@dengueahead/contracts`; dev: `vitest`, `supertest`, `tsx`, `@types/*`.

**Scripts:** `dev` (`tsx watch src/server.ts`), `build` (`tsc -p tsconfig.build.json`, tests excluded), `typecheck`, `test:unit` (excludes `*.integration.test.ts`), `test:integration` (only `*.integration.test.ts`, needs Mongo).

1. **`config/env.ts`** — `loadEnv(source: NodeJS.ProcessEnv): Env` using Zod. `MONGODB_URI` is **required** (must start with `mongodb://` or `mongodb+srv://`); `PORT`, `CORS_ORIGIN`, rate-limit and body-limit values are validated and defaulted. On failure, `server.ts` prints an informative list of **field names and reasons only** (never values, to avoid leaking credentials) and exits with code 1.
2. **`app/createApp.ts`** — `createApp({ env, db })` factory; `db` is an injected `{ ping(): Promise<{ latencyMs: number }> }` so tests use a fake. Middleware order:
   1. request ID: accept inbound `X-Request-Id` only if it matches `^[A-Za-z0-9-]{8,64}$`, else generate UUID; echo in response header and logger context;
   2. `pino-http` structured JSON logging (no request bodies, no secrets);
   3. `helmet`;
   4. `cors` with allowlist from `CORS_ORIGIN` (no wildcard);
   5. `express.json({ limit })`;
   6. read-only guard: methods other than `GET`, `HEAD`, `OPTIONS` return `405 METHOD_NOT_ALLOWED` in the standard error shape (master §5: only read endpoints are public);
   7. rate limiting on `/api/v1` (configurable; `/health` exempt);
   8. router mounted at `/api/v1`;
   9. 404 handler → `404 NOT_FOUND` standard error;
   10. global error handler → `{ error: { code, message, requestId } }`; never returns stack traces; unknown errors become `500 INTERNAL_ERROR` with a generic message.
3. **`routes/health.route.ts`**
   - `GET /api/v1/health` → `200 { status: 'ok', apiVersion, timestamp }`. Does **not** touch the DB. Response validated against `HealthResponseSchema` in tests.
   - `GET /api/v1/readiness` → pings Mongo with a 2 s timeout. Up ⇒ `200` with `status: 'ok'`. Down/timeout ⇒ **`503`** with `status: 'error'`, `components.database.status: 'down'`, `latencyMs: null`. Never returns `200` with an empty or false-success body.
4. **`repositories/mongo.ts`** — lazy `MongoClient`; the API must **start and serve `/health` even when Mongo is down**.
5. **`server.ts`** — loads env, creates app, listens, handles `SIGTERM`/`SIGINT` with graceful close.

### Task 0.5 — `@dengueahead/web`

**Dependencies:** `react`, `react-dom`, `@dengueahead/contracts`, `@fontsource/inter` (openly licensed, self-hosted); dev: `vite`, `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`.

**Scripts:** `dev`, `build` (`tsc --noEmit && vite build`), `typecheck`, `test:unit`.

1. **`styles/index.css`** — design tokens as CSS variables, with roles from master §4:

   | Token             | Value     | Role              |
   | ----------------- | --------- | ----------------- |
   | `--color-navy`    | `#0B1730` | text              |
   | `--color-blue`    | `#2563EB` | primary           |
   | `--color-teal`    | `#0D9488` | positive / stable |
   | `--color-amber`   | `#D97706` | emerging          |
   | `--color-coral`   | `#DC4754` | persistent / high |
   | `--color-surface` | `#F5F7FB` | surface           |
   | `--color-white`   | `#FFFFFF` | card              |

   Inter font, 16 px base, 8-pt spacing scale, visible focus ring, and no horizontal overflow at 360 / 768 / 1024 / 1440 px.

2. **`app/App.tsx`** — semantic landmarks (`header`, `main`, `footer`), one `h1`, skip link.
   - Header: DengueAhead wordmark and tagline _"See the next hotspot before it emerges."_
   - Persistent **non-clinical advisory**: _"Educational decision support for public-health planning. Not a clinical tool or an official warning service."_
   - Main: a "Phase 0 — foundation ready" panel and system status. **No metrics, maps, charts, or case numbers of any kind**; none are shown, not even placeholders.
3. **`features/health/HealthBadge`** — fetches `GET {VITE_API_BASE_URL}/health` via `lib/api.ts`, **validating the response with `HealthResponseSchema`**. States: `loading`, `ok`, `degraded`, `error`, `unreachable` (network/non-2xx), `invalid` (schema mismatch), `not-configured` (`VITE_API_BASE_URL` missing). Each state shows an **icon + text label**, not colour alone, inside an `aria-live="polite"` region. It never shows "live" or "healthy" on failure.
4. **Tests** (`src/test`):
   - App renders landmarks, heading, and advisory text.
   - HealthBadge renders every state above (mocked `fetch`), including malformed JSON and `503`.
   - `vitest-axe`: no violations on the rendered shell.

### Task 0.6 — `services/ml` (Python 3.12)

1. **`pyproject.toml`**: `requires-python = ">=3.12"`; src layout; dependencies `click`, `pydantic`; **`[project.optional-dependencies] dev = [pytest, ruff, jsonschema]`** so that `python -m pip install -e 'services/ml[dev]'` (master §9) works. Console script:
   ```toml
   [project.scripts]
   dengueahead = "dengueahead.cli.main:cli"
   ```
   Ruff config in `pyproject.toml` (lint + format, line length 100). `pytest` config sets `testpaths`.
2. **`cli/main.py`** — click group `cli` with `--version` (reads `dengueahead.__version__`) and these subcommands, with the exact options from master §9:

   | Command          | Options                                 |
   | ---------------- | --------------------------------------- |
   | `audit-sources`  | `--config PATH`                         |
   | `ingest`         | `--config PATH`                         |
   | `validate-data`  | —                                       |
   | `build-features` | `--as-of YYYY-MM-DD`                    |
   | `train`          | `--config PATH`                         |
   | `backtest`       | `--config PATH`                         |
   | `predict`        | `--as-of YYYY-MM-DD` `--publish` (flag) |

   **Every stub validates its options, then prints `<command>: not implemented (planned for Phase N)` to stderr and exits with code 3.** No stub may print success or create output. Phase mapping: audit-sources/ingest/validate-data → 1, build-features → 2, train/backtest → 3, predict → 4.

3. **`common/logging.py`** — structured logging helper (JSON lines to stderr).
4. **Package skeleton** — empty `ingestion`, `validation`, `features`, `training`, `evaluation`, `inference` subpackages (`__init__.py` only) so agent ownership paths in master §1 exist.
5. **`contracts/prediction.py`** — pydantic `Prediction` model implementing the **same invariants** as the Zod schema (Task 0.3). Other models are added when their phase needs them.
6. **Tests** (`tests/unit`):
   - `test_cli.py`: `--help` exits 0 and lists **all seven** subcommands; `--version` exits 0 and prints the version; each stub exits **3** and mentions "not implemented"; invalid `--as-of` is rejected with a usage error (exit 2).
   - `test_contract_parity.py`: loads every file in `packages/contracts/fixtures/valid/prediction*.json` → must validate; every file in `fixtures/invalid/prediction*.json` → must be rejected. Also validates valid fixtures against `json-schema/prediction.json` via `jsonschema`.

### Task 0.7 — CI (`.github/workflows/ci.yml`)

Triggers: `pull_request` and `push` to `main`. `concurrency` cancels superseded runs. Caching via `actions/setup-node` (`cache: npm`) and `actions/setup-python` (`cache: pip`). No test step depends on a live external network (installs excepted).

| Job      | Steps                                                                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node`   | `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test:unit` → `npm run build`; **services: `mongo:7.0`** → `npm run test:integration` with `MONGODB_TEST_URI`; upload test reports; `npm audit --omit=dev` (informational) |
| `python` | Python 3.12; `pip install -e 'services/ml[dev]'` → `ruff check` → `ruff format --check` → `python -m pytest services/ml/tests`; upload JUnit report                                                                                  |
| `e2e`    | `npm ci` → install Playwright Chromium → start Mongo service → `npm run test:e2e`; upload `playwright-report/`                                                                                                                       |

### Task 0.8 — Documentation, AGENTS.md, evidence

1. **`README.md`**: purpose and non-clinical statement; architecture diagram (master §3 mermaid, simplified); prerequisites (Node 22, Python 3.12, Docker); exact setup/run/verify commands from §6; env var table; repo layout; link to `IMPLEMENTATION_PLAN.md`; status badge placeholder for CI; data attribution placeholder.
2. **`AGENTS.md`**: the master §1 operating protocol distilled: read the plans first, one bounded task per branch, no simulated success, synthetic data only in clearly labeled test fixtures, provenance mandatory, no unsupported claims (no uncalibrated probabilities, no invented intervals/SHAP/weather), no secrets in git, no open write/admin endpoints, working trunk rules, blocked-task reporting, handoff format, "no agent marks its own work accepted".
3. **Evidence** (`docs/evidence/phase-0/`):
   - `phase-0-verification.log` — raw output of the verification run (§5 commands).
   - `phase-0-report.md` — date, `git rev-parse HEAD`, OS/Node/Python/Docker versions, every command run with pass/fail counts, failure-injection results, open defects, and manual-check results.
   - `screenshots/` — web shell in `ok` and `unreachable` states.
4. `data/manifests`, `data/samples`, `artifacts`, `scripts/*` kept with `.gitkeep`.

### Task 0.9 — Human / manual tasks (cannot be automated or self-accepted)

- [ ] Every team member clones the repo and runs the README commands successfully; record who and when in the report.
- [ ] Decide code ownership and branch rules (one bounded task per branch/PR; issue IDs such as `DATA-01`, `ML-02`, `API-03`); create the issue board.
- [ ] Confirm the 5 Nov 2026 deadline with the organisers and check current submission upload requirements.
- [ ] Create the remote repository; make it **public by submission**, not necessarily now.
- [ ] Decide whether `ModelX-2.0-Proposal-EchoBinary.pdf` moves to `docs/proposal/` (public) or stays out of the repo.
- [ ] Independent verification of this phase by someone other than the implementing agent.

---

## 5. Verification and Testing Matrix

| Test ID      | Level        | Target      | Expected result                                                                                                                                                                                                                                                                                                              | Command                                                                       |
| ------------ | ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `TEST-P0-01` | Unit         | contracts   | Valid fixtures parse; each invalid fixture is rejected: probability outside [0,1], negative count, `cases: null` without `missingReason`, `WITHHELD` with non-null forecast, uncalibrated `riskProbability`, interval without method/coverage, non-withheld prediction without `sourceSnapshotIds`, malformed `areaId`/dates | `npm run test:unit -w @dengueahead/contracts`                                 |
| `TEST-P0-02` | Unit         | contracts   | Regenerated JSON Schema equals committed `json-schema/` (no drift)                                                                                                                                                                                                                                                           | same                                                                          |
| `TEST-P0-03` | Unit         | api         | `loadEnv` **rejects missing `MONGODB_URI`**, invalid URI scheme, invalid `PORT`; error output lists field names but not values                                                                                                                                                                                               | `npm run test:unit -w @dengueahead/api`                                       |
| `TEST-P0-04` | Unit         | api         | `GET /api/v1/health` → 200, body passes `HealthResponseSchema`, has `X-Request-Id` header; inbound valid ID is echoed, invalid ID replaced                                                                                                                                                                                   | same                                                                          |
| `TEST-P0-05` | Unit         | api         | `GET /api/v1/readiness` with fake DB up → 200; DB down/timeout → **503** with `status: 'error'`                                                                                                                                                                                                                              | same                                                                          |
| `TEST-P0-06` | Unit         | api         | Unknown route → 404 standard error; `POST` → 405; thrown error → 500 with `requestId` and no stack; CORS rejects non-allowlisted origin                                                                                                                                                                                      | same                                                                          |
| `TEST-P0-07` | Integration  | api + Mongo | With `docker compose up -d mongodb`: readiness → 200; after `docker compose stop mongodb`: readiness → 503 and `/health` still 200                                                                                                                                                                                           | `npm run test:integration`                                                    |
| `TEST-P0-08` | Unit         | web         | Shell renders landmarks, heading, non-clinical advisory; no metric/case numbers                                                                                                                                                                                                                                              | `npm run test:unit -w @dengueahead/web`                                       |
| `TEST-P0-09` | Unit         | web         | HealthBadge shows distinct labelled states for loading/ok/degraded/error/unreachable/invalid/not-configured; `503` and malformed JSON never show "ok"                                                                                                                                                                        | same                                                                          |
| `TEST-P0-10` | Unit         | web         | `vitest-axe` reports no violations on shell                                                                                                                                                                                                                                                                                  | same                                                                          |
| `TEST-P0-11` | Unit         | ml          | `dengueahead --help` exits 0 and lists all 7 subcommands; `--version` exits 0; stubs exit 3 with "not implemented"; bad `--as-of` exits 2                                                                                                                                                                                    | `python -m pytest services/ml/tests/unit/test_cli.py`                         |
| `TEST-P0-12` | Unit         | ml          | Python `Prediction` accepts every valid fixture and rejects every invalid fixture (parity with Zod)                                                                                                                                                                                                                          | `python -m pytest services/ml/tests/unit/test_contract_parity.py`             |
| `TEST-P0-13` | Static       | all         | ESLint, Prettier, Ruff clean                                                                                                                                                                                                                                                                                                 | `npm run lint` · `ruff check services/ml` · `ruff format --check services/ml` |
| `TEST-P0-14` | Static/Build | all         | Strict type-check and build pass from a clean checkout (contracts built first)                                                                                                                                                                                                                                               | `npm run typecheck` · `npm run build`                                         |
| `TEST-P0-15` | E2E          | web + api   | Playwright: API on 4000 and web on 5173; shell shows the health badge in `ok`; with the API stopped it shows `unreachable`; no console errors in the `ok` flow                                                                                                                                                               | `npm run test:e2e`                                                            |
| `TEST-P0-16` | Manual       | repo        | Fresh-clone run of README (§6) in an empty directory succeeds with no undocumented steps                                                                                                                                                                                                                                     | manual, recorded in evidence                                                  |
| `TEST-P0-17` | CI           | repo        | `ci.yml` green on a fresh runner for a pull request                                                                                                                                                                                                                                                                          | GitHub Actions run URL in evidence                                            |

**Failure injection (required by master §6 gate step 6):** stop the `mongodb` container → confirm `readiness` = 503, `health` = 200, and the web shell does not claim a healthy system. Record the result in `phase-0-report.md`.

---

## 6. Command Contract for Phase 0

```bash
# setup (matches master §9)
nvm use                                    # Node 22
npm install
python -m pip install -e 'services/ml[dev]'
cp .env.example .env
docker compose up -d mongodb               # wait for healthy

# verify
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration                   # needs mongodb
npm run build
python -m pytest services/ml/tests
npm run test:e2e
dengueahead --help

# run
npm run dev:api                            # http://localhost:4000/api/v1/health
npm run dev:web                            # http://localhost:5173
```

Evidence capture: run the verify block, tee the output to `docs/evidence/phase-0/phase-0-verification.log`, and summarize it in `phase-0-report.md`.

---

## 7. Traceability to the Master Plan (Phase 0, §7)

| Master requirement                                                                                            | Covered by                               |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Monorepo, npm workspaces, Python project, `.editorconfig`, `.gitignore`, `.env.example`, Docker Compose Mongo | 0.1, 0.2, 0.6                            |
| TS strict mode + shared contract schemas                                                                      | 0.2, 0.3                                 |
| Express `/health` + React shell + Python `--help` CLI                                                         | 0.4, 0.5, 0.6                            |
| ESLint, Prettier, Vitest, pytest, Ruff, Playwright; CI jobs with caching                                      | 0.2, 0.4–0.7                             |
| `README.md`, `AGENTS.md`, issue board, evidence folders                                                       | 0.8, 0.9                                 |
| Human tasks (clone/run, ownership, deadline, repo)                                                            | 0.9                                      |
| Unit: env rejects missing DB URI                                                                              | `TEST-P0-03`                             |
| Unit: contract rejects malformed forecast                                                                     | `TEST-P0-01`                             |
| Unit: API health 200; React shell renders                                                                     | `TEST-P0-04`, `TEST-P0-08`               |
| Integration: docker up → API connects → React calls `/health`; CI green                                       | `TEST-P0-07`, `TEST-P0-15`, `TEST-P0-17` |
| Gate: fresh-install reproducibility from README; contracts frozen enough for parallel work                    | `TEST-P0-16`; acceptance checklist below |
| Cross-phase gate (§6): infra up, query, API, React, **failure injection**, evidence with date/SHA             | §5 failure injection; evidence report    |
| Master §5 API conventions (standard error, correlation IDs, CORS allowlist, rate limiting, read-only)         | 0.4                                      |

---

## 8. Acceptance Gate Checklist for Phase 0

Phase 0 is complete, and Phase 1 may start, only when **all** of the following hold and are evidenced in `docs/evidence/phase-0/`:

**Repository & governance**

- [ ] Git repository initialized on `main` with a clean initial commit.
- [ ] `.env.example`, `.editorconfig`, `.gitignore`, `.nvmrc`, `docker-compose.yml`, `README.md`, `AGENTS.md`, `IMPLEMENTATION_PLAN.md` exist at the repo root; `plans/PHASE_0_IMPLEMENTATION_PLAN.md` exists.
- [ ] `configs/sources.yaml` and `configs/model.yaml` templates exist and contain no unverified claims presented as verified.
- [ ] No secrets in git (`.env` ignored; `git ls-files` contains no `.env`).

**Contracts**

- [ ] `packages/contracts` builds; exports Zod schemas **and** types for `Area`, `WeeklyObservation`, `SourceSnapshot`, `Prediction`, `EvaluationMetrics`, health, readiness, error and pagination.
- [ ] Prediction invariants (WITHHELD ⇒ nulls; probability ⇒ calibrated; interval ⇒ method; provenance IDs) are tested (`TEST-P0-01`).
- [ ] JSON Schema committed and drift test passes; Python parity test passes against the same fixtures.

**API**

- [ ] `apps/api` starts cleanly with a valid env, **exits with a clear message on invalid env**, and starts even if Mongo is down.
- [ ] `/api/v1/health` returns 200; `/api/v1/readiness` returns 200 with Mongo and **503** without it.
- [ ] Standard error shape, request ID, CORS allowlist, helmet, body limit, rate limit, and read-only guard are tested.

**Web**

- [ ] `apps/web` builds with Vite, renders without console errors, shows the non-clinical advisory, and shows truthful health states.
- [ ] Component and axe tests pass; no metrics or case numbers displayed.

**ML**

- [ ] `services/ml` installs in editable mode with `[dev]`; `dengueahead --help` lists all seven subcommands; stubs exit non-zero.
- [ ] Ruff passes; pytest passes.

**Tooling & CI**

- [ ] `npm run lint`, `typecheck`, `test:unit`, `test:integration`, `build`, `test:e2e` and `python -m pytest services/ml/tests` all pass locally.
- [ ] `ci.yml` is green on a fresh runner for a pull request, with caching and reports uploaded.

**Verification & evidence**

- [ ] Fresh-clone run of the README succeeds (`TEST-P0-16`).
- [ ] Failure injection (Mongo stopped) behaves truthfully (readiness 503, web does not show healthy).
- [ ] `phase-0-verification.log` and `phase-0-report.md` (date, git SHA, versions, commands, pass/fail counts, open defects) are committed.
- [ ] Human tasks in Task 0.9 are checked off, including independent verification by someone other than the implementing agent.
