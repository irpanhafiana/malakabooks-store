# Task Breakdown — Frontend Angular Scope
### Malakabooks Store (SS Online Shop)

| | |
|---|---|
| **Sumber** | [frontend-readiness-audit.md](frontend-readiness-audit.md) |
| **Tanggal** | 11 Agustus 2026 |
| **Branch** | `ssonlineshop` |
| **Total task** | **38 task** (11 Nice-to-Have · 17 Sedang · 5 Tinggi · 5 Kritikal) |
| **Dikeluarkan** | 8 task auth/backend → [production-readiness-tasks.md](production-readiness-tasks.md) |
| **Skor lingkup FE** | 5,5 / 10 |

---

## Lingkup & Penomoran

**ID task di dokumen ini identik dengan versi penuh** (`CRIT-03` di sini = `CRIT-03` di [production-readiness-tasks.md](production-readiness-tasks.md)). Nomor sengaja tidak dirapatkan meski ada yang hilang, supaya kedua dokumen bisa dibandingkan langsung dan tidak ada kebingungan saat tim backend merujuk ID yang sama.

Karena itu Anda akan melihat lompatan: `CRIT-01`, `CRIT-02`, `CRIT-04`, `CRIT-09`, `HIGH-02`, `MED-05`, `MED-11`, `MED-12` **tidak ada di sini** — kedelapannya menunggu diskusi backend.

**Semua 38 task di dokumen ini bisa dikerjakan tim frontend tanpa menunggu siapa pun**, dengan satu pengecualian yang ditandai 🛠️ (butuh akses deploy/server, bukan tim backend).

### Cara Membaca

Disusun **menaik**: dari task paling ringan (Nice-to-Have) sampai paling kritikal.

> ⚠️ **Urutan baca ≠ urutan kerja.** Untuk pengerjaan, mulai dari bawah — **Tier 1 (Kritikal)** dulu. Lihat [frontend-readiness-sprints.md](frontend-readiness-sprints.md) untuk urutan sprint.

**Legenda:** `S` = < 1 jam · `M` = 1 hari · `L` = > 3 hari · 🛠️ = butuh akses deploy

---

# TIER 4 — NICE TO HAVE
### *11 task · Tidak ada yang memblokir rilis*

---

### `NTH-01` · Housekeeping repository
**Effort:** S · **Kategori:** 8

Tiga file sampah ter-commit di root. Yang paling berbahaya `lint_results.txt` — 42 KB, UTF-16, tertanggal 10 Agustus, berisi **135 error** padahal angka aktual **101**. Laporan lint basi lebih berbahaya daripada tidak ada, karena orang akan mempercayainya.

- [ ] Hapus `lint_results.txt`, `AUDIT_PROMPTS.md` (0 byte), `customs.css` (0 byte)
- [ ] Tambahkan `lint_results.txt` ke `.gitignore`

**AC:** `git status` bersih; `.gitignore` mencegah file laporan lint ter-commit lagi.

---

### `NTH-02` · Pindahkan `@types/*` ke `devDependencies`
**Effort:** S · **Kategori:** 2, 9

`@types/leaflet` dan `@types/qrcode` salah tempat di `dependencies` — type definition tidak pernah dibutuhkan saat runtime.

- [ ] Pindahkan keduanya di [package.json](../package.json)
- [ ] `npm install` untuk memperbarui lockfile

**AC:** `npm ci --omit=dev` sukses dan build production tetap jalan.

---

### `NTH-03` · Tambah `engines` + `.nvmrc`
**Effort:** S · **Kategori:** 9

Mesin dev **v24.14.0**, CI **22.x**, README menulis "v20+" (terlalu longgar — Node 20.0–20.18 akan gagal di Angular 21).

- [ ] Tambahkan di `package.json`:
  ```json
  "engines": { "node": "^20.19.0 || ^22.12.0 || ^24.0.0", "npm": ">=10" }
  ```
- [ ] Buat `.nvmrc`
- [ ] Perbaiki prasyarat Node di [README.md](../README.md)

**AC:** `npm install` di Node 20.18 gagal dengan pesan engine yang jelas.

---

### `NTH-04` · Hapus `security.allowedHosts` kosong
**Effort:** S · **Kategori:** 1

Array kosong di blok `build`, sementara nilai efektifnya sudah ada di `serve.options`.

- [ ] Hapus `"security": { "allowedHosts": [] }` dari [angular.json](../angular.json)

**AC:** Build production tetap sukses.

---

