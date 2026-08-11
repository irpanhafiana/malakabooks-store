# Production-Readiness Audit — Malakabooks Store (SS Online Shop)

| | |
|---|---|
| **Proyek** | `malakabooks` (Angular 21, standalone + signals + zoneless) |
| **Branch** | `ssonlineshop` |
| **Tanggal audit** | 11 Agustus 2026 |
| **Auditor** | Senior Angular Dev / DevOps Tech Lead review |
| **Metode** | Static review + eksekusi nyata: `npm audit`, `ng lint`, `ng test --watch=false`, `ng build --configuration production` |

> **Catatan metodologi:** semua angka di laporan ini (101 lint error, 26 CVE, 46 test, 663.94 kB initial bundle) berasal dari eksekusi perintah nyata pada working tree saat audit, bukan estimasi. File `lint_results.txt` di root sudah usang (135 error, 10 Agustus) — nilai yang benar saat ini adalah 101.

---

## Ringkasan Eksekutif

Proyek ini secara **arsitektur frontend sangat matang** — zoneless change detection, 99 dari 104 komponen memakai `OnPush`, seluruh `@for` memakai `track`, lazy loading per-route menyeluruh, 48 pemakaian `takeUntilDestroyed`, interceptor auth/error/loading terpisah, dan initial bundle hanya 152 kB transfer. Ini di atas rata-rata proyek Angular komersial.

Namun **lapisan keamanan kredensial dan lapisan operasional (deploy/monitoring/SEO) belum siap produksi**. Ada 3 temuan yang berpotensi menyebabkan kegagalan total atau kebocoran kredensial di hari go-live:

1. `client_secret` OAuth ter-hardcode di bundle frontend production.
2. Nilai `clientId`/`clientSecret` production mengandung **koma nyasar di dalam string** — otentikasi kemungkinan besar langsung gagal di production.
3. `posApiUrl` production menunjuk `http://192.168.1.15:10100/` — IP internal via HTTP, akan diblokir sebagai mixed content dari halaman HTTPS.

Ditambah CI pipeline yang dijamin merah (101 lint error dengan `npm run lint` sebagai gate), tidak ada satu pun artefak konfigurasi server (SPA fallback / gzip / cache header), dan tidak ada SSR/meta tag untuk aplikasi e-commerce yang bergantung pada trafik organik.

---

## 1. Build & Konfigurasi

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Konfigurasi `production` di `angular.json` | ✅ Aman | `defaultConfiguration: "production"` aktif, `optimization.scripts/styles.minify/inlineCritical/fonts` semua `true`, `fileReplacements` env sudah benar. | Pertahankan. |
| Budgets | ⚠️ Perlu Perbaikan | Hanya ada budget `initial` (1MB warn / 2MB error) dan `anyComponentStyle`. **Tidak ada budget `bundle`/`allScript`/`any`** untuk lazy chunk. Initial aktual 663.94 kB raw / **152.30 kB transfer** — jauh di bawah limit, artinya limit 1MB terlalu longgar untuk mendeteksi regresi. | Turunkan `initial` ke `maximumWarning: 700kB, maximumError: 900kB` (raw). Tambah budget `{"type":"any","maximumWarning":"150kB"}` agar lazy chunk gemuk ketahuan. |
| Source map production | ✅ Aman | Konfigurasi `production` tidak mengaktifkan `sourceMap`; default `@angular/build` adalah `false`. Terverifikasi: tidak ada `.js.map` di `dist/malakabooks/browser`. | Jadikan eksplisit agar tidak berubah tanpa sengaja: `"sourceMap": { "scripts": false, "styles": false, "hidden": false }`. Jika nanti pasang Sentry, ubah ke `hidden: true` + upload map ke Sentry saja. |
| Secret di `environment.prod.ts` | ❌ **KRITIKAL** | `clientSecret: '996cc633-23c1-4fb7-a6b6-6fd20dd5051e,'` dan `scope: '...5Ecd}3+uX3g=%Mxk...'` ter-hardcode. Dipakai di [auth-api.service.ts:31](src/app/core/services/auth-api.service.ts:31) pada OAuth **password grant** dari browser. Semua nilai ini ada di bundle JS publik dan bisa dibaca siapa pun. | Lihat detail di Kategori 3. Wajib pindah ke BFF / gunakan `client_id` publik + PKCE. |
| **Koma nyasar di dalam string kredensial** | ❌ **KRITIKAL** | `clientId: '996cc633-23c1-4fb7-a6b6-6fd20dd5051d,'` — perhatikan `,` **sebelum** kutip penutup. Sama pada `clientSecret` (`...5051e,`). Nilai yang dikirim ke `/connect/token` menjadi `"...5051d,"`, bukan GUID valid. | **Login production akan gagal total (`invalid_client`).** Hapus koma tersebut sebelum apa pun yang lain. Ini bug fungsional, bukan sekadar kerapian. |
| `posApiUrl` di environment production | ❌ **KRITIKAL** | `posApiUrl: 'http://192.168.1.15:10100/'` — plain HTTP ke IP LAN privat, di file *production*. Dipakai [b2c-order-api.service.ts:13](src/app/core/services/b2c-order-api.service.ts:13) untuk posting order B2C katalog. | Halaman HTTPS akan memblokir request ini sebagai mixed content → **flow checkout katalog offline mati di production**. Sediakan hostname HTTPS publik, atau proxy lewat `apiBaseUrl`. |
| Konsistensi host antar-URL production | ⚠️ Perlu Perbaikan | `apiBaseUrl` → `tokosuburjaya.com:17800`, `authUrl` → `tokosuburjaya.com` (port 443). Beda port tanpa penjelasan; port non-standar 17800 sering diblokir jaringan korporat/hotspot. | Konfirmasi ke tim backend, idealnya letakkan semuanya di belakang satu reverse proxy port 443. |
| `allowedCommonJsDependencies` | ⚠️ Perlu Perbaikan | Terdaftar `sweetalert2`, `leaflet`, tapi build production memunculkan warning: `Module 'qrcode' ... is not ESM` → optimization bailout. | Tambahkan `"qrcode"` ke daftar, atau ganti ke library QR ESM-native untuk menghilangkan bailout. |
| `security.allowedHosts: []` di `build.options` | ⚠️ Perlu Perbaikan | Properti `allowedHosts` berada di blok `build`, sementara nilai efektifnya sudah didefinisikan di `serve.options`. Blok array kosong ini tidak berguna dan membingungkan. | Hapus dari `build.options`. |
| `outputHashing: "bundles"` | ⚠️ Perlu Perbaikan | Hanya JS/CSS yang di-hash. Terverifikasi: `dist/.../media/boxicons.woff2` **tanpa hash**. Ini konsisten dengan `<link rel="preload" href="media/boxicons.woff2">` di `index.html`, jadi memang disengaja — tapi berarti font/asset tidak punya cache busting. | Pertahankan `bundles` (preload butuh nama stabil), **tetapi** wajib set cache header berbeda: JS/CSS `immutable, max-age=31536000`; folder `media/` dan `assets/` `max-age=86400, must-revalidate`. |

