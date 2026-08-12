# Production-Readiness Audit — Malakabooks Store (SS Online Shop)

| | |
|---|---|
| **Proyek** | `malakabooks` (Angular 21, standalone + signals + zoneless) |
| **Branch** | `ssonlineshop` |
| **Tanggal audit** | 12 Agustus 2026 (Diperbarui) |
| **Auditor** | Senior Angular Dev / DevOps Tech Lead review |
| **Metode** | Static review + eksekusi nyata: `npm audit`, `npx ng lint`, `npm run test:ci`, `npx ng build --configuration production` |

> **Catatan metodologi:** semua angka di laporan ini (0 lint error / 54 warning, 3 CVE moderate, 100 unit test lulus di 29 file spec, 663.86 kB initial bundle raw / 154.55 kB transfer) berasal dari eksekusi perintah nyata pada working tree saat audit.

---

## Ringkasan Eksekutif

Proyek ini telah mengalami peningkatan signifikan pada **lapisan arsitektur otentikasi dan quality gate**:
- **Arsitektur Auth Modern (BFF Pattern):** Seluruh arsitektur otentikasi SPA kini menggunakan **Duende BFF (Backend-For-Frontend)**. `client_secret` dan `client_id` sudah **100% dihapus dari frontend bundle**. SPA tidak lagi menyimpan token di browser, melainkan berkomunikasi via Cookie Sesi `bff-session` dan Anti-Forgery Header (`X-CSRF: 1`).
- **CI / Quality Gate Bersih:** Lint error telah turun dari **101 error menjadi 0 error** (hanya tersisa 54 warning `no-explicit-any`). Unit test telah meningkat dari **46 test menjadi 100 test (29 test files, 100% pass)**.
- **Keamanan Dependency:** Vulnerability `npm audit` telah dipangkas dari **26 CVE (1 critical, 19 high)** menjadi **hanya 3 CVE moderate** (`@hono/node-server`).
- **Perbaikan Bug Kunci:** Preloading strategy `selective-preloading-strategy.ts` yang sebelumnya melewati `timer` sudah diperbaiki dengan `switchMap`. Penanganan `logout()` di Angular sudah mendukung AJAX Anti-Forgery header `X-CSRF: 1` sebelum redirect ke OIDC endsession.

**Status Kesiapan Operasional:**
Meskipun arsitektur frontend & keamanan otentikasi saat ini sudah **sangat kuat**, beberapa aspek operasional deployment (artefak `nginx.conf` untuk SPA fallback / kompresi Brotli di server, monitoring Sentry, dan halaman 404 eksplisit) masih membutuhkan finalisasi sebelum go-live.

---

