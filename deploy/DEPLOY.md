# Deploy ke VPS

Panduan untuk menjalankan Handwriting Folio di VPS (Ubuntu/Debian) dengan PM2 + Nginx. Lihat PRD §10.

## 1. Persiapan

```bash
# Node.js LTS (lewat NodeSource)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs nginx

sudo npm install -g pm2
```

`@napi-rs/canvas` sudah membawa binary prebuilt, jadi **tidak perlu** install Cairo, build-essential, dan sejenisnya.

## 2. Ambil kode & install

```bash
cd /var/www
git clone <repo-url> handwriting-folio
cd handwriting-folio
npm ci --omit=dev
```

## 3. Konfigurasi `.env`

```bash
cp .env.example .env
nano .env
```

Nilai yang wajib diubah untuk production:

| Key | Nilai | Alasan |
|-----|-------|--------|
| `HOST` | `127.0.0.1` | Port 3000 hanya bisa diakses lewat Nginx |
| `NODE_ENV` | `production` | |
| `TRUST_PROXY` | `1` | Rate limit per-IP membaca IP asli dari Nginx |
| `BASIC_AUTH_PASS` | password yang kuat | Proteksi akses. Kosongkan jika memakai basic auth di Nginx |

## 4. Jalankan dengan PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 status
curl http://127.0.0.1:3000/api/health

# Agar aplikasi otomatis jalan lagi setelah VPS reboot
pm2 save
pm2 startup      # jalankan perintah sudo yang dicetak oleh command ini
```

Perintah yang sering dipakai:

```bash
pm2 logs handwriting-folio      # lihat log
pm2 restart handwriting-folio   # setelah git pull / ubah .env
```

## 5. Nginx

```bash
sudo cp deploy/nginx/handwriting-folio.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/handwriting-folio.conf /etc/nginx/sites-enabled/
sudo nano /etc/nginx/sites-available/handwriting-folio.conf   # ganti server_name
sudo nginx -t && sudo systemctl reload nginx
```

Buka firewall bila memakai UFW: `sudo ufw allow 'Nginx Full'`.

### Proteksi akses: pilih salah satu

- **Basic auth di aplikasi** (default): isi `BASIC_AUTH_USER` dan `BASIC_AUTH_PASS` di `.env`.
- **Basic auth di Nginx**: kosongkan `BASIC_AUTH_PASS`, lalu:
  ```bash
  sudo apt install -y apache2-utils
  sudo htpasswd -c /etc/nginx/.htpasswd-folio teman
  ```
  dan uncomment baris `auth_basic` di file config Nginx.

Tanpa HTTPS, password basic auth dikirim tanpa enkripsi (hanya base64). Jika sudah punya domain, pasang SSL (langkah 6).

## 6. SSL (opsional, butuh domain)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d folio.example.com
```

Certbot otomatis mengubah config Nginx dan mengatur perpanjangan sertifikat.

## 7. Update aplikasi

```bash
cd /var/www/handwriting-folio
git pull
npm ci --omit=dev
pm2 restart handwriting-folio
```
