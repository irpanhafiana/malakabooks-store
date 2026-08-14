# Audit Kesesuaian Frontend (Angular) ↔ Backend (.NET API)

| | |
|---|---|
| **Tanggal audit** | 14 Agustus 2026 |
| **Branch / commit** | `ssonlineshop` @ `d705760` |
| **Cakupan** | `src/` (Angular 21, Standalone + Signals + Zoneless) dan `API/` (ASP.NET Core, MediatR, MongoDB, IdentityServer4) |
| **Auditor** | Senior Angular Developer + Senior C# Developer |
| **Metode** | Pembacaan statis menyeluruh: enumerasi seluruh atribut `[Route]`/`[HttpX]`/`[Authorize]` di 40 controller, enumerasi seluruh pemanggilan `this.http.*` di 36 service Angular, lalu pemetaan satu-per-satu URL, verb, DTO request/response, dan model otorisasi. Handler MediatR pada jalur transaksi (order, pembayaran, stok, pengiriman) dibaca sampai ke repository. |
| **Tidak dilakukan** | Menjalankan API (`dotnet run`/`dotnet build`), pengujian runtime, dan penetration testing. Temuan bersifat statis — sudah diverifikasi lintas berkas, tetapi belum dieksekusi. Sesuai instruksi, **tidak ada satu berkas kode pun yang diubah.** |

> Dokumen ini melengkapi [`production-readiness-audit-2026-08-13.md`](production-readiness-audit-2026-08-13.md), yang hanya mengaudit sisi frontend. Fokus di sini adalah hal yang **tidak bisa terlihat** bila hanya satu sisi yang diperiksa: kecocokan kontrak, dan penegakan otorisasi/integritas transaksi di sisi server.

---

## 0. Ringkasan Eksekutif

Arsitektur kedua sisi **secara umum cocok**. Penamaan route (`public` / `customer` / `admin`), envelope respons, dan strategi autentikasi BFF sudah selaras dan dirancang matang. Dari ±95 pemanggilan HTTP di frontend, hampir seluruhnya menemukan route yang benar di backend.

Namun ada **4 temuan kritikal**, dan tiga di antaranya berdampak langsung ke uang dan data pelanggan:

| # | Temuan | Kategori | Dampak |
|---|---|:---:|---|
| **K-1** | Webhook `DOKU/Notify` anonim **tanpa verifikasi signature** — filter validasi sudah ditulis tapi tidak pernah dipasang | Keamanan | Siapa pun bisa menandai order mana pun sebagai LUNAS dan memicu pengiriman barang |
| **K-2** | Endpoint `customer/*` menerima `userId` dari URL **tanpa mencocokkan ke klaim pengguna** | Keamanan (IDOR) | Pelanggan A dapat membaca order, alamat, keranjang, dan komplain pelanggan B |
| **K-3** | Kredensial produksi (password admin IS4, DOKU SecretKey, ClientSecret Simasrim, password Redis) **ter-commit di git** | Keamanan | Kompromi penuh gateway pembayaran dan Identity Server |
| **K-4** | CORS produksi tidak mengizinkan origin storefront (`https://tokossonlineshop.com`) dan `AllowCredentials: false` | Konfigurasi | Berpotensi seluruh aplikasi gagal total di produksi |

Di luar itu: 3 temuan tinggi (ongkir tidak divalidasi ulang, stok bisa minus, tidak ada cek ketersediaan stok saat order dibuat) dan sejumlah ketidakcocokan kontrak minor.

**Kesimpulan: proyek ini belum layak go-live.** K-1 sampai K-4 harus ditutup lebih dulu. Kabar baiknya, semuanya perbaikan terlokalisir — bukan cacat arsitektur.

---

## 1. Peta Kontrak Endpoint

Verifikasi FE call → API route. Legenda: ✅ cocok · ⚠️ cocok dengan catatan · ❌ tidak ada padanan.

### 1.1 Katalog & Konten Publik

