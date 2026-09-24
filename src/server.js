// Long-running server entry point (local dev, VPS + PM2).
// For Vercel, see api/index.js — both use the same app from ./app.

const { app, preloadPaper } = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Render the static folio paper (incl. SiDU logo) before taking requests.
preloadPaper().then(() => app.listen(PORT, HOST, () => {
  console.log(`✦ Handwriting Folio server running on http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
}));
