# Audit Frontend `malakabooks-store` — Laporan & Rencana Refactor

## Context

Project ini adalah storefront + admin panel Angular 21 (standalone, zoneless, Tailwind v4) untuk SS Online Shop / Malaka Books. Audit dilakukan untuk memastikan kesiapan production: bukan hanya mencari error, tetapi menilai kualitas implementasi, maintainability, dan konsistensi UI.

**Kesimpulan singkat:** fondasi arsitekturnya kuat dan di atas rata-rata (zoneless CD, 88/92 komponen OnPush, store berbasis signal, interceptor terpusat, lazy load + selective preloading, `takeUntilDestroyed`). Yang menahan project ini dari status production-ready bukan arsitektur, melainkan **sisa artefak development yang ikut ter-build** (sandbox payment gateway, credential di repo, fixture JSON, tool bulk-insert), ditambah beberapa **god component** dan **duplikasi template admin** yang akan menjadi beban maintenance.

**Skor keseluruhan: 62/100** (rincian di §9).

---

## 1. HTML & Tailwind Audit

### 🔴 Critical

**1.1 — Utility class terlalu panjang & di-copy-paste di 20 halaman admin**
`src/app/features/admin/*/list/*.component.html:11` dan `:30`
- 169 atribut `class` melebihi 120 karakter; terpanjang 322 karakter (`dashboard.component.html:148`).
- Blok search input (`class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-600"`) diduplikasi **2× per halaman × 20 halaman = 40 kali**, dengan varian tidak konsisten (`bg-slate-50` di desktop vs `bg-white` di mobile, `text-sm` vs `text-xs`).
- **Dampak:** satu perubahan design token harus disentuh di 40 tempat; sudah terjadi drift.
- **Solusi:** ekstrak `<app-admin-search-input>` (sudah ada pola `app-admin-input`, tinggal varian search). Satu komponen menggantikan 40 blok.

```html
<!-- Sebelum (di 20 file, 2× masing-masing) -->
<div class="relative w-full hidden sm:block">
  <app-icon name="search" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
  <input type="text" placeholder="Cari penulis..." [value]="searchQuery()" (input)="onSearch($event)"
    class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm ...">
</div>

<!-- Sesudah -->
<app-admin-search-input placeholder="Cari penulis..." [value]="searchQuery()"
                        (valueChange)="searchQuery.set($event)" />
```

### 🟠 High

**1.2 — Z-index tanpa skala (layering tidak terkendali)**
Seluruh HTML: `z-10`(15×), `z-50`(10×), `z-40`, `z-30`, `z-20`, **`z-9999`(2×), `z-9998`, `z-1000`, `z-60`, `z-45`**.
- **Dampak:** modal/drawer/toast/bottom-sheet saling tumpang tindih tak terprediksi; `z-45` dan `z-9998` jelas hasil tambal-sulam.
- **Solusi:** definisikan token di `@theme` (`--z-dropdown: 20; --z-drawer: 40; --z-modal: 50; --z-toast: 60`) dan ganti nilai liar. Tidak mengubah business logic, hanya penamaan layer.

**1.3 — Warna hardcoded di TypeScript, bukan di token**
`src/app/features/admin/orders/list/orders-list.component.ts:521-527` (`drStatusClass`) mengembalikan string Tailwind (`'bg-emerald-50 text-emerald-600 border-emerald-100'`).
- Sudah ada `<app-status-badge>` (dipakai 5 halaman) yang tugasnya persis ini.
- **Solusi:** pindahkan pemetaan status→varian ke `StatusBadgeComponent`.

**1.4 — Palet warna belum terkonsolidasi**
Hitungan penggunaan: `slate` 1404×, `primary` 263×, `rose` 93×, `emerald` 57×, **`gray` 43×**, `red` 32×, `amber` 27×, `green` 9×, `indigo` 8×, `blue` 6×.
- `gray` bercampur `slate` (dua skala abu berbeda), `red` bercampur `rose`, `green` bercampur `emerald` → warna semantik yang sama tampil sedikit berbeda antar halaman.
- **Solusi:** tetapkan `slate` = neutral, `rose` = danger, `emerald` = success, `amber` = warning. Ganti 43 `gray-*`, 32 `red-*`, 9 `green-*`. Perubahan mekanis, aman.

### 🟡 Medium

**1.5 — Font-size arbitrary bertebaran**
`text-[10px]` 70×, `text-[14px]` 23×, `[9px]` 14×, `[8px]` 13×, `[12px]` 9×, `[13px]`, `[11px]`.
- Tujuh ukuran font di bawah `text-sm` tanpa nama = tidak ada skala tipografi.
- **Solusi:** tambahkan `--text-2xs: 0.625rem` dan `--text-3xs: 0.5rem` di `@theme`, ganti nilai arbitrary. `text-[14px]` = `text-sm` (identik) → langsung ganti.

**1.6 — Border radius belum punya aturan**
`rounded-xl` 134×, `rounded-full` 112×, `rounded-lg` 93×, `rounded-2xl` 84×, `rounded-md` 12×, `rounded-3xl` 3×, `rounded-sm` 2×.
- Empat radius untuk elemen sejenis (card kadang `xl`, kadang `2xl`). Ada typo: `rounded-` dan `rounded-dots` (class tidak valid, silent no-op).
- **Solusi:** aturan sederhana — control (input/button/badge) = `rounded-xl`, container/card = `rounded-2xl`, avatar/pill = `rounded-full`. Perbaiki 2 typo.

**1.7 — CSS custom yang seharusnya Tailwind**
`src/styles.css:120-160` — `.card-product`, `.badge-uom`, `.badge-uom-lg` ditulis sebagai CSS mentah padahal 100% ekuivalen utility Tailwind, dan `.badge-uom` vs `.badge-uom-lg` hanya beda ukuran (duplikasi).
- **Solusi:** jadikan varian `size` pada `<app-badge>`, hapus dari `styles.css`.

**1.8 — `!important` bertumpuk pada tipografi global**
`src/styles.css:96-115` — 8 deklarasi `!important` untuk font override `.customer-root/.admin-root/.inner-root`.
- **Dampak:** komponen tidak bisa override font sama sekali; sudah memaksa workaround (`.swal2-title` juga `!important`).
- **Solusi:** karena `--font-sans`/`--font-display` sudah token Tailwind v4, cukup set variabel di scope root tanpa `!important` dan pakai `font-display` sebagai utility di heading.

