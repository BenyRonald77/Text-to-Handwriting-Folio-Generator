/**
 * Folio paper configuration.
 * F4 (215mm × 330mm) rendered at 150 DPI.
 *
 * All measurements derived from real Indonesian folio bergaris:
 * - ~8mm line spacing (≈ 47px at 150 DPI, tuned to 44px)
 * - Red vertical margin ~25mm from left edge
 * - ~40 ruled lines per page
 */

// mm → px at 150 DPI
const mm = (v) => Math.round(v / 25.4 * 150);

const FOLIO = Object.freeze({
  // Canvas size
  WIDTH:  mm(215),   // 1270
  HEIGHT: mm(330),   // 1949

  // Background — real SiDU folio has a warm pinkish-cream tone
  BG_COLOR: '#F5EDE0',

  // Ruled lines (horizontal) — dark grey, thin, closely spaced
  LINE_SPACING: 36,      // px between lines (~6mm, matching real folio)
  LINE_COLOR:   '#B0A898', // warm dark grey (matches SiDU paper)
  LINE_WIDTH:   0.5,

  // Header line — the thicker line at the top of the page
  HEADER_LINE_Y:     80,
  HEADER_LINE_COLOR: '#9A9080',
  HEADER_LINE_WIDTH: 1.0,

  // Writing area (full width, no vertical margin line)
  MARGIN_TOP:    116,     // first ruled line — matches real folio top spacing
  MARGIN_BOTTOM: 120,     // extra bottom space for SiDU branding
  WRITE_X:       mm(10),     // ~10mm left padding
  WRITE_END_X:   mm(215) - mm(10), // ~10mm right padding

  // SiDU branding (bottom-left corner)
  SIDU_TEXT:       'SiDU',
  SIDU_FONT_SIZE:  30,       // larger, matching real paper
  SIDU_COLOR:      '#A8A090', // muted warm grey, like printed watermark
  SIDU_X:          mm(8),
  SIDU_Y:          1928,

  // Handwriting
  FONT_FAMILY: 'Kalam',
  FONT_SIZE:   22,       // slightly smaller to fit tighter line spacing
  INK_COLOR:   '#13131f',

  // Output
  JPEG_QUALITY: 92,
});

// Derived layout values
const LAYOUT = Object.freeze({
  WRITE_WIDTH:    FOLIO.WRITE_END_X - FOLIO.WRITE_X,
  FIRST_LINE_Y:   FOLIO.MARGIN_TOP,
  LAST_LINE_Y:    FOLIO.HEIGHT - FOLIO.MARGIN_BOTTOM,
  LINES_PER_PAGE: Math.floor(
    (FOLIO.HEIGHT - FOLIO.MARGIN_BOTTOM - FOLIO.MARGIN_TOP) / FOLIO.LINE_SPACING
  ),
});

/**
 * Per-character randomisation parameters (PRD §8.2).
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  HOW TO TUNE                                                   │
 * │                                                                │
 * │  • Increase a value → more "messy" / natural handwriting       │
 * │  • Decrease a value → more "neat" / uniform text               │
 * │  • Set to 0 → disable that randomisation axis entirely         │
 * │                                                                │
 * │  Use DEBUG mode (below) to generate side-by-side comparisons   │
 * │  after changing values: node test-render.js --debug             │
 * └─────────────────────────────────────────────────────────────────┘
 */
const JITTER = Object.freeze({

  // ── Per-character transforms ──

  // Rotation applied to each individual character (degrees).
  // ±3° = subtle tilt, ±6° = noticeably sloppy.
  ROTATION_DEG: 3.8,

  // Vertical wobble of each character relative to the baseline (px).
  // ±1px = very neat, ±3px = clearly uneven. Simulates hand tremor.
  BASELINE_PX: 2.0,

  // Extra horizontal gap (or overlap) between adjacent characters (px).
  // ±0.5px = tight and even, ±2px = loose and irregular.
  SPACING_PX: 0.8,

  // Size variation per character as a fraction (0.04 = ±4%).
  // 0.02 = barely noticeable, 0.06 = obviously uneven sizes.
  SCALE_FRACTION: 0.04,

  // Pen pressure simulation: opacity range for ink strokes.
  // Narrower range (0.9–1.0) = consistent ink; wider (0.7–1.0) = visible pressure variation.
  OPACITY_MIN: 0.78,
  OPACITY_MAX: 0.96,

  // ── Per-line transforms ──

  // Overall tilt of the entire line (degrees).
  // Simulates hand drift — the line gradually slopes up or down.
  // ±0.1° = barely perceptible, ±0.5° = clearly tilted.
  LINE_TILT_DEG: 0.25,

  // Overall vertical shift of the entire line (px).
  // Moves the whole line slightly above or below the ruled line.
  LINE_Y_OFFSET_PX: 1.2,
});

/**
 * Page number styling (bottom-right corner).
 */
const PAGE_NUMBER = Object.freeze({
  FONT_SIZE:  17,
  COLOR:      '#999999',
  OPACITY:    0.7,
  OFFSET_X:   55,   // px from right edge
  OFFSET_Y:   28,   // px from bottom edge
});

/**
 * Debug / comparison mode.
 *
 * When enabled, the test script generates VARIATIONS_COUNT versions
 * of the same text so you can compare how parameter changes affect
 * the output without re-running multiple times.
 *
 * Enable via:
 *   - Environment variable: DEBUG=true
 *   - CLI flag: node test-render.js --debug
 */
const DEBUG = Object.freeze({
  ENABLED:          process.env.DEBUG === 'true' || process.argv.includes('--debug'),
  VARIATIONS_COUNT: 4,   // how many side-by-side versions to generate
});

module.exports = { FOLIO, LAYOUT, JITTER, PAGE_NUMBER, DEBUG, mm };

