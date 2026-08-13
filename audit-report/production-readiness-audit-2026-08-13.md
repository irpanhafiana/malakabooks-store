# Production-Readiness Audit — SS Online Shop (malakabooks-store)

| | |
|---|---|
| **Tanggal audit** | 13 Agustus 2026 |
| **Branch** | `ssonlineshop` @ `b5ae02f` |
| **Framework** | Angular 21.2.19 (Standalone, Signals, **Zoneless**) |
| **Auditor** | Senior Angular Dev / DevOps Tech Lead |
| **Metode** | Pembacaan konfigurasi + statis analisis kode + eksekusi nyata (`ng lint`, `ng test`, `vitest run`, `ng build --configuration production`, `npm audit`) |

> **Catatan metodologi:** semua temuan di bawah diverifikasi dengan menjalankan perintah nyata, bukan asumsi. Hasil build, lint, test, dan audit dependensi dilampirkan apa adanya.

---

## 1. Build & Konfigurasi

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Konfigurasi `production` di `angular.json` | ✅ Aman | `defaultConfiguration: "production"`, `optimization.scripts/styles/fonts` aktif, `inlineCritical: true`, `extractLicenses` default aktif, `serviceWorker` aktif. | Pertahankan. |
| Budgets | ✅ Aman | `initial` 750kB warn / 1.2MB error; hasil build nyata **663.98 kB raw / 154.60 kB transfer** — jauh di bawah ambang. `anyComponentStyle` 4kB/8kB. | Tambahkan budget tipe `bundle` untuk lazy chunk terbesar (`leaflet-src` 149 kB) agar regresi chunk tertangkap. |
| Source map di production | ✅ Aman | `sourceMap: { scripts: false, styles: false, hidden: true }`. Diverifikasi di `dist/`: **0 file `.map`**, tidak ada komentar `sourceMappingURL` di bundle. | Pertahankan. |
| `environment.prod.ts` vs `environment.ts` | ✅ Aman | `fileReplacements` terpasang benar. **Tidak ada secret** di kedua file — `clientId`/`clientSecret`/`scope` sengaja tidak ada karena negosiasi OIDC ditangani BFF di server. Ini pola yang benar. | Pertahankan. Jangan pernah menambahkan credential ke `environment*.ts` (file ini ikut ter-bundle ke browser). |
| Endpoint di `environment.prod.ts` | ✅ Aman | Seluruh URL production HTTPS ke `tokosuburjaya.com` + `jokul.doku.com` (bukan sandbox). | Pertahankan. |
| `outputHashing` | ⚠️ Perlu Perbaikan | Disetel `"bundles"`, bukan `"all"`. Akibatnya file di `dist/.../media/` (font woff2, boxicons) **tidak di-hash**. Digabung dengan aturan nginx `^/(media\|assets)/ → max-age=86400`, font lama bisa tersaji basi hingga 1 hari setelah deploy. | Ubah ke `"outputHashing": "all"` lalu naikkan cache `/media/` ke `max-age=31536000, immutable`. Ini menghilangkan risiko basi **dan** mempercepat repeat-visit. |
| IP internal ter-commit | ⚠️ Perlu Perbaikan | `proxy.conf.json` (5 entri → `http://192.168.1.15:9000`), `angular.json` `allowedHosts` (`192.168.1.15`, `192.168.1.138`), dan `environment.ts` (`http://192.168.1.15:10100/`) mengekspos topologi jaringan internal di repo. Tidak ikut ke bundle production, tapi bocor jika repo dibuka/diakses pihak luar. | Pindahkan ke `proxy.conf.local.json` yang di-`.gitignore`, atau baca dari env var. Prioritas rendah bila repo privat. |

---

