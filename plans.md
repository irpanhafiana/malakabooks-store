# Audit Kesesuaian Frontend Angular 21 ↔ Backend .NET API (MalakaBooks)

## Context

Tujuan: memastikan kontrak antara frontend Angular (`src/`) dan backend .NET (`API/`) benar-benar sinkron, menemukan mismatch yang berpotensi bug runtime, dan menilai apakah struktur Angular sudah setara standar senior. Audit dilakukan dengan membaca sumber langsung (bukan asumsi): 38 controller backend, `ApiControllerBase`, seluruh `MalakaBooks.ViewModel`, FluentValidation, serta 20 API service + 22 model + interceptor/store di frontend. Titik-titik kritis (envelope, warehouse-stock, order mapping, DTO interface) diverifikasi baris-per-baris.

Deliverable ini = laporan audit + rencana remediasi. Belum ada kode yang diubah.

---

## Ringkasan arsitektur (fakta terverifikasi)

**Backend** — `[Route("api/v1/{area}/[controller]")]` dengan 3 area: `admin` (policy `MalakaAdminPolicy`), `customer` (`MalakaCustomerPolicy`), `public` (`[AllowAnonymous]`). Semua respons dibungkus `ApiResponse<T>` (Newtonsoft camelCase, null di-drop): `{ statusCode, statusMessage, data, errors, errorType, isSuccess }`. Lapisan otorisasi kedua: `GlobalHttpMethodAuthorizationFilter` menuntut claim per-metode (`POST→Create`, `GET→Read`, `PUT→Update`, `DELETE→Delete`), else 403. DTO tidak pakai DataAnnotations — validasi via FluentValidation. Hanya 1 endpoint paginasi: `POST api/v1/admin/Orders` → `PagedResult<T>`.

**Frontend** — Angular 21, feature-based (`core/shared/features/layouts/store`), 100% standalone components, signals + service-store, `inject()`, tsconfig strict penuh, Vitest, design system in-house. Interceptor: `authInterceptor` (bearer + refresh/401) & `loadingInterceptor`. Base URL dari `environment.apiBaseUrl`.

---

## 1. Tabel ringkasan kesesuaian per kelompok endpoint

Status: ✅ Sudah & cocok · ⚠️ Partial/Mismatch · ❌ Belum/Broken · ➖ Tidak perlu di FE