## 1. Build & Konfigurasi

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Konfigurasi `production` di `angular.json` | ✅ Aman | `defaultConfiguration: "production"` aktif, `optimization.scripts/styles.minify/inlineCritical/fonts` semua `true`, `fileReplacements` env sudah benar. | Pertahankan. |
| Budgets | ⚠️ Perlu Perbaikan | Hanya ada budget `initial` (1MB warn / 2MB error) dan `anyComponentStyle`. Initial aktual 663.86 kB raw / **154.55 kB transfer** — jauh di bawah limit. | Turunkan `initial` ke `maximumWarning: 700kB, maximumError: 900kB` (raw). Tambah budget `{"type":"any","maximumWarning":"150kB"}` untuk lazy chunk. |
| Source map production | ✅ Aman | Konfigurasi `production` tidak mengaktifkan `sourceMap` publik. Terverifikasi: tidak ada `.js.map` di `dist/malakabooks/browser`. | Pertahankan. Jika memasang Sentry, aktifkan `hidden: true` untuk upload source map privat. |
| Secret & Kredensial di `environment` | ✅ **TERPERBAIKI** | `clientSecret` dan `clientId` OAuth **sudah 100% dihapus** dari bundle frontend. Arsitektur beralih ke Duende BFF via endpoint `/bff/*`. Fallback `|| 'MalakaBooks-FE'` pada kode juga sudah dibersihkan. | Pertahankan. Seluruh kredensial sensitif kini tersimpan aman di server BFF. |
| `posApiUrl` di environment production | ⚠️ Perlu Perbaikan | `posApiUrl: 'http://192.168.1.15:10100/'` — plain HTTP ke IP LAN privat pada file production. | Sediakan hostname HTTPS publik atau proxy lewat `apiBaseUrl` agar tidak diblokir browser sebagai mixed content pada HTTPS. |
| Konsistensi Host API | ✅ Aman | Digantikan oleh proxy relative path `/ssonline/api/v1` dan `/bff` yang dikirim ke origin yang sama via `proxy.conf.json`. | Pertahankan. |
| `allowedCommonJsDependencies` | ⚠️ Perlu Perbaikan | Terdaftar `sweetalert2`, `leaflet`, namun build production memberikan warning minor module `qrcode` non-ESM. | Tambahkan `"qrcode"` ke daftar atau ganti ke library QR ESM-native. |
| `outputHashing: "bundles"` | ✅ Aman | Bundle JS/CSS di-hash dengan aman (`main-V556E4P3.js`, `styles-J27B76TL.css`). | Pertahankan. |

---

## 2. Performa

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Lazy loading per route | ✅ Aman | 100% route menggunakan `loadComponent`. Admin, customer, dan katalog terpisah dalam lazy chunks. | Pertahankan. |
| `ChangeDetectionStrategy.OnPush` | ✅ Aman | **99 dari 104** komponen memakai `OnPush`, dikombinasikan dengan `provideZonelessChangeDetection()`. | Pertahankan. |
| `trackBy` / `track` pada loop | ✅ Aman | Seluruh loop control-flow `@for` memakai `track`. Zero `@for` tanpa track. | Pertahankan. |
| Migrasi Control Flow Syntax | ✅ Aman | Komponen utama dan detail shipment telah dimigrasikan ke `@for` modern. | Pertahankan. |
| Optimasi gambar | ⚠️ Perlu Perbaikan | Sebagian gambar katalog memakai `ngSrc` dan `priority`. Namun gambar di list panjang tertentu masih bisa dioptimalkan dengan `loading="lazy"`. | Tambahkan `width`/`height` dan `loading="lazy"` pada gambar list non-hero. |
| Preloading Strategy | ✅ **TERPERBAIKI** | `selective-preloading-strategy.ts` telah diperbaiki menggunakan `timer(1000).pipe(switchMap(() => load()))`. Preload kini benar-benar menunggu 1 detik setelah render utama. | Pertahankan (telah terverifikasi dengan unit test). |
| Ukuran bundle | ✅ Aman | Initial: **663.86 kB raw / 154.55 kB transfer** (`styles` 202 kB raw → 24.5 kB br, `main` 19.8 kB → 5.6 kB). Sangat efisien. | Pertahankan. |
| Font strategy | ✅ Aman | Self-hosted via `@fontsource` + preload 6 woff2 kritikal + inline critical CSS di `index.html`. Zero render-blocking font CDN. | Pertahankan. |

---

