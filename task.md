# Daftar Task: Integrasi Belanja Offline Toko (`/katalog`) ke Riwayat Pesanan Customer

Dokumen ini merinci langkah-langkah implementasi teknis untuk mendukung alur:
> **"Customer yang sudah login dapat berbelanja di toko offline (`/katalog`), dan riwayat belanjaan toko fisiknya tercatat serta dapat dilihat pada halaman Riwayat Pesanan (`/order-history`)."**

---

## 📋 Task Checklist & Rencana Kerja

### Tahap 1: Pengikatan Identitas Customer pada Alur Katalog Offline
- [ ] **Task 1.1: Sinkronisasi Identitas User di `KatalogHomeComponent` & `KatalogCartComponent`**
  - Inject `AuthStore` secara konsisten pada seluruh komponen katalog (`/katalog`, `/katalog/cart`, `/katalog/checkout`).
  - Ambil identitas customer (`id`, `name`, `email`, `phone`) jika user terautentikasi (`authStore.isLoggedIn()`), atau gunakan input nama tamu (`mk_katalog_user_name`) untuk *Public User*.
  - *File Target:*
    - `src/app/features/katalog/katalog-cart/katalog-cart.component.ts`
    - `src/app/features/katalog/katalog-home/katalog-home.component.ts`

- [ ] **Task 1.2: Pembaruan Payload Draft Order POS (`B2C_ORDER_CART`)**
  - Sertakan metadata `CustomerId`/`UserId`, `UserEmail`, dan identitas lengkap pada payload draft B2C yang dikirim ke `${posApiUrl}/pos-api/api/v2/DraftObjects/B2CService`.
  - Pastikan kasir POS dapat membaca ID customer saat scan QR code untuk mengaitkan struk transaksi ke akun customer.
  - *File Target:*
    - `src/app/features/katalog/katalog-cart/katalog-cart.component.ts`
    - `src/app/store/b2c-order.store.ts`
    - `src/app/core/services/b2c-order-api.service.ts`

---

### Tahap 2: Manajemen Riwayat Pesanan Toko Offline (`Order History`)
- [ ] **Task 2.1: Penyesuaian Data Model `Order`**
  - Tambahkan penanda tipe transaksi pada model `Order`: `orderType?: 'online' | 'offline_store'` / `channel?: string`.
  - Tambahkan informasi cabang/store jika pesanan berasal dari transaksi offline (`branchCode`, `branchName`).
  - *File Target:*
    - `src/app/core/models/order.model.ts`

- [ ] **Task 2.2: Penyesuaian `OrderApiService` & `OrderStore`**
  - Normalisasi data pesanan dari backend agar dapat memetakan transaksi online maupun transaksi toko fisik (POS).
  - Pastikan `OrderStore.loadUserOrders(userId)` memuat seluruh transaksi terkait customer.
  - *File Target:*
    - `src/app/core/services/order-api.service.ts`
    - `src/app/store/order.store.ts`

- [ ] **Task 2.3: Pembaruan Antarmuka Halaman `/order-history`**
  - Tampilkan badge pembeda tipe transaksi: **"Belanja di Toko" (Store Pickup / Offline)** vs **"Belanja Online" (Delivery)**.
  - Tampilkan informasi lokasi toko/cabang dan hilangkan detail pelacakan resi/ekspedisi untuk transaksi offline toko.
  - *File Target:*
    - `src/app/features/order/order-history/order-history.component.ts`
    - `src/app/features/order/order-history/order-history.component.html`

---

### Tahap 3: Perbaikan Inkonsistensi Sinkronisasi State (Temuan Audit)
- [ ] **Task 3.1: Perbaiki `getCurrentUserId()` pada `CartStore`**
  - Ganti pembacaan `localStorage.getItem('malakabooks_session_user')` dengan `getSessionUserId()` dari `src/app/core/auth/session.util.ts`.
  - Pastikan operasi `addItem`, `removeItem`, dan `updateQuantity` pada keranjang online tersinkronisasi secara tepat waktu ke backend `/customer/Cart`.
  - *File Target:*
    - `src/app/store/cart.store.ts`

---

### Tahap 4: Pengujian & Validasi Kualitas
- [ ] **Task 4.1: Unit Test & Regression Check**
  - Jalankan pengujian Vitest untuk memverifikasi store dan service yang dimodifikasi:
    - `b2c-order.store.spec.ts`
    - `cart.store.spec.ts`
    - `order.store.spec.ts`
- [ ] **Task 4.2: Build Verification**
  - Jalankan `npm run build` / `npx ng build` untuk memastikan tidak ada kesalahan kompilasi TypeScript atau Angular.

---

## 🎯 Target Hasil Akhir
1. Public User tetap bisa berbelanja offline tanpa login (menghasilkan QR kasir non-member).
2. Customer yang login otomatis tercatat `userId`-nya saat checkout di katalog offline.
3. Transaksi offline yang telah diselesaikan di kasir dapat ditinjau oleh customer di halaman `/order-history`.
4. Kode memenuhi standar Angular 21 (Signals, OnPush, Standalone) dan bebas error kompilasi.