| Domain / Endpoint | Frontend service | Status | Catatan |
|---|---|---|---|
| Auth `POST {authUrl}/connect/token` (password & refresh) | auth-api | ✅ | ROPC, client `MalakaBooks-FE`. Di luar REST surface. |
| Register `POST /customer/Users` | user-api | ✅ | `RegisterPayload` ⇄ `CreateIS4UserRequest` cocok field-per-field. |
| User profile `GET /customer/Users/{key}/profile` | user-api | ⚠️ | Backend `UserResponse` = firstName/lastName/phone/avatar/createdAt. FE `User` butuh `name/email/role/joinedAt` → dipetakan manual; `email` tidak dikirim backend. |
| `PUT /customer/Users/{id}/profile` | user-api | ✅ | `{firstName,lastName,avatar}` ⇄ `UpdateUserRequest`. |
| `PUT /customer/Users/change-password` | — | ❌ | Endpoint backend ada, **tidak dipakai FE**. |
| Addresses `GET user/{id}` / `POST` / `PUT` / `DELETE` | user-api | ⚠️ | Request body cocok `CreateAddressRequest`. Pakai `AddressResponseDto` dari `backend-dtos.model.ts`. |
| Home addresses admin `GET/POST/PUT/DELETE /admin/HomeAddresses` | admin-home-address | ✅ | Cocok `CreateHomeAddressRequest`. |
| Home addresses `GET /public/HomeAddresses` | address-api | ✅ | Ada. |
| Cart `GET/POST/DELETE /customer/Cart` | cart-api | ✅ | `ApiResponse<CartData>` baca `.data.items`; body `AddCartItemRequest` cocok. |
| Orders admin list `POST /admin/Orders` | order-api | ✅ | Body `{pageNumber,pageSize}` ⇄ `PagingParam`; baca `.data.results` (`PagedResultDto<OrderResponseDto>`). |
| Orders customer `GET user/{id}`, `GET {id}`, `POST` | order-api | ✅ | Memakai `OrderResponseDto` dengan fallback `itemsSubtotal`, `shippingFee`, `grandTotal`. |
| Order status `PUT /admin/Orders/{id}/status` | order-api | ✅ | `{status}` ⇄ `UpdateOrderStatusRequest`. |
| Shipment `POST {id}/shipment`, `POST /shipment`, `POST {id}/shipment/cancel`, `POST /shipment/detail-resi` | order-api | ✅ | Ada semua. |
| Shipment **recheck** (`{id}/shipment/recheck`, batch) | — | ❌ | Endpoint backend ada, tidak dipakai FE. |
| Track AWB `GET /customer/Simasrim/TrackAwb/{id}` | order-api | ✅ | Ada. |
| Simasrim Province/City/District/Courier/Tarif | address-api | ✅ | Cocok (body pakai model eksternal Simasrim). |
| Simasrim `POST /Insurance` | — | ➖/❌ | Endpoint backend ada; tidak ditemukan pemanggil FE. |
| Categories `GET/POST/PUT/DELETE` (admin) + `GET /public` | category-api | ✅ | `{name,slug,description,icon}` cocok. |
| Categories `GET type/{itemType}` | — | ➖ | FE filter client-side, endpoint tak dipakai. |
| Authors `GET/POST/PUT/DELETE` | author-api | ✅ | Cocok. |
| Payments `GET/POST/PUT/DELETE` + `POST /customer/Payments/calculate-fees` | payment-api | ✅ | `calculate-fees` baca `.data.totalFeeAmount` cocok. |
| Pricings `GET/POST/PUT/DELETE` + `lookup` (customer & public) | pricing-api | ✅ | `CustomerPriceLookupRequest`/`PublicPriceLookupRequest` cocok. |
| UomGroups `GET/POST/PUT/DELETE` | uom-group-api | ✅ | Cocok. |
| Warehouses `GET/POST/PUT/DELETE` | warehouse-api | ✅ | Cocok. |
| **WarehouseStocks** `GET/POST/PUT/DELETE` | warehouse-stock-api | ❌ | **Tidak ada controller di backend** (hanya koleksi Mongo `warehousestocks`). Service mencantumkan comment TODO non-fungsional; route dinonaktifkan. |
| InventoryMovements `GET (?itemId)`, `POST /goods-receive` | inventory-movement-api | ✅ | Cocok. |
| Items `GET /public\|customer\|admin/Items(/priced)`, `{id}` | item-api / product-api | ✅ | Endpoint cocok; response `ItemResponse`/`PricedItemResponse`. |
| Books `POST/PUT /admin/Books` (via product-api) | product-api | ⚠️ | Kirim body produk penuh; backend `CreateBookRequest` hanya ikat `{ItemId,AuthorIds,Isbn,Publisher,PublishedYear,Pages}` → sisanya diabaikan. |
| Books `POST/PUT /admin/Books` (via item-api) | item-api | ✅ | `{itemId,authorIds,isbn,publisher,publishedYear,pages}` cocok. |
| Reviews `GET items/{id}`, `POST` | review-api | ✅ | Cocok. |
| Complaints admin `GET`, `PUT {id}/respond`; customer `GET user/{id}`, `POST`, `PUT {id}/reply` | complaint-api | ✅ | Cocok (pakai `ComplaintResponseDto`). |
| PromotionBanners `POST/PUT/DELETE /admin`, `GET /public` | promotion-banner | ✅ | Admin & aktif keduanya baca `GET /public/PromotionBanners`. |
| DOKU status `POST /customer/IncomingPayments/DOKU/CheckStatus` | external-message | ✅ | Ada di `external-message.service.ts`. |
| Dashboard | dashboard-api | ✅ | Tidak ada HTTP langsung; agregasi client-side. |