**1.9 — Hack layout mobile berbasis selektor struktural rapuh**
`src/styles.css:165-176` — `.inner-root main > div > :not(router-outlet) { display:flex; height:100%; ... }`
- Bergantung pada struktur DOM anak; menambahkan satu wrapper `<div>` di halaman mana pun akan merusak scroll di seluruh mobile inner page.
- **Solusi:** terapkan `flex flex-col flex-1 min-h-0` eksplisit di root template masing-masing halaman inner (11 halaman), lalu hapus blok ini.

**1.10 — Freeze-scroll global memakai `!important` ke banyak selektor**
`src/styles.css:181-193` — `body.overflow-hidden app-root .overflow-y-auto { overflow: hidden !important }` dst.
- Mematikan **semua** area scroll saat modal terbuka, termasuk scroll di dalam modal itu sendiri jika modal berada di dalam `app-root`.
- **Solusi:** kunci hanya `body` (`position: fixed; width: 100%` + restore scrollTop), pola standar dan tidak menyentuh child.

### 🟢 Minor

**1.11** — `authors-list.component.html:1` & `categories-list.component.html:1`: `class=" flex flex-col gap-6"` (spasi di depan). Kosmetik.
**1.12** — 6 file `.component.css` kosong tapi tetap direferensikan `styleUrl` (mis. `admin-layout.component.css`, `customer-layout.component.css`). Hapus file + atribut.
**1.13** — Aksesibilitas: 133 `<button>` tetapi hanya 26 `aria-label`; 16 dari sekian `<img>` punya `alt`. Icon-only button (nav, pagination, aksi tabel) perlu `aria-label`.

**✅ Sudah memenuhi standar production:**
Token warna `primary`/`accent` di `@theme` sudah benar (bukan hardcoded hex di template). Font self-hosted via `@fontsource` + preload woff2 di `index.html` — tidak ada CDN render-blocking. Boot loader inline untuk mencegah FOUC sudah tepat. Skeleton loading (`app-skeleton`, 8 halaman) konsisten.

---

## 2. Component Architecture Audit

### 🔴 Critical

**2.1 — God Component: `OrdersListComponent` (562 baris)**
`src/app/features/admin/orders/list/orders-list.component.ts`
Menangani **7 tanggung jawab** sekaligus: tabel+pagination, search, bulk selection, create/cancel shipment, tracking (detail resi), normalisasi respons API kurir, dan **generator HTML label pengiriman**.

- `printLabel()` (baris 246–487, **241 baris**) membangun dokumen HTML lengkap sebagai template string — termasuk `@page`, ~80 baris CSS, tabel item, barcode, QR.
- 5 helper `dr*()` (baris 500–540) hanyalah *anti-corruption layer* untuk respons kurir yang tidak terstandar (`d.history_pengiriman || d.history || d.histories || d.logs || d.manifests`) — ini logika domain, bukan logika komponen.

**Rekomendasi refactor:**
| Pindahkan ke | Isi |
|---|---|
| `core/services/shipping-label.service.ts` | `printLabel()` + `esc()` — murni: `buildLabelHtml(order, resi): string` |
| `core/services/waybill-normalizer.ts` | `drField/drHistory/drLogDate/drLogDesc/drLogLoc/drEntries` → fungsi murni `normalizeWaybill(raw): Waybill` dengan tipe konkret |
| `features/admin/orders/detail-resi-drawer.component.ts` | UI drawer tracking |
| `shared/util/selection.util.ts` | `isAllSelected/toggleSelectAll/toggleSelectOrder` — pola seleksi generik |
Sisa `OrdersListComponent` ≈ 120 baris murni orkestrasi. Business logic tidak berubah sama sekali.

**2.2 — God Component: `CheckoutComponent` (521 baris)**
`src/app/features/checkout/checkout.component.ts`
Sudah ada pemecahan child (`checkout-address`, `checkout-shipping`, `checkout-payment`) — bagus — tetapi **state dan logic-nya tetap di parent**: 7 FormControl alamat, 5 `valueChanges` cascade (provinsi→kota→kecamatan→kurir→layanan), resolusi geo alamat tersimpan, kalkulasi ongkir, kalkulasi fee pembayaran, dan pembuatan order.

- `ngOnInit()` = 100 baris (baris 152–265): fetch + 6 subscription wiring dalam satu fungsi.
- `courierServiceOptions` (baris 87–105) memuat 6 cabang if/else parsing harga (`s.price` bisa number | object | `s.cost` bisa number | array | object) — **normalisasi payload API di dalam `computed()` komponen**.
- `resolvedistrictForAddress()` (baris 300–336) melakukan 3 panggilan API berantai untuk memetakan alamat tersimpan → kode wilayah. Ini murni domain shipping.

**Rekomendasi refactor:**
- Pindahkan parsing harga kurir dan `resolvedistrictForAddress` ke `ShippingService` (sudah ada, `core/services/shipping.service.ts` — sudah menampung provinces/cities/districts, jadi ini melanjutkan pola yang benar).
- Ekstrak cascade provinsi/kota/kecamatan ke `AddressFormService` — **pola identik ini diduplikasi 3×** (lihat §3.1).
- Pecah `ngOnInit` menjadi `loadInitialData()` + `wireFormCascades()`.

### 🟠 High

**2.3 — `ItemsFormComponent` (404 baris)** — form + upload gambar (base64 conversion) + manajemen author + fetch kategori + **bulk seed dari fixture**. Ekstrak konversi file→base64 ke `shared/util/image.util.ts` (file ini **sudah ada**), dan pisahkan pengelola gambar jadi `<app-image-uploader>` reusable (dipakai juga oleh promotion-banners & authors form).

**2.4 — `MyAddressesComponent` (336 baris)** dan **`HomeAddressesFormComponent` (236 baris)** — keduanya mengandung cascade alamat yang sama dengan checkout. Lihat §3.1.

**✅ Sudah memenuhi standar production:**
Struktur folder `core/ features/ layouts/ shared/ store/` bersih dan konsisten. Pemisahan `shared/ui` (32 komponen), `shared/directives`, `shared/pipes`, `shared/util` sudah tepat. `BaseCrudStore` (`store/utils/base-crud.store.ts`) adalah abstraksi yang bagus dan dipakai ulang oleh 10+ store — ini contoh yang benar, bukan over-engineering.

---

## 3. Code Quality Audit

### 🔴 Critical

**3.1 — Duplikasi logic cascade alamat di 3 tempat — ⚠️ DIKOREKSI, turun ke 🟡 Medium**
| File | Baris |
|---|---|
| `features/checkout/checkout.component.ts` | 193–243 |
| `features/profile/my-addresses/my-addresses.component.ts` | 114–160 |
| `features/admin/home-addresses/form/home-addresses-form.component.ts` | 79–125 |

