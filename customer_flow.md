# Konsep Fitur Offline Store - Sisi Customer (Deferred Roadmap)

Dokumen ini mencatat alur, konsep, dan spesifikasi fitur Offline Store dari perspektif **Customer** yang akan diimplementasikan pada tahap selanjutnya.

---

## 1. Alur Belanja Customer (User Journey)

1. **Scan QR Toko Fisik:**
   - Customer datang ke toko fisik dan melakukan scan QR Code yang dipajang di area toko/pintu masuk.
   - QR Code memuat URL katalog toko dengan identitas cabang (`branchCode`), misal: `https://katalog.malakabooks.com/?branch=BR-BDG-01`.

2. **Eksplorasi Katalog Offline:**
   - Customer masuk ke katalog tanpa perlu registrasi/login (*Guest Mode*).
   - Produk, harga, dan stok yang ditampilkan disinkronkan dengan stok toko fisik lokasi cabang tersebut.

3. **Pengisian Keranjang (Cart):**
   - Customer menambahkan buku ke keranjang belanja melalui tombol tambah atau fitur *Scan Barcode ISBN/SKU* fisik buku.

4. **Generate QR Checkout:**
   - Saat checkout, customer mengisi informasi opsional (Nama & Nomor WhatsApp untuk struk digital).
   - Sistem mengirim Draft Order ke backend (`/pos-api/api/v2/DraftObjects/B2CService`) dan menerima `docNum`.
   - Layar HP customer menampilkan **QR Checkout** yang mengodekan `docNum` beserta ringkasan transaksi (Total Item & Total Harga).

---

## 2. Spesifikasi Payload & Keamanan QR Checkout

- **Format String Payload:** `SJ-OFFLINE:<docNum>:<timestamp>`
- **Masa Berlaku (TTL):** 15 - 30 menit dari waktu pembuatan.
- **Identifikasi:** Menggunakan `docNum` unik sebagai token referensi, bukan data barang mentah.

---

## 3. Rencana Pengembangan Selanjutnya (Customer Side)

- [ ] Penangkapan `branchCode` dari query parameter URL katalog.
- [ ] Fitur Web Camera Barcode Scanner untuk pemindaian ISBN buku fisik di HP customer.
- [ ] Integrasi pembentukan Draft Order B2C saat tombol Checkout ditekan.
- [ ] Tampilan halaman QR Checkout dengan batas waktu mundur (countdown timer).
