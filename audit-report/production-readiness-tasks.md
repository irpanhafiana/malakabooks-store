# Task Breakdown — Production Readiness
### Malakabooks Store (SS Online Shop)

| | |
|---|---|
| **Sumber** | [production-readiness-audit.md](production-readiness-audit.md) |
| **Tanggal** | 11 Agustus 2026 |
| **Branch** | `ssonlineshop` |
| **Total task** | 46 task (11 Nice-to-Have · 20 Sedang · 6 Tinggi · 9 Kritikal) |
| **Skor saat ini** | 4,5 / 10 — belum siap go-live |

---

## Cara Membaca Dokumen Ini

Sesuai permintaan, dokumen ini disusun **menaik**: dimulai dari task paling ringan (Nice-to-Have) dan berakhir di task paling kritikal.

> ⚠️ **Urutan baca ≠ urutan kerja.**
> Untuk **pengerjaan**, mulailah dari bawah — **Tier 1 (Kritikal)** lebih dulu. Sembilan task di Tier 1 adalah blocker go-live; mengerjakan Nice-to-Have sebelum itu berarti memoles aplikasi yang tidak bisa login dan 404 saat di-refresh. Lihat [Rencana Eksekusi](#rencana-eksekusi-urutan-kerja-sebenarnya) di akhir dokumen untuk urutan sprint yang disarankan.

**Legenda effort:** `S` = < 1 jam · `M` = 1 hari · `L` = > 3 hari

Setiap task punya **Acceptance Criteria (AC)** — definisi "selesai" yang bisa diverifikasi, bukan sekadar "sudah dikerjakan".

---

# TIER 4 — NICE TO HAVE
### *Boleh ditunda setelah rilis pertama. Tidak ada yang memblokir go-live.*

---

### `NTH-01` · Housekeeping repository
**Effort:** S · **Kategori audit:** 8 · **Dependensi:** —

Ada tiga file sampah ter-commit di root. Yang paling berbahaya adalah `lint_results.txt` — 42 KB, encoding UTF-16, tertanggal 10 Agustus, berisi **135 error** padahal angka aktual sekarang **101**. Laporan lint basi di repo lebih berbahaya daripada tidak ada sama sekali, karena orang akan mempercayainya.

- [ ] Hapus `lint_results.txt`, `AUDIT_PROMPTS.md` (0 byte), `customs.css` (0 byte)
- [ ] Tambahkan `lint_results.txt` ke `.gitignore`

**AC:** `git status` bersih; `.gitignore` mencegah file laporan lint ter-commit lagi.

---

### `NTH-02` · Pindahkan `@types/*` ke `devDependencies`
**Effort:** S · **Kategori audit:** 2, 9 · **Dependensi:** —

`@types/leaflet` dan `@types/qrcode` salah tempat di `dependencies` — type definition tidak pernah dibutuhkan saat runtime.

- [ ] Pindahkan keduanya ke `devDependencies` di [package.json](../package.json)
- [ ] `npm install` untuk memperbarui lockfile

**AC:** `npm ci --omit=dev` sukses dan `ng build --configuration production` tetap jalan.

---

### `NTH-03` · Tambah `engines` + `.nvmrc`
**Effort:** S · **Kategori audit:** 9 · **Dependensi:** —

Mesin dev pakai Node **v24.14.0**, CI pakai **22.x**, README menulis "v20+" (terlalu longgar — Node 20.0–20.18 akan gagal di Angular 21). Drift ini cepat atau lambat menggigit.

- [ ] Tambahkan di `package.json`:
  ```json
  "engines": { "node": "^20.19.0 || ^22.12.0 || ^24.0.0", "npm": ">=10" }
  ```
- [ ] Buat `.nvmrc`
- [ ] Perbaiki prasyarat Node di [README.md](../README.md)

**AC:** `npm install` di Node 20.18 gagal dengan pesan engine yang jelas.

---

### `NTH-04` · Hapus `security.allowedHosts` kosong dari `build.options`
**Effort:** S · **Kategori audit:** 1 · **Dependensi:** —

Array kosong di blok `build`, sementara nilai efektifnya sudah ada di `serve.options`. Tidak berguna, hanya membingungkan pembaca berikutnya.

- [ ] Hapus blok `"security": { "allowedHosts": [] }` dari [angular.json](../angular.json)

**AC:** Build production tetap sukses.

---

### `NTH-05` · Tambah `qrcode` ke `allowedCommonJsDependencies`
**Effort:** S · **Kategori audit:** 1 · **Dependensi:** —

Build production memunculkan warning `Module 'qrcode' ... is not ESM` → optimization bailout.

- [ ] Tambahkan `"qrcode"` ke array di `angular.json`
- [ ] (Opsional) Evaluasi library QR ESM-native untuk menghilangkan bailout sepenuhnya

**AC:** Output `ng build --configuration production` bersih tanpa warning CommonJS.

---

### `NTH-06` · Eksplisitkan `sourceMap: false` di konfigurasi production
**Effort:** S · **Kategori audit:** 1 · **Dependensi:** —

Saat ini aman karena default `@angular/build` adalah `false` (terverifikasi: tidak ada `.js.map` di `dist`), tapi mengandalkan default itu rapuh.

- [ ] Tambahkan ke konfigurasi `production`:
  ```json
  "sourceMap": { "scripts": false, "styles": false, "hidden": false }
  ```
- [ ] Catat: jika `CRIT-07` (Sentry) sudah jalan, ubah ke `"hidden": true` dan upload map ke Sentry saja

**AC:** Tidak ada `.js.map` di `dist/malakabooks/browser` setelah build production.

---

### `NTH-07` · Perketat budget `angular.json`
**Effort:** S · **Kategori audit:** 1, 2 · **Dependensi:** —

Initial aktual **663,94 kB raw**, sementara limit warning **1 MB**. Terlalu longgar untuk mendeteksi regresi. Tidak ada budget untuk lazy chunk sama sekali.

- [ ] Turunkan `initial` → `maximumWarning: "700kB"`, `maximumError: "900kB"`
- [ ] Tambah `{ "type": "any", "maximumWarning": "150kB" }`

**AC:** Build production lolos dengan budget baru; menambah dependency besar memicu warning.

---

### `NTH-08` · Pindahkan Google Client ID ke `environment`
**Effort:** S · **Kategori audit:** 3 · **Dependensi:** —

Client ID Google memang publik by design — **ini bukan kebocoran keamanan**, murni kerapian agar dev dan prod bisa memakai project Google berbeda.

- [ ] Pindahkan `785241388758-...apps.googleusercontent.com` dari [google-auth.service.ts:21](../src/app/core/services/google-auth.service.ts) ke `environment.ts` / `environment.prod.ts`

**AC:** Tidak ada Client ID hardcoded di `src/app`; login Google tetap berfungsi.

---

### `NTH-09` · Subset font boxicons ke woff2
**Effort:** S · **Kategori audit:** 2 · **Dependensi:** —

`boxicons` 2.1.4 mengirim 5 format (eot/svg/ttf/woff/woff2) ke `dist`. Empat di antaranya mati — tidak ada browser target yang membutuhkannya.

- [ ] Batasi asset boxicons hanya `.woff2` (~200 kB terhemat di `dist`)

**AC:** `dist/malakabooks/browser/media` hanya berisi `boxicons.woff2`; ikon tetap tampil normal.

---

### `NTH-10` · Konsistensi `OnPush` di 5 komponen sisa
**Effort:** S · **Kategori audit:** 2 · **Dependensi:** —

99 dari 104 komponen sudah `OnPush`. Sisanya murni konsistensi — dengan `provideZonelessChangeDetection()` aktif, dampak performanya minim.

- [ ] Identifikasi 5 komponen tanpa `ChangeDetectionStrategy.OnPush` dan tambahkan

**AC:** 104/104 komponen memakai `OnPush`; semua test tetap lulus.

---

### `NTH-11` · Service Worker / PWA
**Effort:** M · **Kategori audit:** 4 · **Dependensi:** `CRIT-03`

Membuat katalog bisa diakses offline dan mempercepat repeat visit.

- [ ] `ng add @angular/pwa`
- [ ] Konfigurasi `ngsw-config.json`: cache-first untuk asset, network-first untuk API
- [ ] Pastikan tidak meng-cache endpoint auth dan checkout

**AC:** Lighthouse PWA check lulus; halaman katalog terbuka dalam mode airplane.

---

# TIER 3 — SEDANG
### *Should-have. Perbaiki dalam 1–2 sprint setelah rilis, atau sebelum rilis kalau jadwal memungkinkan.*

---

### `MED-01` · Ubah `<html lang="en">` → `lang="id"`
**Effort:** S · **Kategori audit:** 5 · **Dependensi:** —

Seluruh konten Bahasa Indonesia tapi dokumen dideklarasikan Inggris. Berdampak pada screen reader (pelafalan salah) dan pemahaman bahasa oleh mesin pencari.

- [ ] Ubah satu baris di [src/index.html](../src/index.html)

**AC:** `<html lang="id">`. **Task 30 detik — kerjakan bareng batch kritikal.**

---

### `MED-02` · Rapikan cakupan `preload: true` (17 route → 4)
**Effort:** S · **Kategori audit:** 2 · **Dependensi:** `HIGH-01`

Praktis **seluruh** aplikasi customer ditandai preload (product, profile, auth×4, cart, checkout, order×4, complaints, addresses). Strategi "selective" jadi setara `PreloadAllModules`.

- [ ] Sisakan `preload: true` hanya di `''`, `product`, `product/:id`, `cart` pada [app.routes.ts](../src/app/app.routes.ts)

**AC:** Network tab menunjukkan ≤ 4 chunk terpreload setelah first paint, bukan 17.

> Kerjakan **setelah** `HIGH-01`, karena selama bug `pipe()` belum diperbaiki, efek perubahan ini tidak akan terlihat benar.

---

### `MED-03` · Migrasi `*ngFor` legacy terakhir
**Effort:** S · **Kategori audit:** 2 · **Dependensi:** —

Satu-satunya sisa `*ngFor` di codebase, dan **tanpa `trackBy`** — sekaligus menarik `CommonModule` ke bundle.

- [ ] [detail-shipment.component.html:99](../src/app/features/order/detail-shipment/detail-shipment.component.html) → `@for (log of trackingLogs; track log.id; let i = $index, first = $first, last = $last)`
- [ ] Hapus impor `CommonModule` bila sudah tidak dipakai

**AC:** Nol `*ngFor` di codebase; lint `template/prefer-control-flow` berkurang.

---

### `MED-04` · Tutup subscription tanpa `takeUntilDestroyed`
**Effort:** S · **Kategori audit:** 8 · **Dependensi:** —

Dari 33 `.subscribe()`, 48 sudah memakai `takeUntilDestroyed` ✅. Dua pengecualian:

- [ ] [katalog-cart.component.ts:160](../src/app/features/katalog/katalog-cart/katalog-cart.component.ts) — `postB2COrder().subscribe()` tanpa proteksi. HTTP one-shot jadi tidak bocor permanen, tapi callback memanggil `isProcessing.set(false)` dan `setLastOrderId()` setelah komponen bisa saja sudah hancur. **Ini jalur pembuatan order** — layak dirapikan.
- [ ] [search-bar.component.ts:29](../src/app/shared/ui/search-bar/search-bar.component.ts) — stream `debounceTime` infinite, sudah di-unsubscribe manual di `ngOnDestroy` ✅ aman; modernkan saja agar seragam

**AC:** Semua `.subscribe()` non-spec memakai `takeUntilDestroyed`; `ngOnDestroy` manual di search-bar bisa dihapus.

---

### `MED-05` · Refresh-token lock di `auth.interceptor`
**Effort:** S · **Kategori audit:** 3 · **Dependensi:** —

Interceptor sudah kelas produksi, tapi ada satu celah: bila 5 request kena 401 bersamaan, `refreshToken()` dipanggil 5×. Berpotensi race condition dan refresh token ter-invalidasi backend.

- [ ] Tambahkan shared in-flight promise / `shareReplay(1)` di [auth.interceptor.ts](../src/app/core/interceptors/auth.interceptor.ts)

**AC:** Unit test: 5 request 401 paralel hanya memicu **satu** panggilan `/connect/token`.

---

### `MED-06` · Sanitasi AWB di `shipping-label.service`
**Effort:** S · **Kategori audit:** 3 · **Dependensi:** —

[shipping-label.service.ts:271](../src/app/core/services/shipping-label.service.ts) merangkai string HTML manual (`.innerHTML = '<p>' + awbClean + '</p>'`) untuk dokumen cetak. Jalur ini **melewati DomSanitizer** karena dieksekusi sebagai string di window cetak.

- [ ] Ganti ke `textContent`, atau validasi `awbClean` dengan regex alfanumerik ketat sebelum interpolasi

**AC:** Nilai AWB berisi `<script>` ter-render sebagai teks literal, bukan tereksekusi.

---

### `MED-07` · Banner offline global
**Effort:** S · **Kategori audit:** 4 · **Dependensi:** —

Saat ini offline hanya ditangani reaktif (`error.status === 0` → toast). Tidak ada indikator proaktif.

- [ ] Buat service/komponen berbasis event `window.online` / `offline`
- [ ] Tampilkan banner persisten selama offline

**AC:** Mematikan network di DevTools memunculkan banner; menyalakan kembali menghilangkannya.

---

### `MED-08` · Perbaikan aksesibilitas
**Effort:** S · **Kategori audit:** 5 · **Dependensi:** —

Fondasi a11y sudah baik (alt text **44/44** ✅, 50 atribut `aria-*` ✅, lint `templateAccessibility` aktif ✅). Sisa pelanggaran:

- [ ] **6 × `label-has-associated-control`** — hubungkan dengan `for`/`id` atau bungkus input di dalam `<label>`. Bukan hanya soal screen reader: sekarang klik label tidak memfokus field.
- [ ] **1 × `click-events-have-key-events`** + **1 × `interactive-supports-focus`** — ganti ke `<button type="button">`, atau tambahkan `tabindex="0"` + `(keydown.enter)` + `role`
- [ ] Tinjau 11 `(click)` pada `<div>`/`<span>`/`<li>`/`<i>` yang tidak tertangkap lint
- [ ] Audit kontras dengan axe/Lighthouse — `text-slate-400` (#94a3b8) di atas putih hanya ~2,8:1, di bawah ambang WCAG AA 4,5:1. Naikkan teks kecil informatif ke `slate-600`.

**AC:** Nol pelanggaran a11y di `ng lint`; nol isu kontras "serious" di axe.

---

### `MED-09` · Migrasi `<img>` ke `NgOptimizedImage`
**Effort:** M · **Kategori audit:** 2 · **Dependensi:** —

Hanya **6 dari 44** `<img>` memakai `NgOptimizedImage` (semua di modul katalog + `product-card`). 38 sisanya `<img [src]>` polos: nol `loading="lazy"`, nol dimensi eksplisit → CLS dan gambar full-size di list panjang.

- [ ] Prioritaskan list panjang: cart, checkout, order-history, mardika-kopi, product-detail
- [ ] Pakai `ngSrc` + `width`/`height` (atau `fill`); tandai gambar hero dengan `priority`
- [ ] Minimal, kalau migrasi penuh terlalu besar: tambahkan `loading="lazy"` + dimensi eksplisit

**AC:** CLS < 0,1 di Lighthouse mobile untuk product-detail dan order-history.

---

### `MED-10` · Error state + retry per halaman
**Effort:** M · **Kategori audit:** 4 · **Dependensi:** —

Saat fetch gagal, user hanya melihat toast lalu **halaman kosong** tanpa jalan keluar.

- [ ] Terapkan pola `loading / error+retry / empty / data` di product list, product detail, order history, cart
- [ ] Sediakan tombol "Coba lagi" yang memanggil ulang fetch

**AC:** Blokir endpoint di DevTools → halaman menampilkan pesan error + tombol retry yang berfungsi.

---

### `MED-11` · Sanitasi HTML deskripsi produk di backend
**Effort:** M · **Kategori audit:** 3 · **Dependensi:** koordinasi backend

Deskripsi dari WYSIWYG admin ([editor.component.ts](../src/app/shared/ui/editor/editor.component.ts)) dirender ke halaman customer via `[innerHTML]` di [product-detail.component.html:184](../src/app/features/product/product-detail/product-detail.component.html) dan [mardika-kopi-detail:145](../src/app/features/mardika-kopi/mardika-kopi-detail/mardika-kopi-detail.component.html).

Angular **sudah menyanitasi** `[innerHTML]` secara otomatis, dan codebase ini **nol `bypassSecurityTrust*`** ✅ — jadi posturnya sudah benar. Masalahnya: pertahanan bertumpu pada satu lapis, dan lapis itu (`@angular/compiler`) sedang punya CVE sanitization bypass aktif (lihat `CRIT-05`).

- [ ] Sanitasi juga saat **simpan** di backend dengan allowlist tag
- [ ] Dokumentasikan tag apa saja yang diizinkan editor

**AC:** Menyimpan `<script>alert(1)</script>` lewat editor admin menghasilkan konten tersimpan yang sudah bersih di database.

---

### `MED-12` · Konfirmasi konsistensi host & port API production
**Effort:** S · **Kategori audit:** 1 · **Dependensi:** koordinasi backend

`apiBaseUrl` → `tokosuburjaya.com:17800`, `authUrl` → `tokosuburjaya.com` (port 443). Beda port tanpa penjelasan, dan **port non-standar 17800 sering diblokir jaringan korporat, sekolah, dan sebagian hotspot publik** — user di jaringan tersebut akan mengalami aplikasi yang gagal total tanpa sebab yang jelas.

- [ ] Konfirmasi ke tim backend apakah port 17800 memang final
- [ ] Idealnya: letakkan semua endpoint di belakang satu reverse proxy port 443

**AC:** Semua endpoint production dapat diakses dari jaringan yang memblokir port non-standar.

---

### `MED-13` · Test untuk guard, interceptor, dan pipe yang belum tercakup
**Effort:** M · **Kategori audit:** 6 · **Dependensi:** —

Guard: 3 dari 4 sudah ada ✅. Interceptor: 1 dari 3 ✅.

- [ ] `katalog-checkout-abandon.guard` — belum ada test
- [ ] `error.interceptor` — belum ada, padahal logika pemetaan status 0/400/403/404/5xx bercabang banyak dan mudah dites
- [ ] `loading.interceptor` — belum ada
- [ ] `truncate.pipe` — satu-satunya pipe di project, belum ada test. Pipe murni = test termurah yang bisa ditulis (~10 menit).

**AC:** Keempatnya punya spec; `npm run test:ci` tetap hijau.

---

### `MED-14` · Unit test service jalur uang + threshold coverage
**Effort:** M · **Kategori audit:** 6 · **Dependensi:** —

**30 service di `core/services` — nol punya test.** Dari 21 store, hanya 3 yang tertutup. Estimasi coverage saat ini **~8%**, dan angkanya tidak pernah diukur karena [vitest.config.ts](../vitest.config.ts) tidak punya blok `coverage` sama sekali.

- [ ] Test service yang menyentuh uang: `auth-api`, `payment-api`, `b2c-order-api`, `doku-checkout`
- [ ] Test store: `order.store`, `payment.store`
- [ ] Tambahkan ke `vitest.config.ts`:
  ```ts
  coverage: { provider: 'v8', reporter: ['text','lcov'], thresholds: { lines: 40, functions: 40 } }
  ```
- [ ] Naikkan threshold bertahap tiap sprint

**AC:** `npm run test:ci` melaporkan angka coverage dan gagal bila di bawah threshold. *Tanpa angka, "quality gate" hanyalah nama folder.*

---

### `MED-15` · E2E test dengan Playwright
**Effort:** M · **Kategori audit:** 6 · **Dependensi:** `CRIT-01`, `CRIT-04`

**Tidak ada E2E sama sekali.** Flow paling kritikal — register → login → keranjang → checkout → bayar DOKU → order success — tidak pernah diuji end-to-end, dan justru flow itulah yang menyentuh uang pelanggan.

- [ ] Pasang Playwright
- [ ] Skenario 1: login customer
- [ ] Skenario 2: cart → checkout → order berhasil
- [ ] Skenario 3: admin login → CRUD item
- [ ] Jalankan di CI (`HIGH-04`)

**AC:** `npx playwright test` hijau lokal dan di CI.

---

### `MED-16` · Bereskan 46 error `no-explicit-any`
**Effort:** M · **Kategori audit:** 6 · **Dependensi:** `CRIT-06`

`tsconfig` sudah strict penuh (`strict`, `noUnusedLocals`, `noPropertyAccessFromIndexSignature`, `strictTemplates`, dan lainnya). Setiap `any` melubangi jaring yang sudah susah payah dipasang itu.

- [ ] Cicil per service; titik terpadat: `google-auth.service` (5), `item-api`, `order-api`, `payment-api`
- [ ] Manfaatkan `backend-dtos.model.ts` yang sudah ada

**AC:** `@typescript-eslint/no-explicit-any` = 0.

> Dipisah dari `CRIT-06` karena butuh pemahaman domain per service — jangan diburu bersamaan dengan batch lint mekanis.

---

### `MED-17` · `Meta` + `Title` dinamis + Open Graph + JSON-LD
**Effort:** M · **Kategori audit:** 5 · **Dependensi:** —

**Nol pemakaian** `Title` maupun `Meta` di seluruh codebase. Setiap halaman — homepage, semua produk, keranjang, checkout — berbagi satu title statis: *"SS Online Shop - Pusat Belanja & Kebutuhan Terlengkap"*.

- [ ] Injeksikan `Title` + `Meta` di `ngOnInit` halaman utama (minimal product-detail, katalog, home)
- [ ] Tambah `description`, Open Graph, Twitter Card, canonical
- [ ] Tambah JSON-LD schema `Product` di halaman detail

**AC:** Setiap halaman produk punya title unik; preview share WhatsApp menampilkan judul + gambar produk yang benar.

> 💡 **Pertimbangkan menaikkan ini ke pre-launch.** Bisa dikerjakan **tanpa** SSR dan sudah langsung memperbaiki tab title, bookmark, dan riwayat browser. Kalau trafik organik penting sejak hari pertama, ini yang paling murah dampaknya.

---

### `MED-18` · SSR / prerendering untuk halaman publik
**Effort:** L · **Kategori audit:** 5 · **Dependensi:** `MED-17`, `CRIT-03`

`angular.json` → `"ssr": false`; README menegaskan "SPA murni dengan CSR". Crawler menerima HTML kosong berisi spinner. Google *bisa* merender JS (dengan antrian, tanpa jaminan), tapi **Bing dan seluruh crawler social preview — WhatsApp, Facebook, Twitter — tidak merender JS sama sekali.**

- [ ] `ng add @angular/ssr`
- [ ] Hybrid rendering per-route: **SSG** untuk `/`, `/product`, `/mardika-kopi` · **SSR** untuk `/product/:id` · **CSR** untuk admin & checkout
- [ ] Pastikan akses `localStorage` (55 pemakaian) aman di server — sebagian kode sudah defensif dengan `typeof localStorage === 'undefined'` ✅
- [ ] Sesuaikan hosting: butuh Node runtime, bukan static host

**AC:** `curl` ke `/product/:id` mengembalikan HTML berisi nama & harga produk.

> **Task terbesar di seluruh daftar.** Rencanakan sprint tersendiri — terlalu berisiko diburu sebelum go-live.

---

### `MED-19` · Content Security Policy + security header
**Effort:** S · **Kategori audit:** 3, 7 · **Dependensi:** `CRIT-03`

Tidak ada CSP sama sekali. `index.html` memuat script eksternal dari `accounts.google.com`, dan DOKU disuntik dinamis dari `jokul.doku.com`.

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

> **Mitigasi berlapis paling murah** untuk risiko token-di-`localStorage` (`CRIT-09`) selama solusi permanennya belum jalan.

---

### `MED-20` · Notifikasi user di `GlobalErrorHandler`
**Effort:** S · **Kategori audit:** 4 · **Dependensi:** `CRIT-07`

[global-error-handler.ts](../src/app/core/errors/global-error-handler.ts) sudah terdaftar dengan benar ✅, tapi isinya hanya `logger.error(...)` — saat terjadi error tak tertangkap, **user tidak melihat apa pun**, aplikasi hanya diam.

- [ ] Tampilkan toast/dialog "Terjadi kesalahan tak terduga"
- [ ] Kirim ke Sentry (slot komentar `// Sentry.captureException(error)` sudah ada di file)

**AC:** Error runtime yang dilempar sengaja memunculkan notifikasi user **dan** muncul di dashboard Sentry.

---

# TIER 2 — TINGGI
### *Bukan blocker teknis, tapi sangat disarankan masuk batch yang sama dengan Tier 1.*

---

### `HIGH-01` · 🐛 Perbaiki bug preloading strategy
**Effort:** S (5 menit) · **Kategori audit:** 2 · **Dependensi:** —

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

**AC:** Network tab menunjukkan chunk preload mulai diunduh ~1 detik **setelah** initial load, bukan bersamaan.

> File ini sudah dalam keadaan *modified* di working tree sebelum audit. Persis kelas bug yang lolos karena tidak ada test-nya.

---

### `HIGH-02` · Hapus fallback kredensial hardcoded dari kode
**Effort:** S · **Kategori audit:** 3, 8 · **Dependensi:** `CRIT-02`

Di luar `environment.prod.ts`, ada kredensial yang tertanam langsung di kode sebagai fallback:

- [ ] [auth-api.service.ts:31](../src/app/core/services/auth-api.service.ts) & `:55` — `environment.clientSecret || 'MalakaBooks-FE'`
- [ ] [auth-api.service.ts:33](../src/app/core/services/auth-api.service.ts) — fallback scope lengkap
- [ ] [b2c-order-api.service.ts:13](../src/app/core/services/b2c-order-api.service.ts) — `|| 'http://192.168.1.15:10100/'`

Pola `||` ini berbahaya bukan hanya karena membocorkan nilai, tapi karena **menyembunyikan misconfiguration**: environment yang kosong tidak akan gagal, melainkan diam-diam memakai kredensial dev di production.

- [ ] Hapus semua fallback — biarkan gagal keras bila environment tidak terisi

**AC:** Mengosongkan `clientSecret` di environment menyebabkan error eksplisit, bukan fallback senyap.

---

### `HIGH-03` · Hardening CI pipeline
**Effort:** S · **Kategori audit:** 6, 9 · **Dependensi:** `CRIT-05`, `CRIT-06`

[ci.yml](../.github/workflows/ci.yml) strukturnya sudah benar (checkout → Node 22 + cache → `npm ci` → lint → test → build), tapi:

- [ ] Trigger hanya `main`, padahal pekerjaan berlangsung di `ssonlineshop` → **CI tidak pernah jalan untuk kerja harian**. Ubah ke `branches: ['**']` untuk PR.
- [ ] Tambah step `npm audit --audit-level=high` agar `CRIT-05` tidak terulang
- [ ] Upload `dist/` sebagai artifact
- [ ] Samakan versi Node dengan `NTH-03`
- [ ] Tambah step E2E setelah `MED-15` selesai

**AC:** Push ke `ssonlineshop` memicu CI; CI hijau; PR dengan CVE high otomatis gagal.

---

### `HIGH-04` · Petakan status 409 & 422 di `error.interceptor`
**Effort:** S · **Kategori audit:** 3, 4 · **Dependensi:** —

[error.interceptor.ts](../src/app/core/interceptors/error.interceptor.ts) sudah memetakan 0/400/403/404/5xx dengan baik ✅ (401 memang sengaja diserahkan ke `authInterceptor`). Tapi **409 Conflict** dan **422 Unprocessable Entity** jatuh diam-diam tanpa toast — user tidak melihat apa pun saat, misalnya, stok habis atau order bentrok.

- [ ] Tambahkan penanganan eksplisit untuk 409 dan 422

**AC:** Response 409/422 dari backend memunculkan pesan yang bisa dipahami user.

---

### `HIGH-05` · Dokumentasikan proses deployment
**Effort:** S · **Kategori audit:** 7 · **Dependensi:** `CRIT-03`

README hanya menyebut hasil build "siap disajikan server statis apa pun" tanpa konfigurasi konkret. Deploy saat ini = proses manual tak terdokumentasi di kepala satu orang.

- [ ] Dokumentasikan langkah deploy di README atau `DEPLOYMENT.md`
- [ ] Sertakan checklist environment variable dan cache header
- [ ] Commit `Dockerfile` bila memakai container

**AC:** Developer baru bisa men-deploy ke staging hanya dengan mengikuti dokumen, tanpa bertanya.

---

### `HIGH-06` · Verifikasi ulang & perbarui skor audit
**Effort:** S · **Kategori audit:** — · **Dependensi:** seluruh Tier 1

- [ ] Jalankan ulang: `npm audit`, `ng lint`, `npm run test:ci`, `ng build --configuration production`
- [ ] Uji manual: refresh di route dalam, share link produk, login customer + admin, checkout end-to-end
- [ ] Perbarui skor di [production-readiness-audit.md](production-readiness-audit.md)

**AC:** Nol temuan ❌ Kritikal tersisa; skor ≥ 8/10.

---

# TIER 1 — KRITIKAL 🚨
### *BLOCKER GO-LIVE. Tidak boleh rilis sebelum sembilan task ini tuntas.*

---

### `CRIT-01` · 🔥 Hapus koma nyasar di kredensial production
**Effort:** S (30 detik) · **Kategori audit:** 1 · **Dependensi:** —

Di [environment.prod.ts](../src/environments/environment.prod.ts):

```ts
clientId:     '996cc633-23c1-4fb7-a6b6-6fd20dd5051d,'   // ❌ koma DI DALAM kutip
clientSecret: '996cc633-23c1-4fb7-a6b6-6fd20dd5051e,'   // ❌ sama
```

Nilai yang dikirim ke `/connect/token` menjadi `"...5051d,"` — bukan GUID valid. Server otorisasi akan menolak dengan `invalid_client`.

**Konsekuensi: tidak ada satu pun user yang bisa login di production. Aplikasi mati total di menit pertama.**

- [ ] Hapus koma di kedua string

**AC:** Login berhasil menggunakan build production melawan endpoint production.

> **Perbaikan tercepat dan berdampak terbesar di seluruh daftar.** Kerjakan lebih dulu dari apa pun. Ini juga bukti nyata bahwa build production belum pernah diuji melawan endpoint production.

---

### `CRIT-02` · 🔥 Keluarkan `client_secret` dari browser + rotasi kredensial
**Effort:** S (rotasi) / L (perbaikan arsitektural) · **Kategori audit:** 3 · **Dependensi:** `CRIT-01`, koordinasi backend

[auth-api.service.ts:26-33](../src/app/core/services/auth-api.service.ts) menjalankan **OAuth 2.0 Resource Owner Password Credentials grant** langsung dari browser: mengirim `client_id` + `client_secret` + username + password ke `/connect/token`. Secret-nya ada di `environment.prod.ts` → ter-bundle → **bisa dibaca siapa pun lewat DevTools**. Hal sama berlaku di `refreshToken()` [baris 52-56](../src/app/core/services/auth-api.service.ts). Scope produksi (`General-B2C-5Ecd}3+uX3g=%Mxk ...`) ikut bocor, membocorkan struktur otorisasi internal.

Password grant **sudah di-deprecate oleh OAuth 2.1 justru karena kasus seperti ini.**

- [ ] **Segera:** rotasi kredensial `996cc633-...` — sudah masuk git history, anggap kompromi
- [ ] **Pilihan A (direkomendasikan):** pindahkan token exchange ke BFF/reverse proxy yang memegang secret di sisi server
- [ ] **Pilihan B (minimum):** daftarkan client sebagai *public client* (tanpa secret) + Authorization Code dengan PKCE
- [ ] Hapus `clientSecret` dan `scope` dari `environment.prod.ts`

**AC:** `grep -r "clientSecret" dist/` tidak menghasilkan apa pun; login tetap berfungsi.

> Kalau timeline mepet: **rotasi kredensial + Pilihan B** cukup untuk membuka jalan go-live. Pilihan A dijadwalkan sebagai follow-up.

---

### `CRIT-03` · 🔥 Commit konfigurasi server (SPA fallback + kompresi + cache)
**Effort:** S · **Kategori audit:** 7 · **Dependensi:** —

**Tidak ada satu pun artefak konfigurasi server di repo** — sudah dicari menyeluruh: tidak ada `nginx.conf`, `web.config`, `_redirects`, `netlify.toml`, `vercel.json`, `firebase.json`, `.htaccess`, maupun `Dockerfile`. Aplikasi memakai `PathLocationStrategy` dengan route dalam seperti `/product/123` dan `/order-history`.

Tiga kegagalan sekaligus:
1. **Tanpa SPA fallback** → setiap refresh halaman dan setiap link produk yang di-share menghasilkan **404 dari web server**
2. **Tanpa kompresi** → user mengunduh **663,94 kB**, bukan 152,30 kB. Angka "estimated transfer size" di output build **mengasumsikan brotli aktif** — asumsi yang saat ini tidak terpenuhi.
3. **Tanpa cache header** → `index.html` bisa ter-cache selamanya dan user terjebak di versi lama

- [ ] Commit `nginx.conf` (template lengkap ada di Kategori 7 laporan audit) atau konfigurasi platform setara
- [ ] SPA fallback: `try_files $uri $uri/ /index.html;`
- [ ] Kompresi brotli + gzip untuk `text/*`, `application/javascript`, `application/json`, `image/svg+xml`
- [ ] Cache: `index.html` → `no-cache` · JS/CSS ber-hash → `max-age=31536000, immutable` · `media/`+`assets/` → `max-age=86400, must-revalidate`

> Catatan cache: `outputHashing: "bundles"` berarti **hanya JS/CSS yang di-hash** — terverifikasi, `media/boxicons.woff2` tanpa hash. Ini disengaja agar `<link rel="preload">` di `index.html` tetap valid, jadi jangan diubah ke `"all"`; kompensasinya justru lewat cache header berbeda di atas.

**AC:** Refresh langsung di `/product/123` memuat halaman (bukan 404); response header menunjukkan `content-encoding: br`; `index.html` tidak ter-cache.

> **Rasio effort-to-impact tertinggi di seluruh laporan** — satu file menutup empat temuan sekaligus. Ini juga kegagalan go-live SPA yang paling umum dan paling memalukan.

---

### `CRIT-04` · 🔥 Perbaiki mixed content `posApiUrl`
**Effort:** S (frontend) / M (butuh backend) · **Kategori audit:** 1, 3 · **Dependensi:** koordinasi backend

`environment.prod.ts` berisi `posApiUrl: 'http://192.168.1.15:10100/'` — **plain HTTP ke IP LAN privat, di file production.** Fallback hardcoded yang sama juga ada di [b2c-order-api.service.ts:13](../src/app/core/services/b2c-order-api.service.ts).

Browser memblokir request HTTP dari origin HTTPS sebagai mixed content. **Flow order katalog B2C offline akan mati** — dan matinya senyap: `errorInterceptor` hanya menampilkan "Tidak dapat terhubung ke server", sehingga tim akan mengira ini masalah jaringan pelanggan, bukan bug konfigurasi.

- [ ] Sediakan endpoint POS ber-HTTPS dengan hostname publik, atau proxy lewat `apiBaseUrl`
- [ ] Perbarui `environment.prod.ts`
- [ ] Hapus fallback IP hardcoded dari `b2c-order-api.service.ts` (lihat `HIGH-02`)

**AC:** Order katalog B2C berhasil dibuat dari halaman HTTPS production; console bersih dari warning mixed content.

---

### `CRIT-05` · 🔥 Tutup 20 kerentanan high/critical
**Effort:** M · **Kategori audit:** 3, 9 · **Dependensi:** —

`npm audit` menghasilkan **26 kerentanan: 1 critical, 19 high, 3 moderate, 3 low.** Yang paling relevan untuk runtime:

| Paket | Kerentanan |
|---|---|
| `@angular/compiler` | **Two-Way Property Binding Sanitization Bypass (XSS)**, i18n XSS via event-handler attributes |
| `@angular/core` | Hydration DOM Clobbering & Response-Cache Poisoning, i18n XSS |
| `@angular/common` | DoS OOM di `formatDate`, weak 32-bit cache key di `HttpTransferCache` |
| `tar` | **CRITICAL** — path type confusion / DoS |
| `piscina` | Prototype Pollution → RCE |
| `postcss`, `vite`, `undici`, `nanoid`, `ip-address` | Path traversal, header injection, SSRF |

Versi terpasang `21.2.16` masuk range rentan (`<21.2.17`, `<=21.2.18`).

**Kenapa XSS bypass sangat berbahaya di aplikasi ini secara spesifik:** aplikasi merender HTML dari admin via `[innerHTML]` **dan** menyimpan access + refresh token di `localStorage`. Satu XSS berhasil = **pembajakan akun permanen**, bukan sekadar defacement.

- [ ] `npm audit fix`
- [ ] Naikkan Angular ke `21.2.19` atau lebih baru (perubahan patch-level, risiko regresi minimal)
- [ ] `npm audit` ulang sampai high/critical nol
- [ ] Jalankan test + build untuk verifikasi tidak ada regresi

**AC:** `npm audit --audit-level=high` exit code 0; test hijau; build sukses.

---

### `CRIT-06` · 🔥 Bereskan 101 lint error → CI hijau
**Effort:** M · **Kategori audit:** 6 · **Dependensi:** —

`ng lint` menghasilkan **101 problem (101 error, 0 warning).** Karena `.github/workflows/ci.yml` menjalankan `npm run lint` sebagai step wajib, **pipeline `main` dijamin merah** — artinya quality gate sudah lama tidak berfungsi dan tim kemungkinan besar sudah terbiasa mengabaikannya.

Batch cepat (~28 error, bisa selesai dalam satu sesi):

| Rule | Jumlah |
|---|---|
| `@angular-eslint/no-output-native` | 12 |
| `@angular-eslint/no-input-rename` | 9 |
| `@typescript-eslint/no-unused-vars` | 4 |
| `no-useless-assignment` | 3 |

Sisanya:

| Rule | Jumlah | Catatan |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 46 | → `MED-16` (butuh pemahaman domain) |
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

---

### `CRIT-07` · 🔥 Pasang monitoring error (Sentry)
**Effort:** M · **Kategori audit:** 4 · **Dependensi:** —

**Nol monitoring.** Tidak ada Sentry / LogRocket / Application Insights / Datadog. Tidak ada RUM, error tracking, maupun alerting.

Aplikasi ini memproses pembayaran DOKU. Tanpa monitoring, **bug production hanya diketahui saat pelanggan komplain** — dan pada aplikasi transaksional, keterlambatan itu berarti kehilangan uang, bukan sekadar pengalaman buruk.

- [ ] Pasang `@sentry/angular`
- [ ] Hubungkan ke [global-error-handler.ts](../src/app/core/errors/global-error-handler.ts) — slot komentar `// Sentry.captureException(error)` sudah tersedia
- [ ] Hubungkan ke [error.interceptor.ts](../src/app/core/interceptors/error.interceptor.ts) untuk error HTTP
- [ ] Aktifkan release tracking + upload hidden source map (koordinasikan dengan `NTH-06`)
- [ ] Set up alerting untuk error rate di flow checkout
- [ ] **Scrub PII** sebelum dikirim: pastikan token, password, dan data pelanggan tidak ikut terkirim ke Sentry

**AC:** Error yang dilempar sengaja muncul di dashboard Sentry dengan stack trace ter-*unminify*, tanpa data sensitif.

---

### `CRIT-08` · 🔥 Buat halaman 404 & perbaiki `admin-host.guard`
**Effort:** S · **Kategori audit:** 4 · **Dependensi:** —

Tidak ada komponen maupun route 404. `app.routes.ts` ditutup dengan `{ path: '**', redirectTo: '' }`.

Lebih buruk lagi: [admin-host.guard.ts:13](../src/app/core/guards/admin-host.guard.ts) memanggil `router.navigate(['/404'])`, tapi **route `/404` tidak ada** — sehingga jatuh ke wildcard dan pengunjung dilempar ke **homepage toko**. Komentar di guard itu sendiri menyatakan niatnya "tampilkan 404 Not Found", jadi **perilaku aktual bertentangan dengan perilaku yang dimaksud**, dan panel admin tetap discoverable dari domain publik.

- [ ] Buat `NotFoundComponent`
- [ ] Daftarkan route `{ path: '404', loadComponent: ... }`
- [ ] Ubah wildcard menjadi `{ path: '**', loadComponent: NotFoundComponent }` — **bukan redirect**, karena redirect merusak SEO dan menyembunyikan broken link dari monitoring
- [ ] Verifikasi `admin-host.guard` kini benar-benar menampilkan 404

**AC:** Mengakses `/halaman-ngawur` menampilkan halaman 404 (URL tetap); mengakses `/admin` dari domain publik menampilkan 404, bukan homepage.

---

### `CRIT-09` · 🔥 Keluarkan refresh token dari `localStorage`
**Effort:** L · **Kategori audit:** 3 · **Dependensi:** `CRIT-02`, koordinasi backend

Access token, refresh token, user object, dan cart semuanya disimpan di **`localStorage`** (`SESSION_TOKEN_KEY`, `SESSION_REFRESH_KEY` di [session.util.ts](../src/app/core/auth/session.util.ts); 55 pemakaian `localStorage` di `src`).

`localStorage` dapat dibaca JavaScript mana pun di origin yang sama. Satu XSS — atau satu dependency npm yang dikompromikan — sama dengan **pencurian sesi permanen**, karena refresh token ikut tersimpan. Digabung dengan CVE sanitization bypass di `CRIT-05`, ini bukan risiko teoretis.

- [ ] **Target akhir:** refresh token di cookie `HttpOnly` + `Secure` + `SameSite=Lax`; access token in-memory saja
- [ ] **Mitigasi transisi** (bila backend belum siap):
  - [ ] Jangan simpan **refresh** token di `localStorage`
  - [ ] Perpendek TTL access token
  - [ ] Pasang CSP ketat (`MED-19`)
- [ ] Sesuaikan [auth.interceptor.ts](../src/app/core/interceptors/auth.interceptor.ts) dan `session.util.ts`

**AC:** `localStorage` tidak lagi berisi refresh token; sesi tetap bertahan setelah refresh halaman.

> **Butuh koordinasi backend dan berpotensi jadi task terpanjang di Tier 1.** Bila tidak bisa selesai sebelum go-live, mitigasi transisi (CSP ketat + TTL pendek + refresh token keluar dari `localStorage`) **wajib** dijalankan sebagai pengganti sementara — dan dicatat sebagai risiko yang diterima secara sadar, bukan diabaikan diam-diam.

---

# Rencana Eksekusi *(urutan kerja sebenarnya)*

Dokumen di atas disusun menaik sesuai permintaan. Untuk **pengerjaan**, balik urutannya:

### Sprint 0 — Hari 1 (setengah hari)
Quick win berdampak besar. `CRIT-01` saja sudah menyelamatkan hari go-live.

| Task | Effort |
|---|---|
| `CRIT-01` Koma nyasar kredensial | 30 detik |
| `CRIT-03` Konfigurasi server nginx | S |
| `CRIT-08` Halaman 404 + fix guard | S |
| `HIGH-01` Bug preloading strategy | 5 menit |
| `MED-01` `lang="id"` | 30 detik |

### Sprint 1 — Blocker keamanan & rilis (1–2 minggu)

| Task | Effort |
|---|---|
| `CRIT-02` Rotasi kredensial + keluarkan secret dari browser | S–L |
| `CRIT-04` Mixed content `posApiUrl` | S–M |
| `CRIT-05` `npm audit fix` + bump Angular | M |
| `CRIT-06` 101 lint error → 0 | M |
| `CRIT-07` Sentry | M |
| `CRIT-09` Token storage *(atau mitigasi transisi)* | L |
| `HIGH-02` … `HIGH-05` | S each |
| `HIGH-06` Verifikasi ulang & perbarui skor | S |

**🚦 Gate go-live:** seluruh Tier 1 selesai · `HIGH-06` lulus · skor ≥ 8/10

### Sprint 2 — Pasca-rilis (2–4 minggu)
Seluruh Tier 3, prioritas: `MED-17` (SEO meta) → `MED-14`/`MED-15` (test) → `MED-05` (refresh lock) → `MED-19` (CSP) → sisanya.

### Backlog
Seluruh Tier 4, plus `MED-18` (SSR) sebagai epic tersendiri.

---

## Ringkasan Sebaran Task

| Tier | Jumlah | Effort total | Blocker go-live? |
|---|---|---|---|
| 🚨 **Tier 1 — Kritikal** | 9 | ~2–3 minggu | **Ya** |
| **Tier 2 — Tinggi** | 6 | ~2 hari | Disarankan |
| **Tier 3 — Sedang** | 20 | ~4–6 minggu | Tidak |
| **Tier 4 — Nice-to-Have** | 11 | ~3 hari | Tidak |
| **Total** | **46** | | |

---

## Catatan Penutup

Tiga hal yang layak diingat saat mengerjakan daftar ini:

1. **Kualitas engineering frontend proyek ini sudah baik.** Zoneless, `OnPush` 99/104, `track` 100%, lazy loading menyeluruh, initial bundle 152 kB, alt text 44/44, nol `console.log` liar. Daftar panjang di atas bukan indikasi kode yang buruk — melainkan indikasi bahwa **lapisan antara kode dan pelanggan** (deployment, kredensial, monitoring, SEO) belum digarap.

2. **Tiga temuan akan gagal di hari pertama, bukan minggu ketiga:** `CRIT-01` (tidak ada yang bisa login), `CRIT-03` (refresh halaman = 404), `CRIT-04` (order katalog mati senyap). Ketiganya effort `S`.

3. **`CRIT-06` bukan sekadar kerapian.** Selama CI merah, semua gate lain — test, audit, build — kehilangan makna karena tim berhenti memperhatikan hasilnya. Menghijaukan CI adalah prasyarat agar perbaikan-perbaikan lain tetap bertahan.

---

*Dokumen ini hanya berisi rencana. Tidak ada file sumber yang diubah saat pembuatannya.*
