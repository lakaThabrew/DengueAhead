# DengueAhead — End-to-End Smoke Test (Sub-phase 6.6)
# Validates the full ingestion → feature → predict → API → frontend pipeline.
#
# Prerequisites:
#   - Docker running (for MongoDB)
#   - Python environment with dengueahead installed (pip install -e services/ml)
#   - Node.js installed (npm install already run)
#
# Usage:
#   .\scripts\e2e-smoke-test.ps1
#   .\scripts\e2e-smoke-test.ps1 -SkipFrontend
#   .\scripts\e2e-smoke-test.ps1 -ApiPort 4001

param(
    [int]$ApiPort = 4000,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir

Set-Location $Root

$Passed = @()
$Failed = @()

function Step-Pass($name) {
    Write-Host "  [PASS] $name" -ForegroundColor Green
    $script:Passed += $name
}

function Step-Fail($name, $reason) {
    Write-Host "  [FAIL] $name — $reason" -ForegroundColor Red
    $script:Failed += "$name: $reason"
}

function Assert-True($condition, $stepName, $failMessage) {
    if ($condition) { Step-Pass $stepName }
    else { Step-Fail $stepName $failMessage }
}

Write-Host "`n=== DengueAhead E2E Smoke Test (Sub-phase 6.6) ===" -ForegroundColor Cyan
Write-Host "Root: $Root"
Write-Host "API Port: $ApiPort`n"

# ── Step 1: MongoDB Up ────────────────────────────────────────────────────────
Write-Host "Step 1: MongoDB connectivity..." -ForegroundColor Yellow
try {
    $mongoState = docker compose ps mongodb --format json 2>$null | ConvertFrom-Json
    $isRunning = $mongoState.State -eq "running" -or $mongoState.Status -like "*Up*"
    if (-not $isRunning) {
        Write-Host "  Starting MongoDB..." -ForegroundColor Gray
        docker compose up -d mongodb
        Start-Sleep -Seconds 5
    }
    Step-Pass "MongoDB container running"
} catch {
    Write-Host "  Starting MongoDB..." -ForegroundColor Gray
    docker compose up -d mongodb
    Start-Sleep -Seconds 5
    Step-Pass "MongoDB container started"
}

# ── Step 2: Python ML environment ────────────────────────────────────────────
Write-Host "`nStep 2: Python dengueahead CLI..." -ForegroundColor Yellow
try {
    $helpOutput = dengueahead --help 2>&1
    Assert-True ($LASTEXITCODE -eq 0) "dengueahead CLI available" "exit code $LASTEXITCODE"
} catch {
    Step-Fail "dengueahead CLI available" "not found — run: pip install -e services/ml"
}

# ── Step 3: Data validation ───────────────────────────────────────────────────
Write-Host "`nStep 3: Data validation..." -ForegroundColor Yellow
try {
    dengueahead validate-data 2>&1 | Out-Null
    Assert-True ($LASTEXITCODE -eq 0) "validate-data passes" "exit code $LASTEXITCODE"
} catch {
    Step-Fail "validate-data passes" $_.Exception.Message
}

# ── Step 4: Secret audit ──────────────────────────────────────────────────────
Write-Host "`nStep 4: Secret audit scan..." -ForegroundColor Yellow
try {
    $auditOut = python scripts/audit-secrets.py --path . 2>&1
    Assert-True ($LASTEXITCODE -eq 0) "No secrets found in repository" "secret scan reported violations"
    Write-Host "    $($auditOut | Select-String 'Scanned')" -ForegroundColor Gray
} catch {
    Step-Fail "Secret audit scan" $_.Exception.Message
}

# ── Step 5: npm audit ─────────────────────────────────────────────────────────
Write-Host "`nStep 5: npm dependency audit..." -ForegroundColor Yellow
try {
    npm audit --audit-level=high 2>&1 | Out-Null
    Assert-True ($LASTEXITCODE -eq 0) "npm audit: 0 high/critical vulnerabilities" "high/critical vulnerabilities found"
} catch {
    Step-Fail "npm audit" $_.Exception.Message
}

# ── Step 6: TypeScript build ──────────────────────────────────────────────────
Write-Host "`nStep 6: TypeScript build..." -ForegroundColor Yellow
try {
    npm run build 2>&1 | Out-Null
    Assert-True ($LASTEXITCODE -eq 0) "npm run build succeeds" "build failed"
} catch {
    Step-Fail "npm run build" $_.Exception.Message
}

# ── Step 7: Unit tests ────────────────────────────────────────────────────────
Write-Host "`nStep 7: Unit test suite..." -ForegroundColor Yellow
try {
    npm run test:unit 2>&1 | Out-Null
    Assert-True ($LASTEXITCODE -eq 0) "All unit tests pass" "test failures detected"
} catch {
    Step-Fail "Unit tests" $_.Exception.Message
}

# ── Step 8: API health probe ──────────────────────────────────────────────────
Write-Host "`nStep 8: API health probe (assumes dev:api running on port $ApiPort)..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:$ApiPort/api/v1/health" -TimeoutSec 5
    Assert-True ($health.status -eq "ok") "GET /api/v1/health returns status:ok" "status was $($health.status)"
} catch {
    Step-Fail "GET /api/v1/health" "API not reachable on port $ApiPort — start with: npm run dev:api"
}

# ── Step 9: API readiness probe ───────────────────────────────────────────────
Write-Host "`nStep 9: API readiness probe..." -ForegroundColor Yellow
try {
    $ready = Invoke-WebRequest -Uri "http://localhost:$ApiPort/api/v1/readiness" -TimeoutSec 5
    Assert-True ($ready.StatusCode -in @(200, 503)) "GET /api/v1/readiness returns 200 or 503 (never 500)" "unexpected status $($ready.StatusCode)"
} catch {
    Step-Fail "GET /api/v1/readiness" "API not reachable — start with: npm run dev:api"
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "`n=== Smoke Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $($Passed.Count)" -ForegroundColor Green
Write-Host "Failed: $($Failed.Count)" -ForegroundColor $(if ($Failed.Count -gt 0) { "Red" } else { "Green" })

if ($Failed.Count -gt 0) {
    Write-Host "`nFailures:" -ForegroundColor Red
    $Failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    exit 1
} else {
    Write-Host "`n✓ All smoke test steps passed." -ForegroundColor Green
    exit 0
}