---

## 2. Isu prioritas TINGGI (berpotensi bug runtime)

### H1 — Fitur "Warehouse Stocks" memanggil endpoint yang tidak ada (404)
`warehouse-stock-api.service.ts` memanggil `/admin/WarehouseStocks` & `/public/WarehouseStocks` (GET/POST/PUT/DELETE). Tidak ada `WarehouseStocksController` di backend (dikonfirmasi: hanya muncul di Postman & `MongoDbSetting.WarehouseStocksCollection`). Akibat: GET menelan error → daftar kosong; save/delete → exception. Service sudah diberi catatan TODO non-fungsional & link nav dinonaktifkan, namun file service & store masih tersimpan.
- Bukti: [warehouse-stock-api.service.ts:9-14](src/app/core/services/warehouse-stock-api.service.ts:9), [MongoDbSetting.cs:12](API/MalakaBooks.Repository/Configuration/MongoDbSetting.cs:12).

### H2 — Penggunaan properti response legacy (`.message` / `.success`) di UI/Store
Model [api-response.model.ts](src/app/core/models/api-response.model.ts) **sudah cocok** dengan backend (`{ statusCode, statusMessage, data, errors, errorType, isSuccess }`). Namun, beberapa komponen UI dan store (mis. [orders-list.component.ts:112](src/app/features/admin/orders/list/orders-list.component.ts:112)) masih secara salah mencoba membaca `res.message` / `e?.error?.message` (seharusnya `statusMessage`) atau `res.success` (seharusnya `isSuccess`) via casting/variabel `any`.
- Risiko: Pesan error dari backend tidak pernah muncul di toast/alert SweetAlert2 karena `res.message` bernilai `undefined`.
- Bukti: [api-response.model.ts:6-14](src/app/core/models/api-response.model.ts:6) vs [orders-list.component.ts:112](src/app/features/admin/orders/list/orders-list.component.ts:112).

### H3 — Sisa casting `any` & Shim Model pada `order-api.service.ts`
Service `order-api.service.ts` telah menggunakan `OrderResponseDto` dengan pemetaan fallback (`itemsSubtotal`, `shippingFee`, `grandTotal`). Namun, pemetaan item order masih mengandalkan shim `as unknown as Product` ([order-api.service.ts:51](src/app/core/services/order-api.service.ts:51)) karena tipe `CartItem.product` mengharuskan interface `Product` penuh padahal DTO backend hanya mengirim ringkasan item (`{itemId, title, price, coverImage, quantity}`).
- Bukti: [order-api.service.ts:34-54](src/app/core/services/order-api.service.ts:34).

---

## 3. Isu prioritas SEDANG

### M1 — Transisi bertahap Typed DTO Layer di boundary HTTP
Model DTO backend (`OrderResponseDto`, `AddressResponseDto`, `UserResponseDto`, `ComplaintResponseDto`, `PagedResultDto`) **sudah dibuat** di [backend-dtos.model.ts](src/app/core/models/backend-dtos.model.ts) dan sudah mulai diterapkan di `order-api`, `user-api`, `complaint-api`. Namun, beberapa service sekunder masih perlu menyelesaikan pengangkatan tipe agar tidak ada lagi pemanggilan `http.get<any>` di boundary.

### M2 — Payload Books via `product-api` tidak sesuai kontrak
`product-api` `POST/PUT /admin/Books` mengirim field produk penuh (title, categoryId, price, description, coverImage, additionalImages, weight, stock, sapCode, dst). Backend `CreateBookRequest` hanya mengikat `{ItemId, AuthorIds, Isbn, Publisher, PublishedYear, Pages}`; sisanya diabaikan. Validator mewajibkan `ItemId`,`Isbn`,`PublishedYear>0`,`Pages>0` → jika Book dibuat tanpa `itemId` valid lebih dulu = 400. Jalur yang benar adalah `item-api` (buat Item → Book).

