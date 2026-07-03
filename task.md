# 📋 Task Perbaikan — Audit Angular MalakaBooks Store

> Dibuat dari hasil audit lapisan Angular (`src/app/**`) — Angular 21, standalone, zoneless, signals.
> Setiap task punya: **ID**, **severity**, **effort** (S/M/L), **lokasi file**, dan **checklist**.
> Kerjakan berurutan per Fase. Centang `[x]` bila selesai.

**Legenda severity:** 🔴 Critical/High · 🟠 Medium · 🟡 Low
**Legenda effort:** S = jam–hari · M = beberapa hari · L = minggu / butuh koordinasi backend

**Skor awal:** Standarisasi 7.5 · Efisiensi 8 · Security 5 · Reusable 6.5 · Dead Code 6 · **Total 6.6/10**

---

## ✅ Progress Tracker

- [ ] **Phase 1 — Critical Fixes** (SEC1, SEC3, D1, D2, D3)
- [ ] **Phase 2 — Refactor Struktural** (SEC2, S1, R1, R2, R3, E1)
- [ ] **Phase 3 — Optimization & Polish** (E2, E3, E4, S2–S7, R4, R5, SEC4, SEC5, SEC6, D4)
- [ ] **Phase 4 — Tooling & Pencegahan** (ESLint, Prettier CI, Husky, Bundle Analyzer, Knip, SonarQube)

---

# 🚀 PHASE 1 — CRITICAL FIXES (Sprint 1)

> Hentikan "pendarahan": security + kode yang akan rusak di produksi + dead code.

## [SEC1] 🔴 Pindahkan URL API / IP internal yang hardcoded ke environment+service — `S`
Hardcode `http://192.168.1.15:25168/...` (plain HTTP + IP LAN) akan **rusak di build produksi** & membocorkan topologi internal.

- [ ] `src/app/features/tracking/tracking.component.ts:22` — hapus URL hardcoded (lihat juga D2, komponen ini kemungkinan dihapus)
- [ ] `src/app/features/profile/profile.component.ts:151` — pindahkan ke method di `user-api.service.ts` memakai `environment.apiBaseUrl`
- [ ] `src/app/core/services/external-message.service.ts:13` — ganti ke `environment.apiBaseUrl`
- [ ] Pastikan semua request lewat `HttpClient` + service agar `authInterceptor` otomatis memasang token
- [ ] Grep ulang: `grep -rn "192.168\|http://localhost" src/app` harus bersih (kecuali environment)

```ts
// AFTER — contoh di user-api.service.ts
getExternalProfile(phone: string) {
  return this.http.get<ExternalProfile>(`${environment.apiBaseUrl}/customer/Users/${phone}/profile`);
}
```

## [SEC3] 🟠 Hilangkan `client_secret` OAuth dari bundle frontend — `S`
`client_secret: 'MalakaBooks-FE'` ter-bundle ke klien = anti-pattern OAuth public client.

- [ ] `src/app/core/services/auth-api.service.ts:19-20` (login) & `:45-46` (refresh) — koordinasi dgn backend agar `MalakaBooks-FE` didaftarkan sebagai **public client** tanpa secret
- [ ] Hapus `body.set('client_secret', ...)` setelah backend siap
- [ ] (Roadmap) rencanakan migrasi ke Authorization Code + PKCE

## [D1] 🔴 Hapus file stub mati `radio-indicator.ts` — `S`
Stub generator CLI (`<p>radio-indicator works!</p>`), tidak pernah di-import (checkout memakai `radio-indicator.component.ts`).

- [ ] Hapus `src/app/shared/ui/radio-indicator/radio-indicator.ts`
- [ ] Verifikasi build masih hijau: `ng build`

## [D2] 🔴 Selesaikan atau hapus komponen debug `tracking` — `S`
Hanya `console.log` respons & menyuruh user "buka Console (F12)". Bukan fitur nyata, tapi ter-route dengan `authGuard`.

- [ ] Putuskan: implementasikan UI tracking sungguhan **atau** hapus
- [ ] Jika hapus: `src/app/features/tracking/tracking.component.ts` + entri rute `tracking` di `src/app/app.routes.ts`
- [ ] Cek tidak ada link/navigasi ke `/tracking` yang menggantung

