# Text-to-Handwriting Folio Generator

Ubah teks yang diketik menjadi gambar tulisan tangan di atas kertas folio bergaris (gaya SiDU), lengkap dengan variasi acak per huruf supaya tidak terlihat seperti font digital.

Dipakai secara privat oleh pemilik project dan dibagikan ke beberapa teman lewat link — bukan aplikasi publik.

## Fitur

- **Teks → gambar JPG** kertas folio bergaris, siap didownload atau dibagikan.
- **16 pilihan font** tulisan tangan (Kalam, Caveat, Patrick Hand, Gochi Hand, Handlee, Indie Flower, Shadows Into Light, Architects Daughter, Reenie Beanie, Nothing You Could Do, Homemade Apple, Covered By Your Grace, Just Another Hand, Sue Ellen Francisco, Zeyada, Dawning of a New Day) — bisa dipilih manual atau diacak tiap generate.
- **Variasi natural per huruf**: rotasi, posisi, ukuran, dan tekanan tinta sedikit acak sehingga dua hasil dari teks yang sama tidak pernah identik.
- **Mengikuti spasi apa adanya**: indentasi, judul yang digeser ke tengah, tab untuk meratakan kolom (`Nama⇥: ...`), dan daftar bernomor tetap sejajar seperti yang diketik.
- **Auto pagination**: teks panjang otomatis dipecah ke beberapa halaman folio, word-wrap di batas kata.
- **Mode debug**: generate beberapa variasi sekaligus untuk membandingkan efek jitter/font.
- **Proteksi akses** lewat HTTP Basic Auth (opsional, direkomendasikan untuk deploy).
- **Responsive** — bisa dipakai dari HP, termasuk tombol Tab pengganti (layar sentuh tidak punya tombol Tab) dan download lewat share sheet.

## Stack

- **Backend**: Node.js + Express
- **Rendering gambar**: [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas-rs) (tidak perlu browser headless, tidak perlu build tools)
- **Frontend**: HTML/CSS/JS vanilla, satu halaman
- **Font**: file `.ttf` di-bundle di dalam project, tidak bergantung ke Google Fonts saat runtime

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env
npm start
```

Buka `http://localhost:3000`.

Untuk auto-restart saat file berubah (development):

```bash
npm run dev
```

### Skrip pengetesan render

```bash
node test-render.js            # render beberapa contoh teks ke output-test/
node test-render.js --debug    # beberapa variasi dari teks yang sama (tuning jitter)
node test-render.js --fonts    # render teks yang sama dengan semua font
```

## Konfigurasi (`.env`)

Semua opsi ada contohnya di [`.env.example`](.env.example):

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port server |
| `HOST` | `0.0.0.0` | Alamat bind. Isi `127.0.0.1` di production di belakang Nginx |
| `TRUST_PROXY` | _(kosong)_ | Isi `1` kalau berjalan di belakang reverse proxy |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` | _(kosong = auth mati)_ | Username & password untuk proteksi akses |
| `MAX_TEXT_LENGTH` | `10000` | Batas maksimum karakter input |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | `60000` / `20` | Rate limit per-IP pada `/api/generate` |
| `JPEG_QUALITY` | `90` | Kualitas output JPEG (0–100) |
| `DEBUG` | `false` | Aktifkan mode debug secara default di server |

## API

### `POST /api/generate`

```jsonc
// Request
{
  "text": "isi teks yang mau diubah jadi tulisan tangan...",
  "font": "kalam",     // opsional — id font atau "random" (default)
  "debug": false,      // opsional — generate beberapa variasi sekaligus
  "count": 4           // opsional — jumlah variasi (mode debug, 2-6)
}
```

```jsonc
// Response 200
{
  "isDebug": false,
  "font": "kalam",
  "totalPages": 2,
  "images": ["data:image/jpeg;base64,...", "..."]
}
```

Response 400 kalau teks kosong/melebihi batas/font tidak dikenal, 413 kalau hasil terlalu besar (lihat catatan Vercel di bawah).

### `GET /api/fonts`

Daftar font yang tersedia, dipakai untuk mengisi pilihan font di frontend.

### `GET /api/health`

Health check sederhana, tidak dilindungi Basic Auth (dipakai untuk uptime monitor / PM2).

## Deploy

Project ini bisa dijalankan di **VPS** maupun **Vercel** tanpa ubah kode — keduanya memakai app Express yang sama dari [`src/app.js`](src/app.js).

- **VPS** (PM2 + Nginx): lihat [`deploy/DEPLOY.md`](deploy/DEPLOY.md)
- **Vercel** (serverless, gratis untuk pemakaian pribadi): lihat [`deploy/VERCEL.md`](deploy/VERCEL.md)

Ringkasan batasan tiap opsi ada di kedua file tersebut — intinya, Vercel lebih cepat untuk mulai dan gratis, sementara VPS tidak punya batas ukuran response dan rate limit-nya lebih akurat.

## Struktur project

```
src/
  app.js              # Express app (dipakai bareng oleh server.js & api/index.js)
  server.js           # Entry point untuk lokal/VPS (node src/server.js)
  fonts.js            # Registrasi semua font ke canvas saat startup
  middleware/
    basic-auth.js     # HTTP Basic Auth
  render/
    config.js         # Semua parameter visual (ukuran kertas, jitter, daftar font, dst.)
    background.js      # Gambar kertas folio + garis + logo SiDU
    text-layout.js     # Word-wrap & pagination, menjaga spasi/indentasi
    handwriting.js      # Render tiap karakter dengan jitter acak
    folio.js            # Orkestrator: teks → array buffer JPEG
  routes/
    generate.js        # POST /api/generate
api/
  index.js            # Entry point untuk Vercel (serverless)
public/
  index.html          # Frontend (satu halaman, vanilla JS)
deploy/
  DEPLOY.md, VERCEL.md, nginx/  # Panduan & config deploy
test-render.js         # Skrip render contoh di luar server (lihat di atas)
```

Parameter visual (ukuran kertas, jarak garis, kekuatan jitter per karakter, ukuran tiap font) semuanya terpusat di [`src/render/config.js`](src/render/config.js) — ubah di situ untuk menyesuaikan tampilan hasil.

## Lisensi font

Semua font di `src/assets/fonts/` adalah font gratis dari Google Fonts di bawah [SIL Open Font License](https://openfontlicense.org/), file lisensinya ikut disertakan (`LICENSE-<nama-font>.txt`) di folder yang sama.