### M3 — Penanganan error tidak menyeluruh terhadap status code backend
- `authInterceptor` menangani 401 (refresh+retry) & token kedaluwarsa; **403/404/500 hanya di-rethrow**, tak ada penanganan terpusat.
- 403 dari `GlobalHttpMethodAuthorizationFilter` (token punya policy tapi kurang claim metode) hanya muncul sebagai kegagalan generik/daftar kosong.
- Envelope error terstruktur (`errors: {"1":...}`, `errorType:"ValidationError"`) hanya diurai di sebagian store (mis. `auth.store` register); store lain menampilkan toast generik dan mengabaikan `errors`.

---

## 4. Isu prioritas RENDAH (struktur/gaya, bukan bug)

- **Barrel minim**: hanya `core/models/index.ts`; service/store/ui di-import path panjang.
- **Envelope lokal duplikatif**: mis. `cart-api` mendefinisikan `CartItemResponse`/`CartData` lokal alih-alih model bersama.
- **`store/` flat & terpisah dari feature** (18 file) — pilihan arsitektur yang sah namun memisahkan state dari domain feature.
- **Token di `localStorage`** (rentan XSS) — diakui kode sebagai kenyamanan UI, bukan batas keamanan.
- **Endpoint backend belum dipakai** (bukan bug): `change-password`, shipment `recheck` (single+batch), Simasrim `Insurance`, `type/{itemType}` (filter client-side). `ItemSync` & webhook `ExternalMessage` memang server-to-server.

---

## 5. Rekomendasi perbaikan konkret

1. **H1 WarehouseStocks** — Putuskan arah: (a) minta tim backend menambah `WarehouseStocksController` (entity/koleksi sudah ada), atau (b) hapus `warehouse-stock-api.service.ts`, `warehouse-stock.store.ts`, dan route `features/admin/stocks` sampai API tersedia secara resmi.

2. **H2 Envelope & UI Error Handling** — Audit komponen UI & Store untuk mengganti pembacaan `.message` / `.success` menjadi `.statusMessage` & `.isSuccess` dari envelope `ApiResponse<T>`.

3. **H3 Order Model Refactoring** — Rapikan kontrak UI `Order` / `CartItem` agar tidak membutuhkan shim `as unknown as Product` pada item order.

4. **M1 Typed API layer** — Lanjutkan penerapan DTO dari [backend-dtos.model.ts](src/app/core/models/backend-dtos.model.ts) ke seluruh service HTTP. Satukan jalur Books ke `item-api` dan pensiunkan pembuatan Book di `product-api`.

5. **M3 Error terpusat** — Perluas interceptor error untuk memetakan 403/404/500 & envelope `errors`/`errorType` ke `ToastService`, sehingga store tak perlu mengurai ad-hoc.

---

## 6. Kesimpulan akhir

**Struktur Angular 21: kelas senior (≈A-).** Feature-based murni, 100% standalone, signals + `inject()`, routing lazy + custom preloading strategy, guards & interceptor fungsional, tsconfig strict penuh, Vitest, design system in-house.

**Perkembangan Integrasi API:** DTO response bertipe (`backend-dtos.model.ts`) dan perbaikan envelope `ApiResponse<T>` sudah tersedia di frontend. Langkah remediasi tersisa adalah: (1) pembersihan sisa pembacaan `.message` legacy di UI, (2) penyelesaian migrasi DTO pada seluruh service, dan (3) penanganan endpoint 404 WarehouseStocks.

---

## Verifikasi
- Jalankan `npx ng build` untuk memastikan proyek Angular bebas dari kesalahan kompilasi.