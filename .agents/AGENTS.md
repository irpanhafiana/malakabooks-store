# Malakabooks Store - AI Agent Rules

Dokumen ini berisi sekumpulan aturan khusus (*rules*) untuk agen AI (seperti Antigravity) yang bekerja di dalam *workspace* ini. 
**PENTING: Bacalah dokumen ini secara otomatis setiap kali pengguna memulai tugas.**

## 1. Arsitektur Proyek
- **Framework:** Angular 21 (Standalone Components).
- **Rendering:** Murni **Client-Side Rendering (CSR)**. Tidak ada Server-Side Rendering (SSR). Dilarang mengimpor atau menggunakan modul server (`@angular/platform-server`, `express`, dll).
- **Style Guide:** Wajib menggunakan Standalone Components API terbaru. Gunakan Angular Signals (`signal`, `computed`, `effect`) untuk manajemen *state* dan hindari penggunaan `RxJS` (`BehaviorSubject`, dsb) jika fitur tersebut bisa diselesaikan dengan Signals.
- **Routing:** Gunakan *lazy loading* terbaru dengan pola `loadComponent`.

## 2. Standar UI dan Styling
- **CSS Framework:** Wajib menggunakan **Tailwind CSS v4** *utility classes* langsung di template HTML.
- **Custom CSS:** SANGAT DILARANG menggunakan CSS atau SCSS kustom di dalam komponen (`.css` / `.scss` component file) kecuali untuk hal-hal spesifik yang tidak bisa di-handle oleh Tailwind (misal: animasi kompleks atau override plugin).
- **Komponen Eksternal:** 
  - Dialog / Alert: Gunakan **SweetAlert2**.
  - Carousel / Slider: Gunakan **Embla Carousel**.
  - Ikon: Gunakan **Boxicons**.

## 3. Pengujian (Testing)
- **Framework:** Proyek ini menggunakan **Vitest** dan **jsdom**, BUKAN Karma atau Jasmine.
- **Aturan:** Jika pengguna meminta untuk menulis *unit test*, tulislah menggunakan *syntax* dan *assertion* Vitest standar yang kompatibel dengan Angular.

## 4. Konteks Bisnis (Domain)
- Aplikasi ini adalah platform **E-Commerce Toko Buku**. Segala pembuatan fitur dummy, nama variabel, atau skema data harap disesuaikan dengan konteks toko buku (misalnya: `Book`, `Author`, `CartItem`, `Order`).
- Referensi dokumen teknis lebih lanjut ada di `ARCHITECTURE.md` (root directory).

## 5. Gaya Komunikasi (Communication Style)
- Jawablah semua instruksi secara langsung (to the point) tanpa basa-basi pembuka (seperti "Tentu, saya akan membantu...") atau penutup yang ramah tamah.
- Prioritaskan menampilkan blok kode langsung atau poin solusi teknis yang ringkas untuk menghemat token.
- Gunakan penjelasan teks seminimal mungkin, hanya untuk bagian yang krusial atau arsitektural.

