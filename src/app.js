/**
 * Express app — shared by both entry points:
 *   - src/server.js  → long-running server (local dev, VPS + PM2)
 *   - api/index.js   → Vercel serverless function
 *
 * This module only builds the app; it does not listen. Callers must
 * `await preloadPaper()` (re-exported below) before handling requests.
 */

const path = require('path');

// Load environment variables FIRST — config.js reads process.env at load time.
// (On Vercel there is no .env file; variables come from the project settings.)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Register fonts before any canvas usage anywhere.
require('./fonts');

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createBasicAuth } = require('./middleware/basic-auth');
const { HANDWRITING_FONTS } = require('./render/config');
const { preloadPaper } = require('./render/background');

const app = express();

// Behind a proxy the client IP arrives in X-Forwarded-For. Without this,
// every request looks like it comes from the proxy and the rate limiter
// would throttle all users together. Set TRUST_PROXY=1 behind Nginx;
// Vercel always sits in front of the function, so it's on by default there.
const trustProxy = process.env.TRUST_PROXY || (process.env.VERCEL ? '1' : '');
if (trustProxy) {
  app.set('trust proxy', /^\d+$/.test(trustProxy) ? parseInt(trustProxy, 10) : trustProxy === 'true');
}

// --- Health check (before auth, so uptime monitors / PM2 checks work) ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// --- Access protection (PRD §7) ---
if (process.env.BASIC_AUTH_PASS) {
  app.use(createBasicAuth({
    user: process.env.BASIC_AUTH_USER || 'teman',
    pass: process.env.BASIC_AUTH_PASS,
  }));
  console.log('  Basic auth: enabled');
} else {
  console.log('  Basic auth: disabled (set BASIC_AUTH_PASS to enable)');
}

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiter on /api/generate (PRD §7: 20 req/min per IP).
// Note: the counter lives in memory, so on Vercel each function instance
// counts separately — good enough as a brake, not a hard global limit.
const generateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak request. Coba lagi nanti.' },
});

// --- Static files ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Routes ---

// Available handwriting fonts (for the frontend font picker)
app.get('/api/fonts', (_req, res) => {
  res.json({
    fonts: HANDWRITING_FONTS.map((f) => ({ id: f.ID, name: f.FAMILY })),
  });
});

// Generate endpoint (with rate limiter)
app.use('/api/generate', generateLimiter, require('./routes/generate'));

module.exports = { app, preloadPaper };