### `NTH-05` · Tambah `qrcode` ke `allowedCommonJsDependencies`
**Effort:** S · **Kategori:** 1

Build production memunculkan warning `Module 'qrcode' ... is not ESM` → optimization bailout.

- [ ] Tambahkan `"qrcode"` ke array di `angular.json`
- [ ] (Opsional) Evaluasi library QR ESM-native

**AC:** Output build production bersih tanpa warning CommonJS.

---

### `NTH-06` · Eksplisitkan `sourceMap` di konfigurasi production
**Effort:** S · **Kategori:** 1 · **Dependensi:** `CRIT-07`

Saat ini aman karena default `@angular/build` adalah `false` (terverifikasi: nol `.js.map` di `dist`), tapi mengandalkan default itu rapuh.

- [ ] Tambahkan `"sourceMap": { "scripts": false, "styles": false, "hidden": false }`
- [ ] Bila `CRIT-07` sudah jalan, ubah ke `"hidden": true` dan upload map ke Sentry saja

**AC:** Nol `.js.map` di `dist/malakabooks/browser`; stack trace Sentry ter-*unminify*.

---

### `NTH-07` · Perketat budget `angular.json`
**Effort:** S · **Kategori:** 1, 2

Initial aktual **663,94 kB raw** vs limit warning **1 MB** — terlalu longgar untuk mendeteksi regresi. Tidak ada budget lazy chunk sama sekali.

- [ ] `initial` → `maximumWarning: "700kB"`, `maximumError: "900kB"`
- [ ] Tambah `{ "type": "any", "maximumWarning": "150kB" }`

**AC:** Build lolos dengan budget baru; menambah dependency besar memicu warning.

> Kerjakan **setelah** optimasi performa lain selesai, supaya baseline-nya realistis.

---

### `NTH-08` · Pindahkan Google Client ID ke `environment`
**Effort:** S · **Kategori:** 3

Client ID Google memang publik by design — **bukan kebocoran keamanan**, murni kerapian agar dev dan prod bisa memakai project Google berbeda. Tidak mengubah perilaku autentikasi sama sekali.

- [ ] Pindahkan `785241388758-...apps.googleusercontent.com` dari [google-auth.service.ts:21](../src/app/core/services/google-auth.service.ts) ke `environment.*`

**AC:** Tidak ada Client ID hardcoded di `src/app`; login Google tetap berfungsi.

---

### `NTH-09` · Subset font boxicons ke woff2
**Effort:** S · **Kategori:** 2

`boxicons` 2.1.4 mengirim 5 format (eot/svg/ttf/woff/woff2) ke `dist`. Empat di antaranya mati — tidak ada browser target yang membutuhkannya.

- [ ] Batasi asset boxicons hanya `.woff2` (~200 kB terhemat)

**AC:** `dist/.../media` hanya berisi `boxicons.woff2`; ikon tetap tampil normal.

---

### `NTH-10` · Konsistensi `OnPush` di 5 komponen sisa
**Effort:** S · **Kategori:** 2

99 dari 104 komponen sudah `OnPush`. Sisanya murni konsistensi — dengan zoneless aktif, dampak performanya minim.

- [ ] Identifikasi 5 komponen tanpa `ChangeDetectionStrategy.OnPush` dan tambahkan

**AC:** 104/104 memakai `OnPush`; semua test tetap lulus.

---

### `NTH-11` · Service Worker / PWA
**Effort:** M · **Kategori:** 4 · **Dependensi:** `CRIT-03` 🛠️

- [ ] `ng add @angular/pwa`
- [ ] Konfigurasi `ngsw-config.json`: cache-first untuk asset, network-first untuk API
- [ ] Pastikan tidak meng-cache endpoint auth dan checkout

**AC:** Lighthouse PWA check lulus; halaman katalog terbuka dalam mode airplane.

---

# TIER 3 — SEDANG
### *17 task · Should-have*

---

### `MED-01` · `<html lang="en">` → `lang="id"`
**Effort:** S (30 detik) · **Kategori:** 5

Seluruh konten Bahasa Indonesia tapi dokumen dideklarasikan Inggris. Berdampak pada screen reader (pelafalan salah) dan pemahaman bahasa oleh mesin pencari.

- [ ] Ubah satu baris di [src/index.html](../src/index.html)

**AC:** `<html lang="id">`. **Kerjakan bareng batch kritikal.**

---

### `MED-02` · Rapikan cakupan `preload: true` (17 route → 4)
**Effort:** S · **Kategori:** 2 · **Dependensi:** `HIGH-01`