---

## 2. Performa

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Lazy loading per route | ✅ Aman | 100% route memakai `loadComponent`. Tidak ada komponen fitur yang eager. Admin, customer, katalog terpisah rapi. | Pertahankan. |
| `ChangeDetectionStrategy.OnPush` | ✅ Aman | **99 dari 104** komponen memakai `OnPush`, dikombinasi `provideZonelessChangeDetection()`. Sangat baik. | Sisir 5 komponen sisanya untuk konsistensi (non-blocking). |
| `trackBy` / `track` pada loop | ✅ Aman | Seluruh 93 loop control-flow `@for` memakai `track`. Nol `@for` tanpa track. | Pertahankan. |
| Sisa `*ngFor` legacy | ⚠️ Perlu Perbaikan | Masih ada 1: [detail-shipment.component.html:99](src/app/features/order/detail-shipment/detail-shipment.component.html:99) — `*ngFor` **tanpa `trackBy`**, menarik `CommonModule` ke bundle. Lint juga melaporkan 6 pelanggaran `template/prefer-control-flow`. | Migrasi ke `@for (log of trackingLogs; track log.id)`. |
| Optimasi gambar | ⚠️ Perlu Perbaikan | `NgOptimizedImage` hanya dipakai di **6 dari 44** `<img>` (semua di modul katalog + `product-card`). 38 sisanya `<img [src]>` polos, **nol** `loading="lazy"`, nol `width`/`height` eksplisit → risiko CLS dan gambar full-size di list panjang (cart, checkout, order-history, mardika-kopi). | Migrasikan `<img>` di list yang panjang ke `ngSrc` + `width`/`height` (atau `fill`), dan tandai gambar hero dengan `priority`. Minimal tambahkan `loading="lazy"` + dimensi. |
| Preloading strategy — **bug implementasi** | ❌ **KRITIKAL (fungsional)** | [selective-preloading-strategy.ts:11](src/app/core/strategies/selective-preloading-strategy.ts:11): `return timer(1000).pipe(() => load());`. Argumen `pipe()` adalah *operator function* `(source) => Observable`, jadi `() => load()` **mengabaikan `timer` sepenuhnya** dan langsung mengembalikan `load()`. Delay 1 detik yang dijanjikan komentar **tidak pernah terjadi** — preload menembak bersamaan dengan first paint. (File ini juga sedang uncommitted di working tree.) | Ganti dengan `return timer(1000).pipe(switchMap(() => load()));` (impor `switchMap`). Ini persis kelas bug yang lolos karena tidak ada test untuk strategy-nya. |
| Cakupan `preload: true` | ⚠️ Perlu Perbaikan | 17 route customer diberi `data: { preload: true }` — praktis **seluruh** aplikasi customer (product, profile, auth×4, cart, checkout, order×4, complaints, addresses). Strategi "selective" jadi hampir sama dengan `PreloadAllModules`. Digabung dengan bug di atas, semua chunk itu diunduh serentak saat load pertama. | Batasi `preload: true` ke jalur bernilai tinggi saja: `''`, `product`, `product/:id`, `cart`. Sisanya on-demand. |
| Ukuran bundle | ✅ Aman | Initial: **663.94 kB raw / 152.30 kB transfer** (`styles` 206 kB raw → 24.5 kB br, `main` 13.2 kB → 3.74 kB). Total 100 lazy chunk, terbesar 48.8 kB raw / 9.7 kB transfer. Sangat sehat. | Pertahankan; kunci dengan budget yang lebih ketat (lihat Kategori 1). |
| Dependency berat / tidak terpakai | ⚠️ Perlu Perbaikan | Semua dependency runtime terpakai (`leaflet` → map-picker, `jsbarcode`+`qrcode` → shipping-label, `embla-carousel` → home & mardika-kopi, `sweetalert2` → alert.service). **Tetapi**: `@types/leaflet` dan `@types/qrcode` salah tempat di `dependencies`, bukan `devDependencies`. `boxicons` 2.1.4 mengirim 5 format font (eot/svg/ttf/woff/woff2) ke `dist`. | Pindahkan kedua `@types/*` ke `devDependencies`. Untuk boxicons, subset ke woff2 saja (eot/ttf/svg ~200 kB mati di `dist`). |
| Font strategy | ✅ Aman | Self-hosted via `@fontsource` + preload 6 woff2 kritikal + inline critical CSS + boot loader anti-FOUC di `index.html`. Nol CDN render-blocking. Sangat rapi. | Pertahankan. |

---

