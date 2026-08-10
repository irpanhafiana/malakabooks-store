# Audit Report: Type Safety & State Management

**Scope:** `src/app/core/`, `src/app/store/`, `src/app/features/`  
**Tanggal:** 2026-08-10

---

## Ringkasan Temuan

| Kategori Pelanggaran | Jumlah File | Severity |
|---|---|---|
| 1. Penggunaan tipe `any` tanpa interface/type | **15 file** (35+ occurrence) | 🔴 High |
| 2. Potensi crash tanpa optional chaining (`?.`) | **2 file** | 🟡 Medium |
| 3. Mutasi Signal Store langsung dari komponen | **0 file** | ✅ Clean |
| 4. Store tanpa `loading`/`error` state | **2 store** | 🟡 Medium |
| 5. *(Bonus)* `catch (err: any)` — untyped error handling | **3 file** | ⚪ Low |
| 6. *(Bonus)* `catch (err)` tanpa error propagation ke state | **9 file** | ⚪ Low |

---

## 1. Penggunaan Tipe Data `any` Tanpa Interface/Type

> [!CAUTION]
> Penggunaan `any` menghilangkan manfaat TypeScript sepenuhnya. Setiap parameter, return type, dan signal yang bertipe `any` berpotensi menyebabkan runtime crash yang tidak terdeteksi saat compile.

### 1a. Signal `<any>` — Komponen

