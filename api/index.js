// Vercel serverless entry point.
//
// vercel.json rewrites every path (including "/" and the static page) to
// this function, so basic auth protects the web page too — not just the API.

const { app, preloadPaper } = require('../src/app');

// Start rendering the folio paper as soon as the instance boots (cold start);
// requests wait for it once, warm requests skip straight through.
const ready = preloadPaper();

module.exports = async (req, res) => {
  await ready;
  return app(req, res);
};
