const path = require('path');
const { GlobalFonts } = require('@napi-rs/canvas');
const { HANDWRITING_FONTS } = require('./render/config');

// Register handwriting fonts at startup.
// @napi-rs/canvas uses GlobalFonts.registerFromPath() instead of
// the old node-canvas registerFont().

const FONTS_DIR = path.join(__dirname, 'assets', 'fonts');

for (const font of HANDWRITING_FONTS) {
  for (const file of font.FILES) {
    GlobalFonts.registerFromPath(path.join(FONTS_DIR, file), font.FAMILY);
  }
}

// Verify registration
const available = new Set(GlobalFonts.families.map((f) => f.family));
const registered = HANDWRITING_FONTS.filter((f) => available.has(f.FAMILY));
const missing = HANDWRITING_FONTS.filter((f) => !available.has(f.FAMILY));

if (registered.length > 0) {
  console.log(`  Fonts loaded: ${registered.map((f) => f.FAMILY).join(', ')}`);
}
if (missing.length > 0) {
  console.error(`  ⚠ Fonts failed to register: ${missing.map((f) => f.FAMILY).join(', ')}`);
}

module.exports = { FONTS_DIR };
