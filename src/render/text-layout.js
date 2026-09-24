/**
 * Text layout engine: word-wrap and pagination.
 *
 * Uses canvas measureText() to calculate how many words fit on each
 * ruled line, then groups lines into pages. Respects explicit newlines
 * in the source text as paragraph breaks.
 */

const { createCanvas } = require('@napi-rs/canvas');
const { FOLIO, LAYOUT } = require('./config');

/**
 * Measure text width using a scratch canvas with the handwriting font.
 * We create one context for all measurements in a single run.
 *
 * @param {{ FAMILY: string, SIZE: number }} [font] — defaults to FOLIO font
 * @returns {{ measureWord: (word: string) => number, measureChar: (ch: string) => number }}
 */
function createMeasurer(font) {
  const canvas = createCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  const size = font ? font.SIZE : FOLIO.FONT_SIZE;
  const family = font ? font.FAMILY : FOLIO.FONT_FAMILY;
  ctx.font = `${size}px "${family}"`;

  return {
    measureWord(word) {
      return ctx.measureText(word).width;
    },
    measureChar(ch) {
      return ctx.measureText(ch).width;
    },
    measureSpace() {
      return ctx.measureText(' ').width;
    },
  };
}

/**
 * Word-wrap a block of text into lines that fit within maxWidth.
 *
 * - Preserves explicit \n as line breaks (paragraph separation).
 * - Breaks at word boundaries (spaces).
 * - If a single word is wider than the line, it is force-broken
 *   mid-word to prevent overflow.
 *
 * @param {string} text — raw input text
 * @param {number} maxWidth — pixel width of the writing area
 * @param {object} [font] — HANDWRITING_FONTS entry used for measuring
 * @returns {string[]} array of lines (one string per line)
 */
function wrapText(text, maxWidth, font) {
  const m = createMeasurer(font);
  const spaceW = m.measureSpace();
  const paragraphs = text.split('\n');
  const lines = [];

  for (const para of paragraphs) {
    // An empty paragraph → blank line (preserves double-newlines)
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/).filter(Boolean);
    let currentLine = '';
    let currentWidth = 0;

    for (const word of words) {
      const wordWidth = m.measureWord(word);

      // Case 1: word fits on current line
      if (currentLine === '') {
        // First word on the line — handle words wider than maxWidth
        if (wordWidth <= maxWidth) {
          currentLine = word;
          currentWidth = wordWidth;
        } else {
          // Force-break the long word character by character
          const broken = breakLongWord(word, maxWidth, m);
          for (let i = 0; i < broken.length - 1; i++) {
            lines.push(broken[i]);
          }
          currentLine = broken[broken.length - 1];
          currentWidth = m.measureWord(currentLine);
        }
      } else if (currentWidth + spaceW + wordWidth <= maxWidth) {
        currentLine += ' ' + word;
        currentWidth += spaceW + wordWidth;
      } else {
        // Case 2: word overflows — push current line, start new
        lines.push(currentLine);

        if (wordWidth <= maxWidth) {
          currentLine = word;
          currentWidth = wordWidth;
        } else {
          const broken = breakLongWord(word, maxWidth, m);
          for (let i = 0; i < broken.length - 1; i++) {
            lines.push(broken[i]);
          }
          currentLine = broken[broken.length - 1];
          currentWidth = m.measureWord(currentLine);
        }
      }
    }

    // Don't forget the last line of the paragraph
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Break a single word that is wider than maxWidth into chunks
 * that each fit within maxWidth.
 */
function breakLongWord(word, maxWidth, measurer) {
  const chunks = [];
  let chunk = '';
  let chunkWidth = 0;

  for (const ch of word) {
    const charW = measurer.measureChar(ch);
    if (chunkWidth + charW > maxWidth && chunk.length > 0) {
      chunks.push(chunk);
      chunk = ch;
      chunkWidth = charW;
    } else {
      chunk += ch;
      chunkWidth += charW;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

/**
 * Split an array of lines into pages.
 *
 * @param {string[]} lines — output of wrapText()
 * @param {number} linesPerPage — how many lines fit on one folio page
 * @returns {string[][]} array of pages, each page is array of lines
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
 * @returns {string[][]} pages, each containing lines
 */
function layoutText(text, font) {
  const lines = wrapText(text, LAYOUT.WRITE_WIDTH, font);
  return paginateLines(lines, LAYOUT.LINES_PER_PAGE);
}

module.exports = { wrapText, paginateLines, layoutText, createMeasurer };