## 2. Performa

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Lazy loading per route | ✅ Aman | **100% route memakai `loadComponent()`** — termasuk seluruh layout (admin, customer, inner-page, katalog, auth). Build menghasilkan 100+ lazy chunk dengan nama fitur yang jelas. Ini implementasi terbaik yang bisa diharapkan. | Pertahankan. |
| `trackBy` / `track` pada loop | ✅ Aman | **0 penggunaan `*ngFor`** — sudah 100% migrasi ke control flow baru. **94 blok `@for` dan seluruhnya punya `track`** (wajib secara sintaksis di Angular 17+). | Pertahankan. Pastikan `track` memakai ID unik, bukan `$index`, pada list yang bisa disisipi di tengah. |
| `ChangeDetectionStrategy.OnPush` | ✅ Aman | 99 dari 106 komponen memakai OnPush. **Konteksnya: aplikasi ini `provideZonelessChangeDetection()`** — CD digerakkan signal, sehingga 7 komponen sisanya bukan risiko performa nyata. | Opsional (konsistensi): tambahkan OnPush pada `login-redirect`, `items-detail`, `uom-groups-form-page`, `callback`, `desktop-footer`, `desktop-header`, `katalog-layout`. |
| Optimasi gambar | ⚠️ Perlu Perbaikan | `NgOptimizedImage`/`ngSrc` dipakai di 18 titik (katalog + product-card, sudah dengan `fill` + `priority`). Namun dari **43 tag `<img>`**, sisanya memakai `[src]` biasa dan **hanya 3 yang punya `loading="lazy"`**. Yang belum: `product-detail` (galeri + thumbnail), `mardika-kopi-detail`, `desktop-header` (dropdown search), `order-history`, `items-detail`. | Migrasikan `<img [src]>` sisanya ke `[ngSrc]` (dapat lazy-load, srcset, dan pencegahan CLS otomatis). Minimal, tambahkan `loading="lazy"` + `width`/`height` eksplisit. Galeri produk adalah gambar terbesar di halaman — dampaknya ke LCP paling terasa. |
| Preloading strategy | ✅ Aman | `SelectivePreloadingStrategy` custom: hanya route ber-`data: { preload: true }` (home, product list, product detail), di-*stagger* 1 detik agar tidak berebut bandwidth dengan first paint, dan chunk `admin` diblokir eksplisit. Desain yang matang. | Pertahankan. |
| Dependency tidak terpakai | ✅ Aman | Seluruh dependency diverifikasi terpakai: `leaflet` (map-picker), `qrcode` + `jsbarcode` (shipping label), `embla-carousel` (+autoplay), `sweetalert2` (alert service), `boxicons`, 4 keluarga `@fontsource`. `@angular/animations` hanya dipakai 1 komponen tapi sudah lazy via `provideAnimationsAsync()`. | Pertahankan. `leaflet` (149 kB) sudah lazy chunk — sudah benar. |
| Ukuran CSS awal | ⚠️ Perlu Perbaikan | `styles.css` = **202 kB raw / 24.55 kB transfer**. Penyebab: 4 keluarga font (Inter 5 weight, Plus Jakarta Sans 5, Poppins 5, Fraunces 2) + `boxicons.min.css` full (±1.500 kelas ikon) di-import global. | 24.5 kB gzip masih wajar, tapi: (a) evaluasi apakah 4 keluarga font benar-benar dipakai semua — tiap keluarga menambah request font; (b) `boxicons` full CSS diimpor padahal hanya sebagian ikon dipakai — pertimbangkan subset atau SVG sprite. |

---

## 3. Keamanan

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Penyimpanan token / auth | ✅ Aman | **Pola BFF (Backend-for-Frontend) diterapkan dengan benar.** SPA tidak pernah memegang access token; hanya cookie sesi httpOnly milik BFF + header antiforgery `X-CSRF`. Ada test regresi eksplisit (`session.util.spec.ts`: *"does not read from localStorage"*). Ini menghilangkan seluruh kelas serangan token-exfiltration via XSS. **Ini kekuatan terbesar proyek ini.** | Pertahankan. Pastikan cookie BFF di server bertanda `HttpOnly; Secure; SameSite=Lax/Strict`. |
| `bypassSecurityTrust*` | ✅ Aman | **0 penggunaan.** Tidak ada sanitizer yang di-bypass di seluruh kode. | Pertahankan. |
| `innerHTML` | ⚠️ Perlu Perbaikan | 4 binding `[innerHTML]`: `items-detail` (`data.description`), `product-detail` + `mardika-kopi-detail` (`product().description`), `katalog-confirm-dialog` (`messageHtml()`). Angular menyanitasi `[innerHTML]` secara default (script & handler dibuang), jadi **bukan XSS langsung**. Namun konten berasal dari `editor.component.ts` yang membaca `nativeElement.innerHTML` mentah dari `contenteditable` — HTML sewenang-wenang tersimpan di DB. | Sanitasi **di sisi server** saat menyimpan deskripsi (allowlist tag: `p, br, strong, em, ul, ol, li, a`). Sanitasi klien Angular adalah lapisan terakhir, bukan satu-satunya. |
| Endpoint API HTTPS | ✅ Aman | Seluruh URL di `environment.prod.ts` HTTPS. Satu-satunya `http://` di kode produksi adalah **URI skema claim XML** (`schemas.xmlsoap.org`) yang merupakan identifier, bukan endpoint. | Pertahankan. |
| Fallback endpoint hardcoded | ⚠️ Perlu Perbaikan | `b2c-order-api.service.ts:13` — `environment.posApiUrl \|\| 'http://192.168.1.15:10100/'`. Fallback plaintext ke IP internal ikut ter-bundle ke production. Saat ini tidak aktif (`posApiUrl` selalu terisi), tapi ini bom waktu jika konfigurasi berubah. | Hapus fallback. Jika `posApiUrl` kosong, gagalkan secara eksplisit (`throw`) daripada diam-diam menembak IP internal via HTTP. |
| HTTP interceptor | ✅ Aman | 3 interceptor terpasang dengan urutan yang dipikirkan matang: `errorInterceptor` (terluar) → `authInterceptor` → `loadingInterceptor`. `authInterceptor` menerapkan `withCredentials` **selektif** — hanya untuk request ber-rute BFF; endpoint pihak ketiga (DOKU, POS) sengaja tidak diberi cookie. Penanganan 401 terpusat dengan konfirmasi ke `/bff/user`. Ketiganya punya unit test. | Pertahankan. Kualitas di atas rata-rata. |
| Guard | ✅ Aman | 4 guard, semua ber-unit-test: `authGuard`, `adminGuard`, `adminHostGuard` (panel admin disembunyikan dari domain publik — redirect ke 404, bukan ke login, agar keberadaannya tidak terkonfirmasi), `katalogCheckoutAbandonGuard`. | Pertahankan. Ingat: guard adalah UX, **bukan** kontrol keamanan — otorisasi wajib ditegakkan ulang di API. |
| `npm audit` | ✅ Aman | Dijalankan nyata: **0 kerentanan** dari 781 dependency (prod 84 / dev 698). Ada `overrides` untuk `undici: ^7.29.0` — patch proaktif. CI sudah menjalankan `npm audit --audit-level=high`. | Pertahankan. Jadwalkan `npm audit` berkala (mis. Dependabot), karena hasil bersih hari ini tidak menjamin bulan depan. |
| Content-Security-Policy | ⚠️ Perlu Perbaikan | CSP ada di 2 tempat (meta `index.html` + header nginx) dan **isinya berbeda** — meta mengizinkan `sandbox.doku.com`, header nginx tidak. Keduanya memakai `script-src 'unsafe-inline'`, dan **tidak ada `default-src`, `style-src`, `img-src`, `connect-src`, maupun `frame-src`** — padahal `index.html` memuat `accounts.google.com/gsi/client` yang butuh frame. | (a) Jadikan header nginx sebagai satu-satunya sumber kebenaran, hapus/selaraskan meta tag. (b) Tambahkan `default-src 'self'` sebagai baseline, lalu `frame-src https://accounts.google.com`, `connect-src 'self' https://tokosuburjaya.com`. (c) `'unsafe-inline'` diperlukan oleh style inline Angular — batasi hanya untuk `style-src`, bukan `script-src`. |
| Terminasi TLS | ⚠️ Perlu Perbaikan | `nginx.conf` hanya `listen 80` tanpa blok TLS atau redirect HTTP→HTTPS, **padahal header HSTS `max-age=31536000` sudah dipasang**. HSTS pada koneksi plaintext tidak berefek. | Konfirmasi bahwa TLS diterminasi di reverse proxy/CDN di depan container ini. Jika ya, tambahkan komentar di `nginx.conf` agar tidak menyesatkan. Jika tidak, ini **kritikal** — tambahkan blok `listen 443 ssl` + redirect 301 dari :80. |

