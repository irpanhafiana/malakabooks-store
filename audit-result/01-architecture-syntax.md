# Audit Report: Arsitektur & Sintaks Angular 21

**Scope:** `src/app/` — seluruh komponen, service, store, layout, dan shared UI.
**Tanggal:** 2026-08-10

---

## Ringkasan Temuan

| Kategori Pelanggaran | Jumlah File | Severity |
|---|---|---|
| 1. Legacy Directives (`*ngIf`, `*ngFor`) | **2 file** | 🔴 High |
| 2. Constructor Injection (parameter DI) | **1 file** | 🔴 High |
| 3. Import Server Module (`platform-server`, `express`) | **0 file** | ✅ Clean |
| 4. Missing `ChangeDetectionStrategy.OnPush` | **1 file** | 🟡 Medium |
| 5. *(Bonus)* Import `CommonModule` (tidak perlu jika pakai `@if`/`@for`) | **8 file** | 🟡 Medium |

---

## 1. Legacy Directives (`*ngIf`, `*ngFor`)

> [!CAUTION]
> SANGAT DILARANG menggunakan `*ngIf`, `*ngFor`, `*ngSwitch`. Wajib migrasi ke `@if`, `@for`, `@switch`, `@let`.

### File Bermasalah

| File | Baris | Kode Pelanggaran | Rekomendasi |
|---|---|---|---|
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L4) | 4 | `<ng-container *ngIf="loading()">` | Ganti ke `@if (loading()) { ... }` |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L17) | 17 | `<ng-container *ngIf="!loading() && error()">` | Ganti ke `@if (!loading() && error()) { ... }` |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L36) | 36 | `<ng-container *ngIf="!loading() && !error() && trackingData()">` | Ganti ke `@if (...) { ... }` |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L96) | 96 | `<div *ngIf="trackingLogs.length > 0; else emptyTimeline" ...>` | Ganti ke `@if (trackingLogs.length > 0) { ... } @else { ... }` |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L99) | 99 | `*ngFor="let log of trackingLogs; let i = index; let first = first; let last = last"` | Ganti ke `@for (log of trackingLogs; track log; let i = $index, first = $first, last = $last) { ... }` |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L125) | 125 | `<span *ngIf="getLogLocation(log)" ...>` | Ganti ke `@if (getLogLocation(log)) { ... }` |
| [tooltip.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/tooltip/tooltip.component.ts#L11) | 11 | `<div *ngIf="text()" ...>` | Ganti ke `@if (text()) { ... }` dan hapus import `CommonModule` |

---

## 2. Constructor Injection (Parameter DI)

> [!WARNING]
> Wajib menggunakan `inject(ServiceName)` pada properti kelas. Hindari constructor parameter injection.

| File | Baris | Kode Pelanggaran | Rekomendasi |
|---|---|---|---|
| [map-picker.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/map-picker/map-picker.component.ts#L40) | 40 | `constructor(@Inject(PLATFORM_ID) private platformId: Object) { }` | Ganti ke `private readonly platformId = inject(PLATFORM_ID);` dan hapus `@Inject` import |

> [!NOTE]
> Seluruh `constructor() { ... }` lainnya (~33 file) menggunakan body logic saja (bukan parameter DI), sehingga **sudah sesuai** konvensi `inject()`.

---

## 3. Import Server Module (`@angular/platform-server`, `express`)

✅ **Tidak ditemukan pelanggaran.** Tidak ada file yang mengimpor `@angular/platform-server` atau `express`. Proyek ini sudah murni **Client-Side Rendering (CSR)**.

---

## 4. Missing `ChangeDetectionStrategy.OnPush`

| File | Baris | Kode Pelanggaran | Rekomendasi |
|---|---|---|---|
| [items-detail.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/detail/items-detail.component.ts#L9) | 9-14 | `@Component({ selector: ..., standalone: true, ... })` — **tanpa `changeDetection`** | Tambahkan `changeDetection: ChangeDetectionStrategy.OnPush,` di dalam `@Component({...})` |

> [!NOTE]
> Semua komponen lainnya (97+ file) sudah menggunakan `ChangeDetectionStrategy.OnPush`. ✅

---

## 5. *(Bonus)* Import `CommonModule` — Tidak Perlu Jika Sudah Migrasi ke `@if`/`@for`

> [!TIP]
> Setelah migrasi dari `*ngIf`/`*ngFor` ke `@if`/`@for`, import `CommonModule` menjadi **tidak diperlukan** (kecuali komponen menggunakan pipe bawaan Angular seperti `DatePipe`, `CurrencyPipe`, `NgClass`, `NgStyle`, dll). Hapus import `CommonModule` yang tidak terpakai untuk mengurangi bundle size.

| File | Baris | Status |
|---|---|---|
| [complaints-form.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/complaints/form/complaints-form.component.ts#L2) | 2, 18 | Periksa apakah masih butuh `CommonModule` setelah migrasi `@if`/`@for` |
| [inventory-movements.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/inventory-movements/inventory-movements.component.ts#L15) | 15, 21 | Periksa apakah masih butuh `CommonModule` |
| [items-detail.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/detail/items-detail.component.ts#L7) | 7, 12 | Periksa apakah masih butuh `CommonModule` |
| [pricings-list.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/pricings/list/pricings-list.component.ts#L12) | 12, 21 | Periksa apakah masih butuh `CommonModule` |
| [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts#L3) | 3, 15 | Setelah migrasi `*ngIf`/`*ngFor`, hapus `CommonModule` (pertahankan `DatePipe` saja) |
| [quantity-selector.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/quantity-selector/quantity-selector.component.ts#L2) | 2, 9 | Periksa apakah masih butuh `CommonModule` |
| [status-badge.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/status-badge/status-badge.component.ts#L2) | 2, 9 | Periksa apakah masih butuh `CommonModule` |
| [tooltip.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/tooltip/tooltip.component.ts#L2) | 2, 9 | Hapus `CommonModule` setelah migrasi `*ngIf` → `@if` |

---

## Prioritas Perbaikan

1. 🔴 **[HIGH]** Migrasi 6x `*ngIf` + 1x `*ngFor` di [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html) ke `@if`/`@for`.
2. 🔴 **[HIGH]** Migrasi 1x `*ngIf` di [tooltip.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/tooltip/tooltip.component.ts#L11) ke `@if`.
3. 🔴 **[HIGH]** Ganti constructor DI di [map-picker.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/map-picker/map-picker.component.ts#L40) ke `inject(PLATFORM_ID)`.
4. 🟡 **[MEDIUM]** Tambahkan `OnPush` ke [items-detail.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/detail/items-detail.component.ts#L9).
5. 🟡 **[MEDIUM]** Evaluasi dan hapus import `CommonModule` yang tidak terpakai di 8 file setelah migrasi ke `@if`/`@for`.
