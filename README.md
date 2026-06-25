# Malakabooks Store 📚

Platform E-Commerce Modern untuk Penjualan Buku, dibangun menggunakan **Angular 21**.

> Aplikasi ini adalah Single Page Application (SPA) murni dengan **Client-Side Rendering (CSR)** untuk performa optimal dan navigasi instan.

## 🚀 Teknologi Utama

- **Framework:** Angular 21 (Standalone & Signals)
- **Styling:** Tailwind CSS v4
- **Pengujian:** Vitest
- **Ikon & Font:** Boxicons, Google Fonts (Fraunces, Inter, Poppins, Plus Jakarta Sans)

## 📦 Prasyarat

Pastikan Anda telah menginstal NodeJS (Direkomendasikan v20+) dan `npm` sebelum menjalankan proyek ini.

## 🛠️ Instalasi & Menjalankan Aplikasi

1. Klon repositori ini atau masuk ke dalam folder proyek.
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm start
   # atau
   npm run ng serve
   ```
4. Buka browser dan navigasikan ke `http://localhost:4200/`. Aplikasi akan termuat ulang otomatis jika ada perubahan pada kode sumber.

## 🏗️ Build untuk Production

Untuk membuat versi produksi (*production bundle*), jalankan:

```bash
npm run build
```

Hasil kompilasi (*build artifacts*) akan disimpan di direktori `dist/malakabooks`. File-file tersebut siap untuk disajikan (di-host) oleh server statis apa pun (seperti Nginx, Vercel, Netlify, atau Firebase Hosting).

## 🧪 Menjalankan Pengujian (Testing)

Proyek ini telah dikonfigurasi untuk menggunakan **Vitest**.

Jalankan perintah berikut untuk mengeksekusi *unit test*:
```bash
npm run test
```

## 📖 Dokumentasi Lanjutan

Untuk developer yang baru bergabung, silakan baca dokumen berikut sebelum mulai berkontribusi:
- [Arsitektur Proyek (ARCHITECTURE.md)](ARCHITECTURE.md)
- [Aturan AI (AGENTS.md)](.agents/AGENTS.md)
