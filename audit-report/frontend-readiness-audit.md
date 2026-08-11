# Frontend Readiness Audit — Angular Scope
### Malakabooks Store (SS Online Shop)

| | |
|---|---|
| **Proyek** | `malakabooks` (Angular 21, standalone + signals + zoneless) |
| **Branch** | `ssonlineshop` |
| **Tanggal** | 11 Agustus 2026 |
| **Lingkup** | **Frontend Angular saja** — item yang membutuhkan tim backend dikeluarkan |
| **Metode** | Eksekusi nyata: `npm audit`, `ng lint`, `ng test --watch=false`, `ng build --configuration production` |

> **Versi lengkap:** [production-readiness-audit.md](production-readiness-audit.md) — berisi seluruh 47 item termasuk autentikasi & backend. Dokumen itu **tidak diubah** dan tetap menjadi bahan diskusi dengan tim backend.

---

## Lingkup Dokumen Ini

Dokumen ini adalah **subset** dari audit lengkap, berisi hanya temuan yang dapat dikerjakan tim frontend **tanpa menunggu pihak lain**.

**Yang dikeluarkan (8 item) — dipindah ke ranah diskusi backend:**

| Item | Ranah |
|---|---|
| `client_secret` di bundle frontend | Auth + backend |
| Koma nyasar di kredensial production | Auth *(lihat kotak verifikasi di bawah)* |
| Token/refresh token di `localStorage` | Auth + backend |
| Fallback kredensial hardcoded di kode | Auth |
| Refresh-token lock di interceptor | Auth |
| `posApiUrl` HTTP → mixed content | Backend/infra |
| Konsistensi host & port API production | Backend/infra |
| Sanitasi HTML deskripsi produk saat simpan | Backend |

**Jumlah item dalam lingkup frontend: 38** (dari 47 item audit penuh; 1 item auth interceptor ikut dikeluarkan dari penilaian).

---

> ### ⚠️ Satu Verifikasi 5 Menit Sebelum Melanjutkan
>
> Autentikasi dilaporkan sudah berjalan. Perlu dicatat bahwa `environment.prod.ts` hanya aktif lewat `fileReplacements` **saat build production** — `ng serve` memakai `environment.ts` yang nilainya bersih.
>
> Jadi bila pengujian dilakukan lewat `ng serve`, "auth berjalan baik" belum tentu berlaku untuk build production.
>
> **Verifikasi:** `ng build --configuration production` → serve hasilnya → coba login.
> - **Login berhasil** → temuan auth memang sudah tertangani, lanjut dengan dokumen ini.
> - **Login gagal (`invalid_client`)** → buka [production-readiness-tasks.md](production-readiness-tasks.md) `CRIT-01`. Perbaikannya 30 detik dan murni frontend.
>
> Setelah diverifikasi, autentikasi tidak dibahas lagi di dokumen ini.

---

## Ringkasan Eksekutif — Sudut Pandang Frontend

Dalam lingkup Angular murni, proyek ini **jauh lebih sehat daripada yang tampak di audit penuh**. Sebagian besar temuan kritikal di dokumen asli berasal dari penanganan kredensial dan integrasi backend — begitu itu dikeluarkan, yang tersisa adalah aplikasi Angular dengan fondasi arsitektur yang kuat dan empat celah operasional yang jelas.

**Kekuatan yang terverifikasi:**
- Zoneless change detection + `OnPush` di **99 dari 104** komponen
- **100%** dari 93 loop `@for` memakai `track` (nol pelanggaran)
- Lazy loading di seluruh route, initial bundle **152,30 kB transfer**
- Alt text **44 dari 44** gambar, 50 atribut `aria-*`, lint a11y aktif di CI
- Nol `console.log` liar — 7 pemanggilan seluruhnya terpusat di `LoggerService`
- Nol `bypassSecurityTrust*` di seluruh codebase
- `tsconfig` strict penuh, 48 pemakaian `takeUntilDestroyed`

**Empat celah yang tersisa, semuanya bisa ditutup tim frontend sendiri:**
1. Nol artefak konfigurasi server → refresh halaman = 404, tanpa kompresi
2. 26 CVE dependency (1 critical, 19 high) + 101 lint error → CI dijamin merah
3. Nol monitoring error pada aplikasi yang memproses pembayaran
4. Nol `Meta`/`Title` dinamis pada toko online yang bergantung trafik organik

---