## [D3] 🟠 Bersihkan 64 statement `console.*` — `S`
Log dev tertinggal; sebagian membocorkan payload (respons DOKU, order).

- [ ] `src/app/features/order/order-history/order-history.component.ts:41`
- [ ] `src/app/features/profile/profile.component.ts:158` (dan error handler)
- [ ] `src/app/core/services/auth-api.service.ts` (beberapa `console.error`)
- [ ] `src/app/store/auth.store.ts` (`console.error('Registration error')`)
- [ ] Sisir sisanya: `grep -rn "console\." src/app --include=*.ts`
- [ ] Ganti yang perlu dengan logger terpusat; sisanya hapus
- [ ] Aktifkan rule ESLint `no-console` (lihat Phase 4) agar tak berulang

---

# 🔧 PHASE 2 — REFACTOR STRUKTURAL (Sprint 2–3)

## [SEC2] 🔴 Strategi penyimpanan token (access + refresh) — `L` (butuh backend)
JWT access + refresh token di `localStorage` → rentan pencurian via XSS.

- [ ] Diskusi dgn backend: pindahkan **refresh token** ke cookie `HttpOnly` + `SameSite=Strict` + `Secure`
- [ ] Jika localStorage tetap dipakai: perpendek lifetime access token + rotasi refresh token
- [ ] Titik yang terpengaruh: `src/app/store/auth.store.ts`, `src/app/core/auth/session.util.ts`, `src/app/core/interceptors/auth.interceptor.ts`
- [ ] Pastikan `clearSession()` (`auth.interceptor.ts:12`) tetap membersihkan semua artefak sesi

## [S1] 🔴 Eliminasi pemakaian `any` (107 lokasi) — `M–L`
`strict:true` aktif tapi manfaatnya hilang karena `any` masif.

- [ ] Buat model: `Province`, `City`, `District`, `CourierService`, `TokenResponse`, `ExternalProfile`
- [ ] `src/app/features/profile/profile.component.ts:100` — `districts = signal<District[]>`
- [ ] `src/app/features/order/detail-shipment/detail-shipment.component.ts` — `trackingData = signal<TrackingData>`
- [ ] `src/app/core/services/auth-api.service.ts:27,54` — ganti `http.post<any>` dgn `TokenResponse`
- [ ] `src/app/core/services/shipping.service.ts:12-15` — `signal<Province[]>`, dst
- [ ] Sisir: `grep -rn ": any\b\|<any>\|as any" src/app --include=*.ts`
- [ ] Setelah bersih, tegakkan rule `@typescript-eslint/no-explicit-any` (Phase 4)

```ts
// AFTER
export interface District { region_code: string; district_name: string; subdistrict_name?: string; }
districts = signal<District[]>([]);
```

## [R1] 🟠 Ekstrak komponen cascade wilayah reusable — `M`
Wiring Provinsi→Kota→Kecamatan (subscribe `valueChanges` + reset child + `*Options` computed) terduplikasi di ≥3 tempat.

- [ ] Sumber duplikasi:
  - `src/app/features/checkout/checkout.component.ts:171-213`
  - `src/app/features/profile/profile.component.ts:175-209`
  - `src/app/features/admin/home-addresses/form/home-addresses-form.component.ts:66-100`
- [ ] Buat `<app-region-selector>` (implement `ControlValueAccessor`) atau directive cascade
- [ ] Manfaatkan `ShippingService` yang sudah ada sebagai sumber data
- [ ] Ganti ketiga komponen memakai komponen baru

## [R2] 🟠 DRY sinkronisasi user di AuthStore — `S`
Blok `localStorage.setItem(SESSION_USER_KEY, ...) + state.update` diulang identik ≥5 kali.

- [ ] `src/app/store/auth.store.ts` — buat helper `private syncUser(user: User)`
- [ ] Terapkan di: `login`, `updateProfile`, `addAddress`, `updateAddress`, `deleteAddress`
- [ ] Gunakan kembali `persistSession()` yang sudah ada secara konsisten

