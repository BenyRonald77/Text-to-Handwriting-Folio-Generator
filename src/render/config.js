/**
 * Folio paper configuration.
 * F4 (215mm × 330mm) rendered at 150 DPI.
 *
 * Geometry is measured from a CamScanner scan of a real SiDU folio
 * ("cam scanner folio.pdf", 2668×4012px) and cross-checked with the
 * "Folio 1.png" template — both give the same proportions:
 * - Double header line with a ruler (dot / tick every ~1cm) between them
 * - 38 ruled lines, ~7.1mm apart, running edge to edge
 * - Single footer line with the same ruler marks above it
 * - Grey "SiDU" logo bottom-left, below the footer line
 *
 * Y positions are scan fractions × page height, so they stay correct
 * if the canvas size changes.
 */

// mm → px at 150 DPI
const mm = (v) => Math.round(v / 25.4 * 150);

const WIDTH  = mm(215);   // 1270
const HEIGHT = mm(330);   // 1949

// Scan coordinate → canvas coordinate
const SCAN_W = 2668;
const SCAN_H = 4012;
const sx = (v) => v / SCAN_W * WIDTH;
const sy = (v) => v / SCAN_H * HEIGHT;

const FOLIO = Object.freeze({
  // Canvas size
  WIDTH,
  HEIGHT,

  // Paper — near-white, as it comes out of CamScanner
  BG_COLOR: '#FCFBFB',

  // Ruled lines (horizontal) — dark, crisp, edge to edge
  FIRST_LINE_Y: sy(448),                    // ≈ 217.6
  LINE_SPACING: sy((3708 - 448) / 37),      // ≈ 42.8 (~7.1mm)
  LINE_COUNT:   38,
  LINE_COLOR:   '#2F2B29',
  LINE_WIDTH:   2.6,

  // Header: two lines with ruler marks hanging from the upper one
  HEADER_LINE_Y:     sy(332),               // ≈ 161.3
  HEADER_LINE2_Y:    sy(360),               // ≈ 174.9
  // Footer: one line with ruler marks standing on it
  FOOTER_LINE_Y:     sy(3801),              // ≈ 1846.5
  BORDER_LINE_COLOR: '#5A5653',             // header/footer print is a bit greyer
  BORDER_LINE_WIDTH: 3.0,

  // Ruler marks on header/footer: alternating dot and short tick
  RULER_START_X:  sx(43),                   // first mark is a dot
  RULER_SPACING:  sx(125.6),                // ≈ 59.8 (~1cm)
  RULER_DOT_R:    1.7,
  RULER_TICK_LEN: 5.5,
  RULER_TICK_W:   1.4,
  RULER_COLOR:    '#3A3634',

  // SiDU logo — cut from the scan (src/assets/images/sidu-logo.png)
  SIDU_X:       sx(204),
  SIDU_Y:       sy(3859),                   // top edge of the logo image
  SIDU_SCALE:   WIDTH / SCAN_W,             // logo PNG is at scan resolution
  SIDU_OPACITY: 0.9,

  // Scanner dust: a few tiny specks scattered on the page (0 = off)
  SPECK_COUNT:  28,
  SPECK_COLOR:  '#4A4644',

  // Writing area (full width, no vertical margin line)
  WRITE_X:       mm(10),     // ~10mm left padding
  WRITE_END_X:   mm(215) - mm(10), // ~10mm right padding

  // Whitespace (text-layout.js). Fixed widths — the same for every font —
  // so indentation typed in the textarea looks the same whatever font is
  // picked. Ratio to the writing width roughly matches the web textarea.
  SPACE_WIDTH: 9,        // px per space character
  TAB_WIDTH:   72,       // px between tab stops (= 8 spaces)

  // Handwriting — default font (see HANDWRITING_FONTS for the full set)
  FONT_FAMILY: 'Kalam',
  FONT_SIZE:   26,
  INK_COLOR:   '#13131f',

  // Output
  JPEG_QUALITY: 92,
});

