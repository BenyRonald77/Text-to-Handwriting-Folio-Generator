// Register fonts FIRST — before any canvas usage anywhere.
require('./fonts');

const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Generate endpoint (with rate limiter)
app.use('/api/generate', generateLimiter, require('./routes/generate'));

// --- Start ---
app.listen(PORT, () => {
  console.log(`✦ Handwriting Folio server running on http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
});
