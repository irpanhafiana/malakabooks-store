# Malakabooks Store - Architecture

Dokumen ini menjelaskan struktur arsitektur teknis untuk proyek **Malakabooks Store**, sebuah aplikasi E-Commerce toko buku.

## Tech Stack Utama
- **Framework**: Angular 21
- **Arsitektur Rendering**: Client-Side Rendering (CSR)
- **Styling**: TailwindCSS v4
- **Testing**: Vitest + jsdom

## Prinsip Desain
1. **Standalone Components**: Semua komponen ditulis menggunakan API Standalone Angular tanpa menggunakan `NgModules`.
2. **Reaktif dengan Signals**: Manajemen state dan reaktivitas utama di-handle menggunakan Angular Signals, mengurangi overhead `RxJS`.
3. **Utility-First CSS**: Desain UI dibangun murni dari class utilitas Tailwind CSS.

## Ekosistem Pihak Ketiga
- **Peta/Geolokasi**: Leaflet (`leaflet`, `@types/leaflet`)
- **Carousel/Slider**: Embla Carousel (`embla-carousel`, `embla-carousel-autoplay`)
- **Notifikasi/Pop-up**: SweetAlert2
- **Ikonografi**: Boxicons
- **Tipografi**: `@fontsource` (Fraunces, Inter, Plus Jakarta Sans, Poppins)

## Struktur Direktori Standar (Konvensi)
Berdasarkan setup Angular, berikut adalah konvensi struktur direktori di dalam folder `src/app/`:

- `core/`: Berisi Singleton services, interceptors, guards, dan model global. File di sini hanya boleh di-import sekali di `app.config.ts`.
- `features/`: Fitur domain spesifik (contoh: `cart`, `checkout`, `product-list`). Masing-masing fitur ini bisa diload secara *lazy*.
- `shared/`: Komponen UI yang digunakan ulang di mana-mana (contoh: `button`, `card`, `input`).
- `layouts/`: Komponen struktural halaman seperti Header, Footer, dan Sidebar.
- `store/`: Berisi logika state management terpusat (jika menggunakan state management terpusat berbasis Signals).

*(Dokumen ini akan terus berkembang seiring berjalannya proyek)*
