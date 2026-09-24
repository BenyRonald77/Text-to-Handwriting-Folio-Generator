# Deploy ke Vercel

Semua konfigurasi sudah ada di repo (`vercel.json`, `api/index.js`), jadi tidak perlu mengubah setting build di dashboard.

## 1. Import project

1. Push semua perubahan ke GitHub (`git push`).
2. Buka https://vercel.com/new, login pakai GitHub, lalu pilih repo **Text-to-Handwriting-Folio-Generator**.
3. Di layar "Configure Project":
   - **Framework Preset:** biarkan (sudah dipaksa `Other` lewat `vercel.json`).
   - **Build & Output Settings:** jangan diubah.
   - **Environment Variables:** isi tabel di bawah.
4. Klik **Deploy**.

## 2. Environment Variables

| Name | Value | Wajib? |
|------|-------|--------|
| `BASIC_AUTH_USER` | username untuk teman-teman, misal `teman` | Ya, kalau mau dikunci |
| `BASIC_AUTH_PASS` | password yang kuat | Ya, kalau mau dikunci (kosong = siapa saja bisa akses) |
| `JPEG_QUALITY` | `90` | Opsional |
| `MAX_TEXT_LENGTH` | `10000` | Opsional |

Tidak perlu `PORT`, `HOST`, atau `TRUST_PROXY`, karena Vercel mengaturnya sendiri.

Kalau env var diubah setelah deploy, lakukan **Redeploy** (Deployments → ⋯ → Redeploy) agar nilainya terpakai.

## 3. Cek hasil

- Buka `https://<nama-project>.vercel.app`. Browser akan meminta username dan password bila `BASIC_AUTH_PASS` diisi.
- `https://<nama-project>.vercel.app/api/health` harus membalas `{"status":"ok",…}` tanpa login.

## 4. Update berikutnya

Cukup `git push` ke branch `main`, dan Vercel otomatis deploy ulang. Branch lain mendapat URL preview sendiri.

## Batasan di Vercel

- **Ukuran hasil maksimal ~4,2 MB.** Teks normal sampai 10.000 karakter aman (sekitar 2,2 MB). **Mode debug** dengan teks panjang akan ditolak dengan pesan "Hasil mode debug terlalu besar".
- **Request pertama setelah lama tidak dipakai** lebih lambat 1–2 detik (cold start: memuat 16 font + kertas).
- **Rate limit** (20 request/menit) dihitung per instance Vercel, jadi bukan batas global. Untuk pemakaian bersama teman ini cukup.

## Cara kerjanya (singkat)

- `vercel.json` mengarahkan **semua** URL, termasuk halaman web, ke satu function (`api/index.js`). Karena itu basic auth juga melindungi halaman web, bukan hanya API.
- Folder `vercel-static/` hanya berisi `robots.txt` agar aplikasi tidak diindeks Google.
- `src/server.js` tetap dipakai untuk menjalankan di lokal (`npm start`) dan VPS (PM2). Keduanya memakai app yang sama dari `src/app.js`.
