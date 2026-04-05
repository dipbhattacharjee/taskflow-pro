#!/usr/bin/env bash
# Quick Reference Card for Security Scripts
# Copy this into your terminal for quick access

# Color codes
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RESET='\033[0m'

cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║  TASKFLOW PRO — SECURITY SCRIPTS QUICK REFERENCE               ║
╚════════════════════════════════════════════════════════════════╝

📋 AVAILABLE SCRIPTS (from project root):
───────────────────────────────────────────────────────────────

✓ ./security-audit.sh
  Full security audit: npm vulns, ports, headers, CORS, injections
  Output: security-report-<timestamp>.txt
  Time: ~1-2 minutes
  Usage: ./security-audit.sh

✓ ./fix-vulns.sh
  Quick diagnostics + safe npm fixes
  Shows: Project structure, vuln counts, server entry points
  Time: ~30 seconds
  Usage: ./fix-vulns.sh

✓ ./manual-fixes.sh
  Targeted high-severity vulnerability fixes
  Auto-backs up, verifies build, auto-reverts if broken
  Time: ~3-5 minutes
  Usage: ./manual-fixes.sh

✓ ./ci-security-check.sh
  Production-only security check (for CI/CD)
  Checks: No dev deps, zero vulns, build succeeds
  Time: ~1-2 minutes
  Usage: ./ci-security-check.sh

📖 DOCUMENTATION:
───────────────────────────────────────────────────────────────

→ SECURITY-VULNERABILITIES.md
  What vulnerabilities exist and why they're not critical

→ SECURITY-SCRIPTS-GUIDE.md
  Detailed guide with workflow and troubleshooting

🚀 RECOMMENDED WORKFLOW:
───────────────────────────────────────────────────────────────

First Time Setup:
  ./security-audit.sh      # See what's wrong
  ./fix-vulns.sh           # Quick diagnosis
  ./manual-fixes.sh        # Apply targeted fixes

Development:
  npm start                # Run your app
  ./security-audit.sh      # Check periodically

Before Deploy:
  ./ci-security-check.sh   # Verify production is safe

✅ EXPECTED RESULTS:
───────────────────────────────────────────────────────────────

Production Build:
  npm audit --omit=dev
  → found 0 vulnerabilities ✓

Full Audit (with dev tools):
  npm audit
  → 26 vulnerabilities (all in devDependencies, not shipped)

🔍 STATUS CHECK:
───────────────────────────────────────────────────────────────

Current Status:
  • Package.json: ✓ Fixed (dev deps separated)
  • npm audit: 26 vulns (all dev-only, production safe)
  • .npmrc: ✓ Configured (audit-level=moderate)

Production Dependencies Health:
EOF

# Try to run a quick audit
cd /home/baban/taskflow-pro/client 2>/dev/null && npm audit --omit=dev 2>/dev/null | grep "found" && echo "" || echo "  [unable to check - run ./fix-vulns.sh first]"

cat << 'EOF'

💡 QUICK COMMANDS:
───────────────────────────────────────────────────────────────

Check production only:
  npm audit --omit=dev

Check everything:
  npm audit

Auto-fix safe vulnerabilities:
  npm audit fix

View detailed audit (JSON):
  npm audit --json | jq .vulnerabilities

ℹ️  MORE INFO:
───────────────────────────────────────────────────────────────

View production vs dev breakdown:
  npm ls --depth=0

Backup package.json before changes:
  cp client/package.json client/package.json.backup

Restore from backup:
  cp client/package.json.backup client/package.json
  npm install

════════════════════════════════════════════════════════════════
Need help? Check SECURITY-SCRIPTS-GUIDE.md for detailed docs.
════════════════════════════════════════════════════════════════

EOF
