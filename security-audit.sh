#!/bin/bash
# ============================================================
# TaskFlow Pro — Security & Bug Audit Script
# Run on Ubuntu: chmod +x security-audit.sh && ./security-audit.sh
# ============================================================

set -euo pipefail
IFS=$'\n\t'

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

PASS="${GREEN}[PASS]${RESET}"
FAIL="${RED}[FAIL]${RESET}"
WARN="${YELLOW}[WARN]${RESET}"
INFO="${CYAN}[INFO]${RESET}"

REPORT_FILE="security-report-$(date +%Y%m%d-%H%M%S).txt"
ISSUES=0

log()  { echo -e "$1" | tee -a "$REPORT_FILE"; }
sep()  { log "\n${BOLD}══════════════════════════════════════════${RESET}"; }
head() { sep; log "${BOLD}${CYAN} $1${RESET}"; sep; }

# ── 0. Prerequisites ─────────────────────────────────────────
head "0. Installing audit tools"

install_if_missing() {
  if ! command -v "$1" &>/dev/null; then
    log "$INFO Installing $1..."
    sudo apt-get install -y "$2" &>/dev/null && log "$PASS $1 installed" || log "$WARN Could not install $1 (skip)"
  else
    log "$PASS $1 already available"
  fi
}

sudo apt-get update -qq &>/dev/null
install_if_missing nmap        nmap
install_if_missing nikto       nikto
install_if_missing curl        curl
install_if_missing jq          jq
install_if_missing ab          apache2-utils

# ── 1. Node.js dependency audit ──────────────────────────────
head "1. npm dependency vulnerability audit"

SERVER_DIR="${SERVER_DIR:-./server}"       # override with: SERVER_DIR=/path/to/server ./script.sh
CLIENT_DIR="${CLIENT_DIR:-./client}"