---

## 4. Error Handling & Monitoring

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Global `ErrorHandler` custom | ✅ Aman | `GlobalErrorHandler` terdaftar di `app.config.ts`. Melakukan logging, notifikasi user yang sopan, dan punya guard anti-rekursi (`try/catch` di sekitar alert). Dilengkapi `provideBrowserGlobalErrorListeners()`. | Pertahankan. |
| Integrasi monitoring (Sentry/LogRocket) | ❌ **Kritikal** | `GlobalErrorHandler.captureExceptionToSentry()` membaca `window.Sentry` — tetapi **Sentry tidak pernah dimuat**: tidak ada di `package.json`, tidak ada script di `index.html`, tidak ada DSN. Kondisi `if (win?.Sentry)` **selalu false di production**. Fungsi PII-scrubbing yang ditulis rapi itu tidak pernah dieksekusi. **Efektif: nol observability.** Jika terjadi error di production, tidak ada yang tahu kecuali user mengeluh. | **Wajib sebelum go-live.** Pasang `@sentry/angular` (atau setara), inisialisasi di `main.ts` dengan DSN dari environment, `tracesSampleRate` rendah, dan `environment: 'production'` + `release` dari hash commit. Kode scrubbing yang ada tinggal disambungkan. |
| Fallback UI — 404 | ✅ Aman | Route wildcard `**` → `NotFoundComponent` dengan desain lengkap (ilustrasi, pesan Bahasa Indonesia, tombol aksi). SPA fallback nginx juga benar. | Pertahankan. |
| Fallback UI — offline | ✅ Aman | `NetworkStatusService` (signal berbasis event `online`/`offline`, aman untuk non-browser) + `<app-offline-banner>` di-render global di `app.html`. Diperkuat service worker dengan `dataGroups` freshness. | Pertahankan. |
| Error handling pada HTTP call | ✅ Aman | Jaring pengaman berlapis: `errorInterceptor` menangani status 0/400/403/404/409/422/5xx dengan pesan Bahasa Indonesia dan membaca envelope backend (`statusMessage`, `errors`). Ada escape hatch `X-Skip-Error-Interceptor` untuk call yang mau menangani sendiri. Di level pemanggil ditemukan **121 blok `try/catch`**. Bukan happy-path-only. | Pertahankan. |
| Logging PII ke konsol | ❌ **Kritikal** | `auth.store.ts:77` dan `:79` — `console.log('[BFF Auth] Klaim mentah /bff/user:', claims)` dan `console.log('[BFF Auth] Data User terpetakan:', user)`. **Tidak dijaga `isDevMode()` maupun `environment.production`.** Ini mencetak klaim mentah (nama, email, nomor HP, role, `sub`) ke konsol browser **setiap kali sesi dimuat di production** — termasuk masuk ke session-replay/log pihak ketiga bila kelak dipasang. Ironisnya `LoggerService.log()` di repo yang sama sudah punya penjaga `!environment.production` yang benar, tapi tidak dipakai di sini. | **Wajib sebelum go-live.** Ganti kedua baris dengan `this.logger.log('BFF Auth', ...)` yang sudah dijaga environment, atau hapus. Ini pelanggaran privasi data pelanggan, bukan sekadar kebersihan kode. |

