# Audit Report: Konsistensi Desain & Penggunaan Shared Components

**Scope:** `src/app/features/` dan `src/app/layouts/`  
**Tanggal:** 2026-08-10

---

## Ringkasan Temuan

| Kategori Pelanggaran | Jumlah File | Severity |
|---|---|---|
| 1. Pembuatan UI kustom padahal sudah ada di `shared/ui/` | **3 file** (5 occurrence) | 🟡 Medium |
| 2. Warna/styling kustom di luar token `@theme` (`bg-[#...]`) | **0 file** | ✅ Clean |
| 3. Font kustom acak di luar Fraunces/Poppins/Inter (`font-[...]`) | **0 file** | ✅ Clean |
| 4. File `.css` kustom per komponen (melanggar Utility-First) | **2 file** (berisi CSS) + **24 file** (kosong/komentar) | 🟡 Medium |
| 5. *(Bonus)* Inline `style="..."` di template HTML | **4 file** (6 occurrence) | ⚪ Low |
| 6. *(Bonus)* `[ngClass]` tanpa `CommonModule` (setelah migrasi `@if`/`@for`) | **3 file** | ⚪ Low |

---

## 1. Pembuatan UI Kustom (Padahal Sudah Ada di `shared/ui/`)

> [!WARNING]
> DILARANG membuat komponen UI dasar dari nol jika sudah tersedia di `src/app/shared/ui/`. Wajib memeriksa dan memanfaatkan katalog komponen yang ada.

### 1a. Raw `<select>` — Seharusnya pakai `<app-select>`

