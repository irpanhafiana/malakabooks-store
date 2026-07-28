# Rencana: Merapikan Tampilan Desktop (Guest & Customer Login) — UX/UI "FIT", Bukan "AI Slop"

## Context

Tampilan desktop untuk guest dan customer yang sudah ada saat ini **berfungsi**, tapi secara UX/UI terasa belum "fit". Akar masalahnya: **desktop pada dasarnya adalah tampilan mobile yang diregangkan ke kanvas lebar**, ditambah beberapa jejak "AI slop" (konten placeholder generik + file scaffolding sampah).

Bukti konkret dari hasil scanning codebase:

- **Konten desktop = carousel mobile yang diregangkan.** Di `home.component.html`, section "Produk Terlaris / Merchandise / Penulis" memakai kartu lebar tetap `flex-[0_0_170px]`. Di layar 1280px+ kartunya jadi kecil-kecil dan banyak ruang kosong → terlihat sepi & janggal. Hero hanya `lg:h-80`.
- **UX mismatch pada overlay.** Detail produk & modal pilih-kuantitas di desktop masih memakai **bottom-sheet** yang menyembul dari bawah (pola mobile), bukan dialog terpusat.
- **"AI slop" konten** di footer: alamat palsu `Jl. Literasi No. 123, Jakarta Selatan`, email `halo@malakabooks.com`, blurb generik "terkemuka / premium / terbaik", tanpa telepon/WA/sosial media.
- **Sampah teknis**: 8 file stub `ng generate` yatim (`desktop-header.ts`, `desktop-footer.ts`, `.html`, `.css`, `.spec.ts`) yang **selectornya bentrok** (`app-desktop-header` / `app-desktop-footer`) dengan komponen `*.component.ts` yang asli; markup modal-kuantitas **ter-copy 4×**; `toastClass()` kemungkinan dead code; magic number (`min-h-[calc(100vh-160px)]`, `max-w-[480px]` vs `max-w-120`).

**Batasan (dari user):** JANGAN sentuh halaman administrator (`admin-*`, `*.admin`). Fokus hanya pengalaman customer/guest. Data kontak footer asli akan disuplai user menyusul.

**Hasil yang diinginkan:** desktop terasa dirancang khusus untuk layar lebar — hero proporsional, grid rapi mengisi kanvas, overlay pakai dialog desktop, konten jujur/tidak generik, dan codebase bersih dari scaffolding sampah.

---

## Prinsip Desain (acuan agar tidak "AI slop")

1. **Reuse token & komponen yang sudah ada** — jangan bikin gaya baru.
   - Warna: `primary-600` = navy `#003049`, `accent-600` = merah `#B61919`, netral pakai skala `slate`.
   - Font: heading = Fraunces serif (`font-display`, weight 700), body = Poppins (`font-sans`).
   - Komponen reusable yang WAJIB dipakai ulang: `app-button`, `app-badge`, `app-price`, `app-input`, `app-product-card`, `app-modal`, `app-empty-state`, `app-skeleton`, `app-search-bar`, `app-quantity-selector`, `app-icon`. (Semua di `src/app/shared/ui/`.)
2. **Desktop bukan mobile yang diregangkan** — grid multi-kolom mengisi lebar, bukan carousel kartu 170px.
3. **Konten jujur, spesifik, tidak generik.** Hindari kata "terkemuka/premium/terbaik" tanpa makna. Data yang belum ada → placeholder eksplisit `<!-- TODO: isi data asli -->`, bukan data karangan.
4. **Konsistensi** rounding (`rounded-xl`/`2xl`), spacing (`gap-6`/`gap-8`, `px-6`), dan container (`max-w-7xl mx-auto`).

---

## Keputusan desain yang sudah ditetapkan di plan ini

- **Overlay desktop → dialog terpusat.** Detail produk & modal kuantitas di cabang `screen.isDesktop()` dikonversi dari `app-bottom-sheet` ke `app-modal` (centered, overlay). Bottom-sheet tetap dipertahankan untuk cabang mobile. Alasan: minim perubahan alur (tetap overlay, bukan pindah route), langsung reuse `app-modal` yang sudah ada.
- **Tidak menambah sidebar** di shell desktop. Navigasi top-nav sudah memadai untuk e-commerce; sidebar filter khusus hanya dipertimbangkan di halaman Daftar Produk (Task 7, opsional).
- **Eliminasi duplikasi:** ekstrak blok modal-kuantitas (yang ter-copy 4×) menjadi satu komponen `app-qty-modal-content`.

