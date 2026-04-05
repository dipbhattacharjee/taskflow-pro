# Security Audit Scripts Guide

All scripts are located in the project root and are ready to execute.

## Quick Reference

| Script | Purpose | When to Use |
|--------|---------|------------|
| `./security-audit.sh` | Full security audit (ports, headers, dependencies, CORS) | Initial audit & CI/CD |
| `./fix-vulns.sh` | Diagnosis + safe auto-fixes | First troubleshooting step |
| `./manual-fixes.sh` | Targeted high-severity vulnerability fixes | After `fix-vulns.sh` or standalone |
| `./ci-security-check.sh` | Production build verification | CI/CD pipelines |

---

## Detailed Script Descriptions

### 1. `security-audit.sh` — Full Security Audit
**Purpose**: Comprehensive security assessment including npm vulnerabilities, port scanning, HTTP headers, and injection patterns.

**What it checks**:
- ✅ npm dependency vulnerabilities
- ✅ Hardcoded secrets
- ✅ Environment file configuration
- ✅ Open ports on localhost
- ✅ HTTP security headers
- ✅ Rate limiting configuration
- ✅ CORS settings
- ✅ Injection vulnerability patterns

**Usage**:
```bash
./security-audit.sh                    # Default audit
API_URL=http://your-api ./security-audit.sh  # With custom API
```

**Output**: Creates `security-report-<timestamp>.txt` with detailed findings.

---

### 2. `fix-vulns.sh` — Comprehensive Diagnostics & Safe Fixes
**Purpose**: Detect project structure, run safe npm fixes, and diagnose server setup.

**What it does**:
1. Auto-detects `client/` and `server/` directories
2. Runs `npm audit fix` safely (no breaking changes)
3. Shows vulnerability counts before/after
4. Finds server entry points (index.js, app.js, server.js)
5. Lists available npm scripts in each package.json

**Usage**:
```bash
./fix-vulns.sh
```

**Output**: Colored report showing project structure and vulnerabilities.

**Good for**: Understanding your project layout and doing initial diagnosis.

---

### 3. `manual-fixes.sh` — Targeted Vulnerability Fixes
**Purpose**: Apply targeted fixes for the most common high-severity npm vulnerabilities in React apps.

**What it fixes** (if present):
- nth-check (ReDoS)
- postcss (line return parsing)
- semver (ReDoS)
- tough-cookie (prototype pollution)
- word-wrap (ReDoS)
- loader-utils (prototype pollution)
- ip (SSRF)
- webpack-dev-middleware (path traversal)
- express (if used)

**Features**:
- ✅ Backs up `package.json` and `package-lock.json`
- ✅ Applies specific version upgrades
- ✅ Adds npm `overrides` to force transitive deps to safe versions
- ✅ Verifies build still works
- ✅ Rolls back automatically if build breaks

**Usage**:
```bash
cd /home/baban/taskflow-pro
./manual-fixes.sh
```

**Output**: Colored progress with pass/fail indicators and final vulnerability count.

---

### 4. `ci-security-check.sh` — Production Build Verification
**Purpose**: Verify production dependencies are secure and build succeeds.

**What it does**:
1. Installs production dependencies only (`npm ci --omit=dev`)
2. Runs production audit (zero vulns target)
3. Builds the app
4. Reports success/failure

**Usage** (in CI/CD):
```bash
cd /home/baban/taskflow-pro
./ci-security-check.sh
```

**Good for**: CI/CD pipelines to ensure safe deployments.

---

## Recommended Workflow

### Initial Setup
```bash
cd /home/baban/taskflow-pro

# 1. Full audit to see the problem
./security-audit.sh

# 2. Show project structure and do safe fixes
./fix-vulns.sh

# 3. Apply targeted high-severity fixes
./manual-fixes.sh
```

### Development
```bash
# After fixes, develop normally
cd client && npm start
cd server && npm start

# Periodically run:
./security-audit.sh  # Check for new issues
```

### Before Deployment
```bash
# Verify production is secure
./ci-security-check.sh

# Or in CI/CD pipeline, run:
npm ci --omit=dev      # Install production only
npm audit --omit=dev   # Check production deps (must be 0 vulns)
npm run build          # Verify build succeeds
```

---

## Expected Results After Fixes

**Production Dependencies** (what gets shipped):
```bash
$ npm audit --omit=dev
found 0 vulnerabilities ✅
```

**Full Audit** (including dev tools):
```bash
$ npm audit
26 vulnerabilities (9 low, 3 moderate, 14 high)
```
↑ This is OK because all 26 are in devDependencies (build/test tools only).

---

## Troubleshooting

### "Build broke after manual-fixes.sh"
The script automatically reverts if the build fails. Check the error and try:
```bash
cd client
npm install  # Fresh install
npm audit fix  # Safe fixes only
npm run build  # Verify builds
```

### "npm audit fix doesn't work"
Try the manual script instead:
```bash
./manual-fixes.sh
```

### "Scripts take too long"
This is normal. npm operations can take several minutes. Be patient!

### "Port 5432 is open but I don't need PostgreSQL"
This is informational. If it's not in use, you can ignore it. The script just reports what's listening.

---

## Scripts at a Glance

```
Project Root/
├── security-audit.sh       ← Start here for full audit
├── fix-vulns.sh            ← Run this second for diagnosis
├── manual-fixes.sh         ← Run this third for targeted fixes
├── ci-security-check.sh    ← Use in CI/CD for deploys
└── SECURITY-VULNERABILITIES.md  ← Policy & rationale
```

---

## More Information

- See [SECURITY-VULNERABILITIES.md](SECURITY-VULNERABILITIES.md) for policy details
- npm audit docs: https://docs.npmjs.com/cli/v9/commands/npm-audit
- CVSS scoring: https://www.first.org/cvss/
