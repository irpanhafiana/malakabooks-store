## Role

Saya ingin melakukan **audit terhadap business flow e-commerce** pada project Angular ini.

Berperanlah sebagai:

* **Senior Angular Developer**
* **Senior Frontend Engineer**
* **Business Flow / Business Logic Auditor**
* **Code Reviewer yang sangat teliti**

Tujuan utama kamu adalah memastikan bahwa **implementasi source code Angular sudah benar-benar sesuai dengan business rule yang saya jelaskan di bawah ini**.

---

## Business Rule yang Harus Dipenuhi

Website ini memiliki **dua tipe pengguna**:

### 1. Public User

Public User adalah user yang **belum login / tidak memiliki session customer**.

Public User:

* Boleh melihat produk.
* Boleh melihat detail produk.
* Boleh melakukan aktivitas browsing.
* **TIDAK BOLEH melakukan pembelian online.**
* **TIDAK BOLEH melakukan online payment.**
* **TIDAK BOLEH melakukan checkout sebagai transaksi online.**

Namun, Public User **tetap diperbolehkan berbelanja melalui mekanisme offline store**, dengan ketentuan:

* User berada di **store offline**.
* User memilih/membeli produk.
* Produk yang dibeli akan **diambil di store offline**.
* Pembayaran dilakukan **di store/offline**, bukan melalui online payment.

Jadi, Public User tidak boleh diperlakukan sebagai customer online hanya karena dapat memasukkan produk ke cart atau melakukan proses tertentu di frontend.

---

### 2. Customer User

Customer User adalah user yang:

* Memiliki akun.
* Sudah login.
* Memiliki authentication/session yang valid.

Customer User:

* Boleh browsing produk.
* Boleh menambahkan produk ke cart.
* **Boleh melakukan pembelian online.**
* **Boleh melakukan checkout online.**
* **Boleh melakukan online payment.**

Namun, untuk transaksi yang menggunakan mekanisme **offline store**, customer juga tetap dapat:

* Membeli produk.
* Mengambil produk di offline store.
* Melakukan pembayaran di store sesuai flow yang tersedia.

---

# Tujuan Audit

Saya ingin kamu melakukan audit terhadap **seluruh source code Angular yang tersedia**, kemudian menentukan apakah implementasi saat ini benar-benar memenuhi business rule di atas.

Jangan hanya memeriksa tampilan UI.

Audit harus mencakup:

* Routing
* Authentication
* Authorization
* Route Guards
* User state
* Session state
* Role/permission handling
* Cart
* Checkout
* Payment
* Order creation
* Product purchase flow
* Offline store flow
* Online purchase flow
* Conditional rendering
* Services
* API calls
* State management
* RxJS flow
* Interceptor
* LocalStorage / SessionStorage jika digunakan
* Navigation flow
* Component logic
* Business logic
* Error handling
* Redirect logic
* Proteksi terhadap akses langsung melalui URL
* Proteksi terhadap user yang memanipulasi state frontend

---

# Hal yang Secara Khusus Harus Kamu Periksa

## 1. Public User vs Customer User

Cari tahu dari source code:

* Bagaimana aplikasi membedakan Public User dan Customer User?
* Apakah status login benar-benar digunakan?
* Apakah ada role/permission?
* Apakah pengecekan dilakukan hanya di UI atau juga di routing/business flow?
* Apakah Public User bisa mengakses halaman checkout?
* Apakah Public User bisa mengakses payment flow?
* Apakah Public User bisa memanggil service/API untuk membuat order?
* Apakah Public User bisa melakukan transaksi hanya dengan memanipulasi frontend state?

---

## 2. Cart Flow

Periksa:

* Apakah Public User dapat memasukkan produk ke cart?
* Jika bisa, apa tujuan cart tersebut?
* Apakah cart Public User dan Customer User memiliki behavior yang berbeda?
* Apakah Public User dapat melanjutkan cart sampai checkout?
* Apakah terdapat validasi user type sebelum checkout?
* Apakah cart state dapat menyebabkan Public User masuk ke online purchase flow secara tidak sengaja?

Jangan langsung menganggap bahwa:

> "Public User bisa add to cart = Public User boleh checkout."

Analisis berdasarkan implementasi sebenarnya.

---

## 3. Checkout Flow

Telusuri flow checkout dari awal sampai akhir.

Contoh:

`Product → Add to Cart → Cart → Checkout → Create Order → Payment → Success`

Periksa setiap tahap:

* Siapa yang dapat mengaksesnya?
* Apakah Public User dapat melewati tahap tersebut?
* Apakah Customer User mendapatkan flow yang benar?
* Apakah terdapat guard atau validation?
* Apakah validasi hanya dilakukan di component?
* Apakah ada bypass melalui direct URL?
* Apakah terdapat kondisi yang salah sehingga Public User bisa masuk ke checkout online?

---

## 4. Payment Flow

Audit secara khusus bagian payment.

Pastikan berdasarkan source code:

