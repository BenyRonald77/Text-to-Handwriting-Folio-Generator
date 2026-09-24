const express = require('express');
const { generateHandwritingPages } = require('../render/folio');
const { DEBUG, HANDWRITING_FONTS } = require('../render/config');

const router = express.Router();

const MAX_TEXT_LENGTH = parseInt(process.env.MAX_TEXT_LENGTH, 10) || 10000;
const JPEG_QUALITY = parseInt(process.env.JPEG_QUALITY, 10) || 92;

/**
 * POST /api/generate
 *
 * Query params (optional):
 *   - ?debug=true   — generate multiple variations of the same text
 *   - ?count=N      — number of variations in debug mode (2..6, default: 4)
 *
 * Body:
 *   {
 *     "text": "...",
 *     "font": "random", // optional, HANDWRITING_FONTS id or "random" (default)
 *     "debug": false,  // optional, overrides to debug mode
 *     "count": 4       // optional debug variations count
 *   }
 *
 * Response (Normal):
 *   {
 *     "isDebug": false,
 *     "font": "kalam",
 *     "totalPages": N,
 *     "images": ["data:image/jpeg;base64,..."]
 *   }
 *
 * Response (Debug):
 *   {
 *     "isDebug": true,
 *     "totalPages": N,
 *     "variationsCount": 4,
 *     "variations": [
 *       { "variation": 1, "font": "kalam", "images": [...] },
 *       { "variation": 2, "font": "caveat", "images": [...] },
 *       ...
 *     ],
 *     "images": ["data:image/jpeg;base64,..."] // variation 1 for backward compat
 *   }
 */
router.post('/', (req, res) => {
  try {
    const { text, font, debug: bodyDebug, count: bodyCount } = req.body || {};

    // --- Validation ---
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Teks tidak boleh kosong.',
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        error: `Teks melebihi batas maksimum ${MAX_TEXT_LENGTH} karakter.`,
      });
    }

    if (
      font !== undefined &&
      font !== 'random' &&
      !HANDWRITING_FONTS.some((f) => f.ID === font)
    ) {
      return res.status(400).json({
        error: `Font tidak dikenal: ${String(font).slice(0, 50)}`,
      });
    }

    // --- Debug mode check ---
    // Activated via query param ?debug=true, body { debug: true }, or process.env.DEBUG=true
    const isDebug =
      req.query.debug === 'true' ||
      req.query.debug === '1' ||
      bodyDebug === true ||
      bodyDebug === 'true' ||
      process.env.DEBUG === 'true' ||
      DEBUG.ENABLED;

    const t0 = Date.now();
    const cleanText = text.trim();

    if (isDebug) {
      const rawCount = parseInt(req.query.count || bodyCount, 10);
      const variationsCount = Math.min(
        Math.max(Number.isFinite(rawCount) ? rawCount : DEBUG.VARIATIONS_COUNT, 2),
        6
      );

      const variations = [];
      for (let v = 1; v <= variationsCount; v++) {
        // With font 'random' each variation gets its own font — handy for
        // comparing fonts side by side.
        const result = generateHandwritingPages(cleanText, {
          jpegQuality: JPEG_QUALITY,
          font,
        });
        const images = result.buffers.map(
          (buf) => `data:image/jpeg;base64,${buf.toString('base64')}`
        );
        variations.push({
          variation: v,
          font: result.font,
          images,
        });
      }

      const elapsed = Date.now() - t0;
      console.log(
        `[generate:debug] ${cleanText.length} chars → ${variationsCount} variations (${variations[0].images.length} pages each) in ${elapsed}ms`
      );

      return res.json({
        isDebug: true,
        font: variations[0].font,
        totalPages: variations[0].images.length,
        variationsCount: variations.length,
        variations,
        images: variations[0].images,
      });
    }

    // --- Normal mode ---
    const { font: usedFont, buffers } = generateHandwritingPages(cleanText, {
      jpegQuality: JPEG_QUALITY,
      font,
    });
    const elapsed = Date.now() - t0;

    console.log(
      `[generate] ${cleanText.length} chars → ${buffers.length} page(s) [${usedFont}] in ${elapsed}ms`
    );

    const images = buffers.map(
      (buf) => `data:image/jpeg;base64,${buf.toString('base64')}`
    );

    return res.json({
      isDebug: false,
      font: usedFont,
      totalPages: images.length,
      images,
    });
  } catch (err) {
    console.error('[generate] Error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan saat generate.' });
  }
});

module.exports = router;