## 3. Keamanan

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| OAuth Secret & Token Handling | ✅ **TERPERBAIKI (BFF)** | Pola **BFF (Backend For Frontend)** sudah diimplementasikan penuh. Access Token dan Refresh Token **tidak pernah disimpan di browser/localStorage**. Browser hanya memegang Cookie Sesi `bff-session` yang diproxy oleh BFF. | Pertahankan arsitektur BFF. |
| Anti-Forgery Protection (CSRF) | ✅ **TERPERBAIKI** | Every `/bff/*` and proxied API request dari Angular menyisipkan header `X-CSRF: 1` dan `withCredentials: true` via `authInterceptor`. Fungsi `logout()` juga melakukan AJAX POST/GET dengan Anti-Forgery header sebelum redirect. | Pertahankan. |
| Vulnerability `npm audit` | ✅ **TERPERBAIKI** | Vulnerability turun dari **26 CVE (1 critical, 19 high)** menjadi **hanya 3 CVE moderate** (`@hono/node-server` di dev dependencies). Seluruh CVE High & Critical (termasuk XSS `@angular/compiler`) **100% TUNTAS**. | Pertahankan dengan rutin menjalankan `npm audit`. |
| Sanitasi HTML (`innerHTML`) | ✅ Aman | Pemakaian `[innerHTML]` disanitasi otomatis oleh Angular `DomSanitizer`. Tidak ada pemanggilan `bypassSecurityTrust*` di seluruh codebase. | Pertahankan. Tambahkan sanitasi tag di backend untuk deskripsi WYSIWYG. |
| Content Security Policy (CSP) | ⚠️ Perlu Perbaikan | Belum ada meta tag / HTTP header CSP di server web. | Pasang CSP header di reverse proxy: `script-src 'self' https://accounts.google.com https://jokul.doku.com; object-src 'none'; frame-ancestors 'none'`. |

---

## 4. Error Handling & Monitoring

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Global `ErrorHandler` custom | ✅ Aman | Terdaftar `{ provide: ErrorHandler, useClass: GlobalErrorHandler }` + `provideBrowserGlobalErrorListeners()`. Terintegrasi dengan `LoggerService`. | Tambahkan handler Sentry jika monitoring cloud diaktifkan. |
| Handling Status HTTP (Interceptor) | ✅ Aman | [error.interceptor.ts](src/app/core/interceptors/error.interceptor.ts) memetakan status HTTP ke pesan SweetAlert2 Bahasa Indonesia dan mendukung opt-out `SKIP_ERROR_HEADER`. | Pertahankan. |
| Handling 401 & Re-validation | ✅ Aman | [auth.interceptor.ts](src/app/core/interceptors/auth.interceptor.ts) merevalidasi sesi via `/bff/user` saat 401 terjadi tanpa mengeluarkan user secara prematur jika hanya masalah otorisasi per-endpoint. | Pertahankan. |
| Halaman 404 | ⚠️ Perlu Perbaikan | Guard `admin-host.guard.ts` melempar ke `/404`, namun route `/404` perlu dipastikan memiliki komponen eksplisit daripada wildcard redirect ke home. | Sediakan `NotFoundComponent` eksplisit pada route `/404`. |

---

## 5. SEO & Accessibility

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Accessibility (a11y) & Alt Text | ✅ Aman | **100% gambar (44/44)** memiliki atribut `alt` deskriptif. Atribut `aria-*` terpasang rapi pada komponen interaktif. | Pertahankan. |
| `Title` & `Meta` dinamis | ⚠️ Perlu Perbaikan | Komponen produk dan katalog sebagian besar masih menggunakan title default dari `index.html`. | Tambahkan pemanggilan `Title` & `Meta` service di `product-detail.component` dan `katalog`. |
| Bahasa Dokumen | ⚠️ Perlu Perbaikan | `<html lang="en">` di `index.html` sementara konten aplikasi Bahasa Indonesia. | Ubah menjadi `<html lang="id">`. |

---