* Public User **tidak dapat melakukan online payment**.
* Customer User **dapat melakukan online payment**.
* Offline store payment memiliki flow yang berbeda jika memang diimplementasikan.
* Tidak ada route/service/component yang memungkinkan Public User masuk ke payment flow secara tidak sengaja.
* Payment method dipisahkan dengan benar antara online dan offline jika memang terdapat lebih dari satu metode.

Periksa juga:

* Payment service
* Payment component
* Payment route
* Payment guard
* Payment status
* Order status
* Redirect setelah payment
* Callback/payment result handling

---

# 5. Offline Store Flow

Audit flow pembelian offline secara khusus.

Saya ingin memastikan bahwa sistem tidak salah menganggap:

`Public User = Online Customer`

karena kedua user dapat berinteraksi dengan cart atau produk.

Periksa apakah source code memiliki mekanisme yang membedakan:

* Online purchase
* Offline store purchase
* Store pickup
* Offline payment
* Online payment

Jika mekanisme tersebut **belum ada**, jangan mengarang bahwa mekanismenya ada.

Katakan dengan jelas bahwa mekanisme tersebut belum ditemukan dalam source code.

---

# 6. Route & Guard Audit

Periksa seluruh route yang berhubungan dengan:

* Cart
* Checkout
* Order
* Payment
* Account
* Customer
* Store
* Purchase

Untuk setiap route penting, tentukan:

* Apakah public?
* Apakah membutuhkan login?
* Apakah membutuhkan role tertentu?
* Apakah memiliki guard?
* Apakah guard benar-benar memvalidasi kondisi yang diperlukan?
* Apakah route masih dapat diakses melalui direct URL?

Contoh yang harus dianalisis:

```text
/checkout
/payment
/orders
/cart
/account
```

Jangan hanya melihat nama route. Telusuri implementasi guard dan logic di belakangnya.

---

# 7. Business Logic Audit

Cari business logic yang:

* Salah tempat.
* Duplikatif.
* Tidak konsisten.
* Hanya mengandalkan frontend state.
* Tidak memiliki validasi.
* Membuat Public User dapat masuk ke customer flow.
* Membuat Customer User tidak dapat menjalankan flow yang seharusnya.
* Menggabungkan online dan offline business flow secara tidak jelas.

Periksa juga apakah terdapat kondisi seperti:

```ts
if (isLoggedIn) { ... }
```

yang digunakan sebagai pengganti authorization yang sebenarnya diperlukan.

Jangan langsung menyimpulkan bahwa `isLoggedIn` = Customer User.

Pastikan berdasarkan implementasi project.

---

# 8. Security / Bypass dari Frontend

Audit apakah business rule dapat dibypass melalui frontend.

Contohnya:

* Direct URL access.
* Manipulasi localStorage.
* Manipulasi session state.
* Manipulasi cart state.
* Memanggil service secara langsung dari component lain.
* Mengubah role/user state di frontend.
* Mengakses checkout tanpa melalui halaman sebelumnya.
* Mengakses payment route secara langsung.

Jika ada potensi bypass, jelaskan:

1. Di mana letak masalahnya.
2. Mengapa masalah tersebut terjadi.
3. Bagaimana flow tersebut dapat dibypass.
4. Apakah masalahnya hanya frontend atau membutuhkan validasi backend.

**Penting:** Jangan menganggap frontend authorization sebagai security boundary. Jika sebuah business rule harus benar-benar aman, jelaskan apakah backend juga harus melakukan validasi.

---

# Metode Audit

Lakukan audit berdasarkan **source code aktual**, bukan asumsi.

Ikuti alur berikut:

### Step 1 — Mapping Architecture

Identifikasi:

* Struktur folder.
* Core services.
* Auth system.
* Guards.
* Interceptors.
* State management.
* Routing.
* Cart system.
* Checkout system.
* Payment system.
* Order system.

### Step 2 — Mapping User State

Temukan bagaimana aplikasi menentukan:

```text
Public User
Customer User
Logged-in User
Role
Permission
Authentication State
```

### Step 3 — Trace Business Flow

Telusuri flow aktual dari source code:

```text
Product
 ↓
Cart
 ↓
Checkout
 ↓
Order
 ↓
Payment
 ↓
Success
```

dan bedakan antara:

```text
Public User
Customer User
```

### Step 4 — Compare Against Business Rules

Bandingkan implementasi aktual dengan business rule yang saya berikan.

### Step 5 — Identify Gap

Temukan:

* Missing implementation
* Incorrect implementation
* Potential bug
* Incorrect authorization
* Incorrect routing
* Incorrect business logic
* Potential bypass
* Inconsistent behavior
* Unnecessary complexity

---

# Output yang Saya Inginkan

Berikan hasil audit dengan struktur berikut:

## 1. Executive Summary

Jawab secara langsung:

**Apakah website ini saat ini sudah memenuhi business flow yang saya inginkan?**

Gunakan status:

* `PASS`
* `PARTIALLY PASS`
* `FAIL`
* `CANNOT VERIFY`

Jelaskan alasan utamanya secara singkat.