---

## Daftar Task (urut prioritas; tiap task berdiri sendiri)

### FASE 0 — Bersih-bersih (cepat, tanpa risiko visual)

- [ ] **T1. Hapus 8 file stub scaffolding yatim.**
  Hapus: `src/app/layouts/desktop/desktop-header/desktop-header.ts`, `.html`, `.css`, `.spec.ts` dan `src/app/layouts/desktop/desktop-footer/desktop-footer.ts`, `.html`, `.css`, `.spec.ts`.
  Pertahankan hanya versi `*.component.*`. Verifikasi tidak ada import yang menunjuk ke file non-`.component` (grep `desktop-header'`/`desktop-footer'`). Menghilangkan collision selector `app-desktop-header`/`app-desktop-footer`.

- [ ] **T2. Bersihkan dead code & magic number.**
  - Hapus `toastClass()` di ketiga layout TS (`customer-layout`, `inner-page-layout`, `search-layout`) bila terbukti tak dipakai template.
  - Samakan lebar frame mobile: pilih satu sintaks (`max-w-[480px]`) di `inner-page-layout.component.html` (saat ini `max-w-120`).
  - Ganti `min-h-[calc(100vh-160px)]` di `customer-layout.component.html:5` dengan pendekatan flex yang tidak bergantung angka tetap (mis. andalkan `grow` + `flex-col` shell) atau CSS var tinggi header/footer.

### FASE 1 — Shell Desktop (header, footer, overlay) — dampak paling luas

- [ ] **T3. Poles Desktop Header** (`desktop-header.component.html`).
  - Hilangkan guard redundan `hidden lg:flex` pada `<nav>` (header hanya render saat `isDesktop()`).
  - Perhalus active state link nav & konsistensi hover.
  - Guest: pastikan hierarki CTA jelas ("Daftar" solid primary, "Masuk" ghost) — sudah oke, rapikan spacing.
  - Customer: pill "Akun Saya" — pertimbangkan dropdown menu (Profil, Pesanan, Keluar) alih-alih link langsung, memakai `click-outside` directive yang sudah ada. (Opsional, tandai jika ingin ditunda.)

- [ ] **T4. Rombak konten Desktop Footer** (`desktop-footer.component.html`).
  - Ganti blurb generik dengan deskripsi netral & jujur (hindari "terkemuka/premium/terbaik").
  - **Kolom kontak:** hapus data palsu; ganti dengan placeholder eksplisit `<!-- TODO: isi alamat/telepon/WA/email asli -->` sampai user memberi data. (Data asli akan disuplai user.)
  - Tambah baris tautan legal (Kebijakan Privasi, S&K) bila route tersedia — jika belum ada, tandai TODO, jangan buat link mati.
  - Rapikan grid 4 kolom agar seimbang di `max-w-7xl`.

- [ ] **T5. Konversi overlay desktop → `app-modal`.**
  - Di cabang `screen.isDesktop()` pada `customer-layout.component.html` & `search-layout.component.html`: bungkus `app-product-detail` dan blok modal-kuantitas dengan `app-modal` (centered) alih-alih `app-bottom-sheet`.
  - Pastikan ukuran modal proporsional desktop (mis. `max-w-3xl` untuk detail, `max-w-md` untuk kuantitas).
  - Cabang mobile TETAP pakai `app-bottom-sheet`.

- [ ] **T6. Ekstrak komponen `app-qty-modal-content`.**
  Buat komponen standalone berisi blok modal-kuantitas (UOM chips + `app-quantity-selector` + total harga + tombol konfirmasi) yang saat ini ter-copy 4× di `customer-layout.component.html` (desktop & mobile) dan `search-layout.component.html` (desktop & mobile). Ganti keempat salinan dengan `<app-qty-modal-content>`. Menghilangkan risiko drift.

### FASE 2 — Konten Halaman Desktop (inti "fit"-nya)