| Panggilan Frontend | Route Backend | Status |
|---|---|:---:|
| `GET /public/Items/priced` · `/priced/type/{t}` · `/priced/{id}` · `/autofill` | `Public/ItemsController` | ✅ |
| `GET /customer/Items/priced` · `/priced/{id}` · `/autofill` | `Customer/ItemsController` | ✅ |
| `GET /admin/Items` · `/{id}`, `POST`, `POST /with-files`, `PUT /{id}`, `PUT /{id}/with-files`, `DELETE /{id}` | `Admin/ItemsController` | ✅ |
| `GET /public/Categories`, `GET /admin/Categories`, `POST`/`PUT`/`DELETE` admin | `Public+Admin/CategoriesController` | ✅ |
| `GET /public/Authors`, `GET /admin/Authors`, `POST`/`PUT` (+`/with-files`), `DELETE` | `Public+Admin/AuthorsController` | ✅ |
| `GET /admin/Books`, `POST`, `PUT /{id}`, `DELETE /{id}` | `Admin/BooksController` | ✅ |
| `GET /public/UomGroups`, `GET/POST/PUT/DELETE /admin/UomGroups` | `Public+Admin/UomGroupsController` | ✅ |
| `GET /public/Warehouses`, `GET/POST/PUT/DELETE /admin/Warehouses` | `Public+Admin/WarehousesController` | ✅ |
| `GET /public/PromotionBanners`, `POST/PUT/DELETE /admin/PromotionBanners` (+`/with-files`) | `Public+Admin/PromotionBannersController` | ✅ |
| `POST /public/Pricings/lookup`, `POST /customer/Pricings/lookup` | `Public+Customer/PricingsController` | ⚠️ M-1 |
| `GET/POST/PUT/DELETE /admin/Pricings` | `Admin/PricingsController` | ✅ |
| `GET /admin/WarehouseStocks` · `/public/WarehouseStocks` (`warehouse-stock-api.service.ts:25,47,50,62`) | **tidak ada controller** | ❌ T-4 |

### 1.2 Transaksi

| Panggilan Frontend | Route Backend | Status |
|---|---|:---:|
| `POST /customer/Orders` | `Customer/OrdersController` `[HttpPost]` | ⚠️ K-2, T-1 |
| `GET /customer/Orders/user/{userId}` · `/status-counts` · `/{id}` | `Customer/OrdersController` | ⚠️ K-2 |
| `POST /admin/Orders` (body `{pageNumber, pageSize}`) | `Admin/OrdersController` `[HttpPost] GetAll(PagingParam)` | ✅ |
| `PUT /admin/Orders/{id}/status` | `Admin/OrdersController` | ✅ |
| `POST /admin/Orders/{id}/shipment` · `/shipment` · `/{id}/shipment/cancel` · `/shipment/detail-resi` | `Admin/OrdersController` | ✅ |
| `GET /customer/Cart/{userId}`, `POST /customer/Cart`, `DELETE /customer/Cart/{userId}/items/{itemId}` | `Customer/CartController` | ⚠️ K-2 |
| `POST /customer/Payments/calculate-fees` | `Customer/PaymentsController` | ✅ |
| `GET /public/Payments`, `GET/POST/PUT/DELETE /admin/Payments` | `Public+Admin/PaymentsController` | ✅ |
| `POST /customer/IncomingPayments/DOKU/CheckStatus` | `Customer/IncomingPaymentsController` | ✅ (jalur aman — lihat K-1) |
| `GET /admin/InventoryMovements?itemId=`, `POST /admin/InventoryMovements/goods-receive` | `Admin/InventoryMovementsController` | ✅ |
| `POST {posApiUrl}` (B2C order ke POS eksternal) | di luar cakupan API ini | — |

### 1.3 Pengguna, Alamat, Pengiriman

| Panggilan Frontend | Route Backend | Status |
|---|---|:---:|
| `GET /customer/Users/{name}/profile`, `PUT /customer/Users/{id}/profile` (+`/with-files`) | `Customer/UsersController` | ⚠️ K-2 |
| `POST /customer/Users` (registrasi) | `Customer/UsersController` `[AllowAnonymous]` | ✅ |
| `GET /admin/Users` | `Admin/UsersController` | ✅ |
| `POST .../customer/Users/ChangePassword` (fallback) | backend punya `[HttpPut("change-password")]` | ❌ M-2 |
| `GET /customer/Addresses/user/{userId}`, `POST`, `PUT /{id}`, `DELETE /{id}` | `Customer/AddressesController` | ⚠️ K-2 |
| `GET /public/HomeAddresses`, `GET/POST/PUT/DELETE /admin/HomeAddresses` | `Public+Admin/HomeAddressesController` | ✅ |
| `GET /customer/Simasrim/Province` · `Courier`, `POST /City` · `District` · `Tarif` | `Customer/SimasrimController` | ✅ |
| `GET /customer/Simasrim/TrackAwb/{id}` | `Customer/SimasrimController` | ⚠️ R-1 (penamaan) |
| `GET /customer/Complaints/user/{userId}`, `POST` (+`/with-files`), `PUT /{id}/reply` | `Customer/ComplaintsController` | ⚠️ K-2 |
| `GET /admin/Complaints`, `PUT /{id}/respond` (+`/with-files`) | `Admin/ComplaintsController` | ✅ |
| `GET /customer/Reviews/items/{itemId}`, `POST` (+`/with-files`) | `Customer/ReviewsController` | ✅ |
| `GET /admin/Dashboard` | `Admin/DashboardController` | ✅ |

