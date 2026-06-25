# Katalog Shared UI Components (`src/app/shared/ui/`)

Proyek ini menggunakan *Custom Design System*. AI diinstruksikan untuk menggunakan komponen-komponen di bawah ini saat membangun UI.

## Komponen Tersedia

1. **`app-button`** (`button.component.ts`)
   - `variant`: `'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline'`
   - `size`: `'sm' | 'md' | 'lg'`
   - `loading`: `boolean`
   - `disabled`: `boolean`
   - `fullWidth`: `boolean`
2. **`app-input`** (`input.component.ts`)
   - Menerima `[control]="FormControl"` untuk validasi form reaktif.
   - `type`: `'text' | 'email' | 'password' dll`
   - `label`: `string`
   - `icon`: `string` (dari Boxicons)
3. **Komponen Form Lainnya**:
   - `app-checkbox`, `app-radio`, `app-select`, `app-textarea`
4. **Data Display**:
   - `app-badge`, `app-discount-badge`, `app-status-badge`
   - `app-card`, `app-product-card`
   - `app-price`
   - `app-table`, `app-masonry-grid`
5. **Feedback & Loading**:
   - `app-skeleton` (untuk efek *loading* UI)
   - `app-spinner`
   - `app-empty-state`
   - `app-toast-container`, `app-modal`, `app-bottom-sheet`, `app-drawer`
6. **E-Commerce Spesifik**:
   - `app-quantity-selector`
   - `app-rating-stars`
   - `app-search-bar`
   - `app-map-picker` (Leaflet map integrasi)

*(Catatan: Jangan gunakan library komponen luar seperti Angular Material atau Bootstrap. Semua UI harus dibangun merakit komponen `shared/ui` ini dengan utilitas TailwindCSS v4).*
