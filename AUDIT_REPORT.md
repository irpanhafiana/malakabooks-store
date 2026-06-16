# 📊 Audit Report — Angular 21 E-Commerce Frontend

**Proyek:** MalakaBooks Store  
**Tanggal Audit:** 16 Juni 2026  
**Versi Angular:** 21.2.0  
**TypeScript:** 5.9.2 · **RxJS:** 7.8.0 · **Test Runner:** Vitest 4 · **Styling:** Tailwind CSS 4  
**Total Komponen:** ~51  
**Total Service:** 16 (14 API service + 2 utility: `toast`, `alert`)  
**Total Store (Signal):** 7  
**Total Route/Halaman:** 25 route (semua lazy-loaded)  

> ⚠️ **Catatan Metodologi:** Penilaian dilakukan terhadap **best practice Angular 21 yang terdokumentasi** (standalone, signals, `@if`/`@for`, zoneless change detection, `OnPush`, `NgOptimizedImage`, `takeUntilDestroyed`, functional interceptor/guard). **Tidak ada satupun file source code, konfigurasi, atau commit yang diubah selama audit ini** — sesuai instruksi.

---

## 🏗️ Struktur Proyek

```
src/
├── main.ts                         # bootstrapApplication (standalone, tanpa NgModule)
├── index.html
├── styles.css
├── environments/
│   ├── environment.ts              # apiBaseUrl / authUrl / apiUrl (hardcoded IP)
│   └── environment.prod.ts         # ⚠️ identik dengan dev
└── app/
    ├── app.ts                      # Root component (imports: RouterOutlet)
    ├── app.config.ts               # provideRouter + provideHttpClient(authInterceptor)
    ├── app.routes.ts               # 25 route, semua loadComponent (lazy)
    │
    ├── core/
    │   ├── auth/                    # jwt.util.ts, session.util.ts
    │   ├── guards/                  # auth.guard.ts, admin.guard.ts (functional)
    │   ├── interceptors/            # auth.interceptor.ts (Bearer + 401 + expiry)
    │   ├── models/                  # 12 model: product, category, order-status,
    │   │                            #   review, complaint(+status,+payload), user,
    │   │                            #   cart-item, wishlist-item, dashboard-metrics,
    │   │                            #   register-payload
    │   └── services/                # 16 service (lihat daftar di bawah)
    │
    ├── store/                       # 7 signal store
    │   ├── auth.store.ts            order.store.ts        complaint.store.ts
    │   ├── product.store.ts         cart.store.ts         user.store.ts
    │   └── admin-home-address.store.ts
    │
    ├── layouts/
    │   ├── customer-layout/         admin-layout/
    │   ├── inner-page-layout/       auth-layout/
    │
    ├── features/
    │   ├── home/                    product/{product-list, product-detail}/
    │   ├── cart/                    checkout/             wishlist/
    │   ├── profile/                 complaint/
    │   ├── order/{order-history, order-success}/
    │   ├── auth/{login, register, forgot-password}/
    │   └── admin/
    │       ├── dashboard/           login/                reports/
    │       ├── products/{list, form}/   categories/{list, form}/
    │       ├── orders/list/         users/                complaints/{list, form}/
    │       └── home-addresses/{list, form}/
    │
    └── shared/
        ├── ui/                      # 23 komponen UI: badge, button, card, checkbox,
        │                            #   drawer, empty-state, icon, input, modal, radio,
        │                            #   select, skeleton, spinner, table, textarea,
        │                            #   toast-container, pagination, search-bar, price,
        │                            #   product-card, bottom-sheet, masonry-grid
        ├── pipes/                   # truncate.pipe.ts
        ├── directives/              # click-outside.directive.ts
        └── util/                    # csv.util.ts, pagination.util.ts
```

**Service (`core/services/`):** `auth-api`, `product-api`, `category-api`, `cart-api`, `order-api`, `review-api`, `user-api`, `complaint-api`, `address-api`, `admin-home-address-api`, `doku-api`, `dashboard-api`, + utility `toast`, `alert`.

---

## ✅ Temuan Positif

Proyek ini sudah **sangat modern** — sebagian besar pekerjaan migrasi Angular 21 sudah selesai:

- **100% Standalone** — `bootstrapApplication()` di `main.ts`, tidak ada satupun `@NgModule`.
- **100% Lazy Loading** — seluruh 25 route memakai `loadComponent: () => import(...)`. Strategi preloading `PreloadAllModules` untuk navigasi instan setelah render pertama.
- **Control flow baru 100%** — seluruh template memakai `@if` / `@for`; **tidak ditemukan** `*ngIf` / `*ngFor` / `*ngSwitch` yang lama.
- **`@for` selalu memakai `track`** — di semua loop (`track item.id`, `track $index`, dst). Best practice tracking terpenuhi penuh.
- **Reaktivitas berbasis Signals** — `signal()`, `computed()`, `input()`, `output()` dipakai luas; 7 store berbasis signal; **tidak ada `BehaviorSubject`**.
- **Functional interceptor & guard** — `authInterceptor` menambahkan Bearer token, cek expiry, dan menangani 401; `authGuard` + `adminGuard` melindungi seluruh route sensitif.
- **TypeScript strict penuh** — `strict: true` + `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`, `noImplicitReturns`, `noFallthroughCasesInSwitch` diaktifkan di `tsconfig.json`.
- **Caching kategori** — `category-api.service.ts` memiliki cache TTL 5 menit (non-admin), di-invalidasi saat save/delete.
- **Parallel fetching** — dashboard, login, dan checkout memakai `Promise.all` untuk request paralel.
- **Bersih dari debug log** — tidak ada `console.log` tertinggal; hanya `console.error`/`warn` di dalam blok `catch`.
- **Loading state cukup luas** — `SpinnerComponent` + `SkeletonComponent` dipakai di list produk/kategori/order, dashboard, product detail, profile, complaint.

---

## 🚨 Temuan Kritis (Harus Segera Diperbaiki)