**Koreksi atas penilaian awal saya:** ketiganya **tidak identik**. Setelah dibandingkan baris per baris, ada 4 perbedaan perilaku yang nyata:

| Aspek | checkout | my-addresses | home-addresses (admin) |
|---|---|---|---|
| Sumber data | `ShippingService` (signal bersama) | `addressApi` langsung + signal lokal | `addressApi` langsung + signal lokal |
| Disable control saat loading | ✅ `disable/enable` | ❌ tidak ada | ❌ tidak ada |
| Reset nilai turunan | `setValue('', {emitEvent:false})` — **tidak** memicu cascade berikutnya | `setValue('')` — **memicu** cascade berikutnya | `setValue('')` — memicu |
| Pencocokan kode district | `d.region_code` | `d.region_code \|\| d.address_code \|\| d.district_id` | `d.region_code` |
| Efek samping | memanggil `updateShippingCost()` | tidak ada | tidak ada |

- **Konsekuensi:** menyatukan ketiganya ke satu service **akan mengubah perilaku** minimal di 2 dari 3 halaman — persis alur yang sudah Anda tes manual (pemilihan alamat & ongkir). Rekomendasi awal saya ("perilaku tidak berubah") keliru.
- **Solusi yang benar:** jangan disatukan dulu. Ekstrak hanya bagian yang benar-benar sama — pemanggilan API + pengisian daftar — ke helper, dan biarkan kebijakan reset/disable tetap di masing-masing komponen sebagai parameter. Atau tunda sepenuhnya; duplikasi 210 baris ini lebih murah daripada regresi di alur checkout.

**Catatan terpisah (observasi, bukan permintaan perubahan):** di `checkout.component.ts:204` dan `home-addresses-form.component.ts:86`, pengecekan `this.cities().some(c => c === currentCityVal)` membandingkan **objek city dengan string**, sehingga selalu `false` dan field kota selalu direset saat provinsi di-set ulang. Di `my-addresses.component.ts:121` perbandingannya benar (`c.city_name === currentCityVal`). Karena alur ini sudah lolos tes manual, efeknya kemungkinan tidak terlihat oleh pengguna (kota memang di-reset saat ganti provinsi). Saya catat agar diketahui, bukan untuk diubah tanpa pengujian.

**3.2 — Duplikasi logic filter+sort produk**
`store/product.store.ts:96-124` (`filteredProducts`) vs `features/home/home.component.ts:64-84` (`catalogProducts`) — algoritma sort identik (price-asc/price-desc/rating/newest), hanya beda: home tidak memfilter search query.
- **Solusi:** tambahkan parameter/`computed` kedua di `ProductStore`; hapus dari komponen.

**3.3 — Dead code: array `slides` dengan gambar Unsplash**
`features/home/home.component.ts:29-59` (31 baris) dan `features/mardika-kopi/mardika-kopi.component.ts:40-70` — **tidak direferensikan sama sekali** di template masing-masing (diverifikasi: 0 kemunculan `slides` di kedua HTML). Sisa dari era sebelum banner diambil dari API.
- **Solusi:** hapus. Sekaligus menghilangkan 6 URL gambar eksternal Unsplash dari bundle.

### 🟠 High

**3.4 — `console.*` langsung di kode aplikasi (9 lokasi)**
Sudah ada `LoggerService` (`core/services/logger.service.ts`, dipakai 30 file) yang menahan `console.log` di production. Tetapi masih ada bypass:
`items-form.component.ts:215, 318, 321, 378, 398`, `pricings-form.component.ts:271`, `mardika-kopi.component.ts:166`, `dashboard-api.service.ts:19`.
- **Solusi:** ganti dengan `this.logger.error(...)`. (`main.ts:6` dan `logger.service.ts` sendiri wajar dibiarkan.)

**3.5 — `any` dipakai 88 kali**
Terkonsentrasi di `orders-list` (respons kurir), `items-form` (`getPayload(): any`, `readonly item = input<any>(null)`), `pricings-form` (`payload: any`). Sudah ada `core/models/backend-dtos.model.ts` — tipenya ada, hanya belum dipakai konsisten.
- **Solusi:** prioritaskan input komponen (`input<any>` → `input<Item | null>`) dan return type publik. Respons kurir cukup satu interface `WaybillResponse` di normalizer (§2.1).

**3.6 — Magic number & hardcoded string**
- `pricings-form.component.ts:262-269`: `customerGroupCode: '103'`, `'106'`, `uomCode: 'JASA'`, `price * 1.2`, `new Date('2036-12-31...')` — aturan bisnis harga sebagai literal tanpa nama.
- `checkout.component.ts:398`: `paymentDetails['cardLast4'] = card.slice(-4) || '4321'` — **fallback ke nilai dummy `'4321'`**. Ini akan mengirim data kartu palsu ke backend jika input kosong.
- `orders-list.component.ts:255,268`: fallback `'SPX'` dan `'STD'` sebagai kurir/servis default.
- **Solusi:** konstanta bernama di `core/constants/`, dan hapus fallback `'4321'` (biarkan validasi form yang menahan).

**3.7 — Import tak terpakai**
`orders-list.component.ts:4` mengimpor `JsonPipe` yang dipakai hanya untuk debug output (§8.5). `pricings-form.component.ts:14` mengimpor `computed` terpisah dari import `@angular/core` di baris 1.

### 🟡 Medium

**3.8** — Penamaan tidak konsisten: `resolvedistrictForAddress` (huruf kecil di tengah camelCase), variabel `destinationdistrict`, `distObj`/`dist`/`distCode` bercampur.
**3.9** — Pesan user bercampur dua bahasa: `toastService.error('Please select a payment method')` (checkout) vs `alertService.error('Gagal!', 'Silakan pilih minimal satu pesanan.')` (orders). Seluruh checkout masih Inggris; sisanya Indonesia.
**3.10** — Komentar berbahasa campuran (ID/EN) di file yang sama, mis. `app.config.ts` (komentar EN lalu ID).

**✅ Sudah memenuhi standar production:**
Tidak ada `debugger`. Tidak ada blok kode besar yang dikomentari (kecuali route stocks yang memang disengaja + beralasan). Komentar yang ada umumnya menjelaskan *kenapa*, bukan *apa* — mis. penjelasan urutan interceptor di `app.config.ts:25-27` dan alasan `session.util.ts` bukan security boundary. Itu justru komentar berkualitas tinggi.

---

## 4. Angular Best Practice