## 1. Build & Konfigurasi

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Konfigurasi `production` | ✅ Aman | `defaultConfiguration: "production"`; `optimization.scripts`, `styles.minify`, `inlineCritical`, `fonts` semua `true`. | Pertahankan. |
| Source map production | ✅ Aman | Tidak diaktifkan; default `@angular/build` adalah `false`. Terverifikasi: nol `.js.map` di `dist/malakabooks/browser`. | Jadikan eksplisit: `"sourceMap": { "scripts": false, "styles": false, "hidden": false }`. Ubah `hidden: true` bila Sentry sudah terpasang. |
| Budgets | ⚠️ Perlu Perbaikan | Hanya `initial` (1MB warn / 2MB error) dan `anyComponentStyle`. **Tidak ada budget untuk lazy chunk.** Initial aktual 663,94 kB raw — jauh di bawah limit, jadi limitnya tidak akan pernah mendeteksi regresi. | Turunkan `initial` → warn 700kB / error 900kB. Tambah `{ "type": "any", "maximumWarning": "150kB" }`. |
| `allowedCommonJsDependencies` | ⚠️ Perlu Perbaikan | Build production memunculkan warning: `Module 'qrcode' ... is not ESM` → optimization bailout. Terdaftar baru `sweetalert2` dan `leaflet`. | Tambahkan `"qrcode"`, atau ganti ke library QR ESM-native. |
| `security.allowedHosts: []` di `build.options` | ⚠️ Perlu Perbaikan | Array kosong di blok `build`, sementara nilai efektifnya sudah ada di `serve.options`. Tidak berfungsi, hanya membingungkan. | Hapus dari `build.options`. |
| `outputHashing: "bundles"` | ⚠️ Perlu Perbaikan | Hanya JS/CSS ter-hash (terverifikasi: `main-2X3AF3WL.js`, `styles-Z4AQZQBQ.css`). Aset di `media/` **tanpa hash** — konsisten dengan `<link rel="preload" href="media/boxicons.woff2">` di `index.html`, jadi memang disengaja. | **Jangan ubah ke `"all"`** (akan merusak preload). Kompensasi lewat cache header berbeda per folder — lihat Kategori 7. |

---

## 2. Performa

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Lazy loading per route | ✅ Aman | 100% route memakai `loadComponent`. Admin, customer, dan katalog terpisah rapi. | Pertahankan. |
| `ChangeDetectionStrategy.OnPush` | ✅ Aman | **99 dari 104** komponen, dikombinasi `provideZonelessChangeDetection()`. | Sisir 5 sisanya untuk konsistensi. |
| `track` pada loop | ✅ Aman | Seluruh **93** loop `@for` memakai `track`. Nol pelanggaran. | Pertahankan. |
| Ukuran bundle | ✅ Aman | Initial **663,94 kB raw / 152,30 kB transfer**. 100 lazy chunk, terbesar 48,8 kB raw / 9,7 kB transfer. Sangat sehat. | Kunci dengan budget lebih ketat. |
| Font strategy | ✅ Aman | Self-hosted `@fontsource` + preload 6 woff2 kritikal + inline critical CSS + boot loader anti-FOUC. Nol CDN render-blocking. | Pertahankan. |
| **Bug preloading strategy** | ❌ **KRITIKAL (fungsional)** | [selective-preloading-strategy.ts:11](../src/app/core/strategies/selective-preloading-strategy.ts) — `return timer(1000).pipe(() => load());`. Argumen `pipe()` adalah *operator function* `(source) => Observable`; karena `() => load()` mengabaikan `source`, **`timer` tidak pernah ikut serta**. Delay 1 detik yang dijanjikan komentar di atasnya tidak pernah terjadi — preload menembak bersamaan dengan first paint. | `return timer(1000).pipe(switchMap(() => load()));` + tambahkan unit test. File ini sedang *modified* di working tree; periksa perubahan yang belum ter-commit sebelum menimpanya. |
| Cakupan `preload: true` | ⚠️ Perlu Perbaikan | **17 route** customer ditandai preload — praktis seluruh aplikasi (product, profile, auth×4, cart, checkout, order×4, complaints, addresses). Strategi "selective" jadi setara `PreloadAllModules`. Digabung bug di atas: semua chunk diunduh serentak saat load pertama. | Sisakan `''`, `product`, `product/:id`, `cart`. |
| Optimasi gambar | ⚠️ Perlu Perbaikan | `NgOptimizedImage` hanya di **6 dari 44** `<img>` (modul katalog + `product-card`). 38 sisanya `<img [src]>` polos: **nol** `loading="lazy"`, nol dimensi eksplisit → risiko CLS dan gambar full-size di list panjang. | Migrasi list panjang (cart, checkout, order-history, product-detail) ke `ngSrc` + `width`/`height`; tandai hero dengan `priority`. |
| Sisa `*ngFor` legacy | ⚠️ Perlu Perbaikan | Satu-satunya sisa: [detail-shipment.component.html:99](../src/app/features/order/detail-shipment/detail-shipment.component.html) — **tanpa `trackBy`**, sekaligus menarik `CommonModule`. Lint melaporkan 6 pelanggaran `prefer-control-flow`. | Migrasi ke `@for (log of trackingLogs; track log.id)`. |
| Dependency berat | ⚠️ Perlu Perbaikan | Semua dependency runtime terpakai ✅. **Tapi** `@types/leaflet` dan `@types/qrcode` salah tempat di `dependencies`. `boxicons` 2.1.4 mengirim 5 format font (eot/svg/ttf/woff/woff2) ke `dist` — empat di antaranya mati. | Pindahkan `@types/*` ke `devDependencies`; subset boxicons ke woff2 saja (~200 kB terhemat). |