---

## 2. Temuan Kritikal

### K-1 — Webhook pembayaran DOKU tanpa verifikasi signature

**Berkas:** `API/MalakaBooks.API/Controllers/Public/ExternalMessageController.cs:26`, `API/MalakaBooks.API/Helper/ValidatePaymentSignatureFilter.cs`, `API/MalakaBooks.API/Program.cs:193`

Endpoint `POST /api/v1/ExternalMessage/DOKU/Notify` bertanda `[AllowAnonymous]` dan memanggil `ProcessDokuPaymentNotificationCommand` langsung dari body request.

`ValidatePaymentSignatureFilter` — kelas yang isinya sudah benar (verifikasi header `Client-Id`, `Request-Id`, `Request-Timestamp`, `Signature`, digest SHA-256 body, HMAC-SHA256 dengan secret) — **terdaftar di DI (`Program.cs:193`) tetapi tidak pernah dipasang ke endpoint mana pun.** Pencarian `ServiceFilter`/`TypeFilter` di seluruh solusi: nol hasil.

Di `ProcessDokuPaymentNotificationHandler.cs:38-47`, status diambil dari body (`NormalizeStatus` menerima `success`/`paid`/`settlement`/`completed`), dan `amount` juga diambil dari body (`:96`) tanpa dibandingkan dengan `order.TotalPrice`.

**Dampak konkret.** Siapa pun yang tahu (atau menebak) sebuah `orderId` bisa mengirim:

```
POST /api/v1/ExternalMessage/DOKU/Notify
{ "orderId": "<id>", "transactionStatus": "SUCCESS" }
```

Hasilnya: order menjadi `paid` + `ready_to_ship`, `IncomingPaymentEntity` tercatat, dan **stok dipotong** (`DeductStockAsync`). Barang dikirim tanpa pembayaran. Tidak ada biaya untuk menyerang, dan tidak ada jejak yang membedakannya dari pembayaran sah.

**Saran.**
1. Pasang filter yang sudah ada: `[ServiceFilter(typeof(ValidatePaymentSignatureFilter))]` pada action `DokuNotify`. Ini perubahan satu baris — infrastrukturnya sudah siap.
2. Terapkan pola yang sama pada `SIMASRIM/Notify` (`:39`), yang juga anonim dan mengubah status pengiriman.
3. **Pertahanan berlapis:** jangan pernah percaya status dari body webhook. Setelah signature lolos, tetap panggil `CheckDokuPaymentStatusHandler` untuk konfirmasi server-ke-server. Pola ini **sudah ada dan sudah benar** di `CheckDokuPaymentStatusHandler.cs:31-50` (memanggil DOKU, mencocokkan `invoice_number`, baru meneruskan). Webhook tinggal memakai ulang jalur itu.
4. Validasi `amount` dari gateway terhadap `order.GrandTotal`; tolak bila tidak sama.
5. Batasi IP sumber webhook ke rentang milik DOKU di level nginx/firewall.

---

### K-2 — IDOR: `userId` dari URL tidak dicocokkan dengan klaim pengguna

**Berkas:** `Customer/OrdersController.cs:53,64,75`, `Customer/CartController.cs:22,34`, `Customer/AddressesController.cs:38`, `Customer/ComplaintsController.cs:22`, `Customer/DashboardController.cs:23`, `Customer/UsersController.cs:67,76,85`, dan handler terkait.

Seluruh controller `customer/*` memakai `[Authorize(Policy = "MalakaCustomerPolicy")]`. Policy itu memastikan **pemanggil adalah pelanggan yang sah** — tetapi tidak memastikan **pelanggan itu adalah pemilik data yang diminta.**

Diverifikasi di handler, bukan diasumsikan:

```csharp
// GetOrdersByUserHandler.cs:12
var orders = await orderRepository.GetByUserIdAsync(request.UserId, cancellationToken);
```

`request.UserId` berasal langsung dari segmen route. Tidak ada pembacaan klaim `sub`, tidak ada perbandingan. Hal yang sama pada `GetOrderByIdHandler.cs:12` — order diambil dari repository dan langsung dikembalikan, tanpa memeriksa `order.User.UserId`.

**Dampak konkret.** Pelanggan yang sudah login cukup mengganti angka/ID di URL:

