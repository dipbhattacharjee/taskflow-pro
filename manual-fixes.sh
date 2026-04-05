#!/bin/bash
# ============================================================
# TaskFlow Pro — Targeted Manual Vulnerability Fixes
# Run from your PROJECT ROOT: ./manual-fixes.sh
# These fix the most common high-severity vulns in React apps
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RESET='\033[0m'

log() { echo -e "$1"; }
sep() { log "\n${BOLD}══════════════════════════════════════════${RESET}"; }

# Detect client dir
CLIENT_DIR=""
for d in client frontend .; do
  [ -f "$d/package.json" ] && { CLIENT_DIR="$d"; break; }
done

[ -z "$CLIENT_DIR" ] && { log "ERROR: No client package.json found."; exit 1; }

log "${BOLD}${CYAN}TaskFlow Pro — Manual Vulnerability Fixes${RESET}"
log "Client dir: $CLIENT_DIR"

sep
log "${BOLD}Step 1 — Back up current state${RESET}"
cp "$CLIENT_DIR/package.json"      "$CLIENT_DIR/package.json.bak"
cp "$CLIENT_DIR/package-lock.json" "$CLIENT_DIR/package-lock.json.bak" 2>/dev/null || true
log "${GREEN}Backed up package.json → package.json.bak${RESET}"

sep
log "${BOLD}Step 2 — Safe auto-fix (no breaking changes)${RESET}"
cd "$CLIENT_DIR"
npm audit fix 2>&1 | grep -E "fixed|changed|added|up to date" | head -10 || true

sep
log "${BOLD}Step 3 — Fix most common high-severity React vulns${RESET}"

# nth-check (ReDoS) — extremely common in CRA
if npm ls nth-check &>/dev/null 2>&1; then
  log "Fixing: nth-check (ReDoS vulnerability)..."
  npm install nth-check@^2.1.1 --save-dev 2>&1 | tail -3 || true
fi

# postcss (line return parsing)
if npm ls postcss &>/dev/null 2>&1; then
  log "Fixing: postcss..."
  npm install postcss@^8.4.31 --save-dev 2>&1 | tail -3 || true
fi

# semver (ReDoS) — common in older CRA
if npm ls semver &>/dev/null 2>&1; then
  log "Fixing: semver..."
  npm install semver@^7.5.4 --save-dev 2>&1 | tail -3 || true
fi

# tough-cookie (prototype pollution)
if npm ls tough-cookie &>/dev/null 2>&1; then
  log "Fixing: tough-cookie..."
  npm install tough-cookie@^4.1.3 2>&1 | tail -3 || true
fi

# word-wrap (ReDoS)
if npm ls word-wrap &>/dev/null 2>&1; then
  log "Fixing: word-wrap..."
  npm install word-wrap@^1.2.4 --save-dev 2>&1 | tail -3 || true
fi

# loader-utils (prototype pollution) — CRA < 5.0.1
if npm ls loader-utils &>/dev/null 2>&1; then
  log "Fixing: loader-utils..."
  npm install loader-utils@^2.0.4 --save-dev 2>&1 | tail -3 || true
fi

# ip (SSRF) — common in webpack-dev-server deps
if npm ls ip &>/dev/null 2>&1; then
  log "Fixing: ip..."
  npm install ip@^2.0.1 --save-dev 2>&1 | tail -3 || true
fi

# webpack-dev-middleware (path traversal)
if npm ls webpack-dev-middleware &>/dev/null 2>&1; then
  log "Fixing: webpack-dev-middleware..."
  npm install webpack-dev-middleware@^5.3.4 --save-dev 2>&1 | tail -3 || true
fi

# express (if used in client dev server)
if npm ls express &>/dev/null 2>&1; then
  log "Fixing: express..."
  npm install express@^4.19.2 2>&1 | tail -3 || true
fi

sep
log "${BOLD}Step 4 — Add npm overrides for transitive deps${RESET}"
log "This forces nested packages to use safe versions..."

# Read current package.json and add overrides
python3 << 'PYEOF'
import json, sys

with open('package.json', 'r') as f:
    pkg = json.load(f)

# Add overrides section to force safe versions of transitive deps
overrides = pkg.get('overrides', {})
overrides.update({
    "nth-check":               ">=2.1.1",
    "postcss":                 ">=8.4.31",
    "semver":                  ">=7.5.4",
    "tough-cookie":            ">=4.1.3",
    "word-wrap":               ">=1.2.4",
    "ip":                      ">=2.0.1",
    "loader-utils":            ">=2.4.0",
    "webpack-dev-middleware":  ">=5.3.4",
    "@babel/traverse":         ">=7.23.2",
    "braces":                  ">=3.0.3",
    "micromatch":              ">=4.0.8",
    "follow-redirects":        ">=1.15.6"
})
pkg['overrides'] = overrides

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)

print(f"Added {len(overrides)} override rules to package.json")
PYEOF

# Reinstall to apply overrides
log "\nReinstalling with overrides applied..."
npm install 2>&1 | tail -5

sep
log "${BOLD}Step 5 — Verify build still works${RESET}"
if npm run build --if-present 2>&1 | tail -8; then
  log "\n${GREEN}Build OK after fixes${RESET}"
else
  log "\n${YELLOW}Build issue — reverting to backup...${RESET}"
  cp package.json.bak package.json
  cp package-lock.json.bak package-lock.json 2>/dev/null || true
  npm install --silent 2>/dev/null || true
  log "Reverted. Run: npm audit  for details on remaining issues."
  exit 1
fi

sep
log "${BOLD}Step 6 — Final vulnerability count${RESET}"
npm audit 2>&1 | grep -E "vulnerabilities|found" | tail -5

sep
log "${BOLD}${GREEN}Done! Next:${RESET}"
log "  • Start client:   npm start"
log "  • Re-run audit:   cd .. && ./security-audit.sh"

cd ..
