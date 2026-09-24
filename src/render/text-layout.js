/**
 * Text layout engine: word-wrap and pagination.
 *
 * Whitespace is preserved the way the user typed it, so indentation,
 * centred titles and aligned "Nama : …" blocks survive:
 * - every space is a fixed width (FOLIO.SPACE_WIDTH), the same for all
 *   fonts, so indentation doesn't depend on the chosen font
 * - a tab jumps to the next tab stop (FOLIO.TAB_WIDTH) → reliable alignment
 * - list items ("1.", "1)", "a.", "-", "•") get a hanging indent: wrapped
 *   lines line up under the item text instead of the left margin
 * - other paragraphs wrap back to the left margin (first-line indent)
 *
 * Output lines are { segments: [{ x, text }] }: each word with its exact x
 * offset from the writing-area left edge, so the renderer's per-character
 * jitter can never push later words out of alignment.
 */

const { createCanvas } = require('@napi-rs/canvas');
const { FOLIO, LAYOUT } = require('./config');

// "1." "12)" "a." "B)" "iv." "-" "•" "*" followed by whitespace
const LIST_MARKER = /^(\d{1,3}[.)]|[a-zA-Z][.)]|[ivxlcIVXLC]{1,6}[.)]|[-•*–])[ \t]+/;

/**
 * Measure text width using a scratch canvas with the handwriting font.
 * We create one context for all measurements in a single run.
 *
 * @param {{ FAMILY: string, SIZE: number }} [font] — defaults to FOLIO font
 */
function createMeasurer(font) {
  const canvas = createCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  const size = font ? font.SIZE : FOLIO.FONT_SIZE;
  const family = font ? font.FAMILY : FOLIO.FONT_FAMILY;
  ctx.font = `${size}px "${family}"`;

  // Sum of per-character widths — the renderer draws one character at a
  // time (no kerning), so measuring whole words would under-estimate them
  // and later words would collide with earlier ones.
  const cache = new Map();
  const charWidth = (ch) => {
    if (!cache.has(ch)) cache.set(ch, ctx.measureText(ch).width);
    return cache.get(ch);
  };

  return {
    measure(text) {
      let w = 0;
      for (const ch of text) w += charWidth(ch);
      return w;
    },
  };
}

/** Advance x over a run of whitespace (spaces and tabs). */
function advanceWhitespace(x, ws) {
  for (const ch of ws) {
    if (ch === '\t') {
      x = (Math.floor(x / FOLIO.TAB_WIDTH) + 1) * FOLIO.TAB_WIDTH;
    } else {
      x += FOLIO.SPACE_WIDTH;
    }
  }
  return x;
}

/**
 * Break a single word that is wider than maxWidth into chunks
 * that each fit within maxWidth.
 */
function breakLongWord(word, maxWidth, m) {
  const chunks = [];
  let chunk = '';

  for (const ch of word) {
    if (chunk && m.measure(chunk + ch) > maxWidth) {
      chunks.push(chunk);
      chunk = ch;
    } else {
      chunk += ch;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

/**
 * Lay out one paragraph (one source line) into wrapped lines.
 */
function wrapParagraph(para, maxWidth, m) {
  // Tokens alternate: [whitespace?, word, whitespace, word, …]
  const tokens = para.split(/([ \t]+)/).filter((t) => t !== '');

  // Hanging indent for list items = x where the item text starts
  let hangingX = 0;
  const indent = para.match(/^[ \t]*/)[0];
  const rest = para.slice(indent.length);
  const list = rest.match(LIST_MARKER);
  if (list) {
    const markerWord = list[1];
    const gap = list[0].slice(markerWord.length);
    hangingX = advanceWhitespace(
      advanceWhitespace(0, indent) + m.measure(markerWord),
      gap
    );
    if (hangingX > maxWidth / 2) hangingX = 0; // absurd indent → ignore
  }

  const lines = [];
  let segments = [];
  let x = 0;
  let pendingWs = '';

  const newLine = () => {
    lines.push({ segments });
    segments = [];
    x = hangingX;
    pendingWs = ''; // whitespace at a line break is dropped
  };

  for (const tok of tokens) {
    if (/^[ \t]+$/.test(tok)) {
      pendingWs += tok;
      continue;
    }

    let wordX = advanceWhitespace(x, pendingWs);
    const w = m.measure(tok);

    if (wordX + w > maxWidth && segments.length > 0) {
      newLine();
      wordX = x;
    }

    if (wordX + w > maxWidth) {
      // Word longer than the whole line → hard-break it
      const chunks = breakLongWord(tok, maxWidth - wordX, m);
      for (let i = 0; i < chunks.length - 1; i++) {
        segments.push({ x: wordX, text: chunks[i] });
        newLine();
        wordX = x;
      }
      const last = chunks[chunks.length - 1];
      segments.push({ x: wordX, text: last });
      x = wordX + m.measure(last);
    } else {
      segments.push({ x: wordX, text: tok });
      x = wordX + w;
    }
    pendingWs = '';
  }

  lines.push({ segments });
  return lines;
}

/**
 * Word-wrap text into positioned lines that fit within maxWidth.
 * Each source line (\n) starts a new line; blank source lines stay blank.
 *
 * @param {string} text — raw input text
 * @param {number} maxWidth — pixel width of the writing area
 * @param {object} [font] — HANDWRITING_FONTS entry used for measuring
 * @returns {{ segments: { x: number, text: string }[] }[]}
 */
function wrapText(text, maxWidth, font) {
  const m = createMeasurer(font);
  const lines = [];

  for (const para of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (para.trim() === '') {
      lines.push({ segments: [] });
    } else {
      lines.push(...wrapParagraph(para.replace(/\s+$/, ''), maxWidth, m));
    }
  }

  return lines;
}

/**
 * Split an array of lines into pages.
 *
 * @param {object[]} lines — output of wrapText()
 * @param {number} linesPerPage — how many lines fit on one folio page
 * @returns {object[][]} array of pages, each page is array of lines
 */
function paginateLines(lines, linesPerPage) {
  const pages = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  // Always return at least one (empty) page
  if (pages.length === 0) pages.push([]);

  return pages;
}

/**
 * Full text layout: wrap + paginate in one call.
 *
 * @param {string} text
 * @param {object} [font] — HANDWRITING_FONTS entry used for measuring
 * @returns {object[][]} pages, each containing lines
 */
function layoutText(text, font) {
  const lines = wrapText(text, LAYOUT.WRITE_WIDTH, font);
  return paginateLines(lines, LAYOUT.LINES_PER_PAGE);
}

module.exports = { wrapText, paginateLines, layoutText, createMeasurer };