---

## 5. SEO & Accessibility

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| `Meta` & `Title` service dinamis | ⚠️ Perlu Perbaikan | Hanya **2 dari ~30 halaman**: `home.component` (title + description) dan `product-detail.component` (title + description + `og:title`). Tidak ada di `product-list`, `mardika-kopi`, `mardika-kopi-detail`, seluruh halaman katalog, order, profile. `index.html` sendiri **tidak punya `<meta name="description">`**. Tidak ada `og:image`, `og:url`, `og:type`, maupun `<link rel="canonical">` di mana pun. | Buat `SeoService` terpusat (title, description, canonical, OG, Twitter Card) lalu panggil dari setiap route utama. Tanpa `og:image`, tautan produk yang dibagikan di WhatsApp/Instagram — kanal utama e-commerce Indonesia — akan tampil tanpa gambar. Ini langsung memukul konversi. |
| `robots.txt` & `sitemap.xml` | ❌ **Kritikal** | **Keduanya tidak ada** di `public/`. Diverifikasi: isi `public/` hanya favicon, manifest, logo, dan beberapa gambar. Crawler tidak punya panduan sama sekali. | Tambahkan `public/robots.txt` (izinkan `/`, larang `/admin`, tunjuk sitemap) dan `sitemap.xml` (idealnya di-generate dari daftar produk saat build atau disajikan backend). Untuk toko online, ini biaya sangat rendah dengan dampak akuisisi organik yang besar. |
| Kebutuhan SSR / prerendering | ❌ **Kritikal** | `angular.json`: `"ssr": false, "prerender": false`. README menyatakan CSR murni adalah pilihan sadar. **Untuk aplikasi internal, pilihan ini benar. Untuk storefront e-commerce publik yang mengandalkan penemuan organik, ini keputusan yang mahal:** halaman produk kosong sampai JS bootstrap, LCP terlambat, dan crawler non-Google (Bing, crawler WhatsApp/Facebook untuk preview link) umumnya tidak mengeksekusi JS. Digabung dengan absennya `og:image`, tautan produk yang dibagikan tampil polos. | Aktifkan **prerender/SSG** untuk halaman publik statis (home, product list, product detail) sambil mempertahankan CSR untuk area admin & checkout. Angular 21 mendukung ini dengan perubahan minimal (`prerender: true` + route list). Jika toko ini hanya melayani trafik dari link langsung/aplikasi, temuan ini boleh diturunkan ke ⚠️ — **keputusan bisnis, bukan teknis**. |
| A11y — lint accessibility | ✅ Aman | `eslint.config.js` mengaktifkan `angular.configs.templateAccessibility` pada seluruh `**/*.html`, dan `ng lint` lolos dengan **0 error**. Ini gate otomatis yang nyata, bukan sekadar klaim. | Pertahankan. Naikkan aturan a11y tertentu dari warning ke error seiring waktu. |
| A11y — ARIA & alt text | ✅ Aman | 61 atribut `aria-*`/`role` di template. Seluruh `<img>` yang diperiksa memiliki `alt` (termasuk yang multi-baris: `items-detail` `alt="Cover"`, `katalog-product-detail` `[alt]="product()!.title"`). | Pertahankan. Pastikan gambar dekoratif memakai `alt=""` agar dilewati screen reader. |
| A11y — navigasi keyboard | ⚠️ Perlu Perbaikan | 28 penanganan `(keydown)`/`tabindex` — bagus. Namun ada **11 `<div>` dengan `(click)`**. Elemen `div` tidak fokusabel dan tidak merespons Enter/Space, sehingga aksi tersebut tidak terjangkau pengguna keyboard/screen reader. | Ganti dengan `<button type="button">` (paling ideal), atau minimal tambahkan `tabindex="0"`, `role="button"`, dan `(keydown.enter)`/`(keydown.space)`. |
| A11y — kontras warna | ⚠️ Perlu Perbaikan | Tidak dapat diverifikasi secara statis. Titik risiko dari palet yang terlihat: teks `text-slate-400`/`text-slate-500` di atas latar `slate-50`/putih berpotensi di bawah rasio 4.5:1 WCAG AA — pola ini muncul di deskripsi produk dan label form. | Jalankan Lighthouse/axe DevTools pada build production untuk halaman home, product detail, cart, dan checkout. Naikkan teks sekunder ke `slate-600` bila gagal. |

---

