/**
 * Draws the lined folio paper background on a canvas context.
 *
 * Matches a CamScanner scan of a real SiDU folio (see config.js):
 * - Near-white paper
 * - Double header line with ruler marks (dot / tick) between them
 * - 38 dark ruled lines, edge to edge
 * - Footer line with ruler marks above it
 * - Grey "SiDU" logo bottom-left
 * - A few random scanner-dust specks (different on every page)
 *
 * The static part is rendered once by preloadPaper() (async, because
 * image decoding in @napi-rs/canvas is async) and cached; each page only
 * copies it and adds its own specks. Call preloadPaper() at startup,
 * before the first generate.
 *
 * Returns the Y positions of every ruled line so the text renderer
 * knows exactly where each baseline sits.
 */

const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { FOLIO } = require('./config');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'images', 'sidu-logo.png');

const LINE_YS = Array.from(
  { length: FOLIO.LINE_COUNT },
  (_, i) => FOLIO.FIRST_LINE_Y + i * FOLIO.LINE_SPACING
);

let cachedPaper = null;
let preloading = null;

function hLine(ctx, y) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(FOLIO.WIDTH, y);
  ctx.stroke();
}

/**
 * Ruler marks along a header/footer line: dot, tick, dot, tick, …
 * @param {number} lineY — the line the marks belong to
 * @param {number} dir — +1 = marks hang below the line, −1 = stand above it
 */
function drawRulerMarks(ctx, lineY, dir) {
  ctx.fillStyle = FOLIO.RULER_COLOR;
  const dotY = lineY + dir * (FOLIO.RULER_TICK_LEN - FOLIO.RULER_DOT_R);

  for (let i = 0, x = FOLIO.RULER_START_X; x < FOLIO.WIDTH; i++, x += FOLIO.RULER_SPACING) {
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.arc(x, dotY, FOLIO.RULER_DOT_R, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const y0 = dir > 0 ? lineY : lineY - FOLIO.RULER_TICK_LEN;
      ctx.fillRect(x - FOLIO.RULER_TICK_W / 2, y0, FOLIO.RULER_TICK_W, FOLIO.RULER_TICK_LEN);
    }
  }
}

function drawLogo(ctx, logo) {
  ctx.save();
  ctx.globalAlpha = FOLIO.SIDU_OPACITY;
  ctx.drawImage(
    logo,
    FOLIO.SIDU_X,
    FOLIO.SIDU_Y,
    logo.width * FOLIO.SIDU_SCALE,
    logo.height * FOLIO.SIDU_SCALE
  );
  ctx.restore();
}

/** Render the static paper (everything except specks) once. */
function preloadPaper() {
  if (!preloading) {
    preloading = loadImage(LOGO_PATH).then((logo) => {
      cachedPaper = renderPaper(logo);
    });
  }
  return preloading;
}

function renderPaper(logo) {
  const canvas = createCanvas(FOLIO.WIDTH, FOLIO.HEIGHT);
  const ctx = canvas.getContext('2d');

  // ── Paper fill ──
  ctx.fillStyle = FOLIO.BG_COLOR;
  ctx.fillRect(0, 0, FOLIO.WIDTH, FOLIO.HEIGHT);

  // ── Header + footer lines with ruler marks ──
  ctx.strokeStyle = FOLIO.BORDER_LINE_COLOR;
  ctx.lineWidth = FOLIO.BORDER_LINE_WIDTH;
  hLine(ctx, FOLIO.HEADER_LINE_Y);
  hLine(ctx, FOLIO.HEADER_LINE2_Y);
  hLine(ctx, FOLIO.FOOTER_LINE_Y);
  drawRulerMarks(ctx, FOLIO.HEADER_LINE_Y, +1);
  drawRulerMarks(ctx, FOLIO.FOOTER_LINE_Y, -1);

  // ── Ruled lines ──
  ctx.strokeStyle = FOLIO.LINE_COLOR;
  ctx.lineWidth = FOLIO.LINE_WIDTH;
  for (const y of LINE_YS) hLine(ctx, y);

  // ── SiDU logo ──
  drawLogo(ctx, logo);

  return canvas;
}

/** Tiny random dust specks, like the ones a scanner picks up. */
function drawSpecks(ctx) {
  ctx.save();
  ctx.fillStyle = FOLIO.SPECK_COLOR;
  for (let i = 0; i < FOLIO.SPECK_COUNT; i++) {
    ctx.globalAlpha = 0.25 + Math.random() * 0.55;
    ctx.beginPath();
    ctx.arc(
      Math.random() * FOLIO.WIDTH,
      Math.random() * FOLIO.HEIGHT,
      0.5 + Math.random() * 1.1,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx — already-sized canvas context
 * @returns {number[]} Y positions of each ruled line (top to bottom)
 */
function drawFolioBackground(ctx) {
  if (!cachedPaper) {
    throw new Error('Folio paper not ready — await preloadPaper() at startup.');
  }
  ctx.drawImage(cachedPaper, 0, 0);
  drawSpecks(ctx);
  return LINE_YS;
}

module.exports = { drawFolioBackground, preloadPaper };
