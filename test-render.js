/**
 * Test script for the rendering engine.
 *
 * Normal mode:
 *   node test-render.js
 *   → Generates short/medium/long samples in /output-test/
 *
 * Font comparison (for tuning per-font SIZE in HANDWRITING_FONTS):
 *   node test-render.js --fonts
 *   → Renders the medium sample once with every font
 *
 * Debug mode (for tuning JITTER parameters):
 *   node test-render.js --debug
 *   or: DEBUG=true node test-render.js
 *   → Generates multiple variations of the same text side-by-side
 *     so you can compare the effect of parameter changes.
 */

require('./src/fonts');

const fs = require('fs');
const path = require('path');
const { generateHandwritingPages } = require('./src/render/folio');
const { preloadPaper } = require('./src/render/background');
const { DEBUG, JITTER, HANDWRITING_FONTS } = require('./src/render/config');

const OUT_DIR = path.join(__dirname, 'output-test');

// ── Sample texts ──

const SHORT_TEXT = 'Ini adalah kalimat pendek untuk tes.';

const MEDIUM_TEXT = `Pendidikan merupakan salah satu aspek penting dalam kehidupan manusia. Melalui pendidikan, seseorang dapat mengembangkan potensi dirinya dan memperoleh pengetahuan yang luas. Di Indonesia, pendidikan formal dimulai dari jenjang Sekolah Dasar hingga Perguruan Tinggi.

Setiap siswa memiliki gaya belajar yang berbeda-beda. Ada yang lebih mudah memahami materi melalui membaca, ada yang lebih suka mendengarkan penjelasan guru, dan ada pula yang lebih efektif belajar dengan praktik langsung. Oleh karena itu, metode pengajaran yang bervariasi sangat diperlukan.

Selain pendidikan formal, pendidikan karakter juga tidak kalah pentingnya. Nilai-nilai seperti kejujuran, kerja keras, dan tanggung jawab perlu ditanamkan sejak dini agar generasi muda memiliki fondasi moral yang kuat.`;

const LONG_TEXT = `Teknologi informasi dan komunikasi telah mengubah cara manusia berinteraksi dan bekerja. Internet, yang mulanya hanya digunakan oleh kalangan akademisi dan militer, kini telah menjadi bagian tak terpisahkan dari kehidupan sehari-hari masyarakat di seluruh dunia.

Perkembangan smartphone dan perangkat mobile lainnya semakin mempercepat adopsi teknologi digital. Dengan hanya bermodalkan telepon genggam, seseorang dapat mengakses informasi, berkomunikasi dengan orang di belahan dunia lain, melakukan transaksi keuangan, hingga belajar keterampilan baru melalui platform daring.

Namun demikian, kemajuan teknologi juga membawa tantangan tersendiri. Isu privasi data, keamanan siber, dan penyebaran informasi yang tidak benar (hoax) menjadi permasalahan serius yang perlu ditangani bersama. Literasi digital menjadi kemampuan yang wajib dimiliki oleh setiap individu di era modern ini.

Dalam dunia pendidikan, teknologi telah membuka pintu bagi metode pembelajaran yang lebih inovatif. Pembelajaran jarak jauh (PJJ) yang sebelumnya dianggap tidak efektif, kini terbukti bisa menjadi alternatif yang viable berkat kemajuan teknologi video conference dan platform e-learning.

Di bidang kesehatan, telemedicine memungkinkan pasien untuk berkonsultasi dengan dokter tanpa harus datang ke rumah sakit secara langsung. Hal ini sangat bermanfaat terutama bagi masyarakat yang tinggal di daerah terpencil dengan akses layanan kesehatan yang terbatas.

Pemerintah Indonesia sendiri telah mencanangkan berbagai program transformasi digital, mulai dari pembangunan infrastruktur jaringan internet di seluruh pelosok nusantara hingga digitalisasi layanan publik. Program-program seperti Palapa Ring dan Satu Data Indonesia merupakan contoh nyata komitmen pemerintah dalam mewujudkan Indonesia yang lebih digital.

Ke depannya, kecerdasan buatan (artificial intelligence) dan Internet of Things (IoT) diprediksi akan semakin mengubah lanskap kehidupan manusia. Otomatisasi di berbagai sektor industri, smart city, dan kendaraan otonom hanyalah sebagian kecil dari potensi yang ditawarkan oleh teknologi-teknologi tersebut.

Oleh karena itu, penting bagi kita semua untuk terus belajar dan beradaptasi dengan perkembangan teknologi. Generasi muda khususnya, perlu dibekali dengan kemampuan berpikir kritis dan kreativitas agar mampu memanfaatkan teknologi secara bijak dan produktif.

Pada akhirnya, teknologi hanyalah sebuah alat. Manfaat atau mudarat yang dihasilkannya sangat bergantung pada bagaimana manusia menggunakannya. Mari kita jadikan teknologi sebagai sarana untuk membangun peradaban yang lebih baik, lebih inklusif, dan berkelanjutan.`;