## 6. Testing & Quality Gate

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Hasil unit test | ✅ Aman | Dijalankan nyata (`ng test --watch=false`): **29 file / 100 test, seluruhnya lulus** dalam 10 detik. | Pertahankan. |
| Coverage service/guard/pipe kritikal | ⚠️ Perlu Perbaikan | Yang **sudah** tertutup baik: **guard 4/4**, **interceptor 3/3**, **pipe 1/1**, util auth (`jwt`, `session`, `bff-claims`, `return-url`), preloading strategy. Ini justru bagian paling kritikal dan sudah aman. Yang **belum**: service **4/32**, store **4/18**, komponen **8/106**. Store yang belum ditest termasuk `cart.store` variannya, `order.store`, `pricing.store`, `item.store`. | Prioritaskan test untuk store & service jalur transaksi: `pricing.store` (salah harga = kerugian langsung), `order.store`, `cart-api`, `shipping.service`. Komponen presentasional boleh terakhir. |
| Gate coverage | ❌ **Kritikal** | `vitest.config.ts` mendeklarasikan `thresholds: { lines: 30, functions: 30 }`, tetapi **`@vitest/coverage-v8` tidak terpasang** — `npx vitest run --coverage` gagal dengan `MISSING DEPENDENCY`. CI juga tidak pernah memanggil `--coverage`. **Gate coverage ini tidak pernah berjalan sekali pun.** Ini lebih berbahaya daripada tidak punya gate, karena memberi rasa aman palsu. | Tambahkan `@vitest/coverage-v8` ke devDependencies dan jalankan `--coverage` di CI. Ambang 30% juga terlalu rendah untuk aplikasi transaksional — naikkan bertahap ke 60%. |
| E2E test | ❌ **Kritikal** | 3 spec Playwright ada dan isinya masuk akal (`browse-and-cart`, `checkout-flow`, `admin-crud`), `playwright.config.ts` lengkap. **Tetapi `@playwright/test` tidak ada di `package.json`, tidak terpasang di `node_modules`, tidak ada npm script (`test:e2e`), dan tidak ada step di CI.** Diverifikasi: `npx vitest run` justru **gagal 3 file** karena mencoba mem-parse spec e2e ini. **Tidak ada satu pun flow utama yang pernah diuji end-to-end.** | Pasang `@playwright/test`, tambahkan script `"test:e2e": "playwright test"`, tambahkan `exclude: ['e2e/**']` di `vitest.config.ts`, dan jalankan e2e di CI (minimal pada PR ke `main`). Untuk e-commerce, flow checkout tanpa E2E adalah risiko pendapatan langsung. |
| Hasil lint | ✅ Aman | `ng lint` nyata: **0 error, 54 warning** — seluruhnya `@typescript-eslint/no-explicit-any`, terkonsentrasi di `waybill-normalizer` (8), `orders-list` (12), `items-form` (5). | Ketatkan bertahap. `waybill-normalizer` menangani respons kurir eksternal — beri tipe DTO eksplisit di sana lebih dulu, karena data tak bertipe dari pihak ketiga paling rawan bug runtime. |
| `console.log` tertinggal | ❌ **Kritikal** | 3 `console.log` di kode aplikasi. 1 aman (`LoggerService`, dijaga `!environment.production`). **2 tidak aman: `auth.store.ts:77` & `:79` mencetak klaim user mentah tanpa penjagaan environment** — lihat detail dan dampak privasinya di Kategori 4. `console.error` lain (`main.ts`, katalog) dapat diterima. | Lihat rekomendasi Kategori 4. Pertimbangkan aturan ESLint `no-console` dengan pengecualian untuk `LoggerService` agar regresi ini tidak terulang. |
| Pipeline CI | ✅ Aman | `.github/workflows/ci.yml` berjalan pada semua branch & PR: `npm ci` → `npm audit --audit-level=high` → lint → test → build → upload artifact. Node 22.x. | Tambahkan step E2E dan `--coverage` (lihat di atas). |

---