| Permintaan | Yang bocor |
|---|---|
| `GET /customer/Orders/user/{userId-lain}` | Seluruh riwayat pesanan pelanggan lain: barang, nominal, alamat kirim |
| `GET /customer/Orders/{orderId-lain}` | Detail satu order termasuk alamat & nomor telepon |
| `GET /customer/Cart/{userId-lain}` | Isi keranjang pelanggan lain |
| `GET /customer/Addresses/user/{userId-lain}` | Alamat rumah, nama penerima, nomor HP |
| `GET /customer/Users/{name}/profile` | Data profil pelanggan lain |
| `DELETE /customer/Cart/{userId-lain}/items/{itemId}` | Mengosongkan keranjang orang lain |

Ini pelanggaran data pribadi (relevan terhadap UU PDP), bukan sekadar bug.

Catatan penting: `CreateOrderHandler` **sudah** memvalidasi kepemilikan alamat (`CreateOrderHandler.cs:73` — `receiverAddress.UserId` dibandingkan dengan `user.UserId`) dan **sudah** mengambil `customerGroupCode` dari klaim (`:47`). Jadi polanya sudah dipahami tim; hanya belum diterapkan konsisten. `SimasrimController.TrackAwb` (`:143`) bahkan sudah membaca klaim `sub` dengan benar — itu contoh yang bisa dijadikan acuan.

**Saran.**
1. Tambahkan helper terpusat, mis. `ICurrentUserAccessor.GetUserId()` yang membaca `sub` / `ClaimTypes.NameIdentifier` dari `IHttpContextAccessor`.
2. **Pola terbaik:** hapus `{userId}` dari route `customer/*` sama sekali dan ambil selalu dari klaim. Route `GET /customer/Orders/mine` tidak bisa disalahgunakan karena tidak ada yang bisa dimanipulasi. Ini butuh perubahan berpasangan di frontend (`order-api.service.ts`, `user-api.service.ts`, `cart-api.service.ts`, `complaint-api.service.ts`) — kerjakan sebagai satu perubahan terkoordinasi.
3. **Bila route ingin dipertahankan** (jalur lebih cepat, tanpa menyentuh frontend): tambahkan penjaga di setiap handler `customer/*` — bila `request.UserId != currentUser.UserId`, kembalikan `403`. Termasuk `GetOrderByIdHandler`, yang harus memeriksa `entity.User.UserId`.
4. Tulis test integrasi khusus: "pelanggan A meminta data pelanggan B → 403". Tanpa test, regresi ini akan kembali.
5. `POST /customer/Orders` juga menerima `UserId` dari body (`CreateOrderRequest.UserId`) — ambil dari klaim, jangan dari klien.

---

### K-3 — Kredensial produksi ter-commit di repositori

**Berkas:** `API/MalakaBooks.API/appsetting.Production.json`, `appsetting.Development.json`, `easycaching.*.json`, `tokensetting.Development.json` — semuanya **ter-track di git** (diverifikasi dengan `git ls-files`).

Yang terekspos dalam bentuk plaintext:

| Konfigurasi | Isi |
|---|---|
| `IS4APISettings.UserPassword` | password akun **admin** Identity Server |
| `IS4APISettings.ClientSecret` | client secret IS4 |
| `DokuSetting.SecretKey` + `ClientId` | kunci penandatanganan **gateway pembayaran produksi** |
| `SimasrimSetting.ClientSecret` / `Password` | kredensial API kurir |
| `easycaching.Production.json` password | kredensial Redis |

`.gitignore` sama sekali tidak mencakup berkas-berkas ini.

**Dampak.** Kunci DOKU adalah kunci yang sama yang dipakai untuk memverifikasi signature webhook di K-1. Siapa pun yang punya akses baca ke repo — kontributor lama, kontraktor, integrasi CI pihak ketiga, atau siapa pun bila repo pernah publik walau sebentar — dapat memalsukan permintaan pembayaran maupun masuk sebagai admin IS4.

**Saran.**
1. **Rotasi semua kredensial di atas sekarang.** Menghapusnya dari berkas saja tidak cukup — nilainya sudah permanen di riwayat git dan di setiap klon yang ada. Anggap semuanya sudah bocor.
2. Pindahkan ke environment variable atau secret store. `Program.cs:47` sudah memanggil `.AddEnvironmentVariables()`, jadi `IS4APISettings__ClientSecret` dan sejenisnya akan otomatis terbaca tanpa perubahan kode sama sekali.
3. Commit ulang berkas `*.Production.json` hanya berisi struktur dengan nilai kosong/placeholder, lalu tambahkan ke `.gitignore`.
4. Pertimbangkan membersihkan riwayat (`git filter-repo`) — tapi rotasi tetap wajib dan lebih mendesak.
5. Pasang secret scanning (GitHub secret scanning / gitleaks) di CI agar tidak terulang.