---

## 3. Keamanan — Lingkup Frontend

> Tiga temuan keamanan terbesar (`client_secret` di bundle, token di `localStorage`, mixed content) berada di ranah auth/backend dan **tidak dibahas di sini**. Lihat [production-readiness-audit.md](production-readiness-audit.md) Kategori 3.

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| `npm audit` (dijalankan nyata) | ❌ **KRITIKAL** | **26 kerentanan: 1 critical, 19 high, 3 moderate, 3 low.** Paling relevan untuk runtime:<br>• `@angular/compiler` — **Two-Way Property Binding Sanitization Bypass (XSS)**, i18n XSS via event-handler attributes<br>• `@angular/core` — Hydration DOM Clobbering & Response-Cache Poisoning<br>• `@angular/common` — DoS OOM di `formatDate`, weak 32-bit cache key `HttpTransferCache`<br>• `tar` (**critical**), `piscina` (Prototype Pollution → RCE), `postcss`, `vite`, `undici`, `nanoid`, `ip-address`<br>Versi terpasang `21.2.16` masuk range rentan (`<21.2.17`, `<=21.2.18`). | **Sepenuhnya dalam kendali frontend.** `npm audit fix` + naikkan Angular ke `21.2.19+` (patch-level, risiko regresi minimal). XSS bypass di `@angular/compiler` relevan langsung karena aplikasi merender HTML admin via `[innerHTML]`. |
| `bypassSecurityTrust*` | ✅ Aman | **Nol pemakaian** di seluruh codebase. Temuan positif yang penting — tidak ada satu pun jalan pintas sanitizer. | Pertahankan sebagai aturan tim. |
| `innerHTML` di template | ⚠️ Perlu Perbaikan | 5 pemakaian, seluruhnya lewat binding `[innerHTML]` sehingga **disanitasi otomatis Angular** ✅. Risiko tersisa: deskripsi dari WYSIWYG admin dirender ke halaman customer ([product-detail.component.html:184](../src/app/features/product/product-detail/product-detail.component.html), [mardika-kopi-detail:145](../src/app/features/mardika-kopi/mardika-kopi-detail/mardika-kopi-detail.component.html)) — pertahanannya bertumpu pada satu lapis, dan lapis itu sedang punya CVE bypass aktif. | Sisi frontend: pastikan `CRIT-05` beres. Sanitasi di sisi simpan adalah item backend *(dikeluarkan dari lingkup ini)*. |
| String HTML manual di service | ⚠️ Perlu Perbaikan | [shipping-label.service.ts:271](../src/app/core/services/shipping-label.service.ts) merangkai `.innerHTML = '<p ...>' + awbClean + '</p>'` untuk dokumen cetak — jalur ini **melewati DomSanitizer** karena dieksekusi sebagai string di window cetak. | Ganti ke `textContent`, atau validasi `awbClean` dengan regex alfanumerik ketat. Murni frontend. |
| Content Security Policy | ⚠️ Perlu Perbaikan | Tidak ada CSP sama sekali — tidak di meta tag maupun header. `index.html` memuat script eksternal `accounts.google.com`; DOKU disuntik dinamis dari `jokul.doku.com`. | `script-src 'self' https://accounts.google.com https://jokul.doku.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`. Ditulis bersama konfigurasi server (Kategori 7). |
| HTTP interceptor error | ✅ Aman | [error.interceptor.ts](../src/app/core/interceptors/error.interceptor.ts) memetakan status 0/400/403/404/5xx ke pesan Bahasa Indonesia, membaca envelope backend, mendukung opt-out `SKIP_ERROR_HEADER`, dan urutan chain-nya benar serta terdokumentasi di `app.config.ts`. | Status **409** dan **422** belum dipetakan — jatuh diam-diam tanpa toast. |
| Google Client ID hardcoded | ✅ Aman | `785241388758-...apps.googleusercontent.com` di [google-auth.service.ts:21](../src/app/core/services/google-auth.service.ts). Client ID Google memang publik by design — **bukan kebocoran**. | Kerapian saja: pindahkan ke `environment.*` agar dev/prod bisa beda project. |

