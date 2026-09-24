const path = require('path');

// Load environment variables FIRST — config.js reads process.env at load time.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Register fonts before any canvas usage anywhere.
require('./fonts');

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createBasicAuth } = require('./middleware/basic-auth');
const { HANDWRITING_FONTS } = require('./render/config');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Behind Nginx the client IP arrives in X-Forwarded-For. Without this,
// every request looks like it comes from 127.0.0.1 and the rate limiter
// would throttle all users together. Set TRUST_PROXY=1 when behind one proxy.
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(tp) ? parseInt(tp, 10) : tp === 'true');
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

// Rate limiter on /api/generate (PRD §7: 20 req/min per IP)
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

// --- Start ---
// Render the static folio paper (incl. SiDU logo) before taking requests.
require('./render/background').preloadPaper().then(() => app.listen(PORT, HOST, () => {
  console.log(`✦ Handwriting Folio server running on http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
}));