**✅ Bagian yang sudah sangat baik — pertahankan:**
- `provideZonelessChangeDetection()` + **88 dari 92 komponen `OnPush`** (96%). Ini jauh di atas rata-rata project Angular.
- 100% standalone component, semua route `loadComponent` (lazy).
- `SelectivePreloadingStrategy` dengan `data: { preload: true }` — chunk admin sengaja tidak di-preload. Implementasi tepat.
- `takeUntilDestroyed(destroyRef)` dipakai di 37 lokasi.
- Guard (`authGuard`, `adminGuard`) functional + ada unit test.
- 3 interceptor terpisah dengan tanggung jawab jelas dan urutan yang didokumentasikan.
- Reactive Forms di semua form; tidak ada `ngModel`.
- 85 `@for` menggunakan `track` (blok kontrol baru); hanya 1 `*ngFor` tersisa.

### 🟠 High

**4.1 — 8 subscription tanpa unsubscribe (potensi memory leak)**
| File | Baris |
|---|---|
| `admin/inventory-movements/inventory-movements.component.ts` | 72 |
| `admin/items/form/items-form.component.ts` | 175, 186, 190 |
| `admin/pricings/form/pricings-form.component.ts` | 149 |
| `admin/stocks/form/stocks-form.component.ts` | 77 |
| `admin/uoms/form-page/uom-groups-form-page.component.ts` | 28 |
| `order/detail-shipment/detail-shipment.component.ts` | 31 |
| `shared/ui/admin-select/admin-select.component.ts` | 36 |
| `profile/profile.component.ts` | 125 |

- Untuk `valueChanges` pada `FormControl` milik komponen, leak-nya terbatas; tetapi `route.paramMap` (`uom-groups-form-page:28`, `detail-shipment:31`) **benar-benar leak** karena `ActivatedRoute` hidup selama router hidup. `admin-select.component.ts:36` leak per-instance dan komponen ini dipakai di 7 halaman.
- **Solusi:** tambahkan `.pipe(takeUntilDestroyed(this.destroyRef))` — pola yang sudah dipakai di 37 tempat lain. Perubahan satu baris per lokasi.

**4.2 — `setTimeout` sebagai penyiasat siklus form**
`items-form.component.ts:197`: `setTimeout(() => this.authorSelectControl.setValue('', { emitEvent: false }), 0)`.
- **Solusi:** `emitEvent: false` sudah membuat reset aman tanpa `setTimeout`; hapus wrapper-nya.

### 🟡 Medium

**4.3 — `async ngOnInit()`** di `checkout.component.ts:152`. Angular tidak menunggu Promise dari `ngOnInit`; error yang di-throw setelah `await` pertama tidak tertangkap lifecycle. Bungkus dalam metode privat `void this.initialize()` dengan `catch`.

**4.4 — 0 penggunaan `| async`.** Bukan masalah — project sepenuhnya berbasis signal, dan itu konsisten. Disebut di sini hanya untuk mencatat bahwa ini keputusan sadar, bukan kelalaian.

**4.5 — Tidak ada Resolver.** Semua halaman fetch di `ngOnInit` dengan state `loading` + skeleton. Untuk aplikasi ini pilihan tersebut valid (menghindari navigasi yang terasa menggantung); tidak perlu diubah.

---

## 5. Performance Audit

### 🟠 High

**5.1 — Getter dipanggil dari template (rerender setiap CD)**
`orders-list.component.html:166,171,178,185,190,228` memanggil `drField(...)`, `drLogDate(...)`; template juga membaca getter `detailResiDetails` dan `drHistory`.
- `drHistory` melakukan **`[...list].sort()` — alokasi array + sorting pada setiap change detection**.
- **Solusi:** ubah menjadi `computed()` dari signal `detailResiData` (§2.1 sekaligus menyelesaikan ini).

**5.2 — Fungsi lookup dipanggil dalam loop template**
`items-list.component.html:61` `{{ uomMap(...) }}`, `pricings-list.component.html:56` `{{ itemMap(...) }}`, `items-form.component.html:123` `{{ getAuthorName(...) }}`.
- Dieksekusi **N× per baris per CD cycle**.
- **Solusi:** precompute `Map` sebagai `computed()`, atau turunkan kolom yang sudah ter-resolve di `computed()` daftar.

**5.3 — Gambar tanpa optimasi**
16 file HTML memakai `<img>`, hanya **3** yang memakai `loading="lazy"`/`NgOptimizedImage`. Foto produk (`product-card`, `product-detail`, `order-history`, `profile`) semuanya eager.
- **Solusi:** `NgOptimizedImage` (`ngSrc` + `width`/`height` + `priority` hanya untuk banner hero). Ini juga mencegah CLS.

### 🟡 Medium

**5.4 — Fixture JSON ter-bundle ke chunk admin**
`items-form.component.ts:16` mengimpor `sku_only.json` (8 KB), `pricings-form.component.ts:16` mengimpor `item_filtered.json` (20 KB). Statis, masuk ke bundle. Lihat §8.1 — akar masalahnya bukan performa melainkan production-readiness.

**5.5 — 5 keluarga font, 21 file CSS font di-import**
`styles.css:1-21`: Inter (5 weight), Plus Jakarta Sans (5), Poppins (5), Fraunces (2). Padahal `.customer-root/.admin-root/.inner-root` meng-override *semuanya* ke Poppins + Fraunces (`styles.css:96-102`) — artinya **Inter dan Plus Jakarta Sans praktis tidak pernah tampil**.
- **Solusi:** verifikasi lalu hapus import Inter & Plus Jakarta Sans → hemat ~10 file font + CSS-nya dari initial load.

**✅ Sudah memenuhi standar production:**
Budget bundle sudah dikonfigurasi (`angular.json`: initial warning 600 kB / error 1 MB, per-component style 4/8 kB). `withFetch()` aktif. Font di-preload. `optimization.styles.inlineCritical` aktif untuk production.

---

## 6. Reusable Component Audit

Duplikasi yang layak diangkat menjadi komponen:

| Pola | Lokasi duplikat | Rekomendasi |
|---|---|---|
| Search input admin | 20 halaman × 2 (desktop+mobile) | `<app-admin-search-input>` |
| Shell halaman list admin (action bar + search + spinner + table + pagination) | `authors`, `categories`, `complaints`, `home-addresses`, `items`, `payment-methods`, `pricings`, `promotion-banners`, `stocks`, `uoms`, `users`, `warehouses` — 12 halaman berstruktur identik | `<app-admin-list-page>` dengan content projection untuk header & row. Ini menghapus ± 60% markup halaman list. |
| Uploader gambar (file→base64, preview, remove) | `items-form`, `promotion-banners-form`, `authors-form`, `complaints-form` | `<app-image-uploader>` + gunakan `shared/util/image.util.ts` yang sudah ada |
| Cascade form alamat | 3 komponen (§3.1) | `AddressCascadeService` |
| Blok "tidak ada data" | 23 string literal di 11 file, sementara `<app-empty-state>` hanya dipakai 5× | Ganti sisanya dengan `<app-empty-state>` |