---

## 4. Error Handling & Monitoring

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Integrasi monitoring | ❌ **KRITIKAL** | **Nol.** Tidak ada Sentry / LogRocket / Application Insights / Datadog. Tidak ada RUM, error tracking, maupun alerting. | Aplikasi ini memproses pembayaran DOKU — tanpa monitoring, bug production hanya diketahui saat pelanggan komplain. Pasang `@sentry/angular`, hubungkan ke `GlobalErrorHandler` + `errorInterceptor`, aktifkan release tracking + hidden source map. **Wajib scrub PII.** Sepenuhnya pekerjaan frontend. |
| Halaman 404 | ❌ **KRITIKAL (bug)** | Tidak ada komponen/route 404; `app.routes.ts` ditutup `{ path: '**', redirectTo: '' }`. Lebih buruk: [admin-host.guard.ts:13](../src/app/core/guards/admin-host.guard.ts) memanggil `router.navigate(['/404'])` — route itu **tidak ada**, jatuh ke wildcard, pengunjung dilempar ke **homepage**. Komentar di guard menyatakan niatnya "tampilkan 404", jadi perilaku aktual ≠ yang dimaksud, dan panel admin tetap discoverable dari domain publik. | Buat `NotFoundComponent`, daftarkan route `/404`, ubah wildcard jadi `loadComponent` — **bukan redirect** (redirect merusak SEO dan menyembunyikan broken link). |
| Global `ErrorHandler` custom | ⚠️ Perlu Perbaikan | Terdaftar dengan benar ✅ (`{ provide: ErrorHandler, useClass: GlobalErrorHandler }` + `provideBrowserGlobalErrorListeners()`), tapi isinya hanya `logger.error(...)`. Saat error tak tertangkap, **user tidak melihat apa pun** — aplikasi hanya diam. Integrasi Sentry masih komentar. | Tambahkan notifikasi user + kirim ke Sentry (slot komentarnya sudah tersedia di file). |
| Fallback UI: error & empty state | ⚠️ Perlu Perbaikan | Ada boot loader anti-FOUC ✅, `loadingInterceptor` + `LoadingService` ✅, toast global ✅. Belum ada error state per-halaman dengan retry — kegagalan fetch hanya memunculkan toast lalu halaman **tetap kosong** tanpa jalan keluar. | Terapkan pola `loading / error+retry / empty / data` di product list, product detail, order history, cart. |
| Offline state | ⚠️ Perlu Perbaikan | Tidak ada `navigator.onLine`, tidak ada listener `online`/`offline`, tidak ada service worker. Penanganan offline hanya reaktif (`error.status === 0` → toast). | Banner offline global berbasis event `window.online`/`offline`. |
| Error handling di HTTP call | ✅ Aman | Dua lapis: interceptor global + try/catch lokal di service kritikal. `DokuCheckoutService.open()` bahkan mendokumentasikan kontraknya secara eksplisit (order sudah tercatat di backend; pemanggil wajib punya fallback). | Pertahankan. |

---

