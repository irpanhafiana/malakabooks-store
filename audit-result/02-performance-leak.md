# Audit Report: Performa & Memory Leak

**Scope:** `src/app/` — seluruh komponen, service, store, layout, shared UI, dan directives.  
**Tanggal:** 2026-08-10

---

## Ringkasan Temuan

| Kategori Pelanggaran | Jumlah File | Severity |
|---|---|---|
| 1. `.subscribe()` RxJS tanpa cleanup | **1 file** (1 occurrence) | 🔴 High |
| 2. `setInterval()` / `setTimeout()` tanpa cleanup | **0 file** (risiko rendah) | ✅ Clean |
| 3. `addEventListener()` tanpa cleanup | **0 file** | ✅ Clean |
| 4. `effect()` berisiko infinite loop / state mutation | **0 file** (risiko rendah) | ✅ Clean |
| 5. Komputasi berat / method call di template HTML | **1 file** (4 call dalam loop) | 🟡 Medium |
| 6. *(Bonus)* `ScreenService` — `ngOnDestroy` pada `providedIn: 'root'` service | **1 file** | 🟡 Medium |
| 7. *(Bonus)* Penggunaan `Subject` + manual `Subscription` (bisa disederhanakan) | **1 file** | ⚪ Low |

---

## 1. `.subscribe()` RxJS Tanpa Cleanup

> [!CAUTION]
> Setiap `.subscribe()` pada Observable yang berumur panjang (bukan one-shot HTTP call) WAJIB memiliki cleanup: `takeUntilDestroyed()`, `take(1)`, atau `Subscription.unsubscribe()`.

### ✅ File yang SUDAH BENAR (memiliki cleanup):

Sebagian besar file sudah menggunakan `takeUntilDestroyed(this.destroyRef)` dengan benar:

| File | Cleanup |
|---|---|
| `home-addresses-form.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `inventory-movements.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `items-form.component.ts` | `takeUntilDestroyed()` ✅ |
| `pricings-form.component.ts` | `takeUntilDestroyed()` ✅ |
| `stocks-form.component.ts` | `takeUntilDestroyed()` ✅ |
| `uom-groups-form-page.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `checkout.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `katalog-header.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `mardika-kopi-detail.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `detail-shipment.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `order-success.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `product-detail.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `my-addresses.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `profile.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `admin-layout.component.ts` | `takeUntilDestroyed()` ✅ |
| `inner-page-layout.component.ts` | `takeUntilDestroyed()` ✅ |
| `katalog-layout.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `admin-select.component.ts` | `takeUntilDestroyed(this.destroyRef)` ✅ |
| `search-bar.component.ts` | `Subscription.unsubscribe()` di `ngOnDestroy` ✅ |

### 🔴 File BERMASALAH (tanpa cleanup):