## 3. Keamanan

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| **`client_secret` di bundle frontend** | ❌ **KRITIKAL** | [auth-api.service.ts:26-33](src/app/core/services/auth-api.service.ts:26) menjalankan **OAuth 2.0 Resource Owner Password Credentials grant** langsung dari browser, mengirim `client_id` + `client_secret` + username + password ke `/connect/token`. Secret-nya ada di `environment.prod.ts` → ter-bundle → **bisa dibaca siapa saja lewat DevTools**. Sama untuk `refreshToken()` [baris 52-56](src/app/core/services/auth-api.service.ts:52). Scope produksi (`General-B2C-5Ecd}3+uX3g=%Mxk ...`) juga bocor, membocorkan struktur otorisasi internal. | Password grant **sudah di-deprecate** oleh OAuth 2.1 justru karena kasus ini. Dua jalur perbaikan: **(a) direkomendasikan** — pindahkan token exchange ke BFF/reverse proxy yang memegang secret di server; **(b) minimum** — daftarkan client sebagai *public client* (tanpa secret) dan pakai Authorization Code + PKCE. Apa pun pilihannya, **rotasi kredensial `996cc633-...` sekarang** karena sudah ada di git history. |
| Semua endpoint API pakai HTTPS | ❌ **KRITIKAL** | `environment.prod.ts` berisi `posApiUrl: 'http://192.168.1.15:10100/'`. Fallback hardcoded yang sama juga ada di kode: [b2c-order-api.service.ts:13](src/app/core/services/b2c-order-api.service.ts:13). Endpoint lain (`apiBaseUrl`, `authUrl`, `apiUrl`, DOKU) sudah HTTPS ✅. | Browser memblokir request HTTP dari origin HTTPS → order B2C katalog gagal senyap di production. Sediakan endpoint HTTPS dan hapus fallback IP hardcoded dari kode. |
| Penyimpanan token | ❌ **KRITIKAL** | Access token, refresh token, user object, dan cart disimpan di **`localStorage`** (`SESSION_TOKEN_KEY`, `SESSION_REFRESH_KEY` di [session.util.ts](src/app/core/auth/session.util.ts); 55 pemakaian `localStorage` di 	`src`). `localStorage` dapat dibaca JavaScript mana pun di origin — satu XSS (atau satu dependency npm yang dikompromikan) = pencurian sesi permanen, karena **refresh token** ikut tersimpan. | Untuk aplikasi yang memproses pembayaran, target akhirnya: refresh token di **cookie `HttpOnly` + `Secure` + `SameSite=Lax`**, access token in-memory saja. Mitigasi transisi: minimal jangan simpan *refresh* token di `localStorage`, perpendek TTL access token, dan pasang CSP yang ketat. Perlu koordinasi backend. |
| HTTP interceptor auth | ✅ Aman | [auth.interceptor.ts](src/app/core/interceptors/auth.interceptor.ts) menangani: cek expiry proaktif via `isTokenExpired`, refresh otomatis, retry request dengan token baru, clear session + redirect saat refresh gagal, guard `SKIP_AUTH_HEADER` anti infinite-loop, redirect sadar-konteks (`/admin/login` vs `/auth/login`). Implementasi kelas produksi. | Satu celah: **tidak ada refresh-lock**. Bila 5 request 401 bersamaan, `refreshToken()` dipanggil 5×. Tambahkan shared in-flight promise/`shareReplay`. |
| HTTP interceptor error | ✅ Aman | [error.interceptor.ts](src/app/core/interceptors/error.interceptor.ts) memetakan status 0/400/403/404/5xx ke pesan Bahasa Indonesia, membaca envelope backend (`statusMessage`, `errors`), mendukung opt-out `SKIP_ERROR_HEADER`, dan urutan chain-nya (`error` terluar, sebelum `auth`) sudah benar & terdokumentasi di `app.config.ts`. | Pertahankan. Status 401/409/422 belum dipetakan eksplisit — 401 memang milik authInterceptor, tapi 409/422 jatuh diam-diam tanpa toast. |
| `innerHTML` | ⚠️ Perlu Perbaikan | 5 pemakaian di template. Semuanya lewat binding `[innerHTML]` sehingga **disanitasi otomatis oleh Angular DomSanitizer** ✅. Tidak ada satu pun `bypassSecurityTrust*` di seluruh codebase ✅ (temuan positif penting). Risiko tersisa: deskripsi produk dari WYSIWYG admin ([editor.component.ts](src/app/shared/ui/editor/editor.component.ts)) dirender ke halaman customer di [product-detail.component.html:184](src/app/features/product/product-detail/product-detail.component.html:184) dan [mardika-kopi-detail:145](src/app/features/mardika-kopi/mardika-kopi-detail/mardika-kopi-detail.component.html:145) — sanitizer akan menelan styling sah dan ini bergantung penuh pada sanitizer Angular yang **saat ini punya CVE bypass aktif** (lihat baris berikutnya). | Sanitasi juga di **backend** saat simpan (allowlist tag), jangan hanya andalkan sanitizer klien. |
| String HTML manual di service | ⚠️ Perlu Perbaikan | [shipping-label.service.ts:271](src/app/core/services/shipping-label.service.ts:271) merangkai string HTML lewat `.innerHTML = '<p ...>' + "${awbClean}" + '</p>'` untuk dokumen cetak — jalur ini **melewati DomSanitizer** karena dieksekusi sebagai string script di window cetak. | Ganti ke `textContent` untuk nilai AWB, atau validasi ketat `awbClean` dengan regex alfanumerik sebelum diinterpolasi. |
| `npm audit` (dijalankan nyata) | ❌ **KRITIKAL** | **26 kerentanan: 1 critical, 19 high, 3 moderate, 3 low.** Yang paling relevan untuk runtime produksi:<br>• `@angular/compiler` — **Two-Way Property Binding Sanitization Bypass (XSS)** + i18n XSS via event-handler attributes<br>• `@angular/core` — Hydration DOM Clobbering & Response-Cache Poisoning, i18n XSS<br>• `@angular/common` — DoS OOM di `formatDate`, weak 32-bit cache key di `HttpTransferCache`<br>• `tar` (**critical**) — path type confusion / DoS<br>• `postcss`, `vite`, `undici`, `piscina` (Prototype Pollution → RCE), `nanoid`, `ip-address` (SSRF)<br>Versi terpasang `21.2.16` masuk range rentan `<21.2.17`/`<=21.2.18`. | **Blocker rilis.** XSS bypass di `@angular/compiler` langsung memperbesar risiko dua temuan di atas (innerHTML + token di localStorage: XSS = akun dibajak). Jalankan `npm audit fix` lalu naikkan Angular ke `21.2.19+`. Verifikasi ulang dengan `npm audit` sampai high/critical nol. |
| Content Security Policy | ⚠️ Perlu Perbaikan | Tidak ada CSP sama sekali (tidak ada meta tag maupun konfigurasi header). `index.html` memuat script eksternal `https://accounts.google.com/gsi/client`, dan DOKU disuntik dinamis dari `jokul.doku.com`. | Pasang CSP di header server: `script-src 'self' https://accounts.google.com https://jokul.doku.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`. Ini mitigasi berlapis paling murah untuk risiko token-di-localStorage. |
| Google OAuth client ID hardcoded | ✅ Aman | `785241388758-...apps.googleusercontent.com` di [google-auth.service.ts:21](src/app/core/services/google-auth.service.ts:21). Client ID Google memang publik by design — **bukan** kebocoran. | Kerapian saja: pindahkan ke `environment.*` agar dev/prod bisa beda project. |