---

### K-4 — CORS produksi tidak mengizinkan origin storefront

**Berkas:** `API/MalakaBooks.API/corssetting.Production.json` vs `src/environments/environment.prod.ts`

Konfigurasi CORS produksi:

```json
"Origins": [ "http://localhost:4200", "http://192.168.1.138:4200" ],
"AllowCredentials": false
```

Sementara di produksi, SPA berjalan di `https://tokossonlineshop.com` (`environment.prod.ts` → `appUrl`) dan menembak API di `https://tokosuburjaya.com:17801/...` (`apiBaseUrl`) — **origin berbeda**. Dan `auth.interceptor.ts:33` memasang `withCredentials: true` untuk setiap permintaan ke `apiBaseUrl`, sesuai pola BFF.

Artinya browser akan mewajibkan `Access-Control-Allow-Origin: https://tokossonlineshop.com` **plus** `Access-Control-Allow-Credentials: true`. Konfigurasi saat ini tidak menyediakan keduanya. Berkas produksi juga masih memuat origin `localhost` dan IP LAN — jelas belum pernah disesuaikan untuk produksi.

**Dampak.** Bila tidak ada lapisan lain yang menangani CORS, **seluruh aplikasi gagal di produksi** — bukan sebagian, melainkan setiap panggilan API.

**Saran.**
1. Konfirmasi lebih dulu: apakah ada reverse proxy di `tokosuburjaya.com:17801` yang menyatukan origin atau menyuntikkan header CORS sendiri? Bila ya, temuan ini turun menjadi "konfigurasi menyesatkan" — tapi berkasnya tetap harus dirapikan agar tidak menjebak orang berikutnya.
2. Bila tidak: set `Origins` ke `["https://tokossonlineshop.com"]` dan `AllowCredentials: true`. Hapus origin `localhost`/LAN dari berkas produksi.
3. Perlu diperhatikan — `Headers` saat ini tidak memuat `X-CSRF`, padahal `auth.interceptor.ts:34` mengirimkannya (`BFF_CSRF_HEADER`). Tambahkan ke daftar `Headers` yang diizinkan.
4. Uji preflight secara eksplisit setelah deploy: `curl -X OPTIONS -H "Origin: https://tokossonlineshop.com" ...`, pastikan header balasannya benar.

---

## 3. Temuan Tinggi

### T-1 — Ongkos kirim diterima apa adanya dari klien

**Berkas:** `CreateOrderHandler.cs` (`entity.ShippingFee` berasal dari `request.ShippingFee`), `OrderViewModel.cs:168`

Handler ini melakukan validasi ulang dengan sangat baik pada dua hal:

- **Harga barang divalidasi ulang** — `ApplyPricingAsync` menimpa harga kiriman klien dengan harga dari `pricingRepository` (`:384`, `:391`), lalu menghitung ulang `ItemsSubtotal` (`:398`). **Ini sudah benar dan patut dipertahankan.**
- **Asuransi divalidasi ulang** — dihitung ulang ke Simasrim dan ditolak bila berbeda (`:141-152`). Sangat baik.

Tetapi `ShippingFee` tidak mendapat perlakuan yang sama. Nilainya masuk langsung dari body ke `GrandTotal`, dan `GrandTotal` itulah yang dikirim ke DOKU sebagai nominal tagihan.

**Dampak.** Klien yang memodifikasi request bisa mengirim `shippingFee: 0` (atau negatif) dan membayar kurang dari yang seharusnya, sementara pengiriman tetap dibuat dengan tarif penuh. Selisihnya ditanggung toko pada setiap transaksi.

**Saran.** Terapkan pola yang sudah dipakai untuk asuransi: panggil ulang `Simasrim/Tarif` dengan kurir, layanan, dan tujuan yang sama, lalu tolak order bila `request.ShippingFee` tidak sama dengan hasil hitung ulang (pesan seperti "tarif pengiriman sudah berubah, silakan muat ulang"). Kodenya bisa meniru blok `Insurance` hampir persis.

### T-2 — Stok tidak diperiksa saat order dibuat

**Berkas:** `CreateOrderHandler.cs`

Tidak ada satu pun pembacaan stok di sepanjang alur pembuatan order. Order untuk barang yang stoknya 0 tetap dibuat, kode pembayaran tetap terbit, pelanggan tetap membayar — dan kegagalan baru ketahuan saat barang mau dikirim.

**Saran.** Validasi ketersediaan sebelum memanggil DOKU, di dalam `ApplyPricingAsync` atau tepat sesudahnya (item sudah di-resolve di sana). Kembalikan `CreateOrderResponse` gagal dengan pesan per-item, mengikuti format yang sudah dipakai untuk "Pricing detail not found" (`:376-380`).

