# PRD: Text-to-Handwriting Folio Generator

**Versi:** 1.0
**Tanggal:** 23 September 2026
**Status:** Draft — siap untuk development

---

## 1. Ringkasan (Overview)

Aplikasi web sederhana yang mengubah teks yang diketik user menjadi gambar (JPG) berupa kertas folio bergaris dengan tulisan tangan yang terlihat natural/mirip manusia (bukan font komputer yang kaku). Digunakan secara privat oleh pemilik project dan dibagikan ke beberapa teman, dijalankan di VPS milik sendiri.

## 2. Latar Belakang & Tujuan

- **Masalah**: Menulis tangan manual untuk tugas/keperluan lain memakan waktu. User ingin cara cepat menghasilkan "tulisan tangan" dari teks digital.
- **Tujuan**:
  1. User bisa paste/ketik teks lalu langsung dapat gambar folio bergaris dengan tulisan tangan.
  2. Hasil terlihat senatural mungkin — tidak seperti font digital yang presisi/kaku.
  3. Sistem ringan, mudah di-deploy di VPS yang sudah ada, tanpa dependency berat (tidak perlu browser headless, tidak perlu model AI/ML).

## 3. Target Pengguna

- Pemilik aplikasi (primary user).
- Beberapa teman dekat yang diberi akses (bukan publik, tidak perlu sistem akun/login kompleks — cukup dibagikan lewat link, opsional dengan proteksi sederhana seperti password/basic auth di Nginx bila diperlukan).

## 4. Ruang Lingkup

### In-scope
- Input teks bebas (multi-paragraf).
- Output gambar JPG kertas folio bergaris, tulisan tangan warna hitam.
- Efek "random per huruf" (rotasi, posisi, ukuran sedikit acak) agar terlihat natural.
- Auto pagination: teks panjang otomatis dipecah ke beberapa halaman folio.
- Preview hasil di browser + tombol download (per halaman, dan "download semua").

### Out-of-scope (untuk versi ini)
- Export ke PDF.
- Penyimpanan riwayat/histori hasil generate.
- Sistem akun/login/multi-user management.
- Pilihan warna tinta lain (hanya hitam).
- Upload font sendiri oleh user (bisa jadi future work).

## 5. User Flow

1. User membuka halaman web.
2. User mengetik/paste teks ke dalam textarea.
3. User klik tombol **"Generate"**.
4. Frontend kirim request ke backend (`POST /api/generate`).
5. Backend memproses teks → render ke satu atau beberapa gambar folio → kirim balik ke frontend.
6. Frontend menampilkan preview tiap halaman.
7. User bisa download gambar satu-satu atau semua sekaligus.

## 6. Functional Requirements

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-1 | Sistem menerima input teks bebas dari user melalui form web | Must |
| FR-2 | Sistem merender teks di atas background kertas folio bergaris (garis horizontal biru + margin merah di kiri, khas kertas folio Indonesia) | Must |
| FR-3 | Sistem menggunakan font bergaya tulisan tangan sambung/santai, bukan font cetak | Must |
| FR-4 | Setiap huruf dirender dengan variasi acak kecil pada rotasi, posisi (x/y), dan skala, agar tidak terlihat seragam seperti font digital | Must |
| FR-5 | Jika teks tidak muat dalam satu halaman folio, sistem otomatis membuat halaman folio berikutnya (pagination), dengan pemenggalan di batas kata (word-wrap), bukan di tengah kata | Must |
| FR-6 | Output berupa gambar JPG, satu file per halaman | Must |
| FR-7 | Warna tinta tulisan: hitam (fixed, tidak ada pilihan warna lain) | Must |
| FR-8 | User bisa melihat preview seluruh halaman hasil generate sebelum download | Should |
| FR-9 | User bisa download tiap halaman secara individual, dan opsi "download semua" | Should |
| FR-10 | Sistem tidak menyimpan teks/gambar yang di-generate setelah response dikirim (no persistence) | Must |

## 7. Non-Functional Requirements

- **Performa**: Waktu generate untuk teks hingga ±2000 karakter (≈3-4 halaman folio) tidak lebih dari 3–5 detik di VPS spesifikasi standar (1-2 vCPU).
- **Skalabilitas**: Traffic rendah (dipakai segelintir orang), tidak perlu load balancing/scaling otomatis.
- **Keamanan**:
  - Batasi panjang input maksimum (misal 10.000 karakter) di sisi server untuk mencegah abuse/DoS lewat request raksasa.
  - Rate limiting sederhana per-IP pada endpoint `/api/generate` (misal maks 20 request/menit) untuk jaga-jaga.
  - Pertimbangkan proteksi akses dasar (HTTP basic auth via Nginx, atau shared secret/token sederhana) karena akan dibagikan lewat link ke teman-teman, bukan publik.
- **Portabilitas**: Semua asset (font, background folio) di-bundle dalam project, tidak bergantung ke service eksternal saat runtime.

## 8. Spesifikasi Visual

### 8.1 Kertas Folio
- Ukuran mengikuti rasio kertas folio/F4 (215mm x 330mm), di-render pada resolusi tinggi (misal setara 150–200 DPI) agar JPG hasil akhir tajam saat di-zoom/print.
- Garis horizontal biru muda dengan jarak antar-garis konsisten (mensimulasikan buku tulis sekolah).
- Satu garis vertikal merah sebagai margin kiri (ciri khas kertas folio bergaris Indonesia).
- Background dasar putih/krem lembut.

