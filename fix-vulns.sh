#!/bin/bash
# ============================================================
# TaskFlow Pro — Comprehensive Vulnerability Fix + Diagnostics
# Run from your project root: chmod +x fix-vulns.sh && ./fix-vulns.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

PASS="${GREEN}[PASS]${RESET}"; FAIL="${RED}[FAIL]${RESET}"
WARN="${YELLOW}[WARN]${RESET}"; INFO="${CYAN}[INFO]${RESET}"

log() { echo -e "$1"; }
sep() { log "\n${BOLD}══════════════════════════════════════════${RESET}"; }
head() { sep; log "${BOLD}${CYAN} $1${RESET}"; sep; }

# ── Detect project structure ──────────────────────────────────
head "0. Detecting project structure"

PROJECT_ROOT=$(pwd)
log "$INFO Project root: $PROJECT_ROOT"

# Find client dir
CLIENT_DIR=""
for d in client frontend src .; do
  [ -f "$d/package.json" ] && { CLIENT_DIR="$d"; break; }
done

# Find server dir
SERVER_DIR=""
for d in server backend api .; do
  if [ -f "$d/package.json" ] && [ "$d" != "$CLIENT_DIR" ]; then
    SERVER_DIR="$d"; break
  fi
done

log "$INFO Client dir : ${CLIENT_DIR:-NOT FOUND}"
log "$INFO Server dir : ${SERVER_DIR:-NOT FOUND}"

# ── 1. Full vulnerability details ────────────────────────────
head "1. Full vulnerability report (before fix)"

if [ -n "$CLIENT_DIR" ] && [ -f "$CLIENT_DIR/package.json" ]; then
  log "$INFO Client vulnerabilities:"
  cd "$CLIENT_DIR"
  npm audit 2>&1 | grep -E "(high|moderate|critical|Low|npm audit fix|Package|Severity)" \
    | head -60 || true
  cd "$PROJECT_ROOT"
fi

# ── 2. Auto-fix safe vulnerabilities ─────────────────────────
head "2. Auto-fixing safe vulnerabilities (npm audit fix)"

if [ -n "$CLIENT_DIR" ] && [ -f "$CLIENT_DIR/package.json" ]; then
  log "$INFO Running npm audit fix in client (safe fixes only)..."
  cd "$CLIENT_DIR"
  npm audit fix 2>&1 | tail -10
  cd "$PROJECT_ROOT"
fi

if [ -n "$SERVER_DIR" ] && [ -f "$SERVER_DIR/package.json" ]; then
  log "$INFO Running npm audit fix in server..."
  cd "$SERVER_DIR"
  npm audit fix 2>&1 | tail -5
  cd "$PROJECT_ROOT"
fi

# ── 3. Diagnose server directory ─────────────────────────────
head "3. Server directory diagnosis"

log "$INFO Searching for server entry points..."
find "$PROJECT_ROOT" -maxdepth 3 \
  \( -name "server.js" -o -name "app.js" -o -name "index.js" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/build/*" \
  2>/dev/null | while read -r f; do
    log "  ↳ Found: $f"
  done

log "\n$INFO package.json files found:"
find "$PROJECT_ROOT" -maxdepth 3 -name "package.json" \
  -not -path "*/node_modules/*" \
  2>/dev/null | while read -r f; do
    SCRIPTS=$(python3 -c "import json; d=json.load(open('$f')); print(list(d.get('scripts',{}).keys()))" 2>/dev/null || echo "?")
    log "  ↳ $f → scripts: $SCRIPTS"
  done

# ── 4. Final vuln count ──────────────────────────────────────
head "4. Final vulnerability count"

for dir in "$CLIENT_DIR" "$SERVER_DIR"; do
  [ -z "$dir" ] || [ ! -f "$dir/package.json" ] && continue
  cd "$dir"
  COUNTS=$(npm audit --json 2>/dev/null | \
    python3 -c "
import json,sys
d=json.load(sys.stdin)
m=d.get('metadata',{}).get('vulnerabilities',{})
c=m.get('critical',0); h=m.get('high',0); mod=m.get('moderate',0); l=m.get('low',0)
total=c+h+mod+l
print(f'Critical:{c} High:{h} Moderate:{mod} Low:{l} | Total:{total}')
" 2>/dev/null || echo "parse error")
  log "$INFO $dir → $COUNTS"
  cd "$PROJECT_ROOT"
done

log "\n${BOLD}Next steps:${RESET}"
log "  1. Run targeted fixes:  ./manual-fixes.sh"
log "  2. Start your server:   cd server && npm start  (or node index.js)"
log "  3. Start your client:   cd client && npm start"
log "  4. Re-run audit:        ./security-audit.sh"