**✅ Sudah memenuhi standar production:**
Library `shared/ui` sudah matang: `app-icon` (43 halaman), `app-admin-button` (25), `app-modal` (18), `app-spinner` (17), `app-button` (16), `app-table` (14), `app-pagination` (14), `app-price` (11). Utilitas `createClientPagination` (`shared/util/pagination.util.ts`) dipakai konsisten di seluruh halaman list — ini pola yang benar. Tidak ada komponen `shared/ui` yang benar-benar mati (semua terpakai, termasuk `radio`/`radio-indicator` via checkout dan `tooltip` via `TooltipDirective`).

---

## 7. UI Consistency Audit

| Elemen | Status | Catatan |
|---|---|---|
| Button | 🟢 Baik | `app-button` (customer) + `app-admin-button` (admin), keduanya bervarian. Pemisahan dua design system disengaja dan konsisten. |
| Input | 🟠 Perlu perbaikan | `app-input`/`app-admin-input` ada, tapi search input ditulis manual di 20 halaman (§1.1) |
| Card | 🟡 Sedang | Radius bercampur `rounded-xl`/`2xl`, border `slate-200`/`slate-100` bercampur |
| Modal / Dialog | 🟠 Tiga sistem paralel | `app-modal` (18), `app-drawer` (1), `app-bottom-sheet` (8), **plus SweetAlert2 via `AlertService` (24 file)**. SweetAlert punya styling sendiri yang di-override paksa dengan `!important` di `styles.css:105-115`. Konfirmasi destruktif memakai SweetAlert, sementara modal form memakai `app-modal` → dua bahasa visual untuk interaksi sejenis. Rekomendasi: pertahankan SweetAlert **hanya** untuk confirm/alert, dan pastikan token warnanya diselaraskan. |
| Badge | 🟡 Sedang | `app-badge` (2×) vs `app-status-badge` (5×) vs `.badge-uom`/`.badge-uom-lg` CSS (§1.7) vs class inline di `drStatusClass` (§1.3) — **4 cara membuat badge** |
| Typography | 🟠 Perlu perbaikan | 7 ukuran arbitrary (§1.5) + override `!important` (§1.8) |
| Icon | 🟢 Baik | `app-icon` terpusat, boxicons self-hosted |
| Spacing | 🟡 Sedang | `gap-6` dominan di admin, tapi padding sel tabel `px-5 py-4` ditulis ulang di setiap `<th>`/`<td>` — layak dipindahkan ke `app-table` |
| Warna | 🟠 Perlu perbaikan | §1.4 |

---

## 8. Production Readiness Checklist

| Item | Status |
|---|---|
| Tidak ada dead code | ❌ §3.3 (62 baris `slides`), fitur `stocks` (list+form+store+api) tidak ter-route |
| Tidak ada unused component | ✅ semua `shared/ui` terpakai |
| Tidak ada unused service | ⚠️ `WarehouseStockApiService`/`WarehouseStockStore` hanya dipakai fitur stocks yang dinonaktifkan (disengaja, terdokumentasi) |
| Tidak ada unused variable/import | ❌ §3.7 |
| Tidak ada TODO | ⚠️ 4 TODO — semuanya beralasan & terdokumentasi baik (menunggu endpoint backend) |
| Tidak ada FIXME | ✅ |
| Tidak ada mock data | ❌ **§8.1** |
| Tidak ada fake API | ✅ semua service memanggil API nyata |
| Tidak ada debug code | ❌ **§8.5** |
| Tidak ada console.log | ⚠️ §3.4 (9 bypass `LoggerService`) |
| Tidak ada commented code | ✅ (1 route dikomentari dengan alasan jelas) |
| Tidak ada duplicate logic | ❌ §3.1, §3.2 |
| Tidak ada hardcoded URL | ❌ **§8.3** |
| Tidak ada hardcoded secret | ❌ **§8.2** |
| Tidak ada file tak terpakai | ❌ 11 dari 13 file di `src/fixtures/` tidak diimpor (termasuk `priced.json` 264 KB, `item.json` 104 KB) |
| Tidak ada dependency tak terpakai | ⚠️ `jsbarcode` terdaftar di `package.json` tetapi **dimuat dari CDN**, bukan dari node_modules (§8.3) |

### 🔴 Critical — blocker sebelum production

**8.1 — Fixture data & tool bulk-insert ikut ter-build ke UI admin**
- `items-form.component.ts:16,38` — `import skuData from 'fixtures/sku_only.json'` dipakai sebagai sumber daftar SKU di form produksi.
- `pricings-form.component.ts:16,241` — method `bulkInsert()` membaca `item_filtered.json` lalu **melakukan loop `await savePricing()` untuk setiap baris**, menulis harga jual + markup 20% ke database production.
- **Dampak:** tombol seed data developer terekspos di admin panel production. Satu klik keliru menulis ratusan record harga.
- **Solusi:** hapus `bulkInsert()` dan tombol pemicunya (ini tool migrasi sekali pakai, bukan fitur); ganti `skuList` dengan pengambilan dari `ItemStore`. Pindahkan `src/fixtures/` ke luar `src/` (mis. `tools/seed-data/`) agar tidak bisa ter-import.

**8.2 — Credential OAuth production ter-commit di repo**
`src/environments/environment.prod.ts:5-8`
```ts
clientId: '996cc633-23c1-4fb7-a6b6-6fd20dd5051d,',
clientSecret: '996cc633-23c1-4fb7-a6b6-6fd20dd5051e,',
scope: 'General-B2C-5Ecd}3+uX3g=%Mxk CRUD-MaBooks-298a66e9 MaBooksScope784a7e2b'
```
**~~Dugaan bug koma — DIBATALKAN.~~** Penilaian awal saya menyebut koma di akhir `clientId`/`clientSecret` sebagai kemungkinan sisa copy-paste yang akan menggagalkan login. **Dikonfirmasi bahwa build production sudah dites end-to-end dan berhasil**, artinya server menerima nilai tersebut apa adanya. Koma itu sah — **jangan diubah**. Temuan ini saya cabut.