### T-3 — Pemotongan stok bisa membuat stok negatif (oversell)

**Berkas:** `API/MalakaBooks.Repository/ItemRepository.cs:67-78`, dipanggil dari `ProcessDokuPaymentNotificationHandler.cs:173`

```csharp
var update = Builders<ItemEntity>.Update.Inc(item => item.Stock, quantityDelta);
return await _collection.FindOneAndUpdateAsync(item => item.Id == id, update, ...);
```

Filternya hanya `Id == id`. Operasi `$inc` bersifat atomik (bagus — tidak ada lost update), tetapi tidak ada syarat stok mencukupi. Dua pembayaran yang masuk bersamaan untuk barang terakhir akan sukses keduanya, dan stok menjadi `-1`.

**Saran.** Jadikan filternya bersyarat:

```csharp
item => item.Id == id && item.Stock >= -quantityDelta   // untuk delta negatif
```

`FindOneAndUpdateAsync` akan mengembalikan `null` bila stok tidak cukup — dan pemanggil di `DeductStockAsync:174` **sudah** menangani `null`, tetapi saat ini menanganinya dengan `continue` diam-diam. Ubah menjadi mencatat log dan menandai order untuk tinjauan manual, jangan dilewat tanpa jejak: pelanggan sudah membayar, jadi kasus ini wajib terlihat oleh operator.

### T-4 — Fitur "Stok Gudang" memanggil endpoint yang tidak ada

**Berkas:** `src/app/core/services/warehouse-stock-api.service.ts:25,47,50,62`; `src/app/store/warehouse-stock.store.ts`; `src/app/features/admin/stocks/`

Service memanggil `/admin/WarehouseStocks` dan `/public/WarehouseStocks`. Tidak ada controller dengan nama itu di seluruh solusi — yang ada hanya nama koleksi MongoDB (`MongoDbSetting.cs:12`). Seluruh panggilan akan menghasilkan 404.

Perlu dicatat sebagai kredit: `app.routes.ts:33` sudah memuat `TODO(warehouse-stocks)` yang menonaktifkan route ini karena "backend belum menyediakan". Jadi ini **tidak aktif di produksi** — statusnya kode mati, bukan kerusakan berjalan.

**Saran.** Putuskan salah satu, jangan dibiarkan menggantung: (a) implementasikan `WarehouseStocksController` di backend bila fitur multi-gudang memang direncanakan, atau (b) hapus service, store, dan komponennya. Kode mati yang menyerupai kode hidup adalah jebakan bagi developer berikutnya — seseorang akan mengaktifkan kembali route itu dan mengira backend-nya ada.

---

## 4. Temuan Menengah & Rendah

### M-1 — `customerGroupCode` dikirim dari klien pada pencarian harga publik

`pricing-api.service.ts:78` mengirim `{ itemId, uomCode, customerGroupCode }` ke `POST /public/Pricings/lookup`, dan `PublicPriceLookupRequest` (`CatalogViewModel.cs:209-214`) menerimanya.

Klien dapat menebak kode grup lain (mis. `103` vs `106`, keduanya terlihat di `appsetting.Production.json`) untuk melihat tingkat harga yang bukan haknya. **Dampak terbatas pada tampilan** — `CreateOrderHandler` mengambil grup dari klaim, jadi harga order tetap benar. Tetap saja, harga grosir yang bocor ke publik adalah masalah komersial.

**Saran.** Abaikan `CustomerGroupCode` dari body pada endpoint publik; pakai selalu `PricingSetting.DefaultPublicCustomerGroupCode` dari konfigurasi server.

### M-2 — Ketidakcocokan verb pada ganti kata sandi

`user-api.service.ts:237` menyusun fallback `POST {apiBaseUrl}/customer/Users/ChangePassword`, sedangkan backend menyediakan `PUT change-password` (`Customer/UsersController.cs:94`). Beda verb **dan** beda ejaan path.

Jalur ini tidak aktif di produksi karena `environment.prod.ts` mengisi `userPasswordApiUrl` (layanan eksternal), sehingga cabang fallback tidak pernah dieksekusi. Namun bila konfigurasi itu suatu saat dikosongkan, fitur akan gagal diam-diam — `changePassword` menangkap error dan hanya mengembalikan `false`, sehingga pengguna melihat kegagalan tanpa sebab yang jelas.

**Saran.** Perbaiki fallback menjadi `PUT .../customer/Users/change-password`, atau hapus cabang fallback dan gagalkan secara eksplisit bila `userPasswordApiUrl` kosong — sejalan dengan pola yang sudah diterapkan di `b2c-order-api.service.ts:15`.