### 8.2 Tulisan Tangan ("mirip tulisan orang Indonesia")
Tidak ada font digital yang secara resmi berlabel "gaya tulisan Indonesia" — kesan itu justru lebih banyak dihasilkan dari **cara render**-nya (random jitter per huruf) daripada dari font itu sendiri. Rekomendasi:
- Gunakan font handwriting yang cenderung "kurang rapi"/casual, bukan yang terlalu dekoratif/kaligrafi bagus. Kandidat yang cocok untuk dicoba (tersedia gratis di Google Fonts):
  - **Kalam** — kesannya paling mirip coretan pena asli, populer dipakai untuk kebutuhan seperti ini.
  - **Caveat**
  - **Patrick Hand**
  - **Gochi Hand**
  - **Reenie Beanie**
- Disarankan sediakan 2-3 font sebagai pilihan/di-random per sesi generate, supaya hasilnya tidak selalu identik.
- **Parameter randomisasi per huruf** (titik awal, sesuaikan lewat testing):
  - Rotasi: ±3° hingga ±5° per huruf
  - Offset vertikal (baseline wobble): ±1.5px – ±3px
  - Offset horizontal/spacing antar huruf: variasi kecil ±1px
  - Skala huruf: variasi ±3–5%
  - Opsional: variasi ketebalan/opacity goresan tinta ±5–10% untuk efek tekanan pena yang tidak rata

## 9. Arsitektur Teknis

### 9.1 Stack
- **Backend**: Node.js + Express
- **Image rendering**: `node-canvas` (Cairo-based, ringan, tidak butuh headless browser)
- **Frontend**: HTML/CSS/JS sederhana (vanilla atau boleh pakai framework ringan), cukup 1 halaman
- **Font**: file `.ttf`/`.woff` di-bundle di server (bukan load dari Google Fonts CDN saat runtime, supaya tidak bergantung koneksi eksternal)

### 9.2 API Design

**`POST /api/generate`**

Request:
```json
{
  "text": "isi teks yang mau diubah jadi tulisan tangan..."
}
```

Response (200):
```json
{
  "totalPages": 2,
  "images": [
    "data:image/jpeg;base64,...halaman1...",
    "data:image/jpeg;base64,...halaman2..."
  ]
}
```

Response (400) — teks kosong/terlalu panjang:
```json
{ "error": "Teks tidak boleh kosong / melebihi batas maksimum 10000 karakter" }
```

> Catatan desain: gambar dikembalikan langsung sebagai base64 dalam satu response (bukan disimpan sebagai file di server) — sesuai requirement "tidak simpan riwayat" dan menghindari perlunya cleanup job di server.

### 9.3 Alur Rendering (server-side, pseudo-logic)
1. Validasi & sanitasi input teks (panjang, karakter kontrol, dsb).
2. Hitung layout: berapa karakter/kata muat per baris (berdasar lebar canvas, font size, margin), berapa baris muat per halaman folio.
3. Word-wrap teks ke baris-baris, lalu ke halaman-halaman.
4. Untuk tiap halaman: buat canvas baru dengan background folio → gambar tiap huruf satu per satu dengan transform (rotate/translate/scale) acak sesuai parameter di §8.2 → export canvas ke buffer JPEG.
5. Kumpulkan semua halaman → encode base64 → kirim sebagai response.

## 10. Deployment Plan

1. **VPS** (sudah tersedia): pastikan Node.js (versi LTS terbaru) terpasang.
2. **Process manager**: gunakan **PM2** agar aplikasi Node otomatis restart jika crash dan tetap jalan setelah reboot server.
3. **Reverse proxy**: **Nginx** di depan aplikasi Node (proxy ke port internal, misal `localhost:3000`), sekaligus untuk:
   - Serve static frontend
   - (Opsional) HTTP basic auth untuk membatasi akses hanya ke teman-teman yang diundang
4. **SSL**: opsional, kalau ada domain, pakai **Certbot** (Let's Encrypt) untuk HTTPS gratis.
5. **Environment**: gunakan file `.env` untuk config (port, batas panjang teks, rate limit, dsb) — jangan hardcode.

## 11. Asumsi & Batasan

- Kapasitas VPS minim (1 vCPU/1GB RAM) diasumsikan cukup karena traffic rendah dan rendering per-request ringan (bukan model AI berat).
- Tidak ada kebutuhan multi-bahasa/multi-alfabet di luar Latin untuk versi ini.
- Kesan "natural" bergantung pada tuning parameter random di §8.2 — perlu iterasi/testing visual sebelum dianggap final.

## 12. Kriteria Sukses (Acceptance Criteria)

- [ ] User bisa generate gambar dari teks tanpa error untuk teks pendek maupun panjang (multi-halaman).
- [ ] Hasil visual: garis folio, margin merah, dan tulisan tangan acak per huruf tampil sesuai spesifikasi.
- [ ] Tidak ada dua hasil generate dari teks yang sama yang terlihat 100% identik (karena randomisasi).
- [ ] Aplikasi tetap responsif (server tidak down) walau menerima beberapa request bersamaan dari teman-teman.
- [ ] Setelah restart VPS, aplikasi otomatis jalan kembali (via PM2).

## 13. Pengembangan Selanjutnya (Future Work — opsional, tidak untuk versi ini)

- Pilihan warna tinta lain.
- Export ke PDF (gabungan semua halaman).
- Upload font sendiri.
- Simpan riwayat (jika suatu saat dibutuhkan).