| File | Baris | Kode | Rekomendasi |
|---|---|---|---|
| [orders-list.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/orders/list/orders-list.component.ts#L61) | 61 | `detailResiData = signal<any>(null)` | Buat `interface DetailResiData` atau gunakan tipe dari `waybill-normalizer.ts` |
| [complaint.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/complaint/complaint.component.ts#L51) | 51 | `selectedComplaint = signal<any>(null)` | Ganti ke `signal<Complaint \| null>(null)` (model `Complaint` sudah ada di `core/models/`) |
| [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts#L28) | 28 | `trackingData = signal<any>(null)` | Buat `interface TrackingResponse` |
| [items-detail.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/detail/items-detail.component.ts#L19) | 19 | `item = signal<CatalogItem & any \| null>(null)` | Hapus `& any` — gunakan `signal<CatalogItem \| null>(null)` |

### 1b. `Promise<any>` / `Observable<any>` / Casting `as any` — Store & Service

| File | Baris | Kode | Rekomendasi |
|---|---|---|---|
| [order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/order.store.ts#L127) | 127 | `createShipment(orderId): Promise<any>` | Buat `interface ShipmentResponse` |
| [order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/order.store.ts#L139) | 139 | `createBulkShipments(orderIds): Promise<any>` | Gunakan `Promise<ShipmentResponse[]>` |
| [order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/order.store.ts#L151) | 151 | `cancelShipment(orderId): Promise<any>` | Gunakan `Promise<ShipmentResponse>` |
| [order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/order.store.ts#L162) | 162 | `getDetailResi(courier, awb): Promise<any>` | Gunakan `Promise<DetailResiData>` |
| [b2c-order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/b2c-order.store.ts#L45) | 45 | `postB2COrder(payload: any[]): Observable<any>` | Buat `interface B2COrderPayload` dan `B2COrderResponse` |
| [b2c-order-api.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/b2c-order-api.service.ts#L12) | 12 | `postB2COrder(payload: any[]): Observable<any>` | Terapkan interface yang sama |
| [order-api.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/order-api.service.ts#L103) | 103, 212 | `status: res.status as any` | Gunakan enum `OrderStatus` |
| [cart.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/cart.store.ts#L75) | 75 | `(i as any).bookId \|\| ((i as any).product ...)` | Gunakan tipe eksplisit `CartItem` |
| [katalog-cart.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/katalog-cart.store.ts#L55) | 55-57 | `(product as any).name \|\| (product as any).image ...` | Gunakan interface `CatalogItem` |

### 1c. Parameter `any` — Utility Functions, Shared UI & Services

| File | Baris | Kode | Rekomendasi |
|---|---|---|---|
| [waybill-normalizer.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/waybill-normalizer.ts#L7) | 7 | `extractDetailResiData(data: any): any` | Buat `interface RawWaybillResponse` |
| [waybill-normalizer.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/waybill-normalizer.ts#L13) | 13 | `getWaybillField(detailObj: any, ...keys): string` | Gunakan `Record<string, unknown>` |
| [waybill-normalizer.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/waybill-normalizer.ts#L22) | 22-54 | 5 fungsi semuanya `(log: any)` / `(detailObj: any)` | Definisikan `interface WaybillDetail` |
| [shipping-label.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/shipping-label.service.ts#L10) | 10, 22, 81 | `detailResiData: any`, `const p: any = it.product` | Gunakan `DetailResiData` interface |
| [google-auth.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/google-auth.service.ts#L9) | 9, 24, 52, 60 | `declare const google: any`, `(response: any)` | Buat `interface GoogleCredentialResponse` atau gunakan `@types/google.accounts` |
| [profile.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/profile/profile.component.ts#L128) | 128 | `next: (res: any) => { ... }` | Buat `interface ExternalProfileResponse { id: string; data?: { id: string } }` |
| [map-picker.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/map-picker/map-picker.component.ts#L34) | 34, 35, 82 | `private map: any; private marker: any; (e: any)` | Gunakan tipe leaflet `L.Map` dan `L.Marker` |
| [masonry-grid.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/masonry-grid/masonry-grid.component.ts#L13) | 13, 15, 17 | `items = input<any[]>([]); trackById(item: any): any` | Gunakan generic `T` pada komponen masonry |

**Kode perbaikan contoh — `waybill-normalizer.ts`:**
```typescript
// SEBELUM
export function extractDetailResiData(data: any): any { ... }

// SESUDAH
export interface WaybillApiResponse {
  data?: WaybillDetail;
  [key: string]: unknown;
}

export interface WaybillDetail {
  awb?: string;
  status?: string | { name?: string; status?: string };
  ekspedisi?: string;
  receiver_name?: string;
  shipper_name?: string;
  history_pengiriman?: WaybillLogEntry[];
  history?: WaybillLogEntry[];
  [key: string]: unknown;  // allow unknown keys from 3rd party API
}

export function extractDetailResiData(data: WaybillApiResponse | null): WaybillDetail | null { ... }
```

---

## 2. Potensi Runtime Crash — Missing Optional Chaining

> [!WARNING]
> Pembacaan properti bertingkat tanpa `?.` pada objek yang mungkin `null` atau `undefined` berpotensi menyebabkan `TypeError: Cannot read properties of undefined`.

| File | Baris | Kode Riskan | Risiko | Rekomendasi |
|---|---|---|---|---|
| [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts#L70) | 70-130 | `get trackingDetails` → `res.data` tanpa guard, lalu `details.awb`, `details.status.name` | `res.data` bisa undefined; `rawStatus.name` bisa crash jika `rawStatus` bukan object | Konversi ke `computed()` dan tambahkan `?.` di setiap akses nested |
| [profile.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/profile/profile.component.ts#L128) | 128-133 | `res.id`, `res.data.id` | `res` bisa null; `res.data` bisa undefined | Gunakan `res?.id`, `res?.data?.id` |

**Kode perbaikan — `detail-shipment.component.ts`:**
```typescript
// SEBELUM (riskan)
get status(): string {
  const details = this.trackingDetails;
  const rawStatus = details.status || '';  // crash jika details null
  if (rawStatus && typeof rawStatus === 'object') {
    return rawStatus.name || rawStatus.status || '';  // ok setelah typeof check
  }
  return rawStatus;
}

// SESUDAH (aman)
readonly status = computed(() => {
  const details = this.trackingDetails();
  if (!details) return '';
  const rawStatus = details?.status ?? '';
  if (rawStatus && typeof rawStatus === 'object') {
    return (rawStatus as Record<string, string>).name || 
           (rawStatus as Record<string, string>).status || '';
  }
  return String(rawStatus);
});
```

---

## 3. Mutasi Signal Store dari Luar Store Methods

### ✅ Tidak Ditemukan Pelanggaran

Seluruh komponen di `features/` mengakses store hanya melalui public methods dan computed signals. Tidak ada komponen yang memanggil `store.state.set()` atau `store.state.update()` secara langsung.

Semua 21 store files menerapkan pola enkapsulasi yang benar:
- State signal `private` atau `protected`
- Public API via methods (`load()`, `save()`, `delete()`, dll)
- Read-only akses via `computed()` signals

---

## 4. Store Tanpa `loading`/`error` State

> [!WARNING]
> Store yang mengelola data async WAJIB memiliki `loading` dan `error` state agar komponen dapat menampilkan fallback UI (skeleton, error message, empty state).

### Stores yang LENGKAP (loading + error + data) — 9 store ✅

| Store | loading | error | Data Signal |
|---|---|---|---|
| `admin-home-address.store.ts` | ✅ | ✅ | `addresses` |
| `auth.store.ts` | ✅ | ✅ | `user`, `token` |
| `cart.store.ts` | ✅ | ✅ | `items` |
| `complaint.store.ts` | ✅ | ✅ | `complaints` |
| `inventory-movement.store.ts` | ✅ | ✅ | `movements` |
| `item.store.ts` | ✅ | ✅ | `items` |
| `order.store.ts` | ✅ | ✅ | `orders` |
| `product.store.ts` | ✅ | ✅ | `products` |
| `promotion-banner.store.ts` | ✅ | ✅ | `banners` |

### Stores yang LENGKAP (loading + error) via `BaseCrudStore` — 6 store ✅

| Store | loading | error | Data Signal |
|---|---|---|---|
| `author.store.ts` | ✅ | ✅ | `authors` |
| `payment.store.ts` | ✅ | ✅ | `payments` |
| `pricing.store.ts` | ✅ | ✅ | `pricings` |
| `uom-group.store.ts` | ✅ | ✅ | `uomGroups` |
| `user.store.ts` | ✅ | ✅ | `users` |
| `warehouse.store.ts` | ✅ | ✅ | `warehouses` |
| `warehouse-stock.store.ts` | ✅ | ✅ | `stocks` |

### 🟡 Stores yang TIDAK LENGKAP — 2 store

| Store | loading | error | Masalah | Rekomendasi |
|---|---|---|---|---|
| [b2c-order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/b2c-order.store.ts) | ❌ | ❌ | Tidak ada loading/error. `postB2COrder()` langsung return Observable tanpa state management. | Tambahkan `loading` dan `error` signal; handle state di `postB2COrder()` |
| [katalog-cart.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/katalog-cart.store.ts) | ❌ | ❌ | Cart store untuk katalog B2C tidak memiliki loading/error state. | Tambahkan `loading` dan `error` signal |

**Kode perbaikan — `b2c-order.store.ts`:**
```typescript
// Tambahkan state management
readonly loading = signal(false);
readonly error = signal<string | null>(null);

postB2COrder(payload: B2COrderPayload[]): Observable<B2COrderResponse> {
  this.loading.set(true);
  this.error.set(null);
  return this.b2cApi.postB2COrder(payload).pipe(
    tap(() => this.loading.set(false)),
    catchError(err => {
      this.loading.set(false);
      this.error.set('Gagal membuat pesanan B2C.');
      throw err;
    })
  );
}
```

---

## 5. *(Bonus)* `catch (err: any)` — Untyped Error Handling

| File | Baris | Kode | Rekomendasi |
|---|---|---|---|
| [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts#L55) | 55 | `catch (err: any)` lalu `err?.message` | Ganti ke `catch (err: unknown)` lalu `err instanceof Error ? err.message : '...'` |
| [order-history.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/order-history/order-history.component.ts#L139) | 139 | `catch (err: any)` | Ganti ke `catch (err: unknown)` |
| [auth.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/auth.store.ts#L217) | 217 | `catch (err: any)` | Ganti ke `catch (err: unknown)` |

**Kode perbaikan:**
```typescript
// SEBELUM
catch (err: any) {
  this.error.set(err?.message || 'Gagal memuat data.');
}

// SESUDAH (type-safe)
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Gagal memuat data.';
  this.error.set(message);
}
```

---

## 6. *(Bonus)* Catch Block Tanpa Error State Update pada Mutation Methods

Di 9 store yang sudah memiliki `error` state, method **load/fetch** sudah benar mengupdate `error` state. Namun method **mutation** (`save`, `delete`) hanya mengatur `loading: false` tanpa memperbaharui `error`:

| Store | Method yang Tidak Set `error` |
|---|---|
| `author.store.ts` | `save()`, `delete()` |
| `payment.store.ts` | `savePayment()`, `deletePayment()` |
| `pricing.store.ts` | `savePricing()`, `deletePricing()` |
| `warehouse.store.ts` | `saveWarehouse()`, `deleteWarehouse()` |
| `warehouse-stock.store.ts` | `saveWarehouseStock()`, `deleteWarehouseStock()` |
| `promotion-banner.store.ts` | `saveBanner()`, `deleteBanner()` |

> [!NOTE]
> Ini bukan bug kritis karena mutation methods biasanya menggunakan `AlertService` untuk notifikasi error. Namun, untuk konsistensi, idealnya catch block juga mengupdate `error` state.

---

## Prioritas Perbaikan

1. 🔴 **[HIGH]** Buat interface untuk **waybill/tracking data** — menghilangkan 12+ occurrence `any` di [waybill-normalizer.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/waybill-normalizer.ts), [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts), [orders-list.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/orders/list/orders-list.component.ts), [shipping-label.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/shipping-label.service.ts).
2. 🔴 **[HIGH]** Buat interface `B2COrderPayload` & `B2COrderResponse` — menghilangkan `any` di [b2c-order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/b2c-order.store.ts#L45) dan [b2c-order-api.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/b2c-order-api.service.ts#L12).
3. 🔴 **[HIGH]** Hapus `& any` dan type assertion `as any` di [items-detail.component.ts:19](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/detail/items-detail.component.ts#L19), [order-api.service.ts:103](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/order-api.service.ts#L103), [cart.store.ts:75](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/cart.store.ts#L75), dan [katalog-cart.store.ts:55](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/katalog-cart.store.ts#L55).
4. 🔴 **[HIGH]** Buat `interface GoogleCredentialResponse` di [google-auth.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/google-auth.service.ts#L9).
5. 🟡 **[MEDIUM]** Tambahkan `loading`/`error` state ke [b2c-order.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/b2c-order.store.ts) dan [katalog-cart.store.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/store/katalog-cart.store.ts).
6. 🟡 **[MEDIUM]** Ganti `signal<any>(null)` dan `any` di [complaint.component.ts:51](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/complaint/complaint.component.ts#L51), [map-picker.component.ts:34](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/map-picker/map-picker.component.ts#L34), serta generic `T` di [masonry-grid.component.ts:13](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/masonry-grid/masonry-grid.component.ts#L13).
7. ⚪ **[LOW]** Ganti `catch (err: any)` ke `catch (err: unknown)` di 3 file.
8. ⚪ **[LOW]** Tambahkan `error` state update di mutation methods store.

---

## Catatan Positif ✅

- **✅ Enkapsulasi Store:** Tidak ada komponen yang memodifikasi state store secara langsung. Semua mutasi melalui public methods.
- **✅ Model Directory:** Proyek memiliki **24 model/interface files** di `src/app/core/models/` yang comprehensive.
- **✅ Loading/Error Pattern:** 15 dari 17 store sudah memiliki `loading` + `error` state yang dikelola dengan benar.
- **✅ Fallback UI:** Mayoritas komponen sudah menampilkan skeleton (loading), error message, dan empty state.