**Yang tetap berlaku:** client secret tersimpan di source control dan **ikut ter-bundle ke JavaScript yang dikirim ke browser** — siapa pun yang membuka DevTools bisa membacanya. Ini bukan kesalahan implementasi frontend melainkan konsekuensi alur OAuth yang dipilih: aplikasi browser adalah *public client*, sehingga `client_secret` secara definisi tidak bisa dirahasiakan. Cara yang tepat adalah Authorization Code + PKCE tanpa `client_secret`.
- **Dampak:** siapa pun dapat memperoleh token atas nama aplikasi ini.
- **Solusi:** butuh dukungan backend (mengizinkan public client + PKCE di `authUrl`). Saya angkat sebagai temuan arsitektural untuk didiskusikan dengan tim backend, bukan sebagai perubahan frontend sepihak. Sampai itu tersedia, tidak ada yang bisa diperbaiki dari sisi frontend saja.

> Catatan: file `environment.ts` dan `environment.prod.ts` sedang dalam status modified di working tree Anda. Mohon dicek ulang sebelum commit.

**8.3 — Script eksternal & sandbox payment gateway di production**
`src/index.html:50` — `<script src="https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js">`
- **URL sandbox DOKU dipakai untuk semua environment**, sementara `environment.prod.ts` sudah menunjuk API production. Transaksi production akan memanggil checkout sandbox. Ini blocker paling serius.
- `orders-list.component.ts:308-309` memuat `jsbarcode` dan `qrcodejs` dari **cdn.jsdelivr.net** ke dalam window cetak, padahal `jsbarcode` sudah ada di `package.json`. `qrcodejs` tidak terdaftar sebagai dependency sama sekali. Label pengiriman gagal dicetak saat jaringan ke CDN terblokir, dan ini menambah supply-chain surface.
- `map-picker.component.ts:58-60` memuat ikon marker Leaflet dari `unpkg.com` walaupun paket `leaflet` sudah lokal.
- **Solusi:** URL DOKU → `environment` (sandbox untuk dev, production untuk prod). Barcode/QR → import dari npm dan generate SVG sebelum membuka window cetak. Ikon Leaflet → path asset lokal.

### 🟠 High

**8.4 — 11 file fixture menganggur di `src/fixtures/` (± 420 KB)**
Hanya `sku_only.json` dan `item_filtered.json` yang diimpor (dan keduanya harus hilang per §8.1). Sisanya — `priced.json` (264 KB), `item.json` (104 KB), `books.json`, `city.json`, `province.json`, `dashboard.json`, `stat.json`, `uomgroups.json`, `category.json`, `payload-pricings.json` — tidak direferensikan. Tidak masuk bundle (tree-shaken), tapi mengotori `src/`. Pindahkan ke `tools/`.

**8.5 — Debug output ter-render di UI admin**
`orders-list.component.html:255`: `<pre ...>{{ data | json }}</pre>` — dump JSON mentah respons kurir ditampilkan ke admin.
- **Solusi:** hapus blok tersebut beserta import `JsonPipe`; gunakan tampilan terstruktur dari `drEntries` yang sudah ada.

**8.6 — `prompt()` browser native di editor**
`shared/ui/editor/editor.component.ts:187`: `const url = prompt('Masukkan URL Link:', 'https://')`.
- Dialog native, tidak bisa di-style, terblokir di sebagian browser/iframe, dan tidak konsisten dengan `AlertService`.
- **Solusi:** gunakan `AlertService` (SweetAlert punya input prompt) atau `app-modal`.

**✅ Sudah memenuhi standar production:**
Konfigurasi build production sudah benar: `fileReplacements` environment, minifikasi, `inlineCritical`, budget terpasang, `security.allowedHosts` eksplisit. `GlobalErrorHandler` terpasang. `LoggerService` menahan log non-error di production. Terdapat 16 file test (guard, interceptor, store, komponen UI dasar) — bukan cakupan penuh, tapi bagian paling kritis (auth guard, auth interceptor, auth store, cart store) sudah tertutup.

---

## 9. Maintainability Score

| Kategori | Skor | Alasan |
|---|---|---|
| Architecture | **8**/10 | Struktur folder, layering, store pattern, `BaseCrudStore`, routing lazy — semuanya solid. Dikurangi karena logika domain (shipping, normalisasi kurir) bocor ke komponen. |
| Component Design | **6**/10 | 32 komponen `shared/ui` yang baik, tapi 3 god component (562/521/404 baris) dan 12 halaman list yang identik tanpa abstraksi. |
| HTML Structure | **6**/10 | Blok kontrol modern & `track` konsisten, tapi markup search/table di-copy-paste dan aksesibilitas kurang (26 `aria-label` untuk 133 button). |
| Tailwind Quality | **6**/10 | Token warna `@theme` benar, tapi 169 class >120 karakter, 7 ukuran font arbitrary, 4 radius bercampur, z-index tanpa skala, dan CSS custom yang seharusnya utility. |
| Performance | **7**/10 | Zoneless + 96% OnPush + lazy route + preloading selektif sangat baik. Ditahan oleh getter/fungsi di template, gambar tanpa lazy-load, dan 2 keluarga font yang tidak terpakai. |
| Scalability | **7**/10 | Menambah entity CRUD baru mudah (`BaseCrudStore` + pola list). Tapi tanpa `<app-admin-list-page>`, setiap entity baru menambah ~250 baris HTML duplikat. |
| Readability | **6**/10 | Komentar berkualitas (menjelaskan *kenapa*), tapi fungsi 241 baris, 88 `any`, penamaan tidak konsisten, dan campuran ID/EN menurunkan nilai. |
| Maintainability | **6**/10 | Duplikasi cascade alamat 3× dan markup list 12× adalah beban nyata. |
| Production Readiness | **4**/10 | Sandbox payment gateway aktif di build production (dikonfirmasi: alur checkout yang lolos tes berjalan lewat sandbox), `client_secret` ter-bundle ke browser, tool bulk-insert terekspos di admin, script CDN eksternal, debug JSON di UI. Naik 1 poin dari penilaian awal karena dugaan bug kredensial dicabut. |

### **Overall Score: 62/100**

**Ringkasan jujur:** ini bukan project yang ditulis buruk — justru sebaliknya, keputusan arsitekturnya (zoneless, signal store, standalone, interceptor berlapis, preloading selektif) menunjukkan pemahaman Angular modern yang bagus dan sudah production-grade. Skornya tertahan hampir seluruhnya oleh **§8 Production Readiness**, dan mayoritas temuan di situ dapat diselesaikan dalam 1–2 hari kerja tanpa menyentuh business logic sedikit pun. Setelah blocker 🔴 dibereskan, project ini realistis berada di kisaran **78–82/100**.

---

## 9b. Dampak terhadap Endpoint & Payload yang Sudah Berjalan