### 1. OAuth `client_secret` di-hardcode di frontend
- **File:** `src/app/core/services/auth-api.service.ts` ([Baris 16-17](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/auth-api.service.ts#L16-L17))
- **Masalah:** `client_id` dan `client_secret` (`'MalakaBooks-FE'`) ditulis langsung di kode dan ikut ter-bundle ke JavaScript browser, sehingga **bisa dibaca siapa saja** lewat DevTools.
- **Dampak:** Kebocoran credential OAuth → pihak ketiga dapat meminta token atas nama aplikasi. Ini risiko keamanan tinggi.
- **Rekomendasi:** Gunakan **PKCE (Proof Key for Code Exchange)** / Authorization Code flow tanpa client secret untuk SPA, atau pindahkan pertukaran token ke Backend-for-Frontend (BFF). Frontend publik tidak boleh menyimpan client secret.

### 2. Environment produksi identik dengan development (IP privat, non-HTTPS)
- **File:** `src/environments/environment.prod.ts` ([Baris 1-7](file:///d:/MALAKABOOKS/malakabooks-store/src/environments/environment.prod.ts)) (sama persis dengan `environment.ts`)
- **Masalah:** Keduanya menunjuk ke `http://192.168.1.15:25168` (API) dan `:44310` (auth) — IP jaringan lokal, **HTTP bukan HTTPS**.
- **Dampak:** Build produksi tidak akan berfungsi di luar jaringan lokal; trafik (termasuk token) dikirim tanpa enkripsi → rawan disadap (MITM).
- **Rekomendasi:** Isi `environment.prod.ts` dengan domain produksi ber-HTTPS yang sebenarnya. Pertimbangkan injeksi config saat runtime agar URL tidak perlu di-hardcode per-build.

### 3. 12 subscription tanpa unsubscribe (memory leak)
- **File & method:**
  | File | Lokasi | Jumlah |
  |---|---|---|
  | `features/checkout/checkout.component.ts` | `ngOnInit` (valueChanges) | 4 |
  | `features/profile/profile.component.ts` | `ngOnInit` (valueChanges) | 2 |
  | `features/admin/home-addresses/form/home-addresses-form.component.ts` | `ngOnInit` (valueChanges) | 2 |
  | `layouts/admin-layout/admin-layout.component.ts` | `constructor` (router.events) | 1 |
  | `layouts/inner-page-layout/inner-page-layout.component.ts` | `constructor` (router.events) | 1 |
  | `features/product/product-detail/product-detail.component.ts` | `ngOnInit` (paramMap) | 1 |
  | `features/order/order-success/order-success.component.ts` | `ngOnInit` (queryParams) | 1 |
- **Masalah:** `subscribe()` dipanggil tanpa `unsubscribe`/`takeUntilDestroyed`. Subscription tetap hidup setelah komponen di-destroy.
- **Dampak:** Memory leak yang menumpuk selama navigasi (kritis untuk e-commerce yang dipakai lama, terutama di mobile). Callback lama bisa berjalan ganda.
- **Rekomendasi:** Gunakan `DestroyRef` dan `takeUntilDestroyed` atau konversi RxJS stream ke Signals menggunakan `toSignal()`.
  *Contoh Perbaikan:*
  ```typescript
  import { DestroyRef, inject } from '@angular/core';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

  export class CheckoutComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    ngOnInit() {
      this.provinceControl.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(async (provinceId) => { ... });
    }
  }
  ```

### 4. Setup Testing Vitest Rusak (0% Passing)
- **File:** `src/app/app.spec.ts` ([Baris 1-24](file:///d:/MALAKABOOKS/malakabooks-store/src/app/app.spec.ts))
- **Masalah:** Uji coba menggunakan `npx vitest run` gagal total karena:
  1. `ReferenceError: describe is not defined` (tidak ada setup globals untuk Vitest).
  2. `Error: Need to call TestBed.initTestEnvironment() first` (belum ada file inisialisasi lingkungan pengujian Angular).
  3. `Error: Component 'App' is not resolved: templateUrl: ./app.html` (Vitest tidak dapat membaca relative template path karena berjalan langsung di Node/JSDOM).
  4. Judul pengujian asersi `"Hello, malakabooks"` di `app.spec.ts` tidak cocok dengan template `app.html` yang hanya berisi `<router-outlet></router-outlet>`.
- **Dampak:** Tidak ada unit test yang dapat berjalan. Kualitas kode tidak terjamin secara otomatis.
- **Rekomendasi:**
  1. Buat `vitest.config.ts` di root untuk mengonfigurasi plugin Angular compiler dan mengaktifkan globals.
  2. Buat `src/test-setup.ts` untuk memanggil `setupZonelessTestEnv()` (karena menggunakan Signals/Zoneless).
  3. Perbaiki file `app.spec.ts` agar sesuai dengan template aslinya.

---

## ⚠️ Temuan Major (Penting Diperbaiki)

### 5. Tidak ada komponen yang memakai `ChangeDetectionStrategy.OnPush`
- **File:** seluruh 51 komponen.
- **Dampak:** Change detection berjalan lebih sering dari yang diperlukan. Karena state sudah berbasis signal, ini adalah *quick win* performa yang terlewat.
- **Rekomendasi:** Tambahkan `changeDetection: ChangeDetectionStrategy.OnPush` mulai dari komponen `shared/ui/*` (paling aman) lalu ke feature components.

### 6. Belum Zoneless secara Konfigurasi
- **File:** `src/app/app.config.ts` ([Baris 8-17](file:///d:/MALAKABOOKS/malakabooks-store/src/app/app.config.ts#L8-L17))
- **Masalah:** Meskipun `zone.js` tidak ada di dependencies `package.json`, konfigurasi `provideZonelessChangeDetection()` belum didaftarkan di providers.
- **Dampak:** Tidak memanfaatkan default Angular 21 (zoneless) secara optimal, berpotensi menyebabkan perilaku tidak terduga karena ketiadaan runtime Zone.js tanpa pemanggilan provider zoneless.
- **Rekomendasi:** Daftarkan `provideZonelessChangeDetection()` di `app.config.ts`.
  ```typescript
  import { provideZonelessChangeDetection } from '@angular/core';
  export const appConfig: ApplicationConfig = {
    providers: [
      provideZonelessChangeDetection(),
      provideBrowserGlobalErrorListeners(),
      ...
    ]
  };
  ```

### 7. Tidak ada SSR/SSG
- **Masalah:** Tidak ada setup `@angular/ssr` dalam proyek.
- **Dampak:** Halaman product listing & product detail dirender penuh di client → **SEO lemah** (mesin pencari kesulitan mengindeks buku) dan **LCP lambat** (pengguna harus menunggu JS di-download sebelum melihat buku).
- **Rekomendasi:** Tambahkan SSR (`ng add @angular/ssr`) minimal untuk route publik `product` dan `product/:id`.

### 8. Tidak memakai `NgOptimizedImage` & Gambar Tanpa Dimensi/Lazy-load
- **File:** `cart.component.html`, `checkout.component.html`, `order-history.component.html`, `product-detail.component.html`
- **Masalah:** Gambar produk menggunakan tag `<img>` biasa dengan `[src]`, tanpa attributes `loading="lazy"`, `width`, atau `height`.
- **Dampak:** **Layout shift (CLS)** yang merusak UX visual saat loading gambar. Bandwidth boros tanpa lazy-load.
- **Rekomendasi:** Gunakan directive `NgOptimizedImage` (`ngSrc` + `width`/`height` + `priority` untuk main image).

### 9. `checkout.component.ts` Terlalu Gemuk (432 baris)
- **File:** `features/checkout/checkout.component.ts` ([Baris 1-432](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/checkout/checkout.component.ts))
- **Masalah:** Logika bisnis (cascade provinsi→kota→kecamatan, kalkulasi tarif, resolusi alamat, integrasi Doku) bercampur di dalam komponen.
- **Dampak:** Sulit di-test, sulit dirawat, melanggar Single Responsibility Principle (SRP).
- **Rekomendasi:** Pindahkan logika wilayah dan tarif ke service terpisah (`ShippingService`), pecah UI menjadi sub-komponen (`<address-form>`, `<shipping-selector>`, `<payment-method>`).

### 10. Penggunaan `any` Berlebihan (48+ kemunculan)
- **File:** Terkonsentrasi di `order-api.service.ts`, `user-api.service.ts`, `category-api.service.ts`, `product-api.service.ts`
- **Masalah:** Respon API dideklarasikan sebagai `any` (misal `HttpClient.get<any>`) dan dimutasi lewat `.map((x: any) => ...)`.
- **Dampak:** Type safety hilang pada boundary data eksternal — area paling rawan bug runtime jika struktur API berubah.
- **Rekomendasi:** Buat interface DTO (Data Transfer Object) untuk setiap respon API (seperti `CategoryResponse`, `ProductDto`) dan gantikan `any`.

---

## 💡 Temuan Minor (Nice to Have)

- **Sisa `@Input()`/`@Output()` lama** di `features/admin/home-addresses/form/home-addresses-form.component.ts` — komponen lain sudah memakai `input()`/`output()`. Selaraskan.
- **Paralelisme terlewat** di `product-detail.component.ts` — produk lalu review dimuat sekuensial; gabungkan dengan `Promise.all` untuk mempercepat loading.
- **Password demo** `ChangeMe123!` di `features/auth/login/login.component.ts` — hapus sebelum produksi.
- **Caching tambahan** — produk & user di-refetch tiap kunjungan; pertimbangkan cache signal seperti pada kategori.
- **`origin_code` di-hardcode** (`'32.71.10.8'`, Jakarta Barat) di `checkout.component.ts` — pindahkan ke file konfigurasi environment.
- **Overlap tanggung jawab** — `CartApi`+`CartStore`, `OrderApi`+`OrderStore`, `AddressApi`+`UserApi` (alamat) — perjelas batasan tanggung jawab.

---

## 📁 AUDIT PENAMAAN FILE & FOLDER (WAJIB)

### Checklist Penamaan
- [x] **Kebab-Case:** 100% file source code menggunakan kebab-case (misal `product-card.component.ts`, `auth-api.service.ts`).
- [x] **Suffix Component:** Nama component diakhiri dengan `.component.ts` secara konsisten.
- [x] **Suffix Service:** Nama service diakhiri dengan `.service.ts` secara konsisten.
- [x] **Interface Naming:** Nama interface models (seperti `Product`, `Category`) konsisten tanpa prefix `I`, sesuai dengan guideline TypeScript modern.
- [❌] **Folder Generic:** Ada folder `src/app/shared/util/` yang terlalu generic; sebaiknya file utilitas dikelompokkan berdasarkan fungsinya atau disatukan ke helper domain jika spesifik.
- [❌] **Mixed Responsibility:** Folder `src/app/core/services/` mencampur service API dengan service utility non-API seperti `toast.service.ts` dan `alert.service.ts`.
- [❌] **SRP Violation:** File `users-crud.component.ts` mencampur visual list, modal form, dan logika edit di dalam satu file komponen tanpa dipisah.

### Struktur Angular 21 Ideal
Untuk kerapihan arsitektur modular berbasis feature, berikut rekomendasi reorganisasi direktori:
```text
src/
 ├── core/
 │    ├── auth/
 │    ├── guards/
 │    ├── interceptors/
 │    ├── models/
 │    └── services/                  # KHUSUS REST API services saja
 ├── shared/
 │    ├── components/                # Komponen UI umum/reusable (button, badge)
 │    ├── directives/
 │    ├── pipes/
 │    └── services/                  # Utility services (toast, alert, logger)
 ├── features/
 │    ├── home/
 │    ├── products/                  # Dikelompokkan per modul e-commerce
 │    │    ├── components/           # RatingStars, ProductCard, ProductImage
 │    │    ├── pages/                # product-list, product-detail
 │    │    └── services/             # product-specific logic
 │    ├── cart/
 │    ├── checkout/
 │    └── auth/
 ├── layout/
 ├── app.routes.ts
 └── app.config.ts
```

---

## 🧠 AUDIT ARSITEKTUR FRONTEND

### Feature Boundary
- **Coupling Tinggi:** Logika feature `checkout` sangat terikat dengan detail internal Doku payment dan formatting kurir Simasrim. Seharusnya komponen checkout hanya menerima user input dan memanggil service orkestrator.
- **Circular Dependency:** Tidak ditemukan circular dependency yang memblokir build, tetapi import file relative `../../../../` sangat panjang.
- **Rekomendasi:** Gunakan TypeScript paths aliases di `tsconfig.json` (misal `@core/*`, `@shared/*`, `@store/*`) untuk menyederhanakan import dan memperjelas feature boundary.

### Dependency Analysis
- **`tslib` (Deprecated/Unused):** Dependency `tslib` di `package.json` bisa dihapus karena Angular CLI modern melakukan penanganan pembantu pembungkusan modern secara internal.
- **RxJS vs Signals:** State store (`CartStore`, `ProductStore`) sudah menggunakan Signals, namun pemanfaatan reaktivitas internal components masih didominasi subscription RxJS manual yang rawan memory leak.

---

## 🧪 AUDIT TESTING

### Unit Test Coverage
| Area | File Pengujian | Coverage Estimasi | Status |
|---|---|---|---|
| Components | Tidak ada | 0% | ❌ Tanpa Test |
| Services | Tidak ada | 0% | ❌ Tanpa Test |
| Guards | Tidak ada | 0% | ❌ Tanpa Test |
| Interceptors | Tidak ada | 0% | ❌ Tanpa Test |
| Pipes | Tidak ada | 0% | ❌ Tanpa Test |

### E-Commerce Critical Flow Coverage
- **Login Flow:** 0% (Tidak ada pengujian unit/E2E).
- **Product Listing & Detail:** 0%.
- **Add To Cart:** 0%.
- **Checkout & Payment:** 0% (Sangat berisiko tinggi untuk e-commerce jika ada perubahan tarif kurir atau API Doku).

### Analisis Kegagalan Vitest
Vitest gagal karena tidak menemukan test runner environment Angular global.
**Rekomendasi Perbaikan:**
1. Tambahkan `vitest.config.ts` di root:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import angular from '@analogjs/vite-plugin-angular'; // Jika menggunakan Analog, atau plugin Vite standard

   export default defineConfig({
     plugins: [angular()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: ['src/test-setup.ts'],
     },
   });
   ```
2. Buat `src/test-setup.ts`:
   ```typescript
   import 'zone.js';
   import 'zone.js/testing';
   import { TestBed } from '@angular/core/testing';
   import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

   TestBed.initTestEnvironment(
     BrowserDynamicTestingModule,
     platformBrowserDynamicTesting()
   );
   ```

---

## ♿ AUDIT ACCESSIBILITY (A11Y)

Meskipun komponen input generik menggunakan markup `<label [for]>`, terdapat beberapa poin pelanggaran aksesibilitas:
1. **Missing Alt Attributes:** Gambar galeri pada thumbnail detail produk (`product-detail.component.html:60`) dan daftar produk admin (`products-list.component.html:46`) tidak memiliki tag `alt`.
2. **Keyboard Navigability:** Banyak interaksi klik dipasang pada elemen `div` (seperti tombol card detail atau toggle filter) tanpa ditambahkan atribut `tabindex="0"` dan handling event `keydown.enter`/`space`, sehingga pengguna screen-reader/keyboard-only tidak dapat mengkliknya.
3. **Form A11Y:** Input error validation span (`Field is required`) tidak dikaitkan menggunakan `aria-describedby` ke input aslinya.

**Skor Aksesibilitas (A11Y) Estimasi: 65/100**

---

## 🔄 Komponen yang Perlu Dibuat Ulang / Direusable-kan

| Komponen Lama (duplikasi) | Masalah | Solusi Reusable |
|---|---|---|
| Rating bintang | Diduplikasi di `product-detail.html` & `product-card.html` dengan markup berbeda | `RatingStarsComponent` — `input(rating)`, `input(reviewsCount)`, `input(size)` |
| Badge diskon ("Save X%") | Identik di `product-card.html` & `product-list.html` | `DiscountBadgeComponent` — `input(price)`, `input(originalPrice)` |
| Gambar produk + fallback | Diulang di `product-card`, `product-list`, `product-detail` | `ProductImageComponent` — handle `imageError()` + fallback icon + `NgOptimizedImage` |
| Quantity selector (+/−) | Logika & markup berbeda di `cart.html` & `product-detail.html` | `QuantitySelectorComponent` — `model(quantity)`, `input(min/max/stock)` |
| Status badge order | `statusVariant()` disalin di `order-history`, `orders-list`, `dashboard` | `StatusBadgeComponent` — pemetaan status→variant terpusat |
| Address form (cascade wilayah) | Hampir identik di `checkout`, `profile`, `admin/home-addresses/form` | `AddressFormComponent` — form alamat + cascade provinsi/kota/kecamatan reusable |
| Breadcrumb | Markup breadcrumb diulang di inner-page layout | `BreadcrumbComponent` — `input(items)` |

---

## 🔌 API Calls Tanpa Loader (UX Gap)

| File | Method/Function | Tipe Call | Ada Loader? | Rekomendasi (pakai httpResource?) |
|---|---|---|---|---|
| `core/services/cart-api.service.ts` | `addCartItem()` | POST (fire-and-forget) | ❌ Tidak | Button loading + disable saat proses |
| `core/services/cart-api.service.ts` | `removeCartItem()` | DELETE (fire-and-forget) | ❌ Tidak | Inline spinner pada item cart |
| `features/product/product-detail.component.ts` | submit review (`review-api.addReview`) | POST | ❌ Tidak | Button loading + toast hasil |
| `features/checkout/checkout.component.ts` | `getCities()` (valueChanges) | POST | ❌ Tidak | Inline spinner pada dropdown kota |
| `features/checkout/checkout.component.ts` | `getDistricts()` (valueChanges) | POST | ❌ Tidak | Inline spinner pada dropdown kecamatan |
| `features/checkout/checkout.component.ts` | `resolveDistrictIdForAddress()` | GET×N sekuensial | ❌ Tidak | Overlay loading saat resolusi alamat |
| `core/services/auth-api.service.ts` | `loginAndGetToken()` | POST | ⚠️ Sebagian | Kelola state loading konsisten di store |
| `core/services/user-api.service.ts` | `register()` | POST | ⚠️ Sebagian | Pastikan button register punya loading state |
| (Global) | semua HTTP via `authInterceptor` | — | ❌ Tidak | Tambah **loading interceptor global** (top-bar/overlay) |
| Banyak service | fallback `catch → return []` | — | ❌ N/A | Bedakan **error-state** dari **empty-state** di UI |

*Rekomendasi Modern:* Untuk call yang bersifat query/data-fetching, gunakan `httpResource()` dari Angular 19.1+ yang menyediakan property reaktif `.isLoading()` dan `.error()` bawaan untuk mereduksi kode boilerplate manual.

---

## 📊 BERIKAN SKOR AKHIR PROYEK

| Kategori | Skor | Catatan |
|-----------|------|---------|
| **Arsitektur** | 75/100 | Standalone & routing rapi, tapi coupling checkout tinggi. |
| **Performa** | 70/100 | Signals dipakai, tapi nihil OnPush, SSR, dan optimalisasi gambar. |
| **Reusability** | 60/100 | Banyak markup UI domain e-commerce yang diduplikasi manual. |
| **Maintainability** | 65/100 | Strict TS, tapi any type tersebar luas dan unit test rusak. |
| **Security** | 40/100 | Client secret terekspos; API produksi memakai IP lokal via HTTP. |
| **Accessibility** | 65/100 | Alt text hilang di beberapa bagian; navigasi keyboard minim. |
| **Angular 21 Compliance** | 80/100 | Fitur Signals, Control Flow, Standalone terpenuhi. Belum zoneless. |

### Final Score
**TOTAL: 65/100**

### Grade
**C (70-79 / Cukup Baik dengan Area Perbaikan Kritis di Sisi Keamanan & Testing)**

---

## 🎯 MODE EKSEKUSI AUDIT

Berikut tabel rencana eksekusi audit berdasarkan dampak perbaikan terbesar (Impact) dibandingkan dengan usaha pengerjaan (Effort):

| Prioritas | Task | Impact | Effort | Score (Impact × Effort)* |
|------------|--------|--------|--------|--------|
| **Critical** | Perbaiki `environment.prod.ts` (gunakan HTTPS & Domain Nyata) | High | Low | 10/10 |
| **Critical** | Hapus password demo `ChangeMe123!` dari login component | High | Low | 10/10 |
| **Critical** | Perbaiki 12 Memory Leak (gunakan `takeUntilDestroyed` atau `toSignal`) | High | Low | 10/10 |
| **Critical** | Hapus OAuth `client_secret` dari frontend (migrasi ke PKCE/BFF) | High | Medium | 9/10 |
| **Major** | Buat konfigurasi Vitest (`vitest.config.ts` & `test-setup.ts`) agar unit test bisa berjalan | High | Medium | 8/10 |
| **Major** | Terapkan `ChangeDetectionStrategy.OnPush` di semua komponen | High | Medium | 8/10 |
| **Major** | Tutup gap UX Loader pada aksi add-to-cart, review, dan dropdown checkout | Medium | Low | 8/10 |
| **Major** | Migrasi gambar ke `NgOptimizedImage` untuk optimasi Core Web Vitals | High | Medium | 8/10 |
| **Major** | Pecah `checkout.component.ts` ke service + sub-komponen (refactor SRP) | Medium | Medium | 7/10 |
| **Major** | Buat komponen reusable domain (RatingStars, QuantitySelector, dll) | Medium | Medium | 7/10 |
| **Minor** | Hilangkan type `any` di API response (buat strict model interface DTO) | Medium | Medium | 6/10 |
| **Minor** | Aktifkan Zoneless Change Detection (`provideZonelessChangeDetection`) | High | High | 5/10 |
| **Minor** | Tambah SSR/SSG untuk halaman produk (`@angular/ssr`) | High | High | 5/10 |

*\*Catatan Matrix: Skor ditentukan dari perpaduan prioritas bisnis, tingkat keamanan, dan kecepatan pengerjaan (Quick Wins vs Strategic Improvements).*

---

## 📋 Task Planning — Prioritas Perbaikan

### 🔴 Sprint 1 — Critical Fixes (Minggu 1-2)
*Quick wins dan perbaikan celah keamanan kritis.*
1. [ ] **Hapus client_secret dari frontend** — pindah ke PKCE / BFF — `core/services/auth-api.service.ts`
2. [ ] **Perbaiki environment.prod.ts** — domain HTTPS produksi nyata — `src/environments/environment.prod.ts`
3. [ ] **Fix 12 memory leak** — gunakan `takeUntilDestroyed` / `toSignal` — `checkout`, `profile`, `home-addresses-form`, `admin-layout`, `inner-page-layout`, `product-detail`, `order-success`
4. [ ] **Hapus password demo** `ChangeMe123!` — `features/auth/login/login.component.ts`
5. [ ] **Buat konfigurasi Vitest runner** agar dapat menguji asersi secara lokal dan otomatis.

### 🟠 Sprint 2 — Performance & UX (Minggu 3-4)
*Peningkatan Core Web Vitals dan kelancaran checkout flow.*
1. [ ] **Loader interceptor global** + top-bar/overlay untuk semua HTTP
2. [ ] **Tutup gap loader** submit review, cart add/remove, dropdown cascade checkout
3. [ ] **Bedakan error-state vs empty-state** di komponen (jangan kembalikan `[]` secara tersembunyi)
4. [ ] **Migrasi gambar ke `NgOptimizedImage`** + set `width`/`height` + `loading="lazy"` — `cart`, `checkout`, `order-history`, `product-detail`
5. [ ] **Paralelkan** load produk+review di `product-detail` dengan `Promise.all`

### 🟡 Sprint 3 — Refactor & Reusability (Minggu 5-6)
*Peningkatan maintainability kode jangka panjang.*
1. [ ] **Pecah `checkout.component.ts`** ke service + sub-komponen
2. [ ] **Buat komponen reusable**: `RatingStars`, `DiscountBadge`, `ProductImage`, `QuantitySelector`, `StatusBadge`, `AddressForm`, `Breadcrumb`
3. [ ] **Hilangkan `any`** — definisikan interface DTO untuk envelope API (`order/user/category/product-api`)
4. [ ] **Selaraskan `@Input()` lama → `input()`** — `home-addresses-form.component.ts`
5. [ ] **Pindahkan `origin_code` hardcoded** ke konfigurasi

### 🟢 Sprint 4 — Modern Angular 21 Migration (Minggu 7-8)
*Optimalisasi framework dan aktivasi zoneless.*
1. [ ] **Terapkan `ChangeDetectionStrategy.OnPush`** di semua komponen (mulai dari `shared/ui/*`)
2. [ ] **Aktifkan Zoneless** `provideZonelessChangeDetection()` setelah OnPush diverifikasi
3. [ ] **Tambah SSR/SSG** untuk route `product` & `product/:id` (`@angular/ssr`)
4. [ ] **Evaluasi Signal Forms** (experimental) untuk form besar (checkout/profile)

---

## 📈 Estimasi Dampak Setelah Perbaikan

| Metrik | Sebelum (estimasi) | Setelah (estimasi) | Dampak Bisnis |
|---|---|---|---|
| **Bundle awal** | ~500 KB (budget warning) | Lebih kecil (< 400 KB) | Loading halaman pertama lebih instan |
| **First Contentful Paint / LCP** | Lambat (CSR penuh, gambar tanpa dimensi) | Sangat cepat (dengan SSR & `NgOptimizedImage`) | Konversi e-commerce naik, bounce rate turun |
| **Cumulative Layout Shift (CLS)** | Tinggi (gambar tanpa width/height) | Mendekati 0 | Tampilan halaman stabil, UX nyaman |
| **Change Detection Cycles** | Sangat sering (Zone.js memantau semua event browser) | Minimal (Zoneless + OnPush) | Hemat baterai pada perangkat mobile pembeli |
| **Memory leak (subscription)** | 12 titik leak | 0 | Aplikasi stabil tidak crash meski dipakai berbelanja lama |
| **Komponen Reusable** | ~23 UI generik | +7 domain (rating, badge, qty, status, address, dst) | Kecepatan pengembangan fitur baru naik |
| **Penggunaan `any`** | 48+ kemunculan | Mendekati 0 | Pencegahan error `undefined` saat runtime |
| **API Calls tanpa loader** | ~9 titik | 0 | Pembeli tidak bingung apakah klik tombolnya berhasil atau tidak |
| **Keamanan Credential** | `client_secret` terekspos, API HTTP | PKCE/BFF, HTTPS | Transaksi aman, data pelanggan terlindungi |
