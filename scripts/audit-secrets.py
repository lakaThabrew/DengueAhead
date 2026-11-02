#!/usr/bin/env python3
"""
Secret & credential leakage scanner — Sub-phase 6.5
Scans all tracked files for hardcoded secrets, credentials, and private keys.

Usage:
    python scripts/audit-secrets.py [--path .] [--fail-on-match]
"""

import re
import sys
import argparse
from pathlib import Path

# Patterns that indicate a real secret — ordered by severity
SECRET_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "Private Key",
        re.compile(r"-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"),
    ),
    ("AWS Access Key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("GCP Service Account", re.compile(r'"type":\s*"service_account"')),
    ("Bearer Token", re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]{20,}")),
    ("Auth Header Secret", re.compile(r"Authorization:\s*Basic\s+[A-Za-z0-9+/=]{10,}")),
    ("MongoDB URI with creds", re.compile(r"mongodb(\+srv)?://[^:]+:[^@]+@[^/]+")),
    (
        "Hardcoded Password",
        re.compile(r'(?i)(password|passwd|pwd)\s*[=:]\s*["\'][^"\']{6,}["\']'),
    ),
    (
        "Hardcoded API Key",
        re.compile(
            r'(?i)(api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*["\'][^"\']{8,}["\']'
        ),
    ),
    ("GitHub Token", re.compile(r"gh[pous]_[A-Za-z0-9]{36,}")),
    (
        "Generic Secret",
        re.compile(r'(?i)(secret|token)\s*[=:]\s*["\'][A-Za-z0-9+/=_\-]{16,}["\']'),
    ),
]

# Safe patterns — known placeholder values that are NOT real secrets
SAFE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"mongodb://localhost"),
    re.compile(r"mongodb://127\.0\.0\.1"),
    re.compile(r"mongodb://mongodb"),  # docker-compose service name
    re.compile(r"MONGODB_URI\s*=\s*mongodb://localhost"),
    re.compile(r"your[_-]?secret[_-]?here"),
    re.compile(r"<your[_\-\s]"),
    re.compile(r"example\.com"),
    re.compile(r"placeholder"),
    re.compile(r"changeme"),
    re.compile(r"test[_-]?secret"),
    re.compile(r"dummy"),
]

# File extensions to scan
SCAN_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".md",
    ".yaml",
    ".yml",
    ".toml",
    ".json",
    ".env",
    ".sh",
    ".ps1",
}

# Paths to always skip
SKIP_DIRS = {
    "node_modules",
    ".git",
    ".ruff_cache",
    ".pytest_cache",
    "__pycache__",
    "dist",
    "build",
    "playwright-report",
}
SKIP_FILES = {"package-lock.json"}


def should_skip(path: Path) -> bool:
    for part in path.parts:
        if part in SKIP_DIRS:
            return True
    if path.name in SKIP_FILES:
        return True
    return False


def is_safe(line: str) -> bool:
    return any(p.search(line) for p in SAFE_PATTERNS)


def scan_file(path: Path) -> list[tuple[int, str, str]]:
    """Return list of (line_number, pattern_name, line_text) for matches."""
    findings: list[tuple[int, str, str]] = []
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return findings

    for lineno, line in enumerate(text.splitlines(), start=1):
        if is_safe(line):
            continue
        for name, pattern in SECRET_PATTERNS:
            if pattern.search(line):
                findings.append((lineno, name, line.strip()[:120]))
                break  # only report first match per line
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="DengueAhead secret scanner")
    parser.add_argument("--path", default=".", help="Repository root to scan")
    parser.add_argument(
        "--fail-on-match", action="store_true", help="Exit 1 if any secrets found"
    )
    args = parser.parse_args()

    root = Path(args.path).resolve()
    total_files = 0
    total_findings: list[tuple[Path, int, str, str]] = []

    for ext in SCAN_EXTENSIONS:
        for filepath in root.rglob(f"*{ext}"):
            if should_skip(filepath.relative_to(root)):
                continue
            total_files += 1
            for lineno, name, line in scan_file(filepath):
                total_findings.append((filepath.relative_to(root), lineno, name, line))

    print(f"Scanned {total_files} files in {root}")

    if total_findings:
        print(f"\n{'=' * 60}")
        print(f"[WARN] {len(total_findings)} potential secret(s) found:\n")
        for fpath, lineno, name, line in total_findings:
            print(f"  [{name}] {fpath}:{lineno}")
            print(f"    {line}\n")
        print("=" * 60)
        if args.fail_on_match:
            return 1
    else:
        print(f"[OK] Zero secrets detected across {total_files} files.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