---

## 4. Error Handling & Monitoring

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Global `ErrorHandler` custom | ⚠️ Perlu Perbaikan | Ada dan terdaftar: `{ provide: ErrorHandler, useClass: GlobalErrorHandler }` + `provideBrowserGlobalErrorListeners()` ✅. **Tapi** [global-error-handler.ts](src/app/core/errors/global-error-handler.ts) isinya hanya `logger.error(...)` — user tidak melihat apa pun, dan integrasi Sentry masih berupa komentar `// Sentry.captureException(error)`. | Tambahkan notifikasi ke user (toast/dialog "terjadi kesalahan tak terduga") + kirim ke backend monitoring. |
| Integrasi monitoring | ❌ **KRITIKAL** | **Nol.** Tidak ada Sentry / LogRocket / Application Insights / Datadog. Tidak ada RUM, tidak ada error tracking, tidak ada alerting. | Untuk aplikasi transaksional, ini berarti bug production hanya diketahui saat pelanggan komplain — dan flow-nya melibatkan uang (DOKU). **Wajib pasang Sentry sebelum go-live** (`@sentry/angular`, hook di `GlobalErrorHandler` + `errorInterceptor`), lengkap dengan release tracking + hidden source map upload. |
| Halaman 404 | ❌ **KRITIKAL (bug)** | Tidak ada komponen/route 404. `app.routes.ts` menutup dengan `{ path: '**', redirectTo: '' }`. Lebih buruk: [admin-host.guard.ts:13](src/app/core/guards/admin-host.guard.ts:13) memanggil `router.navigate(['/404'])` — route `/404` **tidak ada**, sehingga jatuh ke wildcard dan pengunjung dilempar ke **homepage toko**. Komentar di guard tersebut menyatakan niatnya "tampilkan 404", jadi perilaku aktual ≠ perilaku yang dimaksud, dan panel admin jadi discoverable dari domain publik. | Buat `NotFoundComponent`, daftarkan route `{ path: '404', ... }`, dan ubah wildcard menjadi `{ path: '**', loadComponent: NotFoundComponent }` (bukan redirect — redirect merusak SEO dan menyembunyikan broken link). |
| Fallback UI: error & empty state | ⚠️ Perlu Perbaikan | Ada boot loader anti-FOUC ✅, `loadingInterceptor` + `LoadingService` ✅, toast error global via SweetAlert2 ✅. Yang belum ada: error state per-halaman ("gagal memuat produk — coba lagi") dengan tombol retry; kegagalan fetch hanya memunculkan toast lalu halaman tetap kosong. | Tambahkan pola `loading / error+retry / empty / data` pada halaman utama (product list, product detail, order history). |
| Offline state | ⚠️ Perlu Perbaikan | Tidak ada `navigator.onLine`, tidak ada listener `online`/`offline`, tidak ada service worker (`@angular/pwa` tidak terpasang, tidak ada `ngsw-config.json`). Penanganan offline hanya `error.status === 0` → toast "Periksa koneksi internet Anda" (bagus, tapi reaktif saja). | Tambahkan banner offline global berbasis event `window.online/offline`. Service worker opsional (lihat Nice-to-have). |
| Error handling di semua HTTP call | ✅ Aman | Dua lapis: `errorInterceptor` global menangkap semua, dan service-service kritikal (`auth-api`, `doku-checkout`) punya try/catch lokal yang mengembalikan `null`/`false` alih-alih melempar. `DokuCheckoutService.open()` bahkan mendokumentasikan kontraknya secara eksplisit (order sudah tercatat di backend, pemanggil wajib punya fallback) — sangat baik. | Pertahankan. |

---