### M-3 — `NullValueHandling.Ignore` membuat properti null menghilang dari JSON

`Program.cs` menyetel `NullValueHandling = NullValueHandling.Ignore`. Konsekuensinya, properti bernilai null **tidak muncul sama sekali** di respons, bukan terkirim sebagai `null`.

Di sisi Angular, `ApiResponse<T>` mendeklarasikan `data: T` sebagai wajib. Untuk aksi yang memakai `Success()` tanpa data (`ApiControllerBase` overload kedua), `data` akan `undefined`, bukan `null`.

Mayoritas service sudah aman karena memakai `envelope?.data || []`. Yang berisiko adalah yang mengakses langsung, mis. `complaint-api.service.ts:66,70` (`this.mapComplaint(res.data)`).

**Saran.** Ubah tipe menjadi `data?: T | null` agar TypeScript memaksa penanganan di titik pemakaian; atau konsisten memakai optional chaining di seluruh service. Perubahan tipe akan memunculkan daftar tempat yang perlu diperiksa saat kompilasi — itu justru yang diinginkan.

### R-1 — Nama parameter `trackAwb` menyesatkan

`order-api.service.ts:324` mendeklarasikan `trackAwb(awb: string)` dan menyusun URL `/customer/Simasrim/TrackAwb/${awb}`, sedangkan backend memperlakukan segmen itu sebagai **orderId** (`GetSimasrimTrackAwbQuery.cs:22` mencarinya di `orderRepository`).

Diverifikasi: pemanggil sebenarnya (`detail-shipment.component.ts:49`) mengirimkan `orderId`, jadi **fungsinya berjalan benar**. Hanya penamaannya yang salah.

**Saran.** Ganti nama parameter menjadi `orderId` agar tidak ada yang keliru memanggilnya dengan nomor resi. Perubahan kosmetik, tapi murah dan mencegah bug nyata.

### R-2 — Endpoint backend yang tidak dipakai frontend

Bukan kesalahan, tetapi berguna untuk pemeliharaan:

| Endpoint | Catatan |
|---|---|
| `GET /public/Books` · `/public/Books/{id}` | Frontend selalu lewat `Items` |
| `GET /public/Authors/{id}` | Hanya list yang dipakai |
| `GET /public/Items/{id}` · `/type/{itemType}` | Frontend memakai varian `priced` |
| `GET /customer/Categories/*` | Frontend hanya memakai varian public/admin |
| `GET /customer/Dashboard/user/{userId}` | Hanya dashboard admin yang dipanggil |
| `POST /public/item-sync` | Integrasi POS, di luar SPA |

**Saran.** Endpoint yang tidak terpakai tetap merupakan permukaan serangan yang harus dipelihara. `GET /customer/Dashboard/user/{userId}` khususnya juga terkena K-2. Tandai sebagai deprecated atau hapus yang memang tidak ada rencana pemakaian.

### R-3 — Rate limiter dikonfigurasi tetapi tidak diaktifkan di pipeline

`Program.cs` mendaftarkan `AddRateLimiter(...)` dengan partisi per-IP, tetapi **tidak ada `app.UseRateLimiter()`** di susunan middleware (diverifikasi pada blok pipeline `Program.cs:300-343`). Tanpa panggilan itu, rate limiting tidak berjalan sama sekali.

**Saran.** Tambahkan `app.UseRateLimiter()` setelah `UseAuthorization()`. Endpoint yang paling butuh: registrasi pelanggan (`[AllowAnonymous]`), pencarian harga publik, dan webhook. Batas 1000 permintaan/menit per IP juga terhitung longgar untuk endpoint anonim — pertimbangkan kebijakan terpisah yang lebih ketat.

### R-4 — `[AllowAnonymous]` pada registrasi tanpa proteksi bot

`Customer/UsersController.cs:31-44` — `POST /customer/Users` dan `/with-files` bersifat anonim (memang harus, untuk registrasi). Namun tanpa rate limiter aktif (R-3) dan tanpa CAPTCHA, endpoint ini terbuka untuk pembuatan akun massal, termasuk varian `/with-files` yang menerima unggahan berkas hingga 6 MB.

**Saran.** Prioritaskan R-3, lalu pertimbangkan verifikasi OTP/email sebelum akun menjadi aktif.

---

## 5. Yang Sudah Benar — Pertahankan

Audit ini juga menemukan sejumlah keputusan yang kualitasnya di atas rata-rata dan sebaiknya tidak diubah:

