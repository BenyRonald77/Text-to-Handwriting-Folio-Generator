/**
 * Per-character handwriting renderer.
 *
 * Draws each character individually with small random transforms
 * (rotation, position jitter, scale, opacity) to simulate natural
 * handwriting. Parameters follow PRD §8.2.
 *
 * Every call to Math.random() ensures results differ between runs,
 * even for identical input text.
 */

const { FOLIO, JITTER, PAGE_NUMBER } = require('./config');

// ── Helpers ──

/** Random float in [−half, +half] */
const jit = (half) => (Math.random() - 0.5) * 2 * half;

/** Random float in [min, max] */
const rand = (min, max) => min + Math.random() * (max - min);

/** Degrees → radians */
const deg2rad = (d) => d * Math.PI / 180;

/**
 * Render a single line of handwritten text on a canvas.
 *
 * The line's baseline sits at (startX, baselineY). Each character
 * receives independent random transforms so no two renders look
 * the same.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} line — one line of text (already word-wrapped)
 * @param {number} startX — left edge of writing area (px)
 * @param {number} baselineY — Y of the ruled line this text sits on
 * @param {object} [opts]
 * @param {number} [opts.fontSize] — override font size
 * @param {string} [opts.fontFamily] — override font family
 */
function renderHandwrittenLine(ctx, line, startX, baselineY, opts = {}) {
  if (!line || line.length === 0) return;

  const fontSize = opts.fontSize || FOLIO.FONT_SIZE;
  const fontFamily = opts.fontFamily || FOLIO.FONT_FAMILY;

  // Per-line global wobble: slight tilt and vertical shift so the
  // entire line drifts a little, the way real handwriting does.
  const lineTilt = deg2rad(jit(JITTER.LINE_TILT_DEG));
  const lineYShift = jit(JITTER.LINE_Y_OFFSET_PX);

  // Set base font for measurements
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';

  let cursorX = startX;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    // Measure the character's natural width at base font size
    const charWidth = ctx.measureText(ch).width;

    // ── Per-character random transforms ──
    const angle    = deg2rad(jit(JITTER.ROTATION_DEG));
    const yOffset  = jit(JITTER.BASELINE_PX);
    const xJitter  = jit(JITTER.SPACING_PX);
    const scale    = 1 + jit(JITTER.SCALE_FRACTION);
    const alpha    = rand(JITTER.OPACITY_MIN, JITTER.OPACITY_MAX);

    // Position for this character (with line-level drift applied)
    const charX = cursorX + xJitter;
    const charY = baselineY + lineYShift + yOffset
                  + Math.sin(lineTilt) * (cursorX - startX); // tilt effect

    ctx.save();

    // Move origin to character position, apply rotation & scale
    ctx.translate(charX, charY);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Ink colour + pen pressure opacity
    ctx.fillStyle = FOLIO.INK_COLOR;
    ctx.globalAlpha = alpha;

    // Reset font in case scale changed effective size
    ctx.font = `${fontSize}px ${fontFamily}`;

    // Draw character at the transformed origin
    ctx.fillText(ch, 0, 0);

    ctx.restore();

    // Advance cursor (base width + small random gap)
    cursorX += charWidth + jit(JITTER.SPACING_PX);
  }
}

/**
 * Render all lines of a page onto an already-prepared canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} lines — the lines for this page
 * @param {number[]} lineYs — Y positions of each ruled line on the page
 * @param {object} [opts]
 */
function renderPageText(ctx, lines, lineYs, opts = {}) {
  const startX = opts.startX || FOLIO.WRITE_X;

  for (let i = 0; i < lines.length && i < lineYs.length; i++) {
    if (lines[i].length === 0) continue; // blank line — just skip
    renderHandwrittenLine(ctx, lines[i], startX, lineYs[i], opts);
  }
}

/**
 * Draw a small page number in the bottom-right corner.
 */
function drawPageNumber(ctx, pageNum, totalPages) {
  ctx.save();
  ctx.font = `${PAGE_NUMBER.FONT_SIZE}px ${FOLIO.FONT_FAMILY}`;
  ctx.fillStyle = PAGE_NUMBER.COLOR;
  ctx.globalAlpha = PAGE_NUMBER.OPACITY;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    `${pageNum}`,
    FOLIO.WIDTH - PAGE_NUMBER.OFFSET_X,
    FOLIO.HEIGHT - PAGE_NUMBER.OFFSET_Y
  );
  ctx.restore();
}

module.exports = { renderHandwrittenLine, renderPageText, drawPageNumber };
