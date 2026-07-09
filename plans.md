# Rencana Production-Readiness — Frontend (Angular 21)

## Context

MalakaBooks adalah SPA e-commerce (Angular 21, zoneless, signals) yang memproses
pembayaran (DOKU) dan punya panel admin. Audit kode terverifikasi menemukan celah
keamanan auth, cakupan test yang sangat tipis pada jalur kritis, dan beberapa isu
kualitas/performa. Tujuan rencana ini: menyiapkan **layer frontend** untuk produksi.
Scope backend (.NET) dikecualikan atas permintaan user — namun beberapa item FE
(OAuth PKCE, cookie HttpOnly) **butuh dukungan endpoint backend**; ini ditandai
sebagai dependensi, bukan pekerjaan FE murni.

Temuan sudah diverifikasi langsung dari kode (bukan asumsi):

- Token & refresh token di `localStorage` — `auth.store.ts:90-95`, `session.util.ts:14-17`
- `client_secret` hardcoded di FE — `auth-api.service.ts:23,47`
- Resource Owner Password grant (`grant_type: 'password'`) — `auth-api.service.ts:19`
- DOKU `getOne(url)` menerima URL mentah — `doku-api.service.ts:22`
- 11 spec / 157 file; **nol** test di auth.store/interceptor/guards/\*-api.service
- 56 `: any`; 1 `console.log(user)` nyasar di `user-api.service.ts:106`
- CSR-only (`ssr: false`), `inlineCritical: false`, tak ada script `lint`/CI

---

## Fase 0 — Quick wins (risiko rendah, kerjakan lebih dulu)

1. Hapus `console.log(user)` di `user-api.service.ts:106`.
2. Tambah script di `package.json`: `"lint"` (aktifkan `ng lint` / ESLint Angular),
   dan `"test:ci": "ng test --watch=false"`.
3. Tambah `.env`-style dokumentasi: pastikan `environment.prod.ts` tidak
   mengandung nilai dev; verifikasi `originCode` bukan data sensitif.
4. Aktifkan `inlineCritical: true` di `angular.json` (production optimization).

## Fase 1 — Keamanan Auth (PRIORITAS UTAMA)

**Tujuan:** hilangkan token dari localStorage & secret dari bundle FE.

1. **Access token → in-memory only.** Simpan access token di signal `AuthStore`
   (sudah ada `state().token`), berhenti menulis `SESSION_TOKEN_KEY` ke localStorage.
   Ubah `auth.interceptor.ts` agar membaca token dari `AuthStore.token()` bukan
   `localStorage.getItem(SESSION_TOKEN_KEY)`.
2. **Refresh token → cookie HttpOnly** (butuh backend). Sampai backend siap,
   pisahkan penyimpanan refresh token ke satu titik (`session.util.ts`) agar migrasi
   nanti terisolasi. Dokumentasikan sebagai dependensi backend.
3. **Hapus `client_secret` dari FE** — untuk SPA tidak boleh ada secret. Migrasi ke
   **Authorization Code + PKCE** (butuh konfigurasi IdentityServer4 di backend).
   Item FE: ganti alur `loginAndGetToken`/`refreshToken` di `auth-api.service.ts`
   ke flow PKCE (atau minimal `public client` tanpa secret bila backend mengizinkan).
4. **Hardening penyimpanan sesi** — user object di localStorage jangan menyimpan
   `token` (lihat `persistSession`/`syncUser` yang menempelkan `token` ke user).
   Simpan hanya data non-sensitif (id, name, role) untuk UX.

File utama: `auth.store.ts`, `auth.interceptor.ts`, `auth-api.service.ts`,
`session.util.ts`.

## Fase 2 — Keamanan Pembayaran (FE side)

1. `doku-api.service.ts`: berhentikan pola `getOne(url)` dengan URL mentah dari luar.
   Bangun URL dari `EndpointConstants` + parameter tervalidasi saja (cegah
   open-redirect/SSRF via parameter). Verifikasi status akhir pembayaran **selalu**
   lewat endpoint backend yang authoritative, bukan dari query-string redirect DOKU.
2. Audit alur `checkout` → `payment-api.service` untuk memastikan tidak ada
   penentuan "sukses bayar" murni di sisi klien.

## Fase 3 — Type Safety

1. Ganti 56 `: any` — prioritaskan API services (`cart-api`, `order-api`,
   `review-api`, `complaint-api`, `shipping`, `user-api`) dengan interface response
   bertipe (tempatkan di `core/models/`, ekspor via barrel `index.ts`).
2. Aktifkan `strict` TS bila belum penuh; tambah `noImplicitAny` enforcement.

## Fase 4 — Testing jalur kritis

Tulis unit/integration test (Vitest) untuk yang saat ini nol coverage:

1. `auth.store.ts` — login, refresh, logout, loadSession (token expired ± refresh).
2. `auth.interceptor.ts` — attach header, refresh-on-expired, refresh-on-401,
   clear+redirect saat refresh gagal.
3. `admin.guard.ts` & `auth.guard.ts` — izin/redirect.
4. `cart.store.ts` — sync guest→login, kalkulasi total.
5. Minimal 1 alur checkout happy-path end-to-end (sudah ada `checkout.component.spec.ts`
   sebagai basis, perluas).

## Fase 5 — Observability & kualitas rilis

1. Integrasi error tracking (mis. Sentry) di `app.config.ts` + `LoggerService`;
   pastikan level `log` dimatikan di production build.
2. Global `ErrorHandler` untuk menangkap error tak tertangani.
3. Pipeline CI (GitHub Actions): `install → lint → test:ci → build`.

## Fase 6 — Performa & SEO

1. Evaluasi **SSR/prerender (Angular SSR)** untuk halaman produk & landing agar
   terindeks Google + preview social. Keputusan bisnis; siapkan spike terpisah.
2. Tambah meta tags dinamis (`Title`/`Meta` service) di product-detail & home.
3. Review bundle size vs budget (`angular.json` initial 600kB/1MB), lazy-load audit.
4. Header caching & security (CSP, X-Frame-Options) di server statis (Nginx/Vercel).

---

## Verifikasi

- Setiap fase: `npm run build` (production) harus lolos tanpa error budget, dan
  `npm run test` hijau.
- Fase 1: uji manual — login, biarkan access token expired, pastikan refresh jalan
  dan **tidak ada** `malakabooks_session_token` di `localStorage` (cek DevTools →
  Application → Local Storage). Logout membersihkan sesi.
- Fase 2: uji manual alur checkout→DOKU→callback, konfirmasi status final diambil
  dari backend.
- Fase 4: jalankan `npm run test`, target coverage jalur auth/cart/checkout.
- Gunakan skill `/verify` untuk menggerakkan alur yang terdampak end-to-end.

## Catatan dependensi backend (di luar scope, tapi memblokir Fase 1 penuh)

- Cookie `HttpOnly` untuk refresh token — butuh endpoint set-cookie + CORS credentials.
- Authorization Code + PKCE — butuh konfigurasi client di IdentityServer4.
  Sampai ini tersedia, Fase 1 dikerjakan sejauh mungkin di FE (in-memory access token,
  isolasi titik penyimpanan) dan sisanya menunggu backend.