| File | Baris | Kode Pelanggaran | Jenis Leak | Rekomendasi |
|---|---|---|---|---|
| [katalog-cart.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/katalog/katalog-cart/katalog-cart.component.ts#L160) | 160 | `this.b2cOrderStore.postB2COrder(payload).subscribe({...})` | Potensi leak jika Observable tidak complete (bukan HTTP one-shot) | Tambahkan `pipe(take(1))` atau `pipe(takeUntilDestroyed(this.destroyRef))` sebelum `.subscribe()` |

**Kode perbaikan:**
```typescript
// SEBELUM (tanpa cleanup)
this.b2cOrderStore.postB2COrder(payload).subscribe({
  next: (res) => { ... },
  error: (err) => { ... }
});

// SESUDAH (dengan take(1) untuk one-shot call)
import { take } from 'rxjs/operators';

this.b2cOrderStore.postB2COrder(payload).pipe(take(1)).subscribe({
  next: (res) => { ... },
  error: (err) => { ... }
});
```

---

## 2. `setInterval()` / `setTimeout()` — Cleanup Audit

### ✅ `setInterval()` — SUDAH BENAR

| File | Baris | Status |
|---|---|---|
| [pricings-form-page.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/pricings/form-page/pricings-form-page.component.ts#L37) | 37, 41, 44 | `setInterval()` di-cleanup via `clearInterval(checkInterval)` dan fallback `setTimeout(() => clearInterval(...), 3000)` ✅ |

### ✅ `setTimeout()` — Sebagian Besar Aman

Ditemukan **35 occurrence** di 18 file. Mayoritas adalah *one-shot delay* pendek (10ms–300ms) untuk animasi UI, yang secara arsitektural **aman** karena:
- Berjalan sekali dan selesai (tidak looping).
- Dipakai di dalam event handler atau lifecycle hook yang terbatas.

| File | Jumlah | Risiko |
|---|---|---|
| `home.component.ts` | 2x (di `effect()`) | ⚪ Rendah — delay 100ms untuk carousel reInit |
| `bottom-sheet.component.ts` | 4x | ⚪ Rendah — delay animasi open/close |
| `katalog-cart.component.ts` | 8x | ⚪ Rendah — delay animasi modal visibility toggle |
| `katalog-checkout.component.ts` | 3x | ⚪ Rendah — delay animasi |
| `katalog-home.component.ts` | 2x | ⚪ Rendah — delay onboarding sheet |
| `katalog-selection-sheet.component.ts` | 2x | ⚪ Rendah — delay animasi |
| `mardika-kopi.component.ts` | 2x (di `effect()`) | ⚪ Rendah — delay 100ms carousel reInit |
| `tooltip.directive.ts` | 1x | ⚪ Rendah — delay positioning tooltip |
| `editor.component.ts` | 2x | ⚪ Rendah — delay focus |
| Lainnya | 9x | ⚪ Rendah — delay navigasi / animasi |

> [!NOTE]
> Tidak ditemukan `setTimeout()` bermasalah yang menyimpan referensi tanpa cleanup pada komponen berumur panjang.

---

## 3. `addEventListener()` — Cleanup Audit

### ✅ Semua Sudah Memiliki Cleanup

| File | addEventListener | removeEventListener | Status |
|---|---|---|---|
| [screen.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/screen.service.ts#L24) | L24: `mediaQueryList.addEventListener('change', ...)` | L34: `removeEventListener('change', ...)` di `ngOnDestroy()` | ✅ |
| [bottom-sheet.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/bottom-sheet/bottom-sheet.component.ts#L82) | L82-86: `mousemove`, `mouseup`, `touchmove`, `touchend` | L119-126, L153-156: `removeEventListener()` di `ngOnDestroy()` dan drag-end handler | ✅ |
| [editor.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/editor/editor.component.ts#L73) | L73: `document.addEventListener('selectionchange', ...)` | L77: `removeEventListener('selectionchange', ...)` di `ngOnDestroy()` | ✅ |

---

## 4. `effect()` — Risiko Infinite Loop & State Mutation

Ditemukan **32 occurrence** `effect()` di 22 file. Setelah dianalisis:

### ✅ Tidak Ditemukan Infinite Loop

Semua `effect()` yang ditemukan mengikuti pola aman:
- **Membaca signal → melakukan side-effect non-signal** (misal: carousel `reInit()`, `patchValue()` pada FormControl, `localStorage.setItem()`).
- **Tidak ada `effect()` yang menulis kembali ke signal yang dibacanya** (pola yang akan memicu infinite loop).

> [!NOTE]
> Angular menjalankan `effect()` di dalam injection context (constructor). Saat komponen di-destroy, Angular secara otomatis membersihkan `effect()` yang dibuat di constructor. **Tidak ada manual cleanup yang diperlukan.**

---

## 5. Komputasi Berat / Method Call di Template HTML (Inside Loop)

> [!WARNING]
> Method call di dalam template HTML akan dipanggil ulang setiap change detection cycle. Pada loop `@for` / `*ngFor`, ini bisa menjadi bottleneck performa jika data besar.

| File | Baris | Kode Pelanggaran | Jenis Masalah | Rekomendasi |
|---|---|---|---|---|
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L113) | 113 | `{{ getLogDate(log) \| date: 'medium' }}` | Method call di dalam `*ngFor` loop | Pindahkan ke model/interface atau `computed()` |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L121) | 121 | `{{ getLogDescription(log) }}` | Method call di dalam `*ngFor` loop | Pindahkan ke model/interface |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L125) | 125 | `*ngIf="getLogLocation(log)"` | Method call di kondisi `*ngIf` di dalam loop | Pindahkan ke model/interface |
| [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L127) | 127 | `{{ getLogLocation(log) }}` | Method call di dalam `*ngFor` loop | Pindahkan ke model/interface |
| [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts#L70) | 70-142 | `get trackingDetails`, `get awbNo`, `get status`, `get courier`, `get trackingLogs` (TypeScript getters) | Getter dipanggil setiap change detection | Konversi ke `computed()` signal |

**Kode perbaikan — konversi getter ke `computed()` signal:**
```typescript
// SEBELUM (getter — dipanggil setiap CD cycle)
get trackingLogs(): any[] {
  const details = this.trackingDetails;
  // ... sorting logic ...
  return sorted;
}

// SESUDAH (computed signal — hanya dihitung ulang saat trackingData() berubah)
readonly trackingLogs = computed(() => {
  const res = this.trackingData();
  if (!res) return [];
  const details = res.data ?? res;
  const rawList = details.history_pengiriman || details.history || /* ... */ [];
  if (!Array.isArray(rawList)) return [];
  return [...rawList].sort((a, b) => {
    const dateA = new Date(a.date || a.dateTime || '').getTime();
    const dateB = new Date(b.date || b.dateTime || '').getTime();
    return dateB - dateA;
  });
});
```

---

## 6. *(Bonus)* `ScreenService` — `ngOnDestroy` pada Root-Level Service

| File | Baris | Masalah | Severity |
|---|---|---|---|
| [screen.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/screen.service.ts#L6) | 6 | `ScreenService` adalah `providedIn: 'root'` (singleton). `ngOnDestroy()` pada service root-level **tidak akan pernah dipanggil** kecuali saat app sepenuhnya di-destroy. Ini bukan bug langsung, tapi `removeEventListener` di L34 sebenarnya redundant. | 🟡 Medium |

**Rekomendasi:** Pertahankan kode saat ini (defensif). Atau gunakan `DestroyRef` + `inject()` untuk konsistensi.

---

## 7. *(Bonus)* `SearchBarComponent` — Bisa Disederhanakan

| File | Baris | Masalah | Severity |
|---|---|---|---|
| [search-bar.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/search-bar/search-bar.component.ts#L23) | 23-39 | Menggunakan `Subject` + manual `Subscription` + `ngOnDestroy` untuk debounce. Bisa disederhanakan dengan `takeUntilDestroyed()`. | ⚪ Low |

**Kode perbaikan:**
```typescript
// SEBELUM (manual Subject + Subscription)
private searchSubject = new Subject<string>();
private subscription?: Subscription;

ngOnInit() {
  this.subscription = this.searchSubject.pipe(...).subscribe(...);
}
ngOnDestroy() {
  this.subscription?.unsubscribe();
}

// SESUDAH (takeUntilDestroyed — lebih ringkas)
private readonly destroyRef = inject(DestroyRef);
private searchSubject = new Subject<string>();

ngOnInit() {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe((query) => {
    this.inputChange.emit(query.trim());
  });
}
// Tidak perlu ngOnDestroy() lagi
```

---

## Prioritas Perbaikan

1. 🔴 **[HIGH]** Tambahkan `take(1)` pada `.subscribe()` di [katalog-cart.component.ts:160](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/katalog/katalog-cart/katalog-cart.component.ts#L160).
2. 🟡 **[MEDIUM]** Konversi TypeScript getters di [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts#L70) (`trackingDetails`, `awbNo`, `status`, `courier`, `trackingLogs`, `statusBadgeClass`) ke `computed()` signal.
3. 🟡 **[MEDIUM]** Hindari method call di dalam loop template di [detail-shipment.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.html#L113) (`getLogDate()`, `getLogDescription()`, `getLogLocation()`).
4. ⚪ **[LOW]** Refactor [search-bar.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/search-bar/search-bar.component.ts#L23) — ganti `Subject` + manual `Subscription` ke `takeUntilDestroyed()`.