- [ ] **T7. Home desktop** (`home.component.html`) — perubahan paling berdampak visual.
  - **Hero**: naikkan tinggi & skala tipografi desktop (mis. `lg:h-[420px]`), manfaatkan ruang untuk layout hero yang lebih kaya.
  - **Section carousel (Terlaris/Merchandise/Penulis)**: di desktop, ganti kartu lebar tetap `flex-[0_0_170px]` dengan lebar responsif (mis. `lg:flex-[0_0_220px]`) ATAU tampilkan sebagai grid baris penuh (`lg:grid lg:grid-cols-5`) dengan tombol "Lihat semua". Tujuan: mengisi kanvas, bukan kartu kecil bertebaran.
  - **"Semua Produk"**: grid desktop `lg:grid-cols-4` sudah ada — pertimbangkan `xl:grid-cols-5`, perbaiki gap & rhythm vertikal antar-section (`lg:gap-12`).
  - Author bottom-sheet (baris 297+) → konsisten dengan keputusan T5 (jadikan modal di desktop).

- [ ] **T8. Daftar Produk desktop** (`product-list.component.html`).
  - Manfaatkan lebar: grid `lg:grid-cols-4 xl:grid-cols-5`.
  - Filter/sort: pertimbangkan panel filter kiri (sidebar) khusus desktop, atau toolbar atas yang rapi. (Opsional — tandai bila ingin ditunda; sort saat ini via bottom-sheet, samakan dengan T5.)

- [ ] **T9. Detail Produk desktop** (`product-detail.component.html`).
  - Sudah punya cabang `lg:grid-cols-2` (galeri + detail). Poles agar pas dalam konteks modal desktop (T5): spacing, ukuran galeri, tab Deskripsi/Review.

- [ ] **T10. Cart desktop** (`cart.component.html`).
  - Sudah responsif (`lg:flex-row` item kiri + ringkasan kanan sticky). Poles: lebar kolom, spacing, dan pastikan `app-empty-state` proporsional di layar lebar.

- [ ] **T11. Profil desktop** (`profile.component.html`).
  - Grid menu `lg:grid-cols-3` sudah ada. Poles kartu profil (avatar/hero), layout menu, dan tombol logout agar tidak terasa seperti daftar mobile yang diregangkan.

---

## File-file kritis

- Shell: `src/app/layouts/desktop/desktop-header/desktop-header.component.html`, `desktop-footer/desktop-footer.component.html`
- Layout switch: `src/app/layouts/customer-layout/customer-layout.component.{html,ts}`, `inner-page-layout/*`, `search-layout/*`
- Deteksi layar: `src/app/core/services/screen.service.ts` (breakpoint `1024px`)
- Konten: `src/app/features/home/home.component.html`, `product/product-list/*`, `product/product-detail/*`, `cart/*`, `profile/*`
- Reusable UI: `src/app/shared/ui/` (button, modal, badge, price, product-card, empty-state, quantity-selector, dsb.)
- Token global: `src/styles.css` (`@theme` — warna, font)

---

## Verifikasi

1. `npm start` (atau perintah dev yang berlaku) — pastikan build tanpa error setelah penghapusan file T1/T2.
2. Cek di viewport ≥1024px (browser resize / DevTools) untuk state **guest** dan **login**:
   - Header, footer, home, daftar produk, detail produk (modal), cart, profil.
3. Cek di <1024px memastikan tampilan mobile TIDAK berubah/rusak (bottom-sheet, bottom-nav, frame 480px tetap).
4. Konfirmasi tidak ada warning selector duplikat dari Angular setelah T1.
5. Halaman administrator TIDAK tersentuh sama sekali.

---

## Catatan

- Data kontak footer asli (alamat, telepon/WA, email, sosial media, link legal) menunggu dari user; sampai itu ada, pakai placeholder `<!-- TODO -->` — jangan karang data.
- Task ditulis agar bisa dikerjakan bertahap & independen. Rekomendasi urutan: Fase 0 → Fase 1 → Fase 2. Fase 0 & 1 memberi perbaikan "fit" & kebersihan tercepat; Fase 2 adalah inti perombakan visual desktop.