Project ini sudah lolos tes manual end-to-end, jadi baseline-nya adalah: **perilaku runtime saat ini dianggap benar**. Berikut klasifikasi jujur setiap rekomendasi terhadap risiko mengubah endpoint atau payload.

### ✅ Aman — nol perubahan endpoint & payload
Murni struktural, tidak menyentuh data yang dikirim/diterima:
- §2.1 pemecahan `OrdersListComponent` (memindahkan kode, bukan mengubahnya)
- §2.2 pemecahan `CheckoutComponent` — **selama** parsing harga kurir dipindahkan **apa adanya**, termasuk seluruh 6 cabang if/else-nya
- §3.3 hapus `slides` (dead code, 0 referensi terverifikasi)
- §3.4 `console.*` → `LoggerService`
- §3.7 hapus import tak terpakai
- §4.1 tambah `takeUntilDestroyed` (hanya siklus hidup subscription)
- §4.2 hapus `setTimeout` (`emitEvent: false` sudah menahan cascade)
- §5.1 §5.2 getter/fungsi template → `computed()` (nilai keluaran sama)
- §6 `<app-admin-search-input>`, `<app-admin-list-page>` (markup, bukan data)
- §8.4 pindahkan fixture menganggur
- §8.5 hapus `{{ data | json }}`
- §1.11 §1.12 §1.13 §1.6 kosmetik & aksesibilitas
- §3.6 (sebagian) memberi nama konstanta `'103'`/`'106'`/`'JASA'`/`1.2` — **nilainya tetap persis sama**, hanya diberi nama

### ⚠️ Mengubah perilaku — wajib dikonfirmasi dulu, jangan dieksekusi sepihak

**A. §8.3 — URL DOKU sandbox → production.** Ini **mengubah endpoint payment**. **Dikonfirmasi:** build production sudah dites end-to-end — artinya alur checkout yang lolos tes itu berjalan melalui `sandbox.doku.com`. Konsekuensinya: jalur payment production yang sebenarnya **belum pernah diuji sama sekali**. Ini bukan penggantian URL mekanis; perlu merchant credential production DOKU dan pengulangan tes transaksi penuh. Tetap 🔴 blocker, tetapi eksekusinya adalah keputusan rilis, bukan refactor.

**B. §8.2 — koma pada kredensial: TEMUAN DICABUT.** Build production sudah lolos tes end-to-end, jadi server menerima nilai berkoma tersebut. **Jangan diubah.** Yang tersisa hanyalah isu arsitektural OAuth public client (secret ter-bundle ke browser) yang memerlukan dukungan backend — tidak ada aksi frontend.

**C. §3.6 — fallback `cardLast4 = '4321'`** (`checkout.component.ts:398`). Field ini **ikut terkirim ke backend** (`order-api.service.ts:273` → `paymentDetails`) dan terdefinisi di `order.model.ts:14`. Menghapus fallback akan mengirim string kosong ketika input kartu kosong. Turun dari 🟠 High menjadi **perlu konfirmasi**: apakah backend mentolerir `cardLast4` kosong? Kalau alur credit card memang belum dipakai di production, biarkan saja.

**D. §8.1 — `bulkInsert()`: KEPUTUSAN DIAMBIL — sembunyikan di balik flag environment.**
- Rencana: bungkus tombol di `items-form.component.html:143` dan `pricings-form.component.html:89` dengan `@if (!isProduction)`, di mana komponen mengekspos `protected readonly isProduction = environment.production`. Method `bulkInsert()` tetap ada, import fixture tetap ada di source — hanya tidak dapat dijangkau dari UI production.
- **Konsekuensi yang harus disadari:** karena `bulkInsert()` tetap direferensikan, `sku_only.json` (8 KB) dan `item_filtered.json` (20 KB) **tetap ikut ter-bundle** ke chunk admin production (tree-shaking tidak bisa membuang import statis yang masih terpakai). Kalau bundle size jadi soal, alternatifnya: ganti `import` statis menjadi `await import('...')` di dalam `bulkInsert()` sehingga fixture masuk chunk terpisah yang hanya diunduh saat tombol ditekan.
- Sudah diverifikasi aman: `skuList` **hanya** dipakai `bulkInsert()` (`items-form.component.ts:324`), nol referensi di template — jadi tidak ada UI yang terpengaruh.
- 11 fixture menganggur lainnya (±420 KB, termasuk `priced.json` 264 KB) tetap dipindahkan ke `tools/` — tidak ada yang mengimpornya.

**E. §8.3 — barcode/QR dari npm, bukan CDN.** Payload tidak berubah, tapi **output cetak label bisa berbeda secara visual** (jsbarcode versi npm vs versi CDN, dan `qrcodejs` harus diganti library lain karena tidak ada di `package.json`). Label pengiriman adalah dokumen yang dipindai kurir — wajib dibandingkan hasil cetaknya sebelum dan sesudah, dan diuji scan.

**F. §5.3 — `NgOptimizedImage`.** Ada jebakan: `promotion-banners-list.component.html:52` memakai `[src]="banner.imageUrl || banner.imageBase64"` — `ngSrc` **tidak mendukung data URI base64** dan akan melempar error runtime. Terapkan `NgOptimizedImage` hanya pada `<img>` yang pasti ber-URL (product-card, product-detail, order-history); untuk sisanya cukup tambahkan `loading="lazy"` yang tidak berisiko.

**G. §1.8 §1.9 §1.10 §5.5 — perubahan CSS global.** Menghapus `!important` pada font, mengganti hack layout `.inner-root main > div > :not(router-outlet)`, mengubah mekanisme freeze-scroll, dan membuang keluarga font: semuanya **berisiko regresi visual di banyak halaman sekaligus** — justru halaman yang sudah Anda validasi manual. Tidak mengubah data sama sekali, tapi paling mahal untuk diverifikasi ulang. Saya turunkan ke prioritas paling akhir; kerjakan hanya bila memang mengganggu, satu per satu dengan pemeriksaan visual per halaman.

### Kesimpulan bagian ini
Dari 30 butir rekomendasi, **23 aman sepenuhnya**, **1 saya koreksi karena penilaian awal saya salah** (§3.1), dan **6 menyentuh perilaku** sehingga saya reklasifikasi menjadi butuh konfirmasi Anda lebih dulu. Tidak ada satu pun rekomendasi yang boleh dieksekusi dengan asumsi "pasti tidak berubah" pada kelompok ⚠️ di atas.

---

## 10. Refactor Priority

> Urutan di bawah sudah disesuaikan dengan §9b: butir bertanda ⚠️ **tidak boleh dieksekusi sebelum ada konfirmasi**, karena menyentuh perilaku yang sudah lolos tes manual.