## 5. SEO & Accessibility

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| `Meta` & `Title` service | ❌ **KRITIKAL** | **Nol pemakaian** `Title` maupun `Meta` dari `@angular/platform-browser` di seluruh codebase. Setiap halaman — homepage, semua halaman produk, keranjang, checkout — berbagi satu title statis dari `index.html`: *"SS Online Shop - Pusat Belanja & Kebutuhan Terlengkap"*. Tidak ada `description`, tidak ada Open Graph, tidak ada Twitter Card, tidak ada canonical, tidak ada JSON-LD `Product`. | Untuk toko online, ini berarti **setiap produk tidak bisa dibedakan mesin pencari dan tampil buruk saat di-share ke WhatsApp/Instagram**. Injeksikan `Title`+`Meta` di `ngOnInit` tiap halaman (minimal product-detail, katalog, home) plus JSON-LD Product schema. |
| Kebutuhan SSR / prerendering | ❌ **KRITIKAL** | `angular.json` → `"ssr": false`; README menegaskan "SPA murni dengan CSR". Untuk katalog produk publik yang mengandalkan trafik organik, crawler menerima HTML kosong berisi spinner. Google *bisa* merender JS, tapi dengan antrian dan tanpa jaminan; Bing/crawler social preview (WhatsApp, Facebook, Twitter) **tidak** merender JS sama sekali. | Aktifkan **prerender/SSG** untuk halaman publik (`/`, `/product`, `/mardika-kopi`) dan **SSR** untuk `/product/:id`. Angular 21 mendukung ini via `ng add @angular/ssr` dengan hybrid rendering per-route — area admin & checkout tetap CSR. Ini pekerjaan terbesar di daftar, rencanakan sprint tersendiri. |
| Alt text pada gambar | ✅ Aman | Verifikasi menyeluruh: **44 dari 44** `<img>` punya atribut alt (`alt=` atau binding `[alt]`), termasuk yang memakai `ngSrc`. Nilainya pun deskriptif (`[alt]="prod.title"`). | Pertahankan. |
| ARIA | ✅ Aman | 50 atribut `aria-*` di template. `angular-eslint` `templateAccessibility` config aktif di [eslint.config.js](eslint.config.js) — a11y ikut ter-lint di CI. | Pertahankan. |
| Keyboard navigation | ⚠️ Perlu Perbaikan | Lint menemukan **1 × `template/click-events-have-key-events`** dan **1 × `template/interactive-supports-focus`**. Ada 11 `(click)` pada `<div>`/`<span>`/`<li>`/`<i>` yang bukan elemen interaktif natural — tidak semuanya tertangkap lint tapi semuanya patut ditinjau. | Ganti ke `<button type="button">` bila memang aksi; kalau tidak bisa, tambahkan `tabindex="0"` + `(keydown.enter)` + `role`. |
| Label form | ⚠️ Perlu Perbaikan | **6 × `template/label-has-associated-control`** — label tidak terhubung ke input-nya. Berdampak pada screen reader **dan** pada usability biasa (klik label tidak memfokus field). | Hubungkan dengan `for`/`id` atau bungkus input di dalam `<label>`. |
| Kontras warna | ⚠️ Perlu Perbaikan | Tidak dapat diverifikasi statis. Terlihat pemakaian `text-slate-400`/`text-slate-500` di atas latar terang pada teks harga/metadata (mis. checkout, product-detail) — `slate-400` (#94a3b8) di atas putih hanya ~2.8:1, **di bawah ambang WCAG AA 4.5:1**. | Audit dengan Lighthouse/axe. Naikkan teks kecil informatif minimal ke `slate-600`. |
| `lang` attribute | ⚠️ Perlu Perbaikan | `<html lang="en">` sementara seluruh konten Bahasa Indonesia. | Ubah ke `lang="id"` — mempengaruhi screen reader dan pemahaman bahasa oleh mesin pencari. |

---

## 6. Testing & Quality Gate

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Hasil eksekusi test | ✅ Aman | `npm run test:ci` → **17 file, 46 test, semuanya lulus** (48.75 s). Vitest + jsdom, dengan plugin custom untuk inline `templateUrl`. | Pertahankan. |
| Coverage service | ❌ **KRITIKAL** | **30 service di `core/services` — nol punya file test.** Termasuk yang paling berisiko: `auth-api.service` (token exchange), `doku-checkout.service` (pembayaran), `b2c-order-api.service` (pembuatan order), `payment-api.service`, `shipping.service`, `waybill-normalizer`. Dari 21 store, hanya 3 yang punya test (`auth`, `author`, `cart`). | Prioritaskan test untuk jalur uang: `auth-api`, `payment-api`, `b2c-order-api`, `doku-checkout`, `order.store`, `payment.store`. |
| Coverage guard & interceptor | ⚠️ Perlu Perbaikan | Guard: 3 dari 4 ada test ✅ (`auth`, `admin`, `admin-host`) — **`katalog-checkout-abandon.guard` belum**. Interceptor: 1 dari 3 ✅ (`auth`) — **`error.interceptor` dan `loading.interceptor` belum**, padahal `error.interceptor` berisi logika pemetaan status yang bercabang banyak. | Lengkapi ketiganya; interceptor mudah dites dan bernilai tinggi. |
| Coverage pipe | ⚠️ Perlu Perbaikan | Hanya ada 1 pipe (`truncate.pipe.ts`) dan **tidak ada test**-nya. Pipe murni = test termurah yang bisa ditulis. | Tambahkan; effort ~10 menit. |
| Konfigurasi & threshold coverage | ❌ **KRITIKAL** | [vitest.config.ts](vitest.config.ts) tidak punya blok `coverage` sama sekali. Tidak ada reporter, tidak ada `thresholds`. Angka coverage tidak pernah diukur, apalagi ditegakkan. Estimasi kasar dari rasio file: **~8% file sumber tersentuh test** (17 spec / 222 file ts). | Tambahkan `coverage: { provider: 'v8', reporter: ['text','lcov'], thresholds: { lines: 40, functions: 40 } }` dan naikkan bertahap. Tanpa angka, "quality gate" hanyalah nama folder. |
| E2E test | ❌ **KRITIKAL** | **Tidak ada sama sekali.** Tidak ada Playwright/Cypress/WebdriverIO, tidak ada folder `e2e`. Flow paling kritikal — register → login → tambah ke keranjang → checkout → bayar DOKU → order success — tidak pernah diuji end-to-end, dan flow itu justru yang menyentuh uang pelanggan. | Pasang Playwright dan tulis minimal 3 skenario: (1) login customer, (2) cart → checkout → order berhasil, (3) admin login → CRUD item. Jalankan di CI. |
| Hasil lint | ❌ **KRITIKAL** | `ng lint` dijalankan langsung: **101 problem — 101 error, 0 warning.** Rincian: `no-explicit-any` 46, `no-output-native` 12, `no-input-rename` 9, `no-empty-function` 7, `prefer-control-flow` 6, `label-has-associated-control` 6, `no-unused-vars` 4, `no-useless-assignment` 3, `no-empty` 2, `no-empty-object-type` 2, `interactive-supports-focus` 1, `click-events-have-key-events` 1, `prefer-inject` 1, `directive-selector` 1. | **`.github/workflows/ci.yml` menjalankan `npm run lint` sebagai step wajib → pipeline `main` dijamin merah.** Quality gate secara efektif mati (tim pasti sudah terbiasa mengabaikannya). Bereskan dalam batch: 12 `no-output-native` + 9 `no-input-rename` + 4 `no-unused-vars` + 3 `no-useless-assignment` bisa diselesaikan cepat; 46 `any` dicicil sambil menaikkan type-safety. |
| `console.log` tertinggal | ✅ Aman | Hanya **7** pemanggilan `console.*`, dan **semuanya terpusat di [logger.service.ts](src/app/core/services/logger.service.ts)**. `log()` sudah di-gate `if (!environment.production)`. Nol `console.log` liar di komponen. Pola yang sangat baik. | Catatan kecil: `error()` dan `warn()` tetap mencetak di production. Itu wajar, tapi setelah Sentry masuk sebaiknya diarahkan ke sana juga. |
| CI pipeline | ⚠️ Perlu Perbaikan | [ci.yml](.github/workflows/ci.yml) sudah benar strukturnya: checkout → Node 22 + npm cache → `npm ci` → lint → test → build. **Tapi** hanya trigger di branch `main`, sementara pekerjaan berlangsung di `ssonlineshop`. Tidak ada upload artifact, tidak ada step `npm audit`. | Tambahkan `ssonlineshop` (atau pakai `branches: ['**']` untuk PR), tambah step `npm audit --audit-level=high`, dan upload `dist/` sebagai artifact. |

---

## 7. Konfigurasi Server / Deployment

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| SPA fallback ke `index.html` | ❌ **KRITIKAL** | **Tidak ada satu pun artefak konfigurasi server di repo** — dicari menyeluruh: tidak ada `nginx.conf`, `web.config`, `_redirects`, `netlify.toml`, `vercel.json`, `firebase.json`, `.htaccess`, `Dockerfile`. Aplikasi memakai `PathLocationStrategy` (default) dengan route dalam seperti `/product/123` dan `/order-history`. | Tanpa fallback, **refresh halaman atau share link produk = 404 dari web server**. Ini kegagalan paling umum dan paling memalukan saat go-live SPA. Commit konfigurasi server ke repo (contoh di bawah tabel) — infrastruktur harus jadi kode, bukan pengetahuan lisan satu orang. |
| Strategi caching & cache busting | ⚠️ Perlu Perbaikan | Cache busting JS/CSS aman lewat `outputHashing: "bundles"` (terverifikasi: `main-2X3AF3WL.js`, `styles-Z4AQZQBQ.css`). **Tapi** tidak ada konfigurasi cache header di mana pun, dan `media/`+`assets/` tidak ter-hash. | Wajib: `index.html` → `Cache-Control: no-cache` (kalau ini salah, user terjebak versi lama selamanya). Bundle ber-hash → `max-age=31536000, immutable`. `media/`+`assets/` → `max-age=86400, must-revalidate`. |
| Kompresi gzip/brotli | ❌ **KRITIKAL** | Tidak ada konfigurasi kompresi (konsekuensi langsung dari tidak adanya artefak server). Build melaporkan "estimated transfer size" 152 kB — angka itu **mengasumsikan brotli aktif**. Tanpa kompresi, user mengunduh **663.94 kB**, yaitu 4,4× lebih besar. | Aktifkan brotli + gzip untuk `text/*`, `application/javascript`, `application/json`, `image/svg+xml`. Ini perbaikan performa dengan rasio effort-to-impact tertinggi di seluruh laporan. |
| Security header | ⚠️ Perlu Perbaikan | Tidak ada `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, maupun CSP. | Tambahkan bersamaan dengan konfigurasi server; sekaligus menutup sebagian risiko token-di-`localStorage`. |
| Reproducibility deployment | ⚠️ Perlu Perbaikan | README hanya menyebut hasil build "siap disajikan server statis apa pun" tanpa konfigurasi konkret. Tidak ada Dockerfile, tidak ada workflow deploy. Deploy = proses manual tak terdokumentasi. | Commit `Dockerfile` + `nginx.conf`, atau file konfigurasi platform (`netlify.toml`/`vercel.json`) sesuai target hosting. |

**Contoh `nginx.conf` minimal yang menutup 4 temuan di atas sekaligus** (SPA fallback + cache + kompresi + security header):

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
| Memory leak dari subscription | ⚠️ Perlu Perbaikan | 33 `.subscribe()` di 21 file, dengan **48 pemakaian `takeUntilDestroyed`** — mayoritas sudah aman ✅. Dua pengecualian:<br>• [search-bar.component.ts:29-39](src/app/shared/ui/search-bar/search-bar.component.ts:29) — `debounceTime` stream **infinite**, tapi di-unsubscribe manual di `ngOnDestroy` ✅ aman (hanya lebih verbose).<br>• [katalog-cart.component.ts:160](src/app/features/katalog/katalog-cart/katalog-cart.component.ts:160) — `postB2COrder(...).subscribe({...})` **tanpa** `takeUntilDestroyed` dan tanpa unsubscribe. HTTP one-shot jadi tidak bocor permanen, tapi callback-nya memanggil `this.isProcessing.set(false)` dan `setLastOrderId()` setelah komponen mungkin sudah hancur. | Tambahkan `.pipe(takeUntilDestroyed(this.destroyRef))` di katalog-cart, dan modernkan search-bar agar seragam. Risiko rendah, tapi ini jalur pembuatan order — layak dirapikan. |
| `async` pipe | ⚠️ Perlu Perbaikan | **Nol** pemakaian `| async` di 97 template. Ini konsisten dengan arsitektur signal-first (bukan cacat), tapi berarti tidak ada safety net otomatis di sisi template. | Tidak perlu diubah; cukup pastikan setiap `.subscribe()` manual disiplin memakai `takeUntilDestroyed`. Pertimbangkan lint rule `rxjs-angular/prefer-takeuntil`. |
| Data sensitif hardcoded | ❌ **KRITIKAL** | Selain temuan Kategori 3, terkonfirmasi di kode (bukan hanya environment):<br>• **Fallback kredensial di kode**: `environment.clientSecret \|\| 'MalakaBooks-FE'` di [auth-api.service.ts:31](src/app/core/services/auth-api.service.ts:31) dan `:55`, plus fallback scope penuh di `:33`.<br>• **IP internal hardcoded**: `'http://192.168.1.15:10100/'` di [b2c-order-api.service.ts:13](src/app/core/services/b2c-order-api.service.ts:13).<br>• `originCode: '32.71.10.8'` (kode wilayah/toko internal) di environment. | Hapus semua fallback kredensial dari kode — biarkan gagal keras kalau environment tidak terisi, jangan diam-diam memakai kredensial dev. Hapus IP internal hardcoded. |
| Kebersihan repository | ⚠️ Perlu Perbaikan | `lint_results.txt` (42 KB, UTF-16, **sudah usang** — berisi 135 error vs 101 aktual) dan `AUDIT_PROMPTS.md` (0 byte) ter-commit di root. `customs.css` (0 byte) juga. `.gitignore` sudah benar untuk `/dist`, `node_modules`, `.angular/cache` ✅. | Hapus ketiganya dan tambahkan `lint_results.txt` ke `.gitignore`. Laporan lint yang usang di repo lebih berbahaya daripada tidak ada — orang akan mempercayainya. |

---

## 9. Versi & Dependency

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Versi Angular | ⚠️ Perlu Perbaikan | Angular **21.2.x** — versi aktif/terkini, masih dalam masa dukungan penuh ✅. **Namun** patch yang terpasang (`21.2.16`) berada di dalam range rentan beberapa advisory (`<21.2.17`, `<=21.2.18`). | Naikkan ke `21.2.19` atau lebih baru. Perubahan patch-level, risiko regresi minimal, menutup XSS + DoS sekaligus. |
| `package-lock.json` ter-commit | ✅ Aman | Terverifikasi via `git ls-files` — ter-track (406 KB). CI memakai `npm ci` ✅. `packageManager: "npm@11.14.1"` juga terkunci ✅. | Pertahankan. |
| Kompatibilitas Node.js | ⚠️ Perlu Perbaikan | Angular 21 mensyaratkan Node `^20.19 \|\| ^22.12 \|\| ^24.x`. Mesin developer: **v24.14.0** ✅. CI: **22.x** ✅. README menulis "v20+" (terlalu longgar — Node 20.0–20.18 akan gagal). **Tidak ada field `engines`** di `package.json`, dan tidak ada `.nvmrc`. | Tambahkan `"engines": { "node": "^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0", "npm": ">=10" }` dan `.nvmrc`. Dev di Node 24 sementara CI di Node 22 adalah drift yang cepat atau lambat menggigit. |
| Penempatan dependency | ⚠️ Perlu Perbaikan | `@types/leaflet` dan `@types/qrcode` berada di `dependencies`, seharusnya `devDependencies`. | Pindahkan; mengecilkan install tree production. |
| Kesehatan dependency tree | ❌ **KRITIKAL** | 26 kerentanan (1 critical `tar`, 19 high). Rincian di Kategori 3. `npm audit fix` diklaim tersedia untuk mayoritas. | Jalankan `npm audit fix`, lalu bump Angular, lalu `npm audit` ulang. Tambahkan `npm audit --audit-level=high` sebagai step CI agar tidak terulang. |
| Konfigurasi TypeScript | ✅ Aman | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, plus `strictTemplates` + `strictInjectionParameters` + `strictInputAccessModifiers`. Setelan paling ketat yang praktis. | Pertahankan. Ini membuat 46 error `no-explicit-any` makin patut ditutup — `any` melubangi jaring yang sudah susah payah dipasang. |

---

## Skor Kesiapan Production

### **4,5 / 10 — BELUM SIAP GO-LIVE (45%)**

| Kategori | Skor | Catatan |
|---|---|---|
| 1. Build & Konfigurasi | 4/10 | Setup builder solid, tapi kredensial bocor + koma nyasar merusak nilai |
| 2. Performa | **8,5/10** | **Terkuat.** Zoneless, OnPush 99/104, track 100%, bundle 152 kB. Ternoda bug preloading |
| 3. Keamanan | **1,5/10** | **Terlemah.** Secret di bundle, mixed content, token di localStorage, 19 CVE high |
| 4. Error Handling & Monitoring | 4/10 | Interceptor kelas produksi, tapi nol monitoring dan 404 rusak |
| 5. SEO & Accessibility | 3,5/10 | A11y dasar baik (alt 44/44, 50 aria), SEO praktis nol |
| 6. Testing & Quality Gate | 3/10 | 46 test lulus, tapi ~8% coverage, nol E2E, CI dijamin merah |
| 7. Server & Deployment | **1/10** | Nol artefak konfigurasi. Refresh halaman = 404 |
| 8. State & Data | 6,5/10 | Signal store konsisten, leak minimal; kredensial hardcoded menurunkan nilai |
| 9. Versi & Dependency | 5/10 | Versi modern, lock ter-commit; patch rentan + 26 CVE |

**Perhitungan:** dari 47 item yang diperiksa — **15 ❌ Kritikal**, **22 ⚠️ Perlu Perbaikan**, **10 ✅ Aman**.

**Penilaian jujur:** kualitas *engineering* frontend di proyek ini bagus — jelas dikerjakan orang yang paham Angular modern. Yang belum dikerjakan adalah *segala hal di antara kode dan pelanggan*: konfigurasi server, penanganan kredensial, monitoring, dan SEO. Itu bukan detail kecil; tiga di antaranya (SPA fallback, koma di kredensial, mixed content POS) akan menghasilkan kegagalan yang terlihat pelanggan **di hari pertama**, bukan minggu ketiga.

---

## Top 5 Prioritas — WAJIB Sebelum Go-Live

### 1. ❌ Perbaiki kredensial production & keluarkan `client_secret` dari browser
*Kategori 1 & 3 · Effort: S untuk hotfix, M untuk perbaikan benar*

Tiga hal, berurutan:
- **Hapus koma nyasar** di `clientId`/`clientSecret` pada `environment.prod.ts` (`...5051d,` → `...5051d`). Tanpa ini **tidak ada yang bisa login di production.** Perbaikan 30 detik yang mencegah kegagalan total.
- **Rotasi** kredensial `996cc633-...` — sudah masuk git history, anggap kompromi.
- Pindahkan token exchange ke BFF, atau daftarkan public client + PKCE. Hapus fallback `|| 'MalakaBooks-FE'` dari `auth-api.service.ts`.

### 2. ❌ Commit konfigurasi server: SPA fallback + kompresi + cache header
*Kategori 7 · Effort: S*

Repo tidak punya artefak deployment apa pun. Tanpa `try_files ... /index.html`, setiap refresh dan setiap link produk yang di-share menghasilkan 404 dari web server. Tanpa brotli/gzip, pengguna mengunduh 664 kB, bukan 152 kB. Satu file `nginx.conf` (template ada di Kategori 7) menutup empat temuan sekaligus — **rasio effort-to-impact tertinggi di seluruh laporan.**

### 3. ❌ Perbaiki `posApiUrl` mixed content
*Kategori 1 & 3 · Effort: S (frontend), M (butuh backend)*

`http://192.168.1.15:10100/` di `environment.prod.ts` dan sebagai fallback hardcoded di `b2c-order-api.service.ts:13`. Browser memblokir HTTP dari halaman HTTPS → **flow order katalog offline mati senyap di production**, dan `errorInterceptor` hanya akan menampilkan "Tidak dapat terhubung ke server". Butuh endpoint POS ber-HTTPS publik atau proxy lewat API utama.

### 4. ❌ Tutup 20 kerentanan high/critical dan hijaukan CI
*Kategori 3, 6, 9 · Effort: M*

`npm audit fix` + naikkan Angular ke `21.2.19+`. XSS sanitization bypass di `@angular/compiler` bukan risiko teoretis di sini: aplikasi ini merender HTML dari admin via `[innerHTML]` **dan** menyimpan access + refresh token di `localStorage` — XSS berhasil = pembajakan akun permanen. Sekaligus bereskan 101 lint error (CI `main` saat ini dijamin merah, artinya quality gate tidak berfungsi) dan tambahkan `npm audit --audit-level=high` sebagai step CI.

### 5. ❌ Pasang monitoring error + halaman 404 yang benar
*Kategori 4 · Effort: S–M*

Aplikasi ini memproses pembayaran DOKU tanpa error tracking apa pun — bug production baru diketahui saat pelanggan komplain. Pasang Sentry, hubungkan ke `GlobalErrorHandler` (slot komentarnya sudah ada) dan `errorInterceptor`. Bersamaan itu, buat `NotFoundComponent` dan daftarkan route `/404`: saat ini `admin-host.guard` menavigasi ke `/404` yang **tidak ada**, sehingga jatuh ke wildcard dan melempar pengunjung ke homepage — perilakunya bertentangan dengan komentar di guard itu sendiri.

> **Bonus 30 menit** — dua perbaikan sepele di luar Top 5 yang sebaiknya ikut dalam batch yang sama:
> - `selective-preloading-strategy.ts`: `timer(1000).pipe(() => load())` → `timer(1000).pipe(switchMap(() => load()))`. Delay yang dijanjikan komentar tidak pernah berjalan.
> - `index.html`: `<html lang="en">` → `lang="id"`.

---

## Nice-to-Have — Boleh Ditunda Setelah Rilis Pertama

| # | Item | Effort | Nilai |
|---|---|---|---|
| 1 | **SSR/prerender untuk halaman publik** (`ng add @angular/ssr`, hybrid rendering: SSG untuk `/` & `/product`, SSR untuk `/product/:id`, CSR untuk admin & checkout). Dampak SEO terbesar, tapi terlalu besar untuk diburu sebelum go-live | L | Tinggi |
| 2 | **`Meta` + `Title` service dinamis + Open Graph + JSON-LD Product.** Bisa dikerjakan tanpa SSR dan sudah memperbaiki tab title, bookmark, serta preview share (sebagian) — pertimbangkan menaikkan ini ke pre-launch jika trafik organik penting sejak hari pertama | M | Tinggi |
| 3 | **E2E Playwright** untuk 3 flow: login customer, cart→checkout→success, admin CRUD item | M | Tinggi |
| 4 | **Unit test service jalur uang**: `auth-api`, `payment-api`, `b2c-order-api`, `doku-checkout` + threshold coverage di `vitest.config.ts` | M | Tinggi |
| 5 | **Refresh-token lock** di `auth.interceptor` — mencegah N request 401 memicu N kali refresh | S | Sedang |
| 6 | **Content Security Policy** + `Strict-Transport-Security` + `X-Content-Type-Options` di header server | S | Sedang |
| 7 | **Migrasi `<img>` ke `NgOptimizedImage`** (38 dari 44 belum) + `width`/`height` untuk menekan CLS | M | Sedang |
| 8 | **Rapikan `preload: true`** — dari 17 route menjadi 4 route bernilai tinggi | S | Sedang |
| 9 | **Error state + retry per halaman** (pola loading/error/empty/data) menggantikan toast-lalu-halaman-kosong | M | Sedang |
| 10 | **Banner offline** berbasis event `window.online/offline` | S | Sedang |
| 11 | **Bereskan 46 `no-explicit-any`** — `tsconfig` sudah strict penuh, `any` melubanginya | M | Sedang |
| 12 | **Perbaikan a11y**: 6 label tanpa asosiasi, 2 pelanggaran keyboard-interaction, audit kontras warna dengan axe | S | Sedang |
| 13 | **Housekeeping**: hapus `lint_results.txt` (usang & menyesatkan), `AUDIT_PROMPTS.md`, `customs.css`; pindahkan `@types/*` ke `devDependencies`; tambah `engines` + `.nvmrc`; hapus `security.allowedHosts` yang tidak terpakai | S | Rendah |
| 14 | **Subset font boxicons** ke woff2 saja (eot/ttf/svg/woff mati di `dist`) | S | Rendah |
| 15 | **Service worker / PWA** (`ng add @angular/pwa`) untuk katalog offline-capable | M | Rendah |
| 16 | **Perketat budget** `angular.json` agar regresi ukuran ketahuan lebih awal | S | Rendah |

---

## Lampiran — Bukti Eksekusi

| Perintah | Hasil |
|---|---|
| `npm run test:ci` | 17 file, 46 test, **semua lulus** (48.75 s) |
| `npx ng lint` | **101 problem (101 error, 0 warning)** |
| `npm audit` | **26 kerentanan: 1 critical, 19 high, 3 moderate, 3 low** |
| `npx ng build --configuration production` | Sukses. Initial **663.94 kB raw / 152.30 kB transfer**; 100 lazy chunk; 1 warning (`qrcode` non-ESM) |
| `node -v` / `npm -v` | v24.14.0 / 11.14.1 |
| Statistik codebase | 222 file `.ts`, 97 template, 104 komponen (99 `OnPush`), 30 service, 21 store, 4 guard, 3 interceptor, 1 pipe, 17 file spec |

*Tidak ada file sumber yang diubah selama audit ini. Satu-satunya file yang dibuat adalah laporan ini. Perlu dicatat bahwa `src/app/core/strategies/selective-preloading-strategy.ts` sudah dalam keadaan modified di working tree sebelum audit dimulai — bug `pipe()` yang dilaporkan di Kategori 2 ada pada versi working tree tersebut.*