// Derived layout values
const LAYOUT = Object.freeze({
  WRITE_WIDTH:    FOLIO.WRITE_END_X - FOLIO.WRITE_X,
  LINES_PER_PAGE: FOLIO.LINE_COUNT,
});

/**
 * Handwriting fonts (PRD §8.2 — 2-3 fonts, randomised per generate).
 *
 * Each font has its own size because the fonts have very different
 * x-heights: Caveat at 22px looks tiny next to Kalam at 22px. Tune SIZE
 * so every font looks roughly the same size on the ~43px ruled lines.
 *
 * FILES are loaded from src/assets/fonts/ by src/fonts.js.
 */
const HANDWRITING_FONTS = Object.freeze([
  { ID: 'kalam',        FAMILY: 'Kalam',        SIZE: 26, FILES: ['Kalam-Regular.ttf', 'Kalam-Bold.ttf'] },
  { ID: 'caveat',       FAMILY: 'Caveat',       SIZE: 33, FILES: ['Caveat-Variable.ttf'] },
  { ID: 'patrick-hand', FAMILY: 'Patrick Hand', SIZE: 31, FILES: ['PatrickHand-Regular.ttf'] },
  { ID: 'gochi-hand',   FAMILY: 'Gochi Hand',   SIZE: 28, FILES: ['GochiHand-Regular.ttf'] },
  { ID: 'handlee',               FAMILY: 'Handlee',               SIZE: 26, FILES: ['Handlee-Regular.ttf'] },
  { ID: 'indie-flower',          FAMILY: 'Indie Flower',          SIZE: 27, FILES: ['IndieFlower-Regular.ttf'] },
  { ID: 'shadows-into-light',    FAMILY: 'Shadows Into Light',    SIZE: 28, FILES: ['ShadowsIntoLight.ttf'] },
  { ID: 'architects-daughter',   FAMILY: 'Architects Daughter',   SIZE: 25, FILES: ['ArchitectsDaughter-Regular.ttf'] },
  { ID: 'reenie-beanie',         FAMILY: 'Reenie Beanie',         SIZE: 34, FILES: ['ReenieBeanie.ttf'] },
  { ID: 'nothing-you-could-do',  FAMILY: 'Nothing You Could Do',  SIZE: 27, FILES: ['NothingYouCouldDo.ttf'] },
  { ID: 'homemade-apple',        FAMILY: 'Homemade Apple',        SIZE: 22, FILES: ['HomemadeApple-Regular.ttf'] },
  { ID: 'covered-by-your-grace', FAMILY: 'Covered By Your Grace', SIZE: 30, FILES: ['CoveredByYourGrace.ttf'] },
  { ID: 'just-another-hand',     FAMILY: 'Just Another Hand',     SIZE: 35, FILES: ['JustAnotherHand-Regular.ttf'] },
  { ID: 'sue-ellen-francisco',   FAMILY: 'Sue Ellen Francisco',   SIZE: 30, FILES: ['SueEllenFrancisco-Regular.ttf'] },
  { ID: 'zeyada',                FAMILY: 'Zeyada',                SIZE: 31, FILES: ['Zeyada.ttf'] },
  { ID: 'dawning-of-a-new-day',  FAMILY: 'Dawning of a New Day',  SIZE: 35, FILES: ['DawningofaNewDay.ttf'] },
]);

/**
 * Resolve a font id to its config entry.
 * Unknown / missing id (or 'random') → a random font from the set.
 */
function resolveFont(id) {
  const found = HANDWRITING_FONTS.find((f) => f.ID === id);
  if (found) return found;
  return HANDWRITING_FONTS[Math.floor(Math.random() * HANDWRITING_FONTS.length)];
}

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

module.exports = {
  FOLIO, LAYOUT, JITTER, PAGE_NUMBER, DEBUG, HANDWRITING_FONTS, resolveFont, mm,
};

