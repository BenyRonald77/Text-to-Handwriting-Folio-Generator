/**
 * Draws the lined folio paper background on a canvas context.
 *
 * Produces:
 * - Warm cream fill
 * - Evenly-spaced horizontal ruled lines (dark grey)
 * - Full-width writing area (no vertical margin line)
 *
 * Returns the Y positions of every ruled line so the text renderer
 * knows exactly where each baseline sits.
 */

const { FOLIO, LAYOUT } = require('./config');

/**
 * @param {CanvasRenderingContext2D} ctx — already-sized canvas context
 * @returns {number[]} Y positions of each ruled line (top to bottom)
 */
function drawFolioBackground(ctx) {
  const { WIDTH, HEIGHT } = FOLIO;

  // ── Paper fill ──
  ctx.fillStyle = FOLIO.BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── Header line (thicker top border, like real SiDU folio) ──
  ctx.strokeStyle = FOLIO.HEADER_LINE_COLOR;
  ctx.lineWidth = FOLIO.HEADER_LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(0, FOLIO.HEADER_LINE_Y);
  ctx.lineTo(WIDTH, FOLIO.HEADER_LINE_Y);
  ctx.stroke();

  // ── Horizontal ruled lines ──
  ctx.strokeStyle = FOLIO.LINE_COLOR;
  ctx.lineWidth = FOLIO.LINE_WIDTH;

  const lineYs = [];

  for (let y = LAYOUT.FIRST_LINE_Y; y <= LAYOUT.LAST_LINE_Y; y += FOLIO.LINE_SPACING) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
    lineYs.push(y);
  }

  // ── SiDU branding (bottom-left, like real paper) ──
  ctx.save();
  ctx.font = `bold ${FOLIO.SIDU_FONT_SIZE}px sans-serif`;
  ctx.fillStyle = FOLIO.SIDU_COLOR;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(FOLIO.SIDU_TEXT, FOLIO.SIDU_X, FOLIO.SIDU_Y);
  ctx.restore();

  return lineYs;
}

module.exports = { drawFolioBackground };
