/**
 * API benchmark script — Sub-phase 6.4 / SYS-07
 * Measures p50, p95, p99 latency for all 14 /api/v1 routes.
 * Asserts p95 < 200ms per the Phase 6 SLA.
 *
 * Usage:
 *   npx tsx scripts/benchmark-api.ts [--base-url http://localhost:4000]
 */

const BASE_URL = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'http://localhost:4000';

const API = `${BASE_URL}/api/v1`;
const REQUESTS_PER_ROUTE = 100;
const P95_SLA_MS = 200;

const ROUTES: { label: string; path: string }[] = [
  { label: 'GET /health', path: '/health' },
  { label: 'GET /readiness', path: '/readiness' },
  { label: 'GET /meta', path: '/meta' },
  { label: 'GET /overview', path: '/overview' },
  { label: 'GET /areas', path: '/areas' },
  { label: 'GET /areas/LK-11', path: '/areas/LK-11' },
  { label: 'GET /areas/LK-11/series', path: '/areas/LK-11/series' },
  { label: 'GET /areas/LK-11/forecast', path: '/areas/LK-11/forecast' },
  { label: 'GET /predictions', path: '/predictions' },
  { label: 'GET /compare (3 areas)', path: '/compare?areaIds=LK-11,LK-12,LK-21' },
  { label: 'GET /backtests', path: '/backtests' },
  { label: 'GET /evaluation', path: '/evaluation' },
  { label: 'GET /sources', path: '/sources' },
  { label: 'GET /methodology', path: '/methodology' }
];

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function measureRoute(path: string, n: number): Promise<number[]> {
  const latencies: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    try {
      await fetch(`${API}${path}`);
    } catch {
      // network error counts as max latency
      latencies.push(P95_SLA_MS * 10);
      continue;
    }
    latencies.push(performance.now() - t0);
  }
  return latencies.sort((a, b) => a - b);
}

async function run(): Promise<void> {
  console.log(`\n=== DengueAhead API Benchmark (SYS-07) ===`);
  console.log(`Target: ${API}`);
  console.log(`Requests per route: ${REQUESTS_PER_ROUTE}`);
  console.log(`SLA: p95 < ${P95_SLA_MS}ms\n`);

  const colW = 36;
  console.log(
    `${'Route'.padEnd(colW)} ${'p50'.padStart(8)} ${'p95'.padStart(8)} ${'p99'.padStart(8)}  SLA`
  );
  console.log('-'.repeat(colW + 35));

  const violations: string[] = [];

  for (const route of ROUTES) {
    const latencies = await measureRoute(route.path, REQUESTS_PER_ROUTE);
    const p50 = percentile(latencies, 50);
    const p95 = percentile(latencies, 95);
    const p99 = percentile(latencies, 99);
    const pass = p95 < P95_SLA_MS;

    console.log(
      `${route.label.padEnd(colW)} ${p50.toFixed(1).padStart(8)}ms ${p95.toFixed(1).padStart(7)}ms ${p99.toFixed(1).padStart(7)}ms  ${pass ? '✓ PASS' : '✗ FAIL'}`
    );

    if (!pass) violations.push(`${route.label}: p95=${p95.toFixed(1)}ms`);
  }

  console.log('\n' + '='.repeat(colW + 35));

  if (violations.length > 0) {
    console.error(`\n✗ ${violations.length} route(s) exceeded p95 ${P95_SLA_MS}ms SLA:`);
    violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  } else {
    console.log(`\n✓ All ${ROUTES.length} routes pass p95 < ${P95_SLA_MS}ms SLA`);
    process.exit(0);
  }
}

void run();
