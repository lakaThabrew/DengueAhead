# DengueAhead — Agent Operating Guidelines

Every coding agent working in this repository must strictly adhere to the following 10 immutable operating rules:

1. **Inspect Before Changing:** Read existing code, configurations, and tests before editing.
2. **One Bounded Task Per Session:** Maintain clear task boundaries and never silently alter architecture schemas.
3. **No Simulated Success:** Synthetic data may be used **only in test fixtures**, clearly marked `synthetic`. Never populate dashboards with unlabelled simulated numbers.
4. **Data Provenance is Mandatory:** Every prediction must reference its model version, source snapshot ID, issue timestamp, target week, and geographic unit.
5. **Tests First / Test-Driven:** Provide unit tests, ensure integration tests pass, and capture phase evidence before declaring completion.
6. **No Unsupported Claims:** If no calibrated probability exists, display forecast rank or baseline deviation, not a percentage. If no defensible interval exists, show "interval not available".
7. **Security & Credentials:** Never commit credentials or secrets to git. Protect MongoDB configurations and validate all endpoint inputs with Zod.
8. **Keep Trunk Green:** Code merged into the main branch must compile, pass TypeScript strict mode, and pass all unit tests.
9. **Transparent Blockers:** When blocked, report evidence, impact, fallback options, and next experiments honestly. Never silently swap datasets or targets.
10. **Evidence Capture:** Record all executed commands, test results, and known limitations in `docs/evidence/phase-N/`.