## 7. Konfigurasi Server / Deployment

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| SPA fallback ke `index.html` | ✅ Aman | `try_files $uri $uri/ /index.html;` — benar. Deep link seperti `/product/123` akan termuat setelah refresh. | Pertahankan. |
| Cache busting | ✅ Aman (dengan catatan) | JS/CSS ber-hash konten (`outputHashing: "bundles"`) dan disajikan `max-age=31536000, immutable`; `index.html` disajikan `no-cache`. Kombinasi ini benar. | **Catatan:** file di `/media/` tidak ber-hash — lihat temuan `outputHashing` di Kategori 1. |
| Kompresi gzip/brotli | ✅ Aman (dengan catatan) | Keduanya aktif dengan `*_types` yang tepat. Rasio kompresi terbukti dari build: 663.98 kB raw → 154.60 kB transfer (±77% pengurangan). | **Verifikasi saat deploy:** `brotli on;` hanya berfungsi bila binary nginx dikompilasi dengan `ngx_brotli`. Jika modul tidak ada, **nginx gagal start** (bukan gagal diam-diam). Pastikan image Docker memuat modul tersebut, atau bungkus dengan `load_module`. |
| Security header | ✅ Aman | HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP dengan `frame-ancestors 'none'` (proteksi clickjacking). | Tambahkan `Permissions-Policy` untuk menonaktifkan API yang tidak dipakai (`geolocation`, `camera`, `microphone`). |
| Service worker / PWA | ✅ Aman | `provideServiceWorker` aktif hanya di non-dev, `registrationStrategy: registerWhenStable:30000` (tidak mengganggu first paint). `ngsw-config.json` memisahkan `assetGroups` prefetch/lazy dan `dataGroups` freshness dengan timeout 5s untuk Items & Categories. | Pertahankan. Pertimbangkan menambahkan alur `SwUpdate` agar user diberi tahu saat versi baru tersedia — tanpa itu, user PWA bisa tertahan di versi lama. |
| Dokumentasi deployment | ✅ Aman | `DEPLOYMENT.md` lengkap: prasyarat, langkah build, konfigurasi nginx, dan checklist verifikasi pasca-deploy yang konkret. Di atas rata-rata. | Perbarui setelah E2E & Sentry dipasang. |

---

## 8. State Management & Data

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Kebocoran memori dari subscription | ✅ Aman | **Diperiksa satu per satu: seluruh 31 `.subscribe()` di kode aplikasi dilindungi `takeUntilDestroyed()`** (52 penggunaan). Termasuk kasus sulit yang biasanya luput: `router.events` di 3 layout, `valueChanges` di form checkout/address, dan `admin-select.component` yang secara sadar memakai `takeUntilDestroyed(this.destroyRef)` di dalam `effect()` — lengkap dengan komentar penjelas mengapa varian tanpa argumen tidak sah di sana. **Ini disiplin yang sangat baik dan langka.** | Pertahankan. Tambahkan aturan lint kustom bila ingin mengunci pola ini. |
| Arsitektur state | ✅ Aman | 18 signal store dengan `base-crud.store.ts` sebagai abstraksi bersama. Zoneless + signals — arsitektur modern dan konsisten. | Pertahankan. |
| Data sensitif ter-hardcode | ✅ Aman | Pencarian pola (`api_key`, `secret`, `password=`, `client_secret`, token literal) menemukan **0 credential**. Kecocokan yang ada hanyalah daftar `sensitiveKeys` di `GlobalErrorHandler` (justru kode pelindung) dan komentar yang menjelaskan bahwa secret sengaja tidak ada. | Pertahankan. |
| Data di `localStorage` | ⚠️ Perlu Perbaikan | Tidak ada token (✅), tetapi tersimpan: `externalProfileId`, `malakabooks_session_user`, isi keranjang (`mk_katalog_cart`, session cart), `mk_katalog_user_name`, `sj_default_branch`, `mk_pending_b2c_order`. Seluruhnya dapat dibaca & **dimodifikasi** JS mana pun di origin. Risiko utama: identitas dan preferensi cabang bisa dimanipulasi klien. | Perlakukan seluruh isi `localStorage` sebagai **input tidak tepercaya**: backend wajib memvalidasi ulang harga, stok, cabang, dan kepemilikan profil saat checkout — jangan pernah mempercayai nilai dari klien. Validasi bentuk data saat dibaca (sudah dilakukan sebagian di `cart.store`, perluas ke store lain). |
| Endpoint internal ter-hardcode | ⚠️ Perlu Perbaikan | `b2c-order-api.service.ts:13` — fallback `http://192.168.1.15:10100/`. Lihat detail di Kategori 3. | Hapus fallback, gagalkan secara eksplisit. |

---

## 9. Versi & Dependency

| Item Cek | Status | Temuan | Rekomendasi |
|---|---|---|---|
| Versi Angular | ✅ Aman | **Angular 21.2.19** — versi mayor terkini dan dalam masa dukungan aktif. Seluruh paket `@angular/*` selaras di `^21.2.19` (tidak ada versi campur). TypeScript `~5.9.2` kompatibel. | Pertahankan. Jadwalkan upgrade mayor rutin agar tidak menumpuk. |
| Lockfile ter-commit | ✅ Aman | `package-lock.json` (480 kB) ter-track di git. `packageManager: "npm@11.14.1"` dipin. CI memakai `npm ci` (bukan `npm install`) — build deterministik. | Pertahankan. |
| Kompatibilitas Node.js | ✅ Aman | Konsisten di seluruh rantai: `engines.node: "^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0"` (sesuai matriks resmi Angular 21), `.nvmrc: 22`, CI `node-version: 22.x`, mesin dev v24.14.0 — semuanya masuk rentang. `engines.npm: ">=10"`. | Pertahankan. Pertimbangkan `engine-strict=true` di `.npmrc` agar versi Node yang salah gagal cepat. |
| Kesehatan dependency | ✅ Aman | 0 kerentanan (`npm audit`). `overrides` untuk `undici` menunjukkan pemeliharaan aktif. Semua dependency terpakai. | Aktifkan Dependabot/Renovate untuk pembaruan otomatis. |

---