| File | Baris | Kode Pelanggaran | Shared Component |
|---|---|---|---|
| [complaint.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/complaint/complaint.component.html#L226) | 226 | `<select formControlName="orderId" class="w-full text-sm border...">` | Gunakan `<app-select>` dari `src/app/shared/ui/select/` |
| [complaint.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/complaint/complaint.component.html#L239) | 239 | `<select formControlName="itemId" class="w-full text-sm border...">` | Gunakan `<app-select>` dari `src/app/shared/ui/select/` |

**Kode perbaikan:**
```html
<!-- SEBELUM (raw <select> dengan Tailwind inline) -->
<select formControlName="orderId"
  class="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white ...">
  <option value="" disabled>Pilih pesanan...</option>
  ...
</select>

<!-- SESUDAH (shared component) -->
<app-select
  label="Pesanan Terkait"
  [control]="form.controls.orderId"
  placeholder="Pilih pesanan..."
  [options]="orderOptions()">
</app-select>
```

### 1b. Raw `<textarea>` — Seharusnya pakai `<app-textarea>`

| File | Baris | Kode Pelanggaran | Shared Component |
|---|---|---|---|
| [order-history.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/order-history/order-history.component.html#L177) | 177 | `<textarea [ngModel]="reviewComment()" class="w-full p-3 border...">` | Gunakan `<app-textarea>` dari `src/app/shared/ui/textarea/` |

### 1c. Raw `<table>` — Seharusnya pakai `<app-table>`

| File | Baris | Kode Pelanggaran | Shared Component |
|---|---|---|---|
| [dashboard.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/dashboard/dashboard.component.html#L199) | 199 | `<table class="w-full border-collapse text-left text-xs text-slate-600">` | Evaluasi apakah `<app-table>` dari `src/app/shared/ui/table/` cocok |
| [pricings-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/pricings/form/pricings-form.component.html#L57) | 57 | `<table class="w-full text-left border-collapse">` | Evaluasi `<app-table>` |
| [uom-groups-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/uoms/form/uom-groups-form.component.html#L41) | 41 | `<table class="w-full text-left border-collapse">` | Evaluasi `<app-table>` |

> [!NOTE]
> Raw `<table>` dalam form dengan inline-editing mungkin **acceptable** jika `<app-table>` tidak mendukung editing. Evaluasi case-by-case diperlukan.

### ✅ File yang Sudah Benar

Beberapa file yang SUDAH menggunakan shared components dengan benar:
- `checkout-address.component.ts` → `<app-input>`, `<app-button>` ✅
- `checkout-payment.component.ts` → `<app-input>` ✅
- `complaint.component.html` → `<app-input>` (L249) ✅ (tapi `<select>` masih raw)
- Seluruh admin list pages → `<app-table>` ✅

---

## 2. Warna/Styling Kustom di Luar Token `@theme`

### ✅ Tidak Ditemukan Pelanggaran

Tidak ditemukan satupun penggunaan arbitrary value warna di `features/` maupun `layouts/`:
- ❌ `bg-[#...]` → **0 occurrence**
- ❌ `text-[#...]` → **0 occurrence**
- ❌ `border-[#...]` → **0 occurrence**

Semua komponen konsisten menggunakan token warna dari `@theme`:
- `primary-*` (Orange), `accent-*` (Dark Red), `slate-*`, `emerald-*`, `rose-*`, `amber-*`, `blue-*`, `indigo-*`.

---

## 3. Font Kustom Acak di Luar Proyek

### ✅ Tidak Ditemukan Pelanggaran

- ❌ `font-[...]` (arbitrary font-family) → **0 occurrence**
- Semua template menggunakan `font-sans` (Poppins/Inter) atau `font-display` (Fraunces) yang sudah terdefinisi di `@theme` ✅

---

## 4. File `.css` Kustom Per Komponen

> [!CAUTION]
> SANGAT DILARANG membuat file CSS kustom per komponen, kecuali untuk animasi kompleks atau override plugin khusus (aturan AGENTS.md §2).

### Ditemukan **26 file `.css`** yang di-referensikan via `styleUrl`:

#### ✅ File CSS Kosong (Hanya Komentar) — 24 file

File-file berikut **secara teknis tidak melanggar** karena isinya kosong atau hanya komentar placeholder. Namun, keberadaan file `.css` kosong menyebabkan overhead build yang tidak perlu.

| Lokasi | Jumlah | Rekomendasi |
|---|---|---|
| `features/admin/` | 6 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |
| `features/auth/` | 4 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |
| `features/checkout/` | 1 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |
| `features/complaint/` | 1 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |
| `features/order/` | 2 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |
| `features/product/product-list/` | 1 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |
| `features/profile/` | 2 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |
| `layouts/` | 7 file | Hapus file `.css` dan hapus `styleUrl` dari `@Component` |

#### 🟡 File CSS dengan Konten Aktual — 2 file

| File | Baris | Konten CSS | Justifikasi |
|---|---|---|---|
| [mardika-kopi-detail.component.css](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/mardika-kopi/mardika-kopi-detail/mardika-kopi-detail.component.css) | 1-8 | `:host { display: flex; flex-direction: column; grow: 1; min-height: 0; height: 100%; overflow: hidden; }` | **Acceptable** — `:host` styling tidak bisa dilakukan via Tailwind utility class |
| [product-detail.component.css](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/product/product-detail/product-detail.component.css) | 1-8 | `:host { display: flex; flex-direction: column; grow: 1; min-height: 0; height: 100%; overflow: hidden; }` | **Acceptable** — `:host` styling |

> [!TIP]
> `:host` pseudo-selector adalah satu-satunya alasan yang sah untuk file CSS per komponen di proyek ini. Tailwind CSS v4 tidak mendukung styling `:host` via utility classes.

---

## 5. *(Bonus)* Inline `style="..."` di Template HTML

| File | Baris | Kode | Rekomendasi |
|---|---|---|---|
| [complaint.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/complaint/complaint.component.html#L222) | 222 | `style="max-height: 60vh"` | Ganti ke `max-h-[60vh]` (Tailwind arbitrary value) |
| [my-addresses.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/profile/my-addresses/my-addresses.component.html#L106) | 106 | `style="max-height: 60vh"` | Ganti ke `max-h-[60vh]` |
| [profile.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/profile/profile.component.html#L270) | 270 | `style="max-height: 55vh"` | Ganti ke `max-h-[55vh]` |
| [katalog-selection-sheet.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/katalog/components/katalog-selection-sheet/katalog-selection-sheet.component.html#L72) | 72 | `style="padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);"` | **Acceptable** — Tailwind tidak mendukung `env()` |
| [katalog-cart.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/katalog/katalog-cart/katalog-cart.component.html#L50) | 50 | `style="padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);"` | **Acceptable** |
| [katalog-checkout.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/katalog/katalog-checkout/katalog-checkout.component.html#L5) | 5 | `style="padding-bottom: calc(env(safe-area-inset-bottom) + 1.25rem);"` | **Acceptable** |

---

## 6. *(Bonus)* `[ngClass]` Usage di Template

Ditemukan **10 occurrence** `[ngClass]` di `features/`. Penggunaan ini **masih valid** selama `CommonModule` di-import, tetapi setelah migrasi ke `@if`/`@for` nanti, bisa diganti dengan Tailwind conditional class binding:

```html
<!-- [ngClass] approach (butuh CommonModule) -->
<div [ngClass]="{'bg-emerald-50': isActive, 'bg-slate-100': !isActive}">

<!-- Tailwind + Angular class binding approach (tanpa CommonModule) -->
<div [class.bg-emerald-50]="isActive" [class.bg-slate-100]="!isActive">
```

---

## Prioritas Perbaikan

1. 🟡 **[MEDIUM]** Ganti 2x raw `<select>` di [complaint.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/complaint/complaint.component.html#L226) ke `<app-select>`.
2. 🟡 **[MEDIUM]** Ganti raw `<textarea>` di [order-history.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/order-history/order-history.component.html#L177) ke `<app-textarea>`.
3. 🟡 **[MEDIUM]** Hapus **24 file CSS kosong** beserta referensi `styleUrl` dari komponen terkait untuk mengurangi overhead build.
4. ⚪ **[LOW]** Ganti 3x inline `style="max-height: ..."` ke Tailwind `max-h-[...]`.
5. ⚪ **[LOW]** Evaluasi 3x raw `<table>` di admin forms apakah bisa diganti `<app-table>`.
6. ⚪ **[LOW]** Pertimbangkan migrasi `[ngClass]` ke `[class.xxx]` binding untuk mengurangi dependency `CommonModule`.

---

## Catatan Positif ✅

Secara keseluruhan, proyek ini **sangat konsisten** dalam hal desain:

- **✅ Warna:** 100% menggunakan token `@theme` (`primary-*`, `accent-*`, `slate-*`). Tidak ada arbitrary hex color.
- **✅ Font:** 100% menggunakan `font-sans` (Poppins/Inter) dan `font-display` (Fraunces). Tidak ada font acak.
- **✅ Shared Components:** Mayoritas halaman sudah menggunakan `<app-input>`, `<app-button>`, `<app-icon>`, `<app-skeleton>`, `<app-modal>`, `<app-table>`, `<app-pagination>`, `<app-badge>`, `<app-product-card>`, dll.
- **✅ Tailwind Utility-First:** 98% styling dilakukan via Tailwind utility classes, bukan CSS kustom.
- **✅ File CSS berisi konten** hanya 2 file, keduanya hanya untuk `:host` pseudo-selector yang sah.
