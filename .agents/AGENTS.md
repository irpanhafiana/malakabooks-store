# AI Agent Rules - Multi-Category E-Commerce Retail Store

Dokumen ini berisi sekumpulan aturan khusus (*rules*) untuk agen AI (seperti Antigravity/AGY) yang bekerja di dalam *workspace* ini. 
**PENTING: Agen AI WAJIB membaca dan mematuhi dokumen ini secara otomatis setiap kali pengguna memulai tugas.**

---

## 1. Arsitektur Proyek & Konvensi Kode (Angular 21)
- **Framework:** Angular 21 (Standalone Components).
- **Rendering:** Murni **Client-Side Rendering (CSR)**. Tidak ada Server-Side Rendering (SSR). Dilarang mengimpor atau menggunakan modul server (`@angular/platform-server`, `express`, dll).
- **Component Pattern:** Wajib menggunakan Standalone Components API (`standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush`).
- **Dependency Injection:** Gunakan fungsi `inject(ServiceName)` pada properti kelas. HINDARI constructor injection kecuali ada alasan teknis khusus.
- **State Management:** Wajib menggunakan **Angular Signals** (`signal`, `computed`, `effect`, `input`, `output`).
  - Manfaatkan Signal Stores yang ada di `src/app/store/` (`ProductStore`, `CartStore`, `UserStore`, `AuthStore`, `PromotionBannerStore`, dll) sebagai pusat manajemen *state*.
  - Hindari penggunaan `RxJS` (`BehaviorSubject`, `Subject`, dsb) jika fitur tersebut dapat diselesaikan dengan Signals.
- **Control Flow Syntax:** WAJIB menggunakan sintaks Control Flow modern Angular (`@if`, `@for`, `@switch`, `@let`). SANGAT DILARANG menggunakan directive lama seperti `*ngIf`, `*ngFor`, `*ngSwitch`.
- **Routing:** Gunakan *lazy loading* terbaru dengan pola `loadComponent: () => import(...).then(c => c.Component)`. Pahami 5 shell layout yang tersedia di `src/app/layouts/` (`admin-layout`, `customer-layout`, `inner-page-layout`, `katalog-layout`, `auth-layout`).

---

## 2. Standar UI, Styling, dan Konsistensi Desain (Tailwind CSS v4)
- **CSS Framework:** Wajib menggunakan **Tailwind CSS v4** *utility classes* langsung di template HTML.
- **Konsistensi Design System & Theme Tokens:**
  - **Primary Color:** Orange (`bg-primary-600`, `text-primary-600`, `border-primary-600` / `#FE7743`). Gunakan variasi `primary-50` hingga `primary-900` yang sudah terdefinisi di `@theme` (`styles.css`).
  - **Accent Color:** Dark Red (`bg-accent-600`, `text-accent-600` / `#B61919`).
  - **Tipografi & Fonts:** Headings (`h1`-`h6`) menggunakan font **Fraunces** (serif), sedangkan body text & UI elements menggunakan **Poppins** / **Inter** (sans-serif).
  - **Konsistensi Visual:** Setiap pembuatan halaman atau komponen baru WAJIB mengikuti tema visual, skema warna, border-radius, spacing, shadow, dan pola layout yang sudah ada di aplikasi. DILARANG membuat gaya visual acak atau inkonsisten dengan desain yang sudah dibangun.
- **Custom CSS:** SANGAT DILARANG membuat file CSS atau SCSS kustom per komponen (`.css` / `.scss`) atau menambah selector CSS kustom baru di `styles.css` / `app.css`, kecuali untuk animasi kompleks atau override plugin khusus.
- **Komponen Eksternal:** 
  - **Dialog / Alert / Konfirmasi:** Wajib menggunakan **SweetAlert2** (`sweetalert2`).
  - **Carousel / Slider:** Wajib menggunakan **Embla Carousel** (`embla-carousel`, `embla-carousel-autoplay`).
  - **Ikon:** Gunakan **Boxicons** (`boxicons`) atau komponen `<app-icon>`.

---

## 3. Katalogs Shared Components, Directives, & Pipes (`src/app/shared/`)
DILARANG membuat komponen UI dasar dari nol jika sudah tersedia di `src/app/shared/`. WAJIB memeriksa dan memanfaatkan katalog komponen berikut:

### UI Components (`src/app/shared/ui/`)
1. **Form & Inputs:** `input`, `textarea`, `select`, `radio`, `radio-indicator`, `admin-input`, `admin-select`, `admin-checkbox`, `admin-search-input`, `search-bar`, `image-uploader`, `quantity-selector`.
2. **Buttons:** `button`, `admin-button`.
3. **Cards & Displays:** `product-card`, `badge`, `status-badge`, `price`, `masonry-grid`, `table`, `empty-state`, `skeleton`, `spinner`, `icon`.
4. **Overlays, Modals, & Navigations:** `modal`, `bottom-sheet`, `drawer`, `pagination`, `tooltip`, `map-picker`, `qty-modal-content`.

### Directives (`src/app/shared/directives/`)
- `ClickOutsideDirective` (`appClickOutside`) - mendeteksi klik di luar elemen.
- `TooltipDirective` (`appTooltip`) - menampilkan tooltip pada hover/focus.

### Pipes (`src/app/shared/pipes/`)
- `TruncatePipe` (`truncate`) - memotong teks panjang dengan titik-titik.

---

## 4. Pengujian (Testing)
- **Framework:** Proyek ini menggunakan **Vitest** dan **jsdom**, BUKAN Karma atau Jasmine.
- **Perintah Testing:** Gunakan `npm run test` atau `npx vitest run`.
- **Aturan:** Jika pengguna meminta untuk menulis *unit test*, tulislah menggunakan *syntax* dan *assertion* Vitest standar yang kompatibel dengan Angular.

---

## 5. Konteks Bisnis & Domain (Multi-Category Retail E-Commerce)
- **Domain:** Aplikasi ini adalah platform **Multi-Category E-Commerce Retail Store** yang mencakup 3 vertikal bisnis utama:
  1. **Toko Buku Online:** (`Book`, `Author`, `ISBN`, `Category`, dll).
  2. **Penjualan Kopi Mardika Online:** (`Kopi`, `Coffee Beans`, `Beverage`, `Roastery`, `Variant`, rute khusus `/mardika-kopi`).
  3. **Toko Retail Sembako Online:** (`Sembako`, `Groceries`, `UOM` / Satuan, `Warehouse`, `Pricing`, `Stock`, `InventoryMovement`).
- **Entitas & Model Data:** Segala pembuatan fitur dummy, nama variabel, mock data, atau skema data harap disesuaikan dengan konteks retail multi-kategori di atas (`Product`, `Category`, `Variant`, `CartItem`, `Order`, `PaymentMethod`, `Customer`, `Warehouse`, `Pricing`, `PromotionBanner`, `Complaint`, `UOM`, `Author`, dll).

---

## 6. Gaya Komunikasi (Communication Style)
- Jawablah semua instruksi secara langsung (**to the point**) tanpa basa-basi pembuka (seperti "Tentu, saya akan membantu...", "Baik, berikut adalah...") atau salam penutup yang ramah tamah.
- Gunakan Bahasa Indonesia teknis yang ringkas, tepat, dan jelas.
- Prioritaskan menampilkan blok kode langsung atau poin solusi teknis untuk menghemat token dan mempercepat eksekusi.
- Gunakan penjelasan teks seminimal mungkin, hanya untuk bagian arsitektural atau perubahan krusial.

---

## 7. Validasi Perubahan & Quality Control (Build Check & Error Diagnostics)
- **Build Check Wajib:** Setiap kali ada tugas yang mengubah atau menambahkan kode/file baru, **WAJIB** mengeksekusi perintah build (`npx ng build` atau `npm run build`) di terminal pada akhir proses untuk memastikan kode bebas dari *compile error* dan TypeScript berjalan lancar.
- **Investigasi Error Utuh:** Jika terjadi kegagalan build atau test error, agen WAJIB menginspeksi log error secara utuh sebelum mendiagnosis.
- **Dilarang Symptom Patching:** Dilarang keras mengatasi error dengan menyembunyikan exception, mengomentari fungsi/assertion yang gagal, atau mengembalikan fallback dummy tanpa menyelesaikan akar masalahnya.