| Aspek | Catatan |
|---|---|
| **Validasi ulang harga di server** | `ApplyPricingAsync` menimpa harga kiriman klien dengan harga dari repository. Ini pertahanan terpenting di e-commerce, dan sudah ada. |
| **Validasi ulang asuransi** | Dihitung ulang ke Simasrim dan ditolak bila berbeda — pola yang tepat, dan tinggal ditiru untuk ongkir (T-1). |
| **Kepemilikan alamat pada pembuatan order** | `receiverAddress.UserId` dicocokkan dengan pemilik order. Menunjukkan pola cek kepemilikan sudah dipahami tim. |
| **Idempotensi pembayaran** | `ProcessDokuPaymentNotificationHandler` memeriksa `IncomingPayment` yang sudah ada sebelum memproses ulang; ada pula `IdempotentFilter` global. Webhook retry tidak akan menggandakan pemotongan stok. |
| **Verifikasi server-ke-server DOKU** | `CheckDokuPaymentStatusHandler` sudah menanyakan status langsung ke DOKU dan mencocokkan `invoice_number`. Jalur yang benar — tinggal dipakai juga oleh webhook. |
| **Jejak audit stok** | Setiap pemotongan stok mencatat `InventoryMovementEntity` dengan `StockBefore`/`StockAfter` dan referensi order. Sangat membantu rekonsiliasi. |
| **Kadaluwarsa order** | `ExpiresAt` + `UnpaidOrderExpirationService` sebagai background service. Order menggantung tidak menahan stok selamanya. |
| **Pola BFF** | SPA tidak pernah memegang access token; hanya cookie httpOnly + header antiforgery. Menghilangkan seluruh kelas serangan pencurian token via XSS. |
| **Konsistensi envelope** | `ApiControllerBase.ApiResponse<T>` + `CamelCasePropertyNamesContractResolver` cocok persis dengan `api-response.model.ts`, termasuk struktur `errors` berkunci `"1"`, `"2"`. Dikonsumsi dengan benar oleh `errorInterceptor`. |
| **Segmentasi route** | Pemisahan `public`/`customer`/`admin` tercermin rapi di kedua sisi, dan `product-api.service.ts` memilih endpoint sesuai peran sesi. |

---

## 6. Urutan Kerja yang Disarankan

**Blokir go-live sampai selesai:**

| Urutan | Item | Perkiraan | Alasan didahulukan |
|:---:|---|---|---|
| 1 | **K-3** rotasi seluruh kredensial | 1–2 jam | Selama belum dirotasi, semua perbaikan lain bisa dilewati penyerang yang memegang kunci DOKU |
| 2 | **K-1** pasang filter signature + verifikasi server-ke-server | 2–4 jam | Kerugian barang langsung; filter sudah tersedia, tinggal dipasang |
| 3 | **K-4** konfirmasi & perbaiki CORS produksi | 1 jam | Berpotensi membuat aplikasi gagal total saat rilis |
| 4 | **K-2** cek kepemilikan di seluruh endpoint `customer/*` | 1–2 hari | Kebocoran data pribadi pelanggan; perlu perubahan terkoordinasi FE+BE |

**Sebelum trafik naik:**

| Urutan | Item | Perkiraan |
|:---:|---|---|
| 5 | **T-1** validasi ulang ongkir | 3–4 jam |
| 6 | **T-3** filter bersyarat pada pemotongan stok | 1–2 jam |
| 7 | **T-2** cek ketersediaan stok saat order dibuat | 3–4 jam |
| 8 | **R-3** aktifkan `UseRateLimiter()` | 15 menit |

**Kebersihan kode, terjadwal:** T-4, M-1, M-2, M-3, R-1, R-2, R-4.

Setelah K-1 dan K-2 diperbaiki, **tambahkan test integrasi untuk keduanya** sebelum melanjutkan. Keduanya adalah jenis cacat yang mudah kembali saat refactor berikutnya, dan keduanya tidak akan tertangkap oleh unit test frontend maupun `ng lint`.

---

## 7. Catatan Metodologi

- Seluruh nomor baris merujuk pada commit `d705760`.
- Temuan diverifikasi lintas berkas (controller → handler → repository), bukan hanya dari nama route.
- Beberapa hal **tidak dapat dipastikan secara statis** dan perlu konfirmasi operasional: keberadaan reverse proxy di depan API (K-4), pembatasan IP pada webhook di level infrastruktur (K-1), dan apakah kredensial di K-3 sudah pernah dirotasi di luar repo.
- Audit ini tidak mencakup: performa query MongoDB dan indeksnya, kesehatan background service (`UnpaidOrderExpirationService`, `ShippedOrderAwbStatusService`) di bawah beban, serta strategi backup/restore basis data.