### 🔵 Masih butuh keputusan / koordinasi backend
1. ⚠️ **§8.3** URL DOKU sandbox → production: butuh merchant credential production + tes transaksi ulang penuh. **Jalur payment production belum pernah teruji** (tes end-to-end sebelumnya melewati sandbox).
2. ⚠️ **§3.6** Konfirmasi ke backend apakah `cardLast4` boleh kosong sebelum fallback `'4321'` dihapus.
3. ℹ️ **§8.2** OAuth public client + PKCE — diskusi arsitektural dengan backend. Tidak ada aksi frontend saat ini. *(Dugaan bug koma sudah dicabut.)*

### 🔴 Critical — aman dikerjakan sekarang
4. **§8.1** Bungkus tombol `bulkInsert()` dengan `@if (!isProduction)` di `items-form.component.html:143` & `pricings-form.component.html:89`; pertimbangkan `await import()` dinamis untuk fixture agar tidak membebani chunk admin. *(1 jam)*
5. **§8.5** Hapus `<pre>{{ data | json }}</pre>` + import `JsonPipe`. *(5 menit)*
6. **§8.4** Pindahkan 11 fixture menganggur (±420 KB) ke `tools/`. *(15 menit)*
7. ⚠️ **§8.3** Barcode/QR label cetak dari npm — aman terhadap payload, **tapi wajib uji scan hasil cetak**. *(2 jam + verifikasi)*

### 🟠 High — aman, dampak besar
8. **§4.1** Tambahkan `takeUntilDestroyed` pada 8 subscription (prioritas `route.paramMap` ×2 dan `admin-select`). *(30 menit)*
9. **§3.3** Hapus dead code `slides` di `home` & `mardika-kopi`. *(10 menit)*
10. **§3.4** Ganti 9 `console.*` dengan `LoggerService`. *(20 menit)*
11. **§5.1/§5.2** Getter & fungsi lookup di template → `computed()`. *(3 jam)*
12. **§2.1** Pecah `OrdersListComponent` — pindahkan kode apa adanya, tanpa menyentuh logika. *(1 hari)*
13. **§1.1/§6** `<app-admin-search-input>` dan `<app-admin-list-page>`. *(1 hari, menghapus ±60% markup 12 halaman list)*
14. **§8.3** Ikon marker Leaflet → asset lokal. *(15 menit)*
15. **§3.6** Beri nama konstanta untuk `'103'`/`'106'`/`'JASA'`/`1.2` — nilai tetap sama. *(1 jam)*

### 🟡 Medium — dapat dijadwalkan
16. **§1.2** Skala z-index bertoken; ganti `z-9999`/`z-1000`/`z-45`/`z-60`.
17. **§1.4** Konsolidasi palet: `gray`→`slate`, `red`→`rose`, `green`→`emerald`.
18. **§1.5** Token `--text-2xs`/`--text-3xs`; ganti `text-[14px]`→`text-sm`.
19. **§3.5** Kurangi `any` — prioritaskan `input<any>` pada komponen form.
20. **§2.3** `<app-image-uploader>` reusable untuk 4 form.
21. **§7** Satukan pembuatan badge menjadi satu komponen bervarian.
22. ⚠️ **§3.1** Cascade alamat — **jangan disatukan**. Kalau tetap ingin dirapikan, samakan dulu perilaku ketiganya secara sadar (lihat tabel perbedaan di §3.1), baru ekstrak. Bisa juga dilewati sepenuhnya.
23. ⚠️ **§5.3** `NgOptimizedImage` — hanya untuk `<img>` ber-URL; **kecualikan** `promotion-banners-list` yang memakai base64. Sisanya cukup `loading="lazy"`.

### 🟢 Minor — penyempurnaan
24. **§1.13** `aria-label` untuk icon-only button; `alt` untuk semua `<img>`.
25. **§1.12** Hapus 6 file `.component.css` kosong + atribut `styleUrl`-nya.
26. **§1.6** Perbaiki typo class `rounded-` dan `rounded-dots`.
27. **§1.11** Rapikan `class=" flex..."` (spasi depan).
28. **§3.8/§3.9/§3.10** Konsistensi penamaan & satu bahasa untuk pesan pengguna (checkout masih Inggris).
29. **§7** Pindahkan padding `px-5 py-4` ke dalam `app-table`.

### ⛔ Paling akhir — risiko regresi visual tertinggi
31. ⚠️ **§1.8 §1.9 §1.10 §5.5** Perubahan CSS global (hapus `!important` font, hack layout `.inner-root`, freeze-scroll, buang font Inter/Plus Jakarta Sans). Tidak menyentuh data sama sekali, tapi berpotensi merusak tampilan di banyak halaman yang sudah Anda validasi manual. Kerjakan satu per satu dengan pemeriksaan visual per halaman — atau lewati bila tidak mengganggu.

---

## Verifikasi

Setelah setiap batch perbaikan:

```bash
npm run build
```
Pastikan build production lolos budget (initial < 600 kB warning / 1 MB error) dan bandingkan ukuran chunk admin sebelum/sesudah penghapusan fixture.

```bash
npm run test:ci
```
16 file test yang ada (auth guard, admin guard, auth interceptor, auth store, cart store, author store, button/input/modal/badge) harus tetap hijau — ini jaring pengaman untuk memastikan business logic tidak berubah.

Verifikasi manual per area yang disentuh:
- **§8.3 DOKU:** jalankan checkout di dev, konfirmasi `loadJokulCheckout` memakai URL sandbox; build prod, konfirmasi bundle memuat URL production.
- **§4.1 subscription:** navigasi bolak-balik `detail-shipment/:id` dan `uoms/edit/:id` 10×, cek di DevTools bahwa instance komponen tidak menumpuk.
- **§3.1 cascade alamat:** uji ketiga halaman (checkout, profile/addresses, admin/home-addresses) — pilih provinsi → kota → kecamatan, lalu ganti provinsi di tengah jalan; perilaku harus identik dengan sebelum refactor.
- **§2.1 label cetak:** cetak label untuk 1 order dengan resi valid, bandingkan hasil PDF dengan versi sekarang (harus identik secara visual).
- **§1.x Tailwind:** jalankan dev server, periksa halaman list admin, home, product-detail, checkout di viewport mobile (375px) dan desktop (1280px).

**Aturan yang dipegang selama refactor:** tidak ada perubahan business logic, tidak ada fitur yang dihapus (kecuali `bulkInsert()` yang memang tool migrasi developer, bukan fitur pengguna — konfirmasikan dulu bila masih dibutuhkan).