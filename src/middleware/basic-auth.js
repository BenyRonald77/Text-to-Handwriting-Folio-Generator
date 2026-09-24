const crypto = require('crypto');

/**
 * HTTP Basic Auth (PRD §7 — simple access protection).
 *
 * The app is shared with a few friends via a link, so a single shared
 * username/password is enough. The browser shows its native login prompt
 * once and then sends the credentials automatically — including on the
 * frontend's fetch('/api/generate') calls, since they are same-origin.
 *
 * Disabled when BASIC_AUTH_PASS is empty (e.g. local development).
 */

/** Constant-time string compare (hash first so lengths always match). */
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function createBasicAuth({ user, pass, realm = 'Handwriting Folio' }) {
  return function basicAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');

    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const sep = decoded.indexOf(':');
      if (sep !== -1) {
        const okUser = safeEqual(decoded.slice(0, sep), user);
        const okPass = safeEqual(decoded.slice(sep + 1), pass);
        if (okUser && okPass) return next();
      }
    }

    res.set('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`);
    return res.status(401).json({ error: 'Akses ditolak. Masukkan username & password.' });
  };
}

module.exports = { createBasicAuth };