# Ringkasan Eksekutif

## 1. Skor Kesiapan Production

| Kategori | Aman | Perlu Perbaikan | Kritikal | Total |
|---|:---:|:---:|:---:|:---:|
| 1. Build & Konfigurasi | 5 | 2 | 0 | 7 |
| 2. Performa | 5 | 2 | 0 | 7 |
| 3. Keamanan | 6 | 4 | 0 | 10 |
| 4. Error Handling & Monitoring | 4 | 0 | 2 | 6 |
| 5. SEO & Accessibility | 2 | 3 | 2 | 7 |
| 6. Testing & Quality Gate | 3 | 2 | 3 | 8 |
| 7. Server / Deployment | 6 | 0 | 0 | 6 |
| 8. State Management & Data | 3 | 2 | 0 | 5 |
| 9. Versi & Dependency | 4 | 0 | 0 | 4 |
| **TOTAL** | **38** | **15** | **7** | **60** |

**Perhitungan:** (38 × 1.0) + (15 × 0.5) + (7 × 0.0) = **45.5 / 60**

## 🎯 **Skor: 76% — 7.6 / 10**

**Status: BELUM SIAP GO-LIVE** — tertahan oleh 7 temuan kritikal, bukan oleh kualitas kode.

### Interpretasi

Ini bukan proyek yang lemah. **Fondasi rekayasanya kuat dan di beberapa area di atas rata-rata industri:**

- Pola **BFF** dengan cookie httpOnly — token tidak pernah menyentuh browser, lengkap dengan test regresi. Ini menghapus seluruh kelas serangan yang menjadi kelemahan mayoritas SPA.
- **Manajemen subscription 100% bersih** (31/31) — kebocoran memori adalah penyakit kronis aplikasi Angular besar, dan di sini tidak ada satu pun.
- **Lazy loading 100%**, preloading strategy custom yang dipikirkan matang, bundle awal 154 kB transfer.
- Zoneless + Signals + control flow baru — sudah selaras dengan Angular modern, bukan warisan lama.
- 0 kerentanan dependency, lint 0 error, 100 unit test lulus, CI berjalan.

**Masalahnya bukan pada kode, melainkan pada lapisan "sudah ditulis tapi tidak pernah aktif".** Tiga temuan kritikal punya pola identik: infrastrukturnya sudah dibangun rapi, tetapi kabelnya tidak pernah disambungkan.

- Kode PII-scrubbing Sentry ditulis dengan baik → tetapi Sentry tidak pernah dimuat.
- Ambang coverage dideklarasikan → tetapi paket coverage tidak terpasang.
- Tiga spec E2E ditulis lengkap → tetapi Playwright tidak terpasang dan tidak pernah dijalankan.

Ini adalah **rasa aman palsu**, dan justru lebih berbahaya daripada tidak memilikinya sama sekali — karena checklist terlihat sudah tercentang. Kabar baiknya: semuanya berbiaya rendah untuk diperbaiki. Estimasi realistis untuk 5 prioritas di bawah adalah **2–4 hari kerja**, bukan berminggu-minggu.

---

## 2. Top 5 Prioritas — WAJIB Diperbaiki Sebelum Go-Live

### 🔴 1. Hapus logging PII di `auth.store.ts` — *± 5 menit*
`auth.store.ts:77` dan `:79` mencetak klaim user mentah (nama, email, nomor HP, role, `sub`) ke konsol browser **setiap pemuatan sesi di production**, tanpa penjagaan environment. Ini masalah privasi data pelanggan, bukan kebersihan kode — dan akan ikut terekam bila kelak dipasang session-replay atau log agregator. `LoggerService.log()` yang sudah dijaga `!environment.production` tersedia di repo yang sama; cukup gunakan itu.
**Effort: sangat rendah. Dampak: sangat tinggi. Kerjakan pertama.**

### 🔴 2. Aktifkan monitoring error yang sesungguhnya (Sentry) — *± 3 jam*
Saat ini observability production **nol**. `captureExceptionToSentry()` selalu no-op karena `window.Sentry` tidak pernah ada. Jika checkout gagal di production, tidak ada yang tahu sampai pelanggan mengeluh. Pasang `@sentry/angular`, inisialisasi di `main.ts` dengan DSN dari environment + `release` dari hash commit. Kode scrubbing yang sudah ada tinggal tersambung otomatis.
**Untuk aplikasi yang memproses pembayaran, terbang tanpa instrumen bukan pilihan.**

### 🔴 3. Aktifkan E2E test untuk flow checkout — *± 4 jam*
Tiga spec Playwright sudah ditulis dan masuk akal, tetapi `@playwright/test` tidak terpasang, tidak ada npm script, dan tidak ada di CI — **flow checkout belum pernah diuji end-to-end sekali pun**. Pasang paketnya, tambahkan `"test:e2e": "playwright test"`, tambahkan `exclude: ['e2e/**']` di `vitest.config.ts` (saat ini vitest justru gagal karenanya), dan jalankan di CI.
**Checkout adalah jalur pendapatan. Bug di sini berbiaya langsung.**