for dir in "$SERVER_DIR" "$CLIENT_DIR"; do
  if [ -f "$dir/package.json" ]; then
    log "$INFO Auditing $dir..."
    AUDIT=$(cd "$dir" && npm audit --json 2>/dev/null || true)
    CRITICAL=$(echo "$AUDIT" | jq '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo 0)
    HIGH=$(echo     "$AUDIT" | jq '.metadata.vulnerabilities.high     // 0' 2>/dev/null || echo 0)
    MODERATE=$(echo "$AUDIT" | jq '.metadata.vulnerabilities.moderate // 0' 2>/dev/null || echo 0)

    [ "$CRITICAL" -gt 0 ] && { log "$FAIL Critical: $CRITICAL vuln(s) in $dir"; ((ISSUES+=CRITICAL)); } \
                           || log "$PASS No critical vulnerabilities in $dir"
    [ "$HIGH"     -gt 0 ] && { log "$WARN High: $HIGH vuln(s) in $dir"; ((ISSUES+=HIGH)); } \
                           || log "$PASS No high vulnerabilities in $dir"
    [ "$MODERATE" -gt 0 ] && log "$WARN Moderate: $MODERATE vuln(s) in $dir" \
                           || log "$PASS No moderate vulnerabilities in $dir"
  else
    log "$WARN No package.json found at $dir — skipping"
  fi
done

# ── 2. Secret / credential leak scan ─────────────────────────
head "2. Hardcoded secret scan"

SECRET_PATTERNS=(
  'password\s*=\s*["\x27][^"\x27]{4,}'
  'secret\s*=\s*["\x27][^"\x27]{4,}'
  'api[_-]?key\s*[:=]\s*["\x27][^"\x27]{8,}'
  'mongodb\+srv://[^"<\s]+'
  'postgres://[^"<\s]+'
  'eyJ[A-Za-z0-9_-]{20,}'   # JWT tokens
  'AKIA[0-9A-Z]{16}'        # AWS access key
  'ghp_[A-Za-z0-9]{36}'     # GitHub PAT
)

SCAN_DIRS=("$SERVER_DIR" "$CLIENT_DIR" ".")
SCAN_EXTENSIONS=("js" "ts" "jsx" "tsx" "env" "json" "yaml" "yml")

for pattern in "${SECRET_PATTERNS[@]}"; do
  for dir in "${SCAN_DIRS[@]}"; do
    [ -d "$dir" ] || continue
    for ext in "${SCAN_EXTENSIONS[@]}"; do
      MATCHES=$(grep -rInE "$pattern" "$dir" \
        --include="*.$ext" \
        --exclude-dir="node_modules" \
        --exclude-dir=".git" \
        --exclude="*.lock" 2>/dev/null || true)
      if [ -n "$MATCHES" ]; then
        log "$FAIL Possible secret leak ($pattern):"
        echo "$MATCHES" | head -5 | while IFS= read -r line; do
          log "  ↳ $line"
        done
        ((ISSUES++))
      fi
    done
  done
done

[ "$ISSUES" -eq 0 ] && log "$PASS No obvious secrets found in source files"

# ── 3. .env file security check ──────────────────────────────
head "3. Environment file checks"

for envfile in .env .env.production .env.local "$SERVER_DIR/.env" "$CLIENT_DIR/.env"; do
  if [ -f "$envfile" ]; then
    PERMS=$(stat -c "%a" "$envfile")
    if [ "$PERMS" -gt 600 ]; then
      log "$WARN $envfile permissions are $PERMS (should be 600). Fix: chmod 600 $envfile"
      ((ISSUES++))
    else
      log "$PASS $envfile permissions OK ($PERMS)"
    fi

    if grep -qE '^#.*gitignore|\.gitignore' .gitignore 2>/dev/null && \
       ! grep -q "$(basename "$envfile")" .gitignore 2>/dev/null; then
      log "$FAIL $(basename "$envfile") is NOT in .gitignore — risk of committing secrets!"
      ((ISSUES++))
    fi
  fi
done

# Check .gitignore has .env entries
if [ -f ".gitignore" ]; then
  grep -q "\.env" .gitignore && log "$PASS .gitignore contains .env rules" \
                              || { log "$FAIL .gitignore missing .env rule"; ((ISSUES++)); }
fi

# ── 4. Port & service scan (local) ───────────────────────────
head "4. Open port scan (localhost)"

log "$INFO Scanning common ports on localhost..."
OPEN_PORTS=$(nmap -sT -p 3000,3001,4000,5000,5432,6379,27017,8080 localhost \
  --open -oG - 2>/dev/null | grep "open" || true)

if [ -n "$OPEN_PORTS" ]; then
  log "$INFO Open ports detected:"
  echo "$OPEN_PORTS" | while IFS= read -r line; do
    log "  ↳ $line"
  done
else
  log "$INFO No common dev ports open (app may not be running)"
fi

# Check if app is reachable
APP_URL="${APP_URL:-http://localhost:3000}"
if curl -sf "$APP_URL" -o /dev/null --max-time 3; then
  log "$PASS App reachable at $APP_URL"
else
  log "$WARN App not reachable at $APP_URL (start it to run HTTP tests)"
fi

# ── 5. HTTP security header checks ───────────────────────────
head "5. HTTP security header audit"

API_URL="${API_URL:-http://localhost:3001}"

check_header() {
  local header="$1"; local url="$2"
  VALUE=$(curl -sI "$url" --max-time 5 2>/dev/null | grep -i "^${header}:" | head -1 || true)
  if [ -n "$VALUE" ]; then
    log "$PASS $header: $VALUE"
  else
    log "$FAIL Missing header: $header"
    ((ISSUES++))
  fi
}

if curl -sf "$API_URL/api/tasks" -o /dev/null --max-time 3 2>/dev/null; then
  log "$INFO Checking headers on $API_URL..."
  check_header "X-Content-Type-Options" "$API_URL"
  check_header "X-Frame-Options"        "$API_URL"
  check_header "Content-Security-Policy" "$API_URL"
  check_header "Strict-Transport-Security" "$API_URL"
  check_header "X-XSS-Protection"       "$API_URL"
else
  log "$WARN API not reachable at $API_URL — skipping header checks"
  log "$INFO Tip: set API_URL=http://your-api ./security-audit.sh"
fi

# ── 6. Rate limit verification ───────────────────────────────
head "6. Rate limiting verification"

ENDPOINT="${API_URL:-http://localhost:3001}/api/tasks"

if curl -sf "$ENDPOINT" -o /dev/null --max-time 3 2>/dev/null; then
  log "$INFO Sending 15 rapid requests to $ENDPOINT..."
  BLOCKED=0
  for i in $(seq 1 15); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT" --max-time 3 2>/dev/null || echo "000")
    [ "$STATUS" = "429" ] && ((BLOCKED++))
  done

  if [ "$BLOCKED" -gt 0 ]; then
    log "$PASS Rate limiting active — got $BLOCKED × 429 responses"
  else
    log "$FAIL No 429 responses — rate limiting may not be configured"
    ((ISSUES++))
  fi
else
  log "$WARN Endpoint unreachable — skipping rate limit test"
fi

# ── 7. CORS check ────────────────────────────────────────────
head "7. CORS configuration check"

if curl -sf "$API_URL" -o /dev/null --max-time 3 2>/dev/null; then
  CORS=$(curl -sI -H "Origin: http://evil.com" \
    -H "Access-Control-Request-Method: GET" \
    "$API_URL" --max-time 5 2>/dev/null | grep -i "access-control-allow-origin" || true)

  if echo "$CORS" | grep -q "\*"; then
    log "$FAIL CORS allows all origins (*) — restrict to your domain in production"
    ((ISSUES++))
  elif [ -n "$CORS" ]; then
    log "$PASS CORS header present and restricted: $CORS"
  else
    log "$WARN No CORS header returned — verify CORS is configured"
  fi
else
  log "$WARN API unreachable — skipping CORS check"
fi

# ── 8. SQL/NoSQL injection patterns in code ──────────────────
head "8. Injection vulnerability patterns"

INJECTION_PATTERNS=(
  'req\.query\.[a-z]+[^;]*\$where'         # MongoDB $where with user input
  'eval\s*\(.*req\.'                        # eval() with request data
  '\$\{req\.'                               # Template literal with req data in query
  'db\.query.*\+.*req\.'                    # String concatenation in DB query
  'findOne.*req\.body\b'                    # Direct req.body in findOne (no sanitise)
)

for pattern in "${INJECTION_PATTERNS[@]}"; do
  MATCH=$(grep -rInE "$pattern" "$SERVER_DIR" \
    --include="*.js" --include="*.ts" \
    --exclude-dir="node_modules" 2>/dev/null || true)
  if [ -n "$MATCH" ]; then
    log "$FAIL Possible injection risk (${pattern:0:40}...):"
    echo "$MATCH" | head -3 | while IFS= read -r line; do log "  ↳ $line"; done
    ((ISSUES++))
  fi
done
[ "$ISSUES" -eq 0 ] && log "$PASS No obvious injection patterns found"

# ── 9. Summary ───────────────────────────────────────────────
head "9. Audit summary"

log "${BOLD}Total issues found: $ISSUES${RESET}"
log "Full report saved to: ${BOLD}${REPORT_FILE}${RESET}"

if [ "$ISSUES" -eq 0 ]; then
  log "\n${GREEN}${BOLD} All checks passed!${RESET}"
elif [ "$ISSUES" -le 5 ]; then
  log "\n${YELLOW}${BOLD} $ISSUES issue(s) to address — see report above${RESET}"
else
  log "\n${RED}${BOLD} $ISSUES issue(s) found — review and fix before deploying${RESET}"
fi

exit $([ "$ISSUES" -eq 0 ] && echo 0 || echo 1)
