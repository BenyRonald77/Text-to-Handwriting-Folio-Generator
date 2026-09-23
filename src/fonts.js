const path = require('path');
const { GlobalFonts } = require('@napi-rs/canvas');

// Register handwriting fonts at startup.
// @napi-rs/canvas uses GlobalFonts.registerFromPath() instead of
// the old node-canvas registerFont().

const FONTS_DIR = path.join(__dirname, 'assets', 'fonts');

const fonts = [
  { file: 'Kalam-Regular.ttf', family: 'Kalam', weight: 'normal' },
  { file: 'Kalam-Bold.ttf',    family: 'Kalam', weight: 'bold' },
];

for (const font of fonts) {
  const fontPath = path.join(FONTS_DIR, font.file);
  GlobalFonts.registerFromPath(fontPath, font.family);
}

// Verify registration
const registered = GlobalFonts.families
  .map(f => f.family)
  .filter(f => fonts.some(def => def.family === f));

if (registered.length > 0) {
  console.log(`  Fonts loaded: ${registered.join(', ')}`);
} else {
  console.error('  ⚠ No fonts were registered!');
}

module.exports = { fonts, FONTS_DIR };