---

## 2. Business Rule Verification

Buat tabel:

| Business Rule                                 | Status | Evidence dari Source Code | Masalah |
| --------------------------------------------- | ------ | ------------------------- | ------- |
| Public User dapat browsing produk             |        |                           |         |
| Public User tidak dapat online checkout       |        |                           |         |
| Public User tidak dapat online payment        |        |                           |         |
| Customer User dapat online purchase           |        |                           |         |
| Customer User dapat online payment            |        |                           |         |
| Offline store flow tersedia                   |        |                           |         |
| Online dan offline flow terpisah dengan benar |        |                           |         |

Gunakan evidence yang benar-benar ditemukan dari source code.

---

## 3. Flow Analysis

Gambarkan flow aktual berdasarkan source code.

Contoh:

```text
PUBLIC USER
Product
  ↓
Cart
  ↓
?
  ↓
Checkout
  ↓
?
```

dan:

```text
CUSTOMER USER
Login
  ↓
Product
  ↓
Cart
  ↓
Checkout
  ↓
Payment
  ↓
Order Success
```

Jika flow aktual berbeda, tunjukkan perbedaannya.

---

## 4. Route & Guard Audit

Buat daftar route yang relevan:

| Route | Guard | Siapa yang Bisa Akses | Seharusnya | Status |
| ----- | ----- | --------------------- | ---------- | ------ |

Periksa juga direct URL access.

---

## 5. Service & Business Logic Audit

Identifikasi service/component yang mengontrol:

* Authentication
* Cart
* Checkout
* Order
* Payment
* User/Customer
* Store

Jelaskan apakah implementasinya sudah sesuai.

---

## 6. Critical Findings

Prioritaskan masalah:

### CRITICAL

Masalah yang menyebabkan business rule utama dapat dilanggar.

### HIGH

Masalah yang berpotensi menyebabkan transaksi atau authorization salah.

### MEDIUM

Masalah flow atau maintainability yang perlu diperbaiki.

### LOW

Improvement minor.

Untuk setiap masalah, jelaskan:

```text
Problem:
Location:
Evidence:
Why it is a problem:
Expected behavior:
Recommended fix:
```

---

## 7. Missing Implementation

Tuliskan fitur atau mekanisme yang **belum ditemukan** dalam source code tetapi diperlukan untuk memenuhi business rule.

Jangan menganggap fitur tersebut sudah ada hanya karena nama component/service/route terlihat mendukungnya.

---

## 8. Recommended Architecture / Flow

Jika terdapat masalah, berikan rekomendasi flow yang lebih benar.

Contoh:

```text
PUBLIC USER
   ↓
Browse Product
   ↓
Offline Store Flow
   ↓
Store Purchase
   ↓
Offline Payment
```

```text
CUSTOMER USER
   ↓
Login
   ↓
Browse Product
   ↓
Cart
   ↓
Online Checkout
   ↓
Online Payment
   ↓
Order
```

Namun, sesuaikan diagram dengan implementasi aktual dan kebutuhan project.

---

# Aturan Penting Saat Melakukan Audit

1. **Jangan mengarang.**
2. **Jangan mengasumsikan sebuah fitur ada hanya karena nama file/component/service menunjukkan fitur tersebut.**
3. Semua kesimpulan harus berdasarkan source code yang benar-benar ditemukan.
4. Jika tidak menemukan evidence, tulis:
   **"Tidak dapat diverifikasi dari source code yang tersedia."**
5. Jika source code tidak lengkap, jelaskan bagian mana yang tidak dapat diaudit.
6. Jangan memberikan PASS jika evidence belum cukup.
7. Bedakan antara:

   * Authentication
   * Authorization
   * Business logic
   * UI restriction
   * Backend validation
8. Jangan menganggap menyembunyikan button sebagai security.
9. Jangan menganggap route guard saja sudah cukup untuk menjamin business rule.
10. Jika sebuah validasi seharusnya dilakukan backend, jelaskan secara eksplisit.
11. Jangan melakukan perubahan code terlebih dahulu.
12. **Tahap ini hanya audit dan analisis.**
13. Jangan membuat solusi berdasarkan asumsi.
14. Jika ada beberapa kemungkinan interpretasi dari source code, jelaskan ambiguity tersebut.
15. Prioritaskan **akurasi evidence dibanding opini atau best practice**.

---

## Final Requirement

Saya ingin hasil audit yang **sangat teliti dan evidence-based**.

Jangan hanya mengatakan:

> "Sepertinya sudah benar."

Saya ingin kamu benar-benar melakukan **trace terhadap source code dan flow bisnis**, kemudian menunjukkan:

* Apa yang sudah benar.
* Apa yang belum benar.
* Apa yang belum ditemukan.
* Apa yang berpotensi menjadi bug.
* Apa yang dapat dibypass.
* Apa yang membutuhkan validasi backend.
* Apa yang perlu diperbaiki agar business flow benar-benar production-ready.

**Jangan melakukan perubahan kode apa pun. Audit terlebih dahulu.**