```ts
private syncUser(user: User) {
  const token = this.token() ?? '';
  const userWithToken = { ...user, token };
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userWithToken));
  this.state.update(s => ({ ...s, user: userWithToken }));
}
```

## [R3] 🟠 Model wilayah bersama (menutup S1 untuk data region) — `S`
`provinces/cities/districts = signal<any[]>` didefinisikan ulang di banyak file.

- [ ] Pindahkan model region ke `src/app/core/models/` (mis. `region.model.ts`) + export via `models/index.ts`
- [ ] Pakai di `shipping.service.ts:12-15` + checkout + profile + home-addresses-form

## [E1] 🟠 Ganti `PreloadAllModules` dengan custom preloading — `M`
Semua chunk lazy (termasuk seluruh modul admin) di-preload untuk setiap pengunjung customer.

- [ ] `src/app/app.config.ts:16` — ganti `withPreloading(PreloadAllModules)`
- [ ] Implementasikan `PreloadingStrategy` kustom (preload hanya rute customer bertanda `data: { preload: true }`) atau adopsi quicklink
- [ ] Verifikasi bundel admin tidak lagi ikut terunduh di sisi customer (Bundle Analyzer)

---

# 🎨 PHASE 3 — OPTIMIZATION & POLISH (Sprint 4)

## RxJS & Change Detection

- [ ] **[E2] 🟠 `S`** `src/app/features/order/detail-shipment/detail-shipment.component.ts:182` — `route.paramMap.subscribe` bungkus `takeUntilDestroyed(destroyRef)` atau ganti `toSignal`
- [ ] **[E3] 🟡 `S`** `src/app/core/services/animation-state.service.ts:10` — `router.events.subscribe` tambahkan `takeUntilDestroyed` demi konsistensi
- [ ] **[E4] 🟡 `S`** `src/app/shared/ui/search-bar/search-bar.component.ts:29` — turunkan `debounceTime(1000)` → `300–400ms`
- [ ] **[S3] 🟡 `S`** `src/app/shared/ui/search-bar/search-bar.component.ts:23` — ganti `Subscription`+`ngOnDestroy` manual ke `takeUntilDestroyed`

## Konsistensi Standar

- [ ] **[S2] 🟠 `S`** `src/app/features/order/detail-shipment/detail-shipment.component.ts:13` — migrasi `*ngIf` → `@if`, hapus `CommonModule`
- [ ] **[S4] 🟡 `S`** Tambah `ChangeDetectionStrategy.OnPush` pada komponen yang belum:
  - [ ] `src/app/layouts/customer-layout/customer-layout.component.ts`
  - [ ] `src/app/shared/ui/map-picker/map-picker.component.ts`
  - [ ] (`tracking` & `radio-indicator.ts` sudah dihapus di Phase 1)
- [ ] **[S5] 🟡 `S`** `src/app/shared/ui/radio-indicator/radio-indicator.component.ts` — standarkan penamaan class (sufiks `Component`)
- [ ] **[S6] 🟡 `S`** Rename konstanta yang salah sufiks:
  - [ ] `src/app/core/constants/auth-constant.service.ts` → `auth.constants.ts`
  - [ ] `src/app/core/constants/endpoint-constant.service.ts` → `endpoint.constants.ts`
- [ ] **[S7] 🟡 `S`** `src/app/features/order/detail-shipment/detail-shipment.component.ts` — pisahkan template inline ke `.html` eksternal

## Reusable & Config

- [ ] **[R4] 🟡 `S`** Pindahkan magic string `'malakabooks_cart'` (`src/app/core/interceptors/auth.interceptor.ts:14` + cart store) ke konstanta di `session.util.ts`
- [ ] **[R5] 🟡 `S`** `src/app/features/home/home.component.ts:42-62` — pindahkan URL banner Unsplash hardcoded ke config/CMS

## Security lanjutan

- [ ] **[SEC4] 🟠 `M`** Sanitasi konten `[innerHTML]`:
  - [ ] `src/app/features/product/product-detail/product-detail.component.html:114` (`description`)
  - [ ] `src/app/features/home/home.component.html:309` (`biography`)
  - [ ] Pastikan sanitasi dilakukan saat SIMPAN; jangan pakai `bypassSecurityTrustHtml`