// ── Helpers ──

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function clearJpgs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.jpg')) fs.unlinkSync(path.join(dir, f));
  }
}

function saveBuffers(buffers, prefix, dir) {
  for (let i = 0; i < buffers.length; i++) {
    const filename = `${prefix}-page${i + 1}.jpg`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, buffers[i]);
    console.log(`  → ${filename} (${Math.round(buffers[i].length / 1024)} KB)`);
  }
}

// ── Normal mode ──

function runNormal() {
  console.log('=== Test Render: Handwriting Folio Generator ===\n');

  const tests = [
    { name: 'short',  text: SHORT_TEXT },
    { name: 'medium', text: MEDIUM_TEXT },
    { name: 'long',   text: LONG_TEXT },
  ];

  for (const test of tests) {
    const t0 = Date.now();
    const { font, buffers } = generateHandwritingPages(test.text);
    const elapsed = Date.now() - t0;

    console.log(
      `[${test.name}] ${test.text.length} chars → ${buffers.length} page(s) [${font}] — ${elapsed}ms`
    );
    saveBuffers(buffers, test.name, OUT_DIR);
    console.log();
  }
}

// ── Debug mode: multiple variations of same text ──

function runDebug() {
  const count = DEBUG.VARIATIONS_COUNT;

  console.log('=== DEBUG MODE: Comparison Variations ===');
  console.log(`Generating ${count} variations of the same text.\n`);
  console.log('Current JITTER parameters:');
  console.log('  ROTATION_DEG:     ' + JITTER.ROTATION_DEG);
  console.log('  BASELINE_PX:      ' + JITTER.BASELINE_PX);
  console.log('  SPACING_PX:       ' + JITTER.SPACING_PX);
  console.log('  SCALE_FRACTION:   ' + JITTER.SCALE_FRACTION);
  console.log('  OPACITY_MIN/MAX:  ' + JITTER.OPACITY_MIN + ' / ' + JITTER.OPACITY_MAX);
  console.log('  LINE_TILT_DEG:    ' + JITTER.LINE_TILT_DEG);
  console.log('  LINE_Y_OFFSET_PX: ' + JITTER.LINE_Y_OFFSET_PX);
  console.log();

  // Use medium text for debug — enough to see patterns, not too long
  const debugText = MEDIUM_TEXT;

  for (let v = 1; v <= count; v++) {
    const t0 = Date.now();
    const { font, buffers } = generateHandwritingPages(debugText);
    const elapsed = Date.now() - t0;

    console.log(`[variation ${v}/${count}] [${font}] — ${elapsed}ms`);
    saveBuffers(buffers, `debug-v${v}`, OUT_DIR);
  }

  console.log(`\nCompare the ${count} variations in: ${OUT_DIR}`);
  console.log('Tweak values in src/render/config.js → JITTER, then re-run.\n');
}

// ── Font comparison: same text, every font ──

function runFonts() {
  console.log('=== FONT COMPARISON ===\n');

  for (const f of HANDWRITING_FONTS) {
    const t0 = Date.now();
    const { buffers } = generateHandwritingPages(MEDIUM_TEXT, { font: f.ID });
    const elapsed = Date.now() - t0;

    console.log(`[${f.ID}] ${f.SIZE}px — ${elapsed}ms`);
    saveBuffers(buffers, `font-${f.ID}`, OUT_DIR);
  }

  console.log('\nTweak SIZE in src/render/config.js → HANDWRITING_FONTS, then re-run.\n');
}

// ── Main ──

async function run() {
  await preloadPaper();
  ensureDir(OUT_DIR);
  clearJpgs(OUT_DIR);

  if (process.argv.includes('--fonts')) {
    runFonts();
  } else if (DEBUG.ENABLED) {
    runDebug();
  } else {
    runNormal();
  }

  console.log(`Done! Output: ${OUT_DIR}`);
}

run();
