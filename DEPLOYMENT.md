# Panduan Deployment — Kopi Mardika Frontend

Dokumen ini menjelaskan langkah-langkah deployment aplikasi frontend Angular (Kopi Mardika) ke lingkungan produksi / staging.

---

## 1. Persyaratan Lingkungan Build
- **Node.js:** `^20.19.0 || ^22.12.0 || ^24.0.0`
- **NPM:** `>= 10`
- **Angular CLI:** Angular 21 Standalone

---

## 2. Langkah Build Production

Jalankan perintah berikut pada terminal:

```bash
# 1. Install dependensi secara bersih
npm ci

# 2. Jalankan pengujian otomatis & linting
npm run test:ci
npx ng lint

# 3. Build bundle produksi
npx ng build --configuration production
```

Hasil build akan berada di direktori `dist/malakabooks/browser`.

---

## 3. Konfigurasi Web Server (Nginx)

Untuk menyajikan SPA (Single Page Application) hasil build, tempatkan isi folder `dist/malakabooks/browser` ke root direktori web server (misalnya `/usr/share/nginx/html`).

Gunakan file `nginx.conf` yang tersedia di root proyek:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Kompresi Brotli & Gzip
  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;

  brotli on;
  brotli_types text/plain text/css application/javascript application/json image/svg+xml;

  # Security Headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Cache Control
  location ~* \.(js|css)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location ~* ^/(media|assets)/ {
    add_header Cache-Control "public, max-age=86400, must-revalidate";
  }

  location = /index.html {
    add_header Cache-Control "no-cache";
  }

  # SPA Fallback Routing
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## 4. Checklist Verifikasi Setelah Deploy
- [ ] Direct access / refresh halaman pada route dalam (seperti `/product/123` atau `/order-history`) memuat halaman dengan benar (tidak 404 dari web server).
- [ ] Header HTTP pada `index.html` mengembalikan `Cache-Control: no-cache`.
- [ ] Header HTTP pada file `.js` / `.css` mengembalikan `Cache-Control: public, max-age=31536000, immutable` dan `content-encoding: br` / `gzip`.
- [ ] Akses route tidak valid (misal `/halaman-ngawur`) menampilkan halaman 404 aplikasi (bukan 404 default web server).