- [ ] **[SEC5] 🟠 `M`** `src/app/shared/ui/editor/editor.component.ts:147` — `document.execCommand` (deprecated); sanitasi output editor, roadmap ganti ke lib editor modern
- [ ] **[SEC6] 🟡 —** `src/app/core/guards/auth.guard.ts` & `admin.guard.ts` — konfirmasi backend meng-enforce role di setiap endpoint admin (guard klien bukan security boundary)

## Dokumentasi

- [ ] **[D4] 🟡 `S`** `ARCHITECTURE.md` (16 byte, kosong) — isi dengan arsitektur nyata atau hapus

---

# 🛠️ PHASE 4 — TOOLING & PENCEGAHAN

- [ ] **ESLint** — pasang `angular-eslint` + `@typescript-eslint`; aktifkan rules `no-explicit-any`, `no-console`, `no-unused-vars`
- [ ] **Prettier** — integrasikan `.prettierrc` yang sudah ada ke pipeline CI (`prettier --check`)
- [ ] **Husky + lint-staged** — pre-commit hook: blok error lint & `console.*` sebelum commit
- [ ] **Bundle Analyzer** — `ng build --stats-json` + esbuild-visualizer; verifikasi E1 & library berat (`sweetalert2`, `boxicons`, `embla-carousel`) tidak masuk initial bundle
- [ ] **Knip / ts-prune** — deteksi dead code & export tak terpakai otomatis (menangkap kasus tipe D1)
- [ ] **npm audit + Dependabot/Renovate** — pemantauan dependency vuln
- [ ] **SonarQube/SonarCloud** — deteksi duplikasi (R1/R2) & code smell berkelanjutan

---

# 📌 Ringkasan Prioritas (Quick Reference)

| ID | Severity | Effort | Kategori | Fase |
|----|:---:|:---:|----------|:---:|
| SEC1 | 🔴 | S | Security — URL hardcoded | 1 |
| SEC3 | 🟠 | S | Security — client_secret | 1 |
| D1 | 🔴 | S | Dead code — file stub | 1 |
| D2 | 🔴 | S | Dead code — komponen debug | 1 |
| D3 | 🟠 | S | Dead code — console.* | 1 |
| SEC2 | 🔴 | L | Security — token storage | 2 |
| S1 | 🔴 | M–L | Standarisasi — hapus `any` | 2 |
| R1 | 🟠 | M | Reusable — cascade wilayah | 2 |
| R2 | 🟠 | S | Reusable — sync session | 2 |
| R3 | 🟠 | S | Reusable — model wilayah | 2 |
| E1 | 🟠 | M | Efisiensi — preloading | 2 |
| E2 | 🟠 | S | Efisiensi — leak subscribe | 3 |
| E3 | 🟡 | S | Efisiensi — cleanup | 3 |
| E4 | 🟡 | S | Efisiensi — debounce | 3 |
| S2 | 🟠 | S | Standarisasi — control flow | 3 |
| S3 | 🟡 | S | Standarisasi — RxJS cleanup | 3 |
| S4 | 🟡 | S | Standarisasi — OnPush | 3 |
| S5 | 🟡 | S | Standarisasi — naming | 3 |
| S6 | 🟡 | S | Standarisasi — naming konstanta | 3 |
| S7 | 🟡 | S | Standarisasi — template eksternal | 3 |
| R4 | 🟡 | S | Reusable — magic string | 3 |
| R5 | 🟡 | S | Reusable — hardcoded banner | 3 |
| SEC4 | 🟠 | M | Security — innerHTML sanitasi | 3 |
| SEC5 | 🟠 | M | Security — editor execCommand | 3 |
| SEC6 | 🟡 | — | Security — guard boundary | 3 |
| D4 | 🟡 | S | Dead code — doc kosong | 3 |

**Total: 26 task** across 5 kategori audit (Standarisasi, Efisiensi, Security, Reusable, Dead Code).
