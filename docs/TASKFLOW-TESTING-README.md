# TaskFlow Pro — Security, Rate Limiting & Performance Guide

## What's included

| File | Purpose |
|---|---|
| `taskflow-rate-limiter.js` | Express middleware — drop into your server |
| `security-audit.sh` | Ubuntu shell script — security & secret scan |
| `perf-test.sh` | Ubuntu shell script — load & bug testing |

---

## 1. Add rate limiting to your server

```bash
# In your server directory
npm install express-rate-limit express-slow-down helmet
```

Copy `taskflow-rate-limiter.js` → `your-server/middleware/rateLimiter.js`

Then in `server.js` / `app.js`:

```js
const {
  globalLimiter, authLimiter, taskCreateLimiter,
  readLimiter, speedLimiter, securityHeaders,
} = require('./middleware/rateLimiter');

app.use(securityHeaders);       // Security headers on all routes
app.use(globalLimiter);         // 200 req / 15 min per IP
app.use(speedLimiter);          // Slow down after 50 req/min

app.use('/api/auth/login',    authLimiter);       // 10 attempts / 15 min
app.use('/api/auth/register', authLimiter);

app.get('/api/tasks',         readLimiter,       tasksCtrl.list);
app.post('/api/tasks',        taskCreateLimiter, tasksCtrl.create);
app.get('/api/analytics',     readLimiter,       analyticsCtrl.get);
```

---

## 2. Run the security audit

```bash
# Make executable
chmod +x security-audit.sh

# Basic run (from your project root)
./security-audit.sh

# With custom paths
SERVER_DIR=./backend CLIENT_DIR=./frontend ./security-audit.sh

# With your API URL
API_URL=http://localhost:3001 ./security-audit.sh
```

**What it checks:**
- npm dependency vulnerabilities (critical / high / moderate)
- Hardcoded secrets, API keys, JWT tokens in source files
- `.env` file permissions and `.gitignore` coverage
- Open ports on localhost
- HTTP security headers (CSP, HSTS, X-Frame-Options…)
- Rate limiting (sends 15 rapid requests, expects 429s)
- CORS wildcard misconfiguration
- Injection patterns in server code (eval, $where, string concat in queries)

---

## 3. Run the performance & bug tests

```bash
chmod +x perf-test.sh

# Basic run
./perf-test.sh

# With auth token (if your API requires login)
AUTH_TOKEN=your_jwt_here ./perf-test.sh

# With custom URLs
APP_URL=http://localhost:3000 API_URL=http://localhost:3001 ./perf-test.sh
```

**What it tests:**
- API response time (10-sample average, p50, p99)
- Load test: 100 requests @ 10 concurrency, 500 @ 50 concurrency
- 20 concurrent task creates (race condition / data integrity check)
- Node.js process memory & CPU usage
- Your existing Jest/Mocha/Vitest test suite (npm test)
- Production build size & bundle analysis
- Smoke tests for every endpoint (list, create, analytics, 404, validation)

---

## Quick thresholds (sensible defaults)

| Metric | Target |
|---|---|
| GET /api/tasks avg response | < 300 ms |
| GET /api/analytics avg response | < 500 ms |
| React app initial load | < 1000 ms |
| JS bundle (largest chunk) | < 500 KB |
| Node.js process RAM | < 512 MB |
| Failed requests under load | 0 |

---

## Recommended order before every deploy

```
1. ./security-audit.sh       — fix any FAIL lines first
2. ./perf-test.sh            — verify no regressions
3. Deploy using rolling/blue-green strategy
```