Praktis **seluruh** aplikasi customer ditandai preload. Strategi "selective" jadi setara `PreloadAllModules`.

- [ ] Sisakan `preload: true` di `''`, `product`, `product/:id`, `cart` pada [app.routes.ts](../src/app/app.routes.ts)

**AC:** Network tab menunjukkan ≤ 4 chunk terpreload, bukan 17.

> Kerjakan **setelah** `HIGH-01` — selama bug `pipe()` belum diperbaiki, efek perubahan ini tidak akan terlihat benar.

---

### `MED-03` · Migrasi `*ngFor` legacy terakhir
**Effort:** S · **Kategori:** 2

Satu-satunya sisa `*ngFor`, dan **tanpa `trackBy`** — sekaligus menarik `CommonModule` ke bundle.

- [ ] [detail-shipment.component.html:99](../src/app/features/order/detail-shipment/detail-shipment.component.html) → `@for (log of trackingLogs; track log.id; let i = $index, first = $first, last = $last)`
- [ ] Hapus impor `CommonModule` bila sudah tidak dipakai

**AC:** Nol `*ngFor` di codebase; pelanggaran `prefer-control-flow` berkurang.

---

### `MED-04` · Tutup subscription tanpa `takeUntilDestroyed`
**Effort:** S · **Kategori:** 8

Dari 33 `.subscribe()`, 48 sudah memakai `takeUntilDestroyed` ✅. Dua pengecualian:

- [ ] [katalog-cart.component.ts:160](../src/app/features/katalog/katalog-cart/katalog-cart.component.ts) — `postB2COrder().subscribe()` tanpa proteksi. HTTP one-shot jadi tidak bocor permanen, tapi callback memanggil `isProcessing.set(false)` dan `setLastOrderId()` setelah komponen bisa saja sudah hancur. **Ini jalur pembuatan order.**
- [ ] [search-bar.component.ts:29](../src/app/shared/ui/search-bar/search-bar.component.ts) — sudah aman lewat `ngOnDestroy` manual ✅; modernkan saja agar seragam

**AC:** Semua `.subscribe()` non-spec memakai `takeUntilDestroyed`; `ngOnDestroy` manual di search-bar bisa dihapus.

---

### `MED-06` · Sanitasi AWB di `shipping-label.service`
**Effort:** S · **Kategori:** 3

[shipping-label.service.ts:271](../src/app/core/services/shipping-label.service.ts) merangkai string HTML manual (`.innerHTML = '<p>' + awbClean + '</p>'`) untuk dokumen cetak. Jalur ini **melewati DomSanitizer** karena dieksekusi sebagai string di window cetak.

- [ ] Ganti ke `textContent`, atau validasi `awbClean` dengan regex alfanumerik ketat

**AC:** Nilai AWB berisi `<script>` ter-render sebagai teks literal, bukan tereksekusi.

---

### `MED-07` · Banner offline global
**Effort:** S · **Kategori:** 4

Offline hanya ditangani reaktif (`error.status === 0` → toast). Tidak ada indikator proaktif.

- [ ] Service/komponen berbasis event `window.online` / `offline`
- [ ] Banner persisten selama offline

**AC:** Mematikan network di DevTools memunculkan banner; menyalakan kembali menghilangkannya.

---

### `MED-08` · Perbaikan aksesibilitas
**Effort:** S · **Kategori:** 5

Fondasi a11y sudah baik — alt text **44/44** ✅, 50 atribut `aria-*` ✅, lint `templateAccessibility` aktif ✅. Sisa pelanggaran:

- [ ] **6 × `label-has-associated-control`** — hubungkan `for`/`id` atau bungkus input di dalam `<label>`. Bukan hanya screen reader: sekarang klik label tidak memfokus field.
- [ ] **1 × `click-events-have-key-events`** + **1 × `interactive-supports-focus`** — ganti ke `<button type="button">`, atau `tabindex="0"` + `(keydown.enter)` + `role`
- [ ] Tinjau 11 `(click)` pada `<div>`/`<span>`/`<li>`/`<i>` yang tidak tertangkap lint
- [ ] Audit kontras dengan axe/Lighthouse — `text-slate-400` (#94a3b8) di atas putih hanya **~2,8:1**, di bawah ambang WCAG AA 4,5:1

**AC:** Nol pelanggaran a11y di `ng lint`; nol isu kontras "serious" di axe.

---

### `MED-09` · Migrasi `<img>` ke `NgOptimizedImage`
**Effort:** M · **Kategori:** 2

Hanya **6 dari 44** `<img>` memakai `NgOptimizedImage`. 38 sisanya polos: nol `loading="lazy"`, nol dimensi eksplisit → CLS dan gambar full-size di list panjang.

- [ ] Prioritaskan: cart, checkout, order-history, mardika-kopi, product-detail
- [ ] `ngSrc` + `width`/`height` (atau `fill`); tandai hero dengan `priority`
- [ ] Minimal bila migrasi penuh terlalu besar: `loading="lazy"` + dimensi eksplisit

**AC:** CLS < 0,1 di Lighthouse mobile untuk product-detail dan order-history.

---

### `MED-10` · Error state + retry per halaman
**Effort:** M · **Kategori:** 4

Saat fetch gagal, user hanya melihat toast lalu **halaman kosong** tanpa jalan keluar.

- [ ] Pola `loading / error+retry / empty / data` di product list, product detail, order history, cart
- [ ] Tombol "Coba lagi" yang memanggil ulang fetch

**AC:** Blokir endpoint di DevTools → halaman menampilkan error + tombol retry yang berfungsi.

---

### `MED-13` · Test guard, interceptor & pipe yang belum tercakup
**Effort:** M · **Kategori:** 6

Guard 3 dari 4 ✅, interceptor 1 dari 3 ✅.

- [ ] `katalog-checkout-abandon.guard`
- [ ] `error.interceptor` — logika pemetaan status 0/400/403/404/5xx bercabang banyak dan mudah dites
- [ ] `loading.interceptor`
- [ ] `truncate.pipe` — satu-satunya pipe, pipe murni adalah test termurah (~10 menit)

**AC:** Keempatnya punya spec; `npm run test:ci` tetap hijau.

---

### `MED-14` · Test service jalur uang + threshold coverage
**Effort:** M · **Kategori:** 6

**30 service di `core/services` — nol punya test.** Dari 21 store, hanya 3 tertutup. Estimasi coverage **~8%**, dan angkanya tidak pernah diukur karena [vitest.config.ts](../vitest.config.ts) tidak punya blok `coverage`.

- [ ] Test service jalur uang: `payment-api`, `b2c-order-api`, `doku-checkout`
- [ ] Test store: `order.store`, `payment.store`
- [ ] Tambahkan ke `vitest.config.ts`:
  ```ts
  coverage: { provider: 'v8', reporter: ['text','lcov'], thresholds: { lines: 40, functions: 40 } }
  ```
- [ ] Naikkan threshold bertahap tiap sprint

**AC:** `npm run test:ci` melaporkan coverage dan gagal bila di bawah threshold.

> *Tanpa angka yang ditegakkan, "quality gate" hanyalah nama folder.*

---

### `MED-15` · E2E test dengan Playwright
**Effort:** M · **Kategori:** 6

**Tidak ada E2E sama sekali.** Flow keranjang → checkout → bayar → order success tidak pernah diuji end-to-end, dan justru flow itulah yang menyentuh uang pelanggan.

- [ ] Pasang Playwright
- [ ] Skenario 1: browse produk → tambah ke keranjang
- [ ] Skenario 2: cart → checkout → order berhasil
- [ ] Skenario 3: admin CRUD item
- [ ] Jalankan di CI (`HIGH-03`)

**AC:** `npx playwright test` hijau lokal dan di CI.

> Tulis **setelah** `MED-08` dan `MED-09` selesai — E2E di atas markup yang masih berubah akan langsung rusak.

---

### `MED-16` · Bereskan 46 error `no-explicit-any`
**Effort:** M · **Kategori:** 6 · **Dependensi:** `CRIT-06`

`tsconfig` sudah strict penuh (`strict`, `noUnusedLocals`, `noPropertyAccessFromIndexSignature`, `strictTemplates`, dan lainnya). Setiap `any` melubangi jaring yang sudah susah payah dipasang itu.

- [ ] Cicil per service; titik terpadat: `google-auth.service` (5), `item-api`, `order-api`, `payment-api`
- [ ] Manfaatkan `backend-dtos.model.ts` yang sudah ada

**AC:** `@typescript-eslint/no-explicit-any` = 0.

> Dipisah dari `CRIT-06` karena butuh pemahaman domain per service — jangan diburu bersamaan dengan batch lint mekanis.

---

### `MED-17` · `Meta` + `Title` dinamis + Open Graph + JSON-LD
**Effort:** M · **Kategori:** 5

**Nol pemakaian** `Title` maupun `Meta` di seluruh codebase. Setiap halaman berbagi satu title statis dari `index.html`.

- [ ] Injeksikan `Title` + `Meta` di `ngOnInit` (minimal product-detail, katalog, home)
- [ ] Tambah `description`, Open Graph, Twitter Card, canonical
- [ ] Tambah JSON-LD schema `Product` di halaman detail

**AC:** Setiap halaman produk punya title unik; preview share WhatsApp menampilkan judul + gambar produk yang benar.

> 💡 **Kandidat terkuat untuk dinaikkan ke sprint pre-rilis.** Bisa dikerjakan **tanpa** SSR, tidak bergantung siapa pun, dan langsung memperbaiki tab title, bookmark, dan preview share. Dampak bisnis tertinggi di Tier 3.

---

### `MED-18` · SSR / prerendering untuk halaman publik
**Effort:** L · **Kategori:** 5 · **Dependensi:** `MED-17`, `CRIT-03` 🛠️

`angular.json` → `"ssr": false`. Crawler menerima HTML kosong berisi spinner. Google *bisa* merender JS (dengan antrian, tanpa jaminan), tapi **Bing dan seluruh crawler social preview — WhatsApp, Facebook, Twitter — tidak merender JS sama sekali.**

- [ ] `ng add @angular/ssr`
- [ ] Hybrid rendering: **SSG** `/`, `/product`, `/mardika-kopi` · **SSR** `/product/:id` · **CSR** admin & checkout
- [ ] Pastikan 55 pemakaian `localStorage` aman di server *(sebagian kode sudah defensif dengan `typeof localStorage === 'undefined'` ✅)*
- [ ] Sesuaikan hosting: butuh Node runtime, bukan static host

**AC:** `curl` ke `/product/:id` mengembalikan HTML berisi nama & harga produk.

> **Task terbesar di daftar.** Sprint tersendiri dengan jendela regression testing sendiri.

---

### `MED-19` · Content Security Policy + security header
**Effort:** S · **Kategori:** 3, 7 · **Dependensi:** `CRIT-03` 🛠️

Tidak ada CSP sama sekali. `index.html` memuat script eksternal dari `accounts.google.com`; DOKU disuntik dinamis dari `jokul.doku.com`.

- [ ] Tambahkan di header server (bareng `CRIT-03`):
  ```
  Content-Security-Policy: script-src 'self' https://accounts.google.com https://jokul.doku.com;
                           object-src 'none'; base-uri 'self'; frame-ancestors 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  ```
- [ ] Uji login Google dan checkout DOKU tidak terblokir CSP

**AC:** securityheaders.com grade A; login Google + checkout DOKU tetap berfungsi.

---

### `MED-20` · Notifikasi user di `GlobalErrorHandler`
**Effort:** S · **Kategori:** 4 · **Dependensi:** `CRIT-07`

[global-error-handler.ts](../src/app/core/errors/global-error-handler.ts) sudah terdaftar dengan benar ✅, tapi isinya hanya `logger.error(...)` — saat terjadi error tak tertangkap, **user tidak melihat apa pun**, aplikasi hanya diam.

- [ ] Toast/dialog "Terjadi kesalahan tak terduga"
- [ ] Kirim ke Sentry (slot komentar `// Sentry.captureException(error)` sudah ada di file)

**AC:** Error runtime yang dilempar sengaja memunculkan notifikasi user **dan** muncul di dashboard Sentry.

---

# TIER 2 — TINGGI
### *5 task · Kerjakan bersama Tier 1*

---

### `HIGH-01` · 🐛 Perbaiki bug preloading strategy
**Effort:** S (5 menit) · **Kategori:** 2

[selective-preloading-strategy.ts:11](../src/app/core/strategies/selective-preloading-strategy.ts):

```ts
return timer(1000).pipe(() => load());   // ❌ timer diabaikan total
```

Argumen `pipe()` adalah *operator function* bertipe `(source) => Observable`. Karena `() => load()` mengabaikan parameter `source`, **`timer` tidak pernah ikut serta** — delay 1 detik yang dijanjikan komentar di atasnya tidak pernah terjadi. Preload menembak bersamaan dengan first paint, persis yang ingin dihindari.

```ts
return timer(1000).pipe(switchMap(() => load()));   // ✅
```

- [ ] Perbaiki + impor `switchMap`
- [ ] Tambahkan unit test untuk strategy ini

**AC:** Network tab menunjukkan chunk preload mulai diunduh ~1 detik **setelah** initial load.

> File ini sedang *modified* di working tree — periksa perubahan yang belum ter-commit sebelum menimpanya. Ini persis kelas bug yang lolos karena tidak ada test-nya.

---

### `HIGH-03` · Hardening CI pipeline
**Effort:** S · **Kategori:** 6, 9 · **Dependensi:** `CRIT-05`, `CRIT-06`

[ci.yml](../.github/workflows/ci.yml) strukturnya sudah benar (checkout → Node 22 + cache → `npm ci` → lint → test → build), tapi:

- [ ] Trigger hanya `main`, padahal pekerjaan di `ssonlineshop` → **CI tidak pernah jalan untuk kerja harian.** Ubah ke `branches: ['**']` untuk PR.
- [ ] Tambah step `npm audit --audit-level=high` agar `CRIT-05` tidak terulang
- [ ] Upload `dist/` sebagai artifact
- [ ] Samakan versi Node dengan `NTH-03`
- [ ] Tambah step E2E setelah `MED-15` selesai

**AC:** Push ke `ssonlineshop` memicu CI; CI hijau; PR dengan CVE high otomatis gagal.

---

### `HIGH-04` · Petakan status 409 & 422 di `error.interceptor`
**Effort:** S · **Kategori:** 3, 4

[error.interceptor.ts](../src/app/core/interceptors/error.interceptor.ts) sudah memetakan 0/400/403/404/5xx dengan baik ✅. Tapi **409 Conflict** dan **422 Unprocessable Entity** jatuh diam-diam tanpa toast — user tidak melihat apa pun saat, misalnya, stok habis atau order bentrok.

- [ ] Tambahkan penanganan eksplisit untuk 409 dan 422

**AC:** Response 409/422 memunculkan pesan yang bisa dipahami user.

---

### `HIGH-05` · Dokumentasikan proses deployment
**Effort:** S · **Kategori:** 7 · **Dependensi:** `CRIT-03` 🛠️

README hanya menyebut hasil build "siap disajikan server statis apa pun" tanpa konfigurasi konkret. Deploy = proses manual tak terdokumentasi di kepala satu orang.

- [ ] Dokumentasikan langkah deploy di README atau `DEPLOYMENT.md`
- [ ] Sertakan checklist environment variable dan cache header
- [ ] Commit `Dockerfile` bila memakai container

**AC:** Developer baru bisa men-deploy ke staging hanya dengan mengikuti dokumen.

---

### `HIGH-06` · Verifikasi ulang & perbarui skor
**Effort:** S · **Dependensi:** seluruh Tier 1

- [ ] Jalankan ulang: `npm audit`, `ng lint`, `npm run test:ci`, `ng build --configuration production`
- [ ] Uji manual: refresh di route dalam, share link produk, checkout end-to-end, halaman 404
- [ ] Perbarui skor di [frontend-readiness-audit.md](frontend-readiness-audit.md)

**AC:** Nol temuan ❌ Kritikal frontend tersisa; skor lingkup FE ≥ 8/10.

---

# TIER 1 — KRITIKAL 🚨
### *5 task · Blocker rilis dalam lingkup frontend*

---

### `CRIT-03` · 🔥 Commit konfigurasi server 🛠️
**Effort:** S · **Kategori:** 7

**Tidak ada satu pun artefak konfigurasi server di repo** — dicari menyeluruh: tidak ada `nginx.conf`, `web.config`, `_redirects`, `netlify.toml`, `vercel.json`, `firebase.json`, `.htaccess`, maupun `Dockerfile`. Aplikasi memakai `PathLocationStrategy` dengan route dalam seperti `/product/123` dan `/order-history`.

Tiga kegagalan sekaligus:
1. **Tanpa SPA fallback** → setiap refresh halaman dan setiap link produk yang di-share = **404 dari web server**
2. **Tanpa kompresi** → user mengunduh **663,94 kB**, bukan 152,30 kB. Angka "estimated transfer size" di output build **mengasumsikan brotli aktif** — asumsi yang saat ini tidak terpenuhi.
3. **Tanpa cache header** → `index.html` bisa ter-cache selamanya dan user terjebak di versi lama

- [ ] Commit `nginx.conf` (template lengkap di [frontend-readiness-audit.md](frontend-readiness-audit.md) Kategori 7) atau konfigurasi platform setara
- [ ] SPA fallback: `try_files $uri $uri/ /index.html;`
- [ ] Brotli + gzip untuk `text/*`, `application/javascript`, `application/json`, `image/svg+xml`
- [ ] Cache: `index.html` → `no-cache` · JS/CSS ber-hash → `max-age=31536000, immutable` · `media/`+`assets/` → `max-age=86400, must-revalidate`

> Catatan: `outputHashing: "bundles"` berarti **hanya JS/CSS yang di-hash** — `media/boxicons.woff2` tanpa hash. Ini disengaja agar `<link rel="preload">` di `index.html` tetap valid, jadi **jangan diubah ke `"all"`**; kompensasinya lewat cache header berbeda di atas.

**AC:** Refresh langsung di `/product/123` memuat halaman (bukan 404); header menunjukkan `content-encoding: br`; `index.html` tidak ter-cache.

> **Rasio effort-to-impact tertinggi di seluruh laporan** — satu file menutup empat temuan sekaligus.

---

### `CRIT-05` · 🔥 Tutup 20 kerentanan high/critical
**Effort:** M · **Kategori:** 3, 9

`npm audit` menghasilkan **26 kerentanan: 1 critical, 19 high, 3 moderate, 3 low.**

| Paket | Kerentanan |
|---|---|
| `@angular/compiler` | **Two-Way Property Binding Sanitization Bypass (XSS)**, i18n XSS via event-handler attributes |
| `@angular/core` | Hydration DOM Clobbering & Response-Cache Poisoning, i18n XSS |
| `@angular/common` | DoS OOM di `formatDate`, weak 32-bit cache key `HttpTransferCache` |
| `tar` | **CRITICAL** — path type confusion / DoS |
| `piscina` | Prototype Pollution → RCE |
| `postcss`, `vite`, `undici`, `nanoid`, `ip-address` | Path traversal, header injection, SSRF |

Versi terpasang `21.2.16` masuk range rentan (`<21.2.17`, `<=21.2.18`).

**Kenapa XSS bypass relevan langsung di aplikasi ini:** deskripsi produk dari WYSIWYG admin dirender ke halaman customer via `[innerHTML]`. Pertahanannya bertumpu pada satu lapis — sanitizer Angular — dan lapis itulah yang punya CVE bypass aktif.

- [ ] `npm audit fix`
- [ ] Naikkan Angular ke `21.2.19+` (patch-level, risiko regresi minimal)
- [ ] `npm audit` ulang sampai high/critical nol
- [ ] Jalankan test + build untuk verifikasi tidak ada regresi

**AC:** `npm audit --audit-level=high` exit code 0; test hijau; build sukses.

---

### `CRIT-06` · 🔥 Bereskan 101 lint error → CI hijau
**Effort:** M · **Kategori:** 6

`ng lint` menghasilkan **101 problem (101 error, 0 warning).** Karena `.github/workflows/ci.yml` menjalankan `npm run lint` sebagai step wajib, **pipeline `main` dijamin merah** — quality gate sudah lama tidak berfungsi dan tim kemungkinan besar terbiasa mengabaikannya.

**Batch cepat — 28 error, bisa selesai satu sesi:**

| Rule | Jumlah |
|---|---|
| `@angular-eslint/no-output-native` | 12 |
| `@angular-eslint/no-input-rename` | 9 |
| `@typescript-eslint/no-unused-vars` | 4 |
| `no-useless-assignment` | 3 |

**Sisanya:**

| Rule | Jumlah | Catatan |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 46 | → `MED-16` |
| `@typescript-eslint/no-empty-function` | 7 | |
| `template/prefer-control-flow` | 6 | → sebagian di `MED-03` |
| `template/label-has-associated-control` | 6 | → `MED-08` |
| `no-empty` | 2 | |
| `@typescript-eslint/no-empty-object-type` | 2 | |
| `interactive-supports-focus`, `click-events-have-key-events` | 2 | → `MED-08` |
| `@angular-eslint/prefer-inject`, `directive-selector` | 2 | |

- [ ] Selesaikan batch cepat lebih dulu
- [ ] Sisanya sampai `ng lint` bersih (46 `any` boleh diserahkan ke `MED-16` bila di-timebox)

**AC:** `npm run lint` exit code 0; CI hijau.

> **Bukan sekadar kerapian.** Selama CI merah, hasil `npm audit`, test, dan build tidak ada yang memperhatikan. Menghijaukan CI adalah yang membuat semua perbaikan lain **tetap bertahan**.

---

### `CRIT-07` · 🔥 Pasang monitoring error (Sentry)
**Effort:** M · **Kategori:** 4

**Nol monitoring.** Tidak ada Sentry / LogRocket / Application Insights / Datadog. Tidak ada RUM, error tracking, maupun alerting.

Aplikasi ini memproses pembayaran DOKU. Tanpa monitoring, **bug production hanya diketahui saat pelanggan komplain** — dan pada aplikasi transaksional, keterlambatan itu berarti kehilangan uang, bukan sekadar pengalaman buruk.

- [ ] Pasang `@sentry/angular`
- [ ] Hubungkan ke [global-error-handler.ts](../src/app/core/errors/global-error-handler.ts) — slot komentar `// Sentry.captureException(error)` sudah tersedia
- [ ] Hubungkan ke [error.interceptor.ts](../src/app/core/interceptors/error.interceptor.ts) untuk error HTTP
- [ ] Aktifkan release tracking + upload hidden source map (koordinasikan `NTH-06`)
- [ ] Set up alerting untuk error rate di flow checkout
- [ ] **Scrub PII** — pastikan token dan data pelanggan tidak ikut terkirim

**AC:** Error yang dilempar sengaja muncul di dashboard Sentry dengan stack trace ter-*unminify*, tanpa data sensitif.

> Sentry yang dipasang tanpa scrubbing hanya memindahkan kebocoran data ke pihak ketiga.

---

### `CRIT-08` · 🔥 Buat halaman 404 & perbaiki `admin-host.guard`
**Effort:** S · **Kategori:** 4

Tidak ada komponen maupun route 404. `app.routes.ts` ditutup dengan `{ path: '**', redirectTo: '' }`.

Lebih buruk lagi: [admin-host.guard.ts:13](../src/app/core/guards/admin-host.guard.ts) memanggil `router.navigate(['/404'])`, tapi **route `/404` tidak ada** — jatuh ke wildcard dan pengunjung dilempar ke **homepage toko**. Komentar di guard itu sendiri menyatakan niatnya "tampilkan 404 Not Found", jadi **perilaku aktual bertentangan dengan yang dimaksud**, dan panel admin tetap discoverable dari domain publik.

- [ ] Buat `NotFoundComponent`
- [ ] Daftarkan route `{ path: '404', loadComponent: ... }`
- [ ] Ubah wildcard menjadi `{ path: '**', loadComponent: NotFoundComponent }` — **bukan redirect**, karena redirect merusak SEO dan menyembunyikan broken link dari monitoring
- [ ] Verifikasi `admin-host.guard` kini benar-benar menampilkan 404

**AC:** `/halaman-ngawur` menampilkan halaman 404 dengan URL tetap; `/admin` dari domain publik menampilkan 404, bukan homepage.

---

# Ringkasan

| Tier | Jumlah | Effort total | Blocker rilis? |
|---|---|---|---|
| 🚨 **Tier 1 — Kritikal** | 5 | ~1 minggu | **Ya** |
| **Tier 2 — Tinggi** | 5 | ~1 hari | Disarankan |
| **Tier 3 — Sedang** | 17 | ~4–5 minggu | Tidak |
| **Tier 4 — Nice-to-Have** | 11 | ~3 hari | Tidak |
| **Total lingkup FE** | **38** | | |

**Empat quick win** — total di bawah setengah hari, semuanya effort `S`:
`CRIT-03` (nginx) · `CRIT-08` (404) · `HIGH-01` (bug preload, 5 menit) · `MED-01` (`lang="id"`, 30 detik)

---

## Lampiran — Task yang Dikeluarkan

Delapan task berikut menunggu diskusi backend. Rinciannya di [production-readiness-tasks.md](production-readiness-tasks.md).

| ID | Task | Ranah | Masih blocker rilis? |
|---|---|---|---|
| `CRIT-01` | Koma nyasar di kredensial production | Auth | **Ya** — kecuali sudah diverifikasi dengan build production |
| `CRIT-02` | `client_secret` keluar dari browser + rotasi | Auth + backend | **Ya** |
| `CRIT-04` | Mixed content `posApiUrl` | Backend/infra | **Ya** — flow order katalog B2C |
| `CRIT-09` | Refresh token keluar dari `localStorage` | Auth + backend | **Ya** |
| `HIGH-02` | Hapus fallback kredensial hardcoded | Auth | Tidak |
| `MED-05` | Refresh-token lock di interceptor | Auth | Tidak |
| `MED-11` | Sanitasi HTML deskripsi produk saat simpan | Backend | Tidak |
| `MED-12` | Konsistensi host & port API production | Backend/infra | Tidak |

> Menyelesaikan seluruh 38 task frontend membuat **lingkup frontend** siap. Empat item di atas tetap harus tuntas sebelum aplikasi benar-benar bisa rilis.

---

*Dokumen ini hanya berisi rencana. Tidak ada file sumber yang diubah saat pembuatannya.*
