/**
 * Main folio rendering orchestrator.
 *
 * Combines the background, text layout, and handwriting renderer
 * into one entry point: generateHandwritingPages(text) → Buffer[]
 *
 * Flow (PRD §9.3):
 * 1. Layout text → word-wrapped lines → paginated pages
 * 2. For each page:
 *    a. Create fresh canvas
 *    b. Draw lined paper background
 *    c. Render each line character-by-character with jitter
 *    d. Add page number
 *    e. Export to JPEG buffer
 * 3. Return array of JPEG buffers
 */

const { createCanvas } = require('@napi-rs/canvas');
const { FOLIO, resolveFont } = require('./config');
const { drawFolioBackground } = require('./background');
const { layoutText } = require('./text-layout');
const { renderPageText, drawPageNumber } = require('./handwriting');

/**
 * Generate handwritten folio page images from text.
 *
 * One font is picked per call (not per page) so every page of a single
 * result looks like it was written by the same hand.
 *
 * @param {string} text — the full input text
 * @param {object} [options]
 * @param {number} [options.jpegQuality] — 0-100 (default: FOLIO.JPEG_QUALITY)
 * @param {string} [options.font]        — HANDWRITING_FONTS id; omitted/'random' → random
 * @returns {{ font: string, buffers: Buffer[] }} font id used + one JPEG buffer per page
 */
function generateHandwritingPages(text, options = {}) {
  const quality = options.jpegQuality ?? FOLIO.JPEG_QUALITY;
  const font = resolveFont(options.font);

  // ── Step 1: Layout ──
  // Word-wrap into lines (measured with the chosen font), then group into pages
  const pages = layoutText(text, font);
  const buffers = [];

  // ── Step 2: Render each page ──
  for (let p = 0; p < pages.length; p++) {
    const canvas = createCanvas(FOLIO.WIDTH, FOLIO.HEIGHT);
    const ctx = canvas.getContext('2d');

    // 2a. Paper background (returns ruled line Y positions)
    const lineYs = drawFolioBackground(ctx);

    // 2b. Handwritten text
    renderPageText(ctx, pages[p], lineYs, {
      fontSize:   font.SIZE,
      fontFamily: font.FAMILY,
      startX:     FOLIO.WRITE_X,
    });

    // 2c. Page number
    drawPageNumber(ctx, p + 1, pages.length);

    // 2d. Export JPEG
    const buffer = canvas.toBuffer('image/jpeg', quality);
    buffers.push(buffer);
  }

  return { font: font.ID, buffers };
}

module.exports = { generateHandwritingPages };