### 🔴 4. Perbaiki gate coverage yang tidak pernah berjalan — *± 1 jam*
`@vitest/coverage-v8` tidak terpasang sehingga ambang 30% tidak pernah dievaluasi. Pasang paketnya, jalankan `--coverage` di CI. Lalu tambahkan test untuk store transaksional yang belum tertutup — terutama **`pricing.store`** (kesalahan harga = kerugian finansial langsung), `order.store`, dan `cart-api.service`.

### 🔴 5. Perbaiki fondasi SEO — *± 4 jam*
Untuk storefront publik, tiga hal ini bukan opsional: (a) tambahkan `robots.txt` + `sitemap.xml` di `public/` — saat ini keduanya tidak ada; (b) buat `SeoService` terpusat dan pasang di semua route publik — saat ini hanya 2 dari ~30 halaman punya meta tag; (c) tambahkan **`og:image`** — tanpa ini, tautan produk yang dibagikan di WhatsApp dan Instagram tampil polos tanpa gambar, dan itu memukul konversi secara langsung di kanal penjualan utama pasar Indonesia.

> **Keputusan bisnis yang perlu diambil bersamaan:** aktifkan **prerender/SSG** untuk halaman publik (home, product list, product detail)? Jika akuisisi organik dari mesin pencari termasuk target bisnis, ini **wajib** dan sebaiknya masuk daftar prioritas ini. Jika trafik datang murni dari tautan langsung dan aplikasi, CSR murni dapat diterima dan temuan ini turun ke prioritas berikutnya. Angular 21 mendukung prerender parsial dengan perubahan minimal — area admin & checkout tetap CSR.

---

## 3. Nice-to-Have — Dapat Ditunda Setelah Rilis Pertama

**Prioritas menengah (sprint berikutnya):**

1. **Pengetatan CSP** — tambahkan `default-src 'self'`, `frame-src`, `connect-src`; selaraskan CSP meta `index.html` dengan header nginx (saat ini berbeda isi); pindahkan `'unsafe-inline'` dari `script-src` ke `style-src` saja.
2. **`outputHashing: "all"`** + naikkan cache `/media/` ke `immutable` — menghilangkan risiko font basi sekaligus mempercepat kunjungan berulang.
3. **Hapus fallback `http://192.168.1.15:10100/`** di `b2c-order-api.service.ts:13` — ganti dengan kegagalan eksplisit.
4. **Aksesibilitas keyboard** — ganti 11 `<div (click)>` menjadi `<button>`, atau tambahkan `tabindex` + `role` + handler keyboard.
5. **Audit kontras warna** — jalankan Lighthouse/axe pada home, product detail, cart, checkout; naikkan `text-slate-400/500` bila gagal WCAG AA.
6. **Sanitasi HTML di sisi server** untuk deskripsi produk dari rich-text editor (allowlist tag) — saat ini hanya mengandalkan sanitizer klien Angular.
7. **Alur `SwUpdate`** — beri tahu user PWA saat versi baru tersedia agar tidak tertahan di versi lama.

**Prioritas rendah (backlog):**

8. Migrasikan sisa `<img [src]>` ke `NgOptimizedImage` (terutama galeri product detail — dampak LCP terbesar).
9. Bereskan 54 warning `no-explicit-any`, mulai dari `waybill-normalizer.ts` (respons kurir eksternal paling rawan).
10. Tambahkan `OnPush` pada 7 komponen sisanya (dampak kecil karena aplikasi sudah zoneless — murni konsistensi).
11. Evaluasi 4 keluarga font dan subset `boxicons` — potensi penghematan payload font & CSS.
12. Pindahkan `proxy.conf.json` dan IP LAN di `allowedHosts` keluar dari version control.
13. Tambahkan header `Permissions-Policy` di nginx.
14. Tambahkan budget tipe `bundle` untuk memantau lazy chunk terbesar (`leaflet-src`).
15. Aktifkan Dependabot/Renovate untuk pembaruan dependency otomatis.
16. Naikkan ambang coverage bertahap dari 30% → 60%.

---

## Lampiran — Bukti Eksekusi

| Perintah | Hasil |
|---|---|
| `npm audit` | 0 kerentanan / 781 dependency (prod 84, dev 698, opt 147) |
| `npx ng lint` | **0 error**, 54 warning (seluruhnya `no-explicit-any`) |
| `npx ng test --watch=false` | **29 file / 100 test — seluruhnya lulus** (10.11 s) |
| `npx vitest run` | 29 lulus / **3 gagal** — `e2e/*.spec.ts` gagal resolve `@playwright/test` |
| `npx vitest run --coverage` | **Gagal** — `MISSING DEPENDENCY: @vitest/coverage-v8` |
| `npx ng build --configuration production` | **Sukses** (41.9 s) — initial **663.98 kB raw / 154.60 kB transfer**, 100+ lazy chunk, 0 file `.map` di `dist/` |
| `node -v` | v24.14.0 (dalam rentang `engines`) |
| `ls node_modules/@playwright` | Tidak ada — Playwright tidak terpasang |

