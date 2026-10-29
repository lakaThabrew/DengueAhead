# Fixtures

**SYNTHETIC TEST-ONLY DATA. Not real surveillance data.**

These JSON fixtures exist exclusively for automated testing of the Zod (TypeScript) and Pydantic (Python) contract schemas. They use obviously fake area IDs (`TEST_AREA_*`).

**Never** import these into any dashboard, production database, or demo environment.

## `valid/`

Fixtures that **must** parse successfully against `PredictionSchema`.

## `invalid/`

Fixtures that **must be rejected** by `PredictionSchema`. Each file name describes the violated invariant.