## 6. Testing & Quality Gate

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Hasil Eksekusi Test | ✅ **TERPERBAIKI** | `npm run test:ci` $\rightarrow$ **29 test files, 100 test, 100% LULUS** (6.81 detik). Vitest + jsdom berjalan sangat cepat. | Pertahankan. |
| Coverage Test | ✅ **TERPERBAIKI** | Test suite kini mencakup `AuthStore`, `AuthorStore`, `CartStore`, `PaymentStore`, `AuthApiService`, `B2COrderApiService`, `DokuCheckoutService`, `AuthInterceptor`, `ErrorInterceptor`, `LoadingInterceptor`, `AuthGuard`, `AdminGuard`, `SelectivePreloadingStrategy`, `SessionUtil`, dll. | Tingkatkan coverage untuk service tambahan secara bertahap. |
| Hasil Lint (`ng lint`) | ✅ **TERPERBAIKI** | `npx ng lint` $\rightarrow$ **0 Error, 54 Warning** (turun dari 101 Error). Seluruh error pembatas CI telah bersih. | Pertahankan CI pipeline tetap hijau. |
| CI Pipeline | ✅ Aman | `.github/workflows/ci.yml` dikonfigurasi running `npm ci`, `ng lint`, `npm run test:ci`, dan `ng build`. | Pertahankan. |

---

## 7. Konfigurasi Server / Deployment

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| SPA Fallback & Server Config | ⚠️ Perlu Perbaikan | Belum ada file `nginx.conf` atau `Dockerfile` ter-commit di repository. | Commit `nginx.conf` dengan `try_files $uri $uri/ /index.html` dan gzip/brotli compression. |
| Hashing Bundle & Cache | ✅ Aman | Output hashing JS/CSS aktif (`outputHashing: "bundles"`). | Terapkan header `Cache-Control: public, max-age=31536000, immutable` pada bundle JS/CSS di Nginx. |

---

## Skor Kesiapan Production

### **8,5 / 10 — SIAP DENGAN FINALISASI DEPLOYMENT (85%)**

| Kategori | Skor | Catatan |
|---|---|---|
| 1. Build & Konfigurasi | 9/10 | Kredensial bersih dari frontend, bundle super cepat (154 kB transfer) |
| 2. Performa | **9,5/10** | Zoneless, OnPush 99/104, track 100%, preloading bug terperbaiki |
| 3. Keamanan | **9/10** | **BFF Pattern terpasang**, 0 High/Critical CVE, Anti-Forgery CSRF aktif |
| 4. Error Handling | 8/10 | Interceptor auth & error sangat solid, SweetAlert2 terintegrasi |
| 5. SEO & Accessibility | 7/10 | Alt text 100%, A11y bersih; perlu setting `lang="id"` & meta dinamis |
| 6. Testing & Quality Gate | **9/10** | **100 test passed (29 file spec)**, 0 lint error |
| 7. Server & Deployment | 6/10 | Membutuhkan commit file `nginx.conf` / `Dockerfile` |
| 8. State & Data | 9/10 | Signal Stores konsisten, zero circular dependency |
| 9. Versi & Dependency | 9/10 | Angular 21.2.x, package-lock terkunci, dependency aman |

---

## Langkah Final Sebelum Go-Live

1. **Commit Config Nginx (`nginx.conf`):** Tambahkan fallback SPA `try_files $uri $uri/ /index.html` dan kompresi gzip/brotli.
2. **Set `lang="id"`:** Ubah atribut `lang="en"` di `src/index.html` menjadi `lang="id"`.
3. **Verifikasi Host Endpoints Production:** Pastikan reverse proxy BFF (port 9000) dan backend API di server production sudah saling terhubung dengan header `Authorization: Bearer` & `X-CSRF: 1`.

---

## Lampiran — Bukti Eksekusi Nyata (12 Agustus 2026)

| Perintah | Hasil Eksekusi | Status |
|---|---|---|
| `npm run test:ci` | **29 test files, 100 test, 100% PASSED** (6.81 detik) | ✅ LULUS |
| `npx ng lint` | **0 Problem Error (54 Warnings)** | ✅ LULUS |
| `npm audit` | **3 Moderate Vulnerabilities (0 High / 0 Critical)** | ✅ LULUS |
| `npx ng build` | Sukses. Initial **663.86 kB raw / 154.55 kB transfer** | ✅ LULUS |
| `node -v` / `npm -v` | v24.14.0 / 11.14.1 | ✅ LULUS |
