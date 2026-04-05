// ============================================================
// TaskFlow Pro — API Rate Limiting Middleware
// File: middleware/rateLimiter.js
// Install: npm install express-rate-limit rate-limit-redis ioredis helmet express-slow-down
// ============================================================

const rateLimit = require('express-rate-limit');
const slowDown  = require('express-slow-down');
const helmet    = require('helmet');

// ── Helpers ─────────────────────────────────────────────────

/**
 * Standard rate-limit response body.
 * Keeps your API responses consistent.
 */
const limitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error:   'Too many requests',
    message: `Rate limit exceeded. Try again after ${Math.ceil(req.rateLimit.resetTime / 1000)} seconds.`,
    retryAfter: req.rateLimit.resetTime,
  });
};

// ── 1. Global limiter — every route ─────────────────────────
// 200 requests per IP per 15 minutes across the whole API.
const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 min
  max:              200,
  standardHeaders:  true,            // Return RateLimit-* headers
  legacyHeaders:    false,
  handler:          limitHandler,
  message:          'Global rate limit reached.',
});

// ── 2. Auth routes — strict ──────────────────────────────────
// Login / register: 10 attempts per 15 min per IP.
// Prevents brute-force and credential stuffing.
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         limitHandler,
  skipSuccessfulRequests: true,      // Only counts failed requests
});

// ── 3. Task creation — per user ──────────────────────────────
// 30 tasks created per minute (blocks spam / runaway scripts).
const taskCreateLimiter = rateLimit({
  windowMs:        60 * 1000,       // 1 min
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => req.user?.id || req.ip, // per-user when authenticated
  handler:         limitHandler,
});

// ── 4. Read endpoints — generous ────────────────────────────
// Dashboard, task list: 300 reads per minute per IP.
const readLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         limitHandler,
});

// ── 5. Slow-down middleware ──────────────────────────────────
// After 50 requests per minute, add 500 ms delay per request
// (softer than hard-blocking — degrades gracefully).
const speedLimiter = slowDown({
  windowMs:        60 * 1000,
  delayAfter:      50,
  delayMs:         500,
  maxDelayMs:      5000,
});

// ── 6. Security headers (Helmet) ─────────────────────────────
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
    },
  },
  hsts: {
    maxAge:            31536000,
    includeSubDomains: true,
    preload:           true,
  },
  referrerPolicy:      { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  xFrameOptions:       { action: 'deny' },
  xXssProtection:      true,
});

// ── Export ───────────────────────────────────────────────────
module.exports = {
  globalLimiter,
  authLimiter,
  taskCreateLimiter,
  readLimiter,
  speedLimiter,
  securityHeaders,
};


// ============================================================
// HOW TO WIRE INTO YOUR EXPRESS APP  (server.js / app.js)
// ============================================================
//
// const express = require('express');
// const {
//   globalLimiter, authLimiter, taskCreateLimiter,
//   readLimiter, speedLimiter, securityHeaders,
// } = require('./middleware/rateLimiter');
//
// const app = express();
//
// // Apply globally first
// app.use(securityHeaders);
// app.use(globalLimiter);
// app.use(speedLimiter);
//
// // Auth routes
// app.use('/api/auth/login',    authLimiter);
// app.use('/api/auth/register', authLimiter);
//
// // Task routes
// app.get('/api/tasks',        readLimiter,        tasksController.list);
// app.get('/api/tasks/:id',    readLimiter,        tasksController.get);
// app.post('/api/tasks',       taskCreateLimiter,  tasksController.create);
// app.put('/api/tasks/:id',    taskCreateLimiter,  tasksController.update);
// app.delete('/api/tasks/:id', taskCreateLimiter,  tasksController.delete);
//
// // Analytics route
// app.get('/api/analytics',    readLimiter,        analyticsController.get);