## 5. SEO & Accessibility

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| `Meta` & `Title` service | ❌ **KRITIKAL** | **Nol pemakaian** `Title` maupun `Meta` di seluruh codebase. Setiap halaman — homepage, semua produk, keranjang, checkout — berbagi satu title statis dari `index.html`. Tidak ada `description`, Open Graph, Twitter Card, canonical, maupun JSON-LD. | Setiap produk tidak bisa dibedakan mesin pencari dan **tampil buruk saat di-share ke WhatsApp/Instagram**. Injeksikan `Title`+`Meta` di `ngOnInit` + JSON-LD `Product`. Sepenuhnya frontend, tidak butuh SSR. |
| Kebutuhan SSR / prerendering | ❌ **KRITIKAL** | `angular.json` → `"ssr": false`. Crawler menerima HTML kosong berisi spinner. Google *bisa* merender JS (dengan antrian, tanpa jaminan), tapi **Bing dan seluruh crawler social preview — WhatsApp, Facebook, Twitter — tidak merender JS sama sekali.** | `ng add @angular/ssr` dengan hybrid rendering: **SSG** `/`, `/product`, `/mardika-kopi` · **SSR** `/product/:id` · **CSR** admin & checkout. Butuh hosting Node runtime. Epic tersendiri. |
| Alt text | ✅ Aman | Verifikasi menyeluruh: **44 dari 44** `<img>` punya alt (`alt=` atau binding `[alt]`), termasuk yang memakai `ngSrc`. Nilainya deskriptif (`[alt]="prod.title"`). | Pertahankan. |
| ARIA | ✅ Aman | 50 atribut `aria-*`. `angular-eslint` `templateAccessibility` aktif di [eslint.config.js](../eslint.config.js) — a11y ikut ter-lint di CI. | Pertahankan. |
| Label form | ⚠️ Perlu Perbaikan | **6 × `label-has-associated-control`**. Berdampak pada screen reader **dan** usability biasa — klik label tidak memfokus field. | Hubungkan dengan `for`/`id` atau bungkus input di dalam `<label>`. |
| Keyboard navigation | ⚠️ Perlu Perbaikan | **1 × `click-events-have-key-events`**, **1 × `interactive-supports-focus`**. Ada 11 `(click)` pada `<div>`/`<span>`/`<li>`/`<i>` yang patut ditinjau. | Ganti ke `<button type="button">`, atau `tabindex="0"` + `(keydown.enter)` + `role`. |
| Kontras warna | ⚠️ Perlu Perbaikan | Terlihat `text-slate-400`/`text-slate-500` untuk teks harga & metadata. `slate-400` (#94a3b8) di atas putih hanya **~2,8:1**, di bawah ambang WCAG AA 4,5:1. | Audit dengan axe/Lighthouse; naikkan teks kecil informatif ke `slate-600`. |
| `lang` attribute | ⚠️ Perlu Perbaikan | `<html lang="en">` sementara seluruh konten Bahasa Indonesia. | `lang="id"`. Satu baris. |

---

## 6. Testing & Quality Gate

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Hasil eksekusi test | ✅ Aman | `npm run test:ci` → **17 file, 46 test, semuanya lulus** (48,75 s). Vitest + jsdom dengan plugin custom untuk inline `templateUrl`. | Pertahankan. |
| `console.log` tertinggal | ✅ Aman | Hanya **7** pemanggilan `console.*`, **seluruhnya terpusat di [logger.service.ts](../src/app/core/services/logger.service.ts)**. `log()` sudah di-gate `if (!environment.production)`. Nol `console.log` liar di komponen. | Setelah Sentry masuk, arahkan `error()`/`warn()` ke sana juga. |
| Hasil lint | ❌ **KRITIKAL** | `ng lint` dijalankan langsung: **101 problem (101 error, 0 warning).** `no-explicit-any` 46 · `no-output-native` 12 · `no-input-rename` 9 · `no-empty-function` 7 · `prefer-control-flow` 6 · `label-has-associated-control` 6 · `no-unused-vars` 4 · `no-useless-assignment` 3 · sisanya 8. | **`.github/workflows/ci.yml` menjalankan `npm run lint` sebagai step wajib → pipeline `main` dijamin merah.** Quality gate secara efektif mati. Batch cepat (12+9+4+3 = 28 error) bisa selesai satu sesi. |
| Konfigurasi & threshold coverage | ❌ **KRITIKAL** | [vitest.config.ts](../vitest.config.ts) **tidak punya blok `coverage` sama sekali** — tidak ada reporter, tidak ada `thresholds`. Angka coverage tidak pernah diukur. Estimasi kasar: **~8%** file sumber tersentuh test (17 spec / 222 file ts). | `coverage: { provider: 'v8', reporter: ['text','lcov'], thresholds: { lines: 40, functions: 40 } }`, naikkan bertahap. *Tanpa angka, "quality gate" hanyalah nama folder.* |
| Coverage service & store | ❌ **KRITIKAL** | **30 service di `core/services` — nol punya test.** Termasuk `doku-checkout` (pembayaran), `b2c-order-api` (pembuatan order), `payment-api`, `shipping.service`, `waybill-normalizer`. Dari 21 store, hanya 3 tertutup (`auth`, `author`, `cart`). | Prioritaskan jalur uang: `payment-api`, `b2c-order-api`, `doku-checkout`, `order.store`, `payment.store`. |
| E2E test | ❌ **KRITIKAL** | **Tidak ada sama sekali.** Tidak ada Playwright/Cypress, tidak ada folder `e2e`. Flow paling kritikal — keranjang → checkout → bayar → order success — tidak pernah diuji end-to-end, dan justru flow itulah yang menyentuh uang pelanggan. | Playwright, minimal 3 skenario. Jalankan di CI. |
| Coverage guard, interceptor, pipe | ⚠️ Perlu Perbaikan | Guard 3 dari 4 ✅ (`katalog-checkout-abandon` belum). Interceptor 1 dari 3 ✅ — **`error.interceptor` belum**, padahal logika pemetaan statusnya bercabang banyak dan mudah dites. `truncate.pipe` (satu-satunya pipe) belum ada test — pipe murni adalah test termurah yang bisa ditulis. | Lengkapi keempatnya. |
| CI pipeline | ⚠️ Perlu Perbaikan | [ci.yml](../.github/workflows/ci.yml) strukturnya benar (checkout → Node 22 + cache → `npm ci` → lint → test → build), tapi **trigger hanya `main`** padahal pekerjaan di `ssonlineshop` → **CI tidak pernah jalan untuk kerja harian**. Tidak ada step `npm audit`, tidak ada upload artifact. | Ubah ke `branches: ['**']` untuk PR; tambah `npm audit --audit-level=high`; upload `dist/`. |

---

## 7. Konfigurasi Deployment
*Berkas konfigurasi ini berada di repo frontend dan ditulis tim frontend, meski penerapannya butuh akses server.*

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| SPA fallback ke `index.html` | ❌ **KRITIKAL** | **Tidak ada satu pun artefak konfigurasi server di repo** — dicari menyeluruh: tidak ada `nginx.conf`, `web.config`, `_redirects`, `netlify.toml`, `vercel.json`, `firebase.json`, `.htaccess`, `Dockerfile`. Aplikasi memakai `PathLocationStrategy` dengan route dalam seperti `/product/123`. | Tanpa fallback, **refresh halaman atau share link produk = 404 dari web server**. Kegagalan go-live SPA paling umum. Template lengkap ada di bawah tabel. |
| Kompresi gzip/brotli | ❌ **KRITIKAL** | Tidak ada konfigurasi kompresi. Build melaporkan "estimated transfer size" 152 kB — angka itu **mengasumsikan brotli aktif**, asumsi yang saat ini tidak terpenuhi. Tanpa kompresi user mengunduh **663,94 kB**, yaitu 4,4× lebih besar. | Brotli + gzip untuk `text/*`, `application/javascript`, `application/json`, `image/svg+xml`. **Rasio effort-to-impact tertinggi di seluruh laporan.** |
| Cache header & cache busting | ⚠️ Perlu Perbaikan | Cache busting JS/CSS aman lewat `outputHashing` ✅, tapi tidak ada konfigurasi cache header di mana pun, dan `media/`+`assets/` tidak ter-hash. | `index.html` → `no-cache` (kalau ini salah, user terjebak versi lama selamanya). Bundle ber-hash → `max-age=31536000, immutable`. `media/`+`assets/` → `max-age=86400, must-revalidate`. |
| Security header | ⚠️ Perlu Perbaikan | Tidak ada `Strict-Transport-Security`, `X-Content-Type-Options`, `frame-ancestors`, `Referrer-Policy`, maupun CSP. | Tambahkan bersamaan konfigurasi server. |
| Reproducibility deployment | ⚠️ Perlu Perbaikan | README hanya menyebut hasil build "siap disajikan server statis apa pun" tanpa konfigurasi konkret. Deploy = proses manual tak terdokumentasi. | Commit konfigurasi + dokumentasikan langkahnya. |

**Template `nginx.conf` yang menutup empat temuan di atas sekaligus:**

```nginx
server {
  listen 443 ssl http2;
  root /usr/share/nginx/html;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
  brotli on;
  brotli_types text/css application/javascript application/json image/svg+xml;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  location ~* \.(js|css)$        { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location ~* ^/(media|assets)/  { add_header Cache-Control "public, max-age=86400, must-revalidate"; }
  location = /index.html         { add_header Cache-Control "no-cache"; }

  location / { try_files $uri $uri/ /index.html; }   # SPA fallback
}
```

---

## 8. State Management & Data

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Pola state management | ✅ Aman | 21 signal store di `src/app/store` + `provideZonelessChangeDetection()`. Konsisten, modern, tanpa dependency state eksternal. | Pertahankan. |
| Memory leak dari subscription | ⚠️ Perlu Perbaikan | 33 `.subscribe()` di 21 file, dengan **48 pemakaian `takeUntilDestroyed`** — mayoritas aman ✅. Dua pengecualian:<br>• [katalog-cart.component.ts:160](../src/app/features/katalog/katalog-cart/katalog-cart.component.ts) — `postB2COrder().subscribe()` **tanpa proteksi**. HTTP one-shot jadi tidak bocor permanen, tapi callback memanggil `isProcessing.set(false)` dan `setLastOrderId()` setelah komponen bisa saja sudah hancur. **Ini jalur pembuatan order.**<br>• [search-bar.component.ts:29](../src/app/shared/ui/search-bar/search-bar.component.ts) — stream infinite, tapi di-unsubscribe manual di `ngOnDestroy` ✅ aman, hanya lebih verbose. | Tambahkan `takeUntilDestroyed` di katalog-cart; modernkan search-bar agar seragam. |
| `async` pipe | ⚠️ Perlu Perbaikan | **Nol** pemakaian `\| async` di 97 template. Konsisten dengan arsitektur signal-first (bukan cacat), tapi berarti tidak ada safety net otomatis di template. | Tidak perlu diubah; pastikan disiplin `takeUntilDestroyed`. Pertimbangkan lint rule `rxjs-angular/prefer-takeuntil`. |
| Kebersihan repository | ⚠️ Perlu Perbaikan | `lint_results.txt` (42 KB, UTF-16, **usang** — berisi 135 error vs 101 aktual), `AUDIT_PROMPTS.md` (0 byte), `customs.css` (0 byte) ter-commit di root. `.gitignore` sudah benar untuk `/dist`, `node_modules`, `.angular/cache` ✅. | Hapus ketiganya; tambahkan `lint_results.txt` ke `.gitignore`. **Laporan lint usang lebih berbahaya daripada tidak ada** — orang akan mempercayainya. |

---

## 9. Versi & Dependency

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Kesehatan dependency tree | ❌ **KRITIKAL** | 26 kerentanan (1 critical, 19 high) — rincian di Kategori 3. `npm audit fix` tersedia untuk mayoritas. | Jalankan, lalu tambahkan `npm audit --audit-level=high` sebagai step CI. |
| Versi Angular | ⚠️ Perlu Perbaikan | **21.2.x** — versi aktif, masih dukungan penuh ✅. Namun patch terpasang (`21.2.16`) berada di dalam range rentan beberapa advisory. | Naikkan ke `21.2.19+`. Patch-level, risiko regresi minimal. |
| Kompatibilitas Node.js | ⚠️ Perlu Perbaikan | Angular 21 mensyaratkan `^20.19 \|\| ^22.12 \|\| ^24.x`. Mesin dev **v24.14.0** ✅, CI **22.x** ✅. README menulis "v20+" (terlalu longgar — Node 20.0–20.18 akan gagal). **Tidak ada field `engines`**, tidak ada `.nvmrc`. | Tambahkan `engines` + `.nvmrc`. Dev di Node 24 sementara CI di Node 22 adalah drift yang cepat atau lambat menggigit. |
| Penempatan dependency | ⚠️ Perlu Perbaikan | `@types/leaflet` dan `@types/qrcode` di `dependencies`. | Pindahkan ke `devDependencies`. |
| `package-lock.json` ter-commit | ✅ Aman | Terverifikasi via `git ls-files` (406 KB). CI memakai `npm ci` ✅. `packageManager: "npm@11.14.1"` terkunci ✅. | Pertahankan. |
| Konfigurasi TypeScript | ✅ Aman | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, plus `strictTemplates` + `strictInjectionParameters` + `strictInputAccessModifiers`. Setelan paling ketat yang praktis. | Pertahankan. Ini membuat 46 error `no-explicit-any` makin patut ditutup — `any` melubangi jaring yang sudah susah payah dipasang. |

---

## Skor Kesiapan — Lingkup Frontend

### **5,5 / 10 — BELUM SIAP (55%)**

> ⚠️ **Angka ini BUKAN kemajuan dari 4,5/10.**
> Ini **lingkup yang berbeda dan lebih sempit**. Delapan item yang dikeluarkan tidak terselesaikan — hanya dipindah ke ranah diskusi backend, dan **empat di antaranya masih blocker go-live yang sesungguhnya.** Frontend siap ≠ aplikasi siap rilis.

| Kategori | Skor FE | Catatan |
|---|---|---|
| 1. Build & Konfigurasi | 6,5/10 | Setup builder solid; sisa murni penyetelan |
| 2. Performa | **8,5/10** | **Terkuat.** Zoneless, OnPush 99/104, track 100%, 152 kB. Ternoda bug preloading |
| 3. Keamanan (FE) | 4/10 | Postur kode baik (nol `bypassSecurityTrust`), tapi 20 CVE high/critical |
| 4. Error Handling & Monitoring | 4/10 | Interceptor kelas produksi, tapi nol monitoring dan 404 rusak |
| 5. SEO & Accessibility | 3,5/10 | A11y dasar baik (alt 44/44, 50 aria); SEO praktis nol |
| 6. Testing & Quality Gate | 3/10 | 46 test lulus, tapi ~8% coverage, nol E2E, CI dijamin merah |
| 7. Deployment | **1/10** | **Terlemah.** Nol artefak konfigurasi. Refresh halaman = 404 |
| 8. State & Data | 7,5/10 | Signal store konsisten, leak minimal |
| 9. Versi & Dependency | 5/10 | Versi modern, lock ter-commit; 26 CVE |

**Perhitungan:** dari 38 item dalam lingkup frontend — **8 ❌ Kritikal**, **21 ⚠️ Perlu Perbaikan**, **9 ✅ Aman**.

### Delapan Temuan Kritikal Frontend

| # | Temuan | Kategori | Effort |
|---|---|---|---|
| 1 | Nol artefak konfigurasi server (SPA fallback + kompresi) | 7 | S |
| 2 | 26 CVE dependency (1 critical, 19 high) | 3, 9 | M |
| 3 | 101 lint error → CI dijamin merah | 6 | M |
| 4 | Nol monitoring error | 4 | M |
| 5 | Halaman 404 tidak ada + `admin-host.guard` rusak | 4 | S |
| 6 | Bug preloading strategy (`pipe()` mengabaikan `timer`) | 2 | S |
| 7 | Nol `Meta`/`Title` dinamis (SEO) | 5 | M |
| 8 | Nol E2E + coverage tidak pernah diukur (~8%) | 6 | M |

**Penilaian jujur:** kualitas *engineering* Angular di proyek ini bagus dan konsisten — jelas dikerjakan orang yang paham Angular modern. Yang belum dikerjakan adalah *segala hal di antara kode dan pelanggan*: konfigurasi penyajian, monitoring, dan discoverability. Empat dari delapan temuan di atas punya effort `S` dan bisa selesai dalam setengah hari.

---

## Lampiran A — Item yang Dikeluarkan dari Lingkup

Delapan item berikut **tetap terbuka** dan menunggu diskusi dengan tim backend. Rinciannya ada di [production-readiness-audit.md](production-readiness-audit.md).

| Item | Status asli | Masih blocker go-live? |
|---|---|---|
| `client_secret` OAuth di bundle frontend | ❌ Kritikal | **Ya** |
| Koma nyasar di kredensial production | ❌ Kritikal | **Ya** — kecuali sudah diverifikasi *(lihat kotak di atas)* |
| `posApiUrl` HTTP → mixed content | ❌ Kritikal | **Ya** — flow order katalog B2C |
| Token & refresh token di `localStorage` | ❌ Kritikal | **Ya** |
| Fallback kredensial hardcoded di kode | ⚠️ | Tidak |
| Konsistensi host & port API production | ⚠️ | Tidak |
| Refresh-token lock di `auth.interceptor` | ⚠️ | Tidak |
| Sanitasi HTML deskripsi produk saat simpan | ⚠️ | Tidak |

---

## Lampiran B — Bukti Eksekusi

| Perintah | Hasil |
|---|---|
| `npm run test:ci` | 17 file, 46 test, **semua lulus** (48,75 s) |
| `npx ng lint` | **101 problem (101 error, 0 warning)** |
| `npm audit` | **26 kerentanan: 1 critical, 19 high, 3 moderate, 3 low** |
| `npx ng build --configuration production` | Sukses. Initial **663,94 kB raw / 152,30 kB transfer**; 100 lazy chunk; 1 warning (`qrcode` non-ESM) |
| `node -v` / `npm -v` | v24.14.0 / 11.14.1 |
| Statistik codebase | 222 file `.ts`, 97 template, 104 komponen (99 `OnPush`), 30 service, 21 store, 4 guard, 3 interceptor, 1 pipe, 17 file spec |

---

*Tidak ada file sumber yang diubah untuk audit ini. Tiga dokumen versi penuh — audit, tasks, sprints — tetap utuh sebagai bahan diskusi dengan tim backend.*
