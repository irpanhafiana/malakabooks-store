# Audit Report: Keamanan & Aksesibilitas (Security & A11y)

**Scope:** `src/app/` — seluruh template HTML, service, dan komponen.  
**Tanggal:** 2026-08-10

---

## Ringkasan Temuan

| Kategori | Jumlah File | Severity |
|---|---|---|
| 1. `[innerHTML]` / `innerHTML` — risiko XSS | **5 file** (12 occurrence) | 🔴 High |
| 2. Kredensial/API key hardcoded | **2 file** | 🔴 High |
| 3. Manipulasi DOM langsung (`document.*`, `nativeElement`) | **5 file** | 🟡 Medium |
| 4. `<img>` tanpa atribut `alt` | **6 file** (15 tag) | 🟡 Medium |
| 5. `<button>` icon-only tanpa `aria-label` atau teks | **4 file** (~12 button) | 🟡 Medium |
| 6. *(Bonus)* `DomSanitizer.bypassSecurity*` | **0 file** | ✅ Clean |

---

## 1. Penggunaan `innerHTML` — Risiko XSS

> [!CAUTION]
> `[innerHTML]` merender HTML mentah ke DOM. Jika konten berasal dari user input atau API yang tidak dipercaya, ini membuka celah **Cross-Site Scripting (XSS)**. Angular secara default men-*sanitize* `[innerHTML]`, tetapi tetap merupakan vektor serangan jika konten mengandung tag berbahaya yang lolos sanitasi.

### 1a. `[innerHTML]` di Template HTML (Angular Auto-Sanitize — Risiko Sedang)

| File | Baris | Kode | Sumber Konten | Risiko |
|---|---|---|---|---|
| [items-detail.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/detail/items-detail.component.html#L91) | 91 | `[innerHTML]="data.description \|\| '<i>Tidak ada deskripsi.</i>'"` | Dari API (admin-generated) | 🟡 Sedang — konten dari admin CMS |
| [katalog-confirm-dialog.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/katalog/components/katalog-confirm-dialog/katalog-confirm-dialog.component.html#L17) | 17 | `<span [innerHTML]="messageHtml()"></span>` | Dari kode internal (signal) | ⚪ Rendah — konten dari kode, bukan user |
| [mardika-kopi-detail.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/mardika-kopi/mardika-kopi-detail/mardika-kopi-detail.component.html#L145) | 145 | `[innerHTML]="product()!.description"` | Dari API | 🟡 Sedang — konten dari API |
| [product-detail.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/product/product-detail/product-detail.component.html#L184) | 184 | `[innerHTML]="product()!.description"` | Dari API | 🟡 Sedang — konten dari API |

### 1b. `innerHTML` di TypeScript (Tidak Di-Sanitize Angular — Risiko Tinggi)

| File | Baris | Kode | Risiko |
|---|---|---|---|
| [editor.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/editor/editor.component.ts#L90) | 90, 101-102, 126, 137, 223, 230 | `this.editorRef.nativeElement.innerHTML = val` (7 occurrence) | 🟡 Sedang — Editor WYSIWYG, konten dari admin input. Namun raw `innerHTML` bypass Angular sanitization. |
| [shipping-label.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/shipping-label.service.ts#L271) | 271 | `document.querySelector('.barcode').innerHTML = '<p>...' + awbClean + '</p>'` | 🔴 Tinggi — **String concatenation ke innerHTML tanpa sanitasi.** Jika `awbClean` mengandung karakter berbahaya, ini menjadi vektor XSS. |

**Kode perbaikan — `shipping-label.service.ts`:**
```typescript
// SEBELUM (XSS risk — string concat ke innerHTML)
document.querySelector('.barcode').innerHTML = '<p ...>' + "${awbClean}" + '</p>';

// SESUDAH (aman — textContent)
const barcodeEl = document.querySelector('.barcode');
if (barcodeEl) {
  const p = document.createElement('p');
  p.style.cssText = 'font-size:10pt;font-weight:700;';
  p.textContent = awbClean;  // textContent TIDAK merender HTML
  barcodeEl.innerHTML = '';
  barcodeEl.appendChild(p);
}
```

**Kode perbaikan — `product-detail` & `mardika-kopi-detail`:**
```html
<!-- SEBELUM (innerHTML langsung dari API) -->
<p [innerHTML]="product()!.description"></p>

<!-- SESUDAH (pipe sanitizer untuk keamanan berlapis) -->
<!-- Opsi 1: Gunakan DomSanitizer jika HTML WAJIB dirender -->
<p [innerHTML]="sanitizedDescription()"></p>

<!-- Opsi 2: Jika plaintext cukup, gunakan textContent -->
<p>{{ product()!.description }}</p>
```

---

## 2. Kredensial & API Key Hardcoded

> [!CAUTION]
> Kredensial yang di-hardcode di source code bisa diakses oleh siapapun yang memiliki akses ke repository atau build artifact. Ini adalah pelanggaran keamanan tingkat tinggi.

| File | Baris | Kode | Jenis | Severity |
|---|---|---|---|---|
| [google-auth.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/google-auth.service.ts#L21) | 21 | `private readonly clientId = '785241388758-rv7vrb7fu9c011k34ulbcu5sq6uli1hm.apps.googleusercontent.com';` | **Google OAuth Client ID** — hardcoded langsung di file | 🔴 High |
| [auth-api.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/auth-api.service.ts#L32) | 29, 32 | `environment.clientId \|\| 'MalakaBooks-FE'` dan `environment.clientSecret \|\| 'MalakaBooks-FE'` | **Client Secret fallback** — hardcoded sebagai default value | 🟡 Medium |

**Kode perbaikan — `google-auth.service.ts`:**
```typescript
// SEBELUM (hardcoded)
private readonly clientId = '785241388758-rv7vrb7fu9c011k34ulbcu5sq6uli1hm.apps.googleusercontent.com';

// SESUDAH (dari environment config)
private readonly clientId = environment.googleClientId;
```

> [!IMPORTANT]
> **Catatan:** Google OAuth Client ID untuk web apps bersifat **publik** (terekspos di browser). Ini berbeda dengan Client Secret. Namun, best practice tetap menyimpannya di `environment.ts` agar mudah dikelola per environment (dev/staging/prod) dan tidak di-commit langsung ke repository.

**Kode perbaikan — `auth-api.service.ts`:**
```typescript
// SEBELUM (fallback ke hardcoded string)
body.set('client_secret', environment.clientSecret || 'MalakaBooks-FE');

// SESUDAH (tanpa fallback — wajib dikonfigurasi di environment)
if (!environment.clientSecret) {
  throw new Error('clientSecret is not configured in environment.');
}
body.set('client_secret', environment.clientSecret);
```

---

## 3. Manipulasi DOM Langsung

| File | Baris | Kode | Risiko | Status |
|---|---|---|---|---|
| [editor.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/ui/editor/editor.component.ts#L90) | 90, 117, etc. | `this.editorRef.nativeElement.innerHTML = ...` | 🟡 — WYSIWYG editor memerlukan DOM access | **Acceptable** (inherent to rich text editor) |
| [doku-checkout.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/doku-checkout.service.ts#L56) | 55-62 | `document.createElement('link')`, `document.createElement('script')` | 🟡 — Dynamic script loading untuk payment SDK | **Acceptable** (3rd party SDK integration) |
| [shipping-label.service.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/shipping-label.service.ts#L271) | 271, 274 | `document.querySelector('.barcode').innerHTML`, `document.getElementById('qrcode')` | 🔴 — innerHTML + getElementById di popup window | Perlu perbaikan (lihat §1b) |
| [detail-shipment.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/detail-shipment/detail-shipment.component.ts#L170) | 170 | `document.createElement('input')` — clipboard fallback | ⚪ — Fallback untuk browser lama | **Acceptable** |
| [csv.util.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/shared/util/csv.util.ts#L40) | 40 | `document.createElement('a')` — download trigger | ⚪ — Standard download pattern | **Acceptable** |
| [login.component.ts](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/auth/login/login.component.ts#L47) | 47 | `document.getElementById('google-button')` | ⚪ — Google GSI button render | **Acceptable** |

---

## 4. `<img>` Tanpa Atribut `alt` (Aksesibilitas)

> [!WARNING]
> Setiap `<img>` WAJIB memiliki atribut `alt` untuk aksesibilitas screen reader. Tanpa `alt`, screen reader tidak bisa mengomunikasikan konteks gambar ke pengguna tunanetra.

### ❌ `<img>` TANPA `alt`

| File | Baris | Kode | Rekomendasi |
|---|---|---|---|
| [complaints-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/complaints/form/complaints-form.component.html#L11) | 11 | `<img [src]="img.image" (click)="openImagePreview(...)">` | Tambah `alt="Gambar komplain"` |
| [complaints-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/complaints/form/complaints-form.component.html#L42) | 42 | `<img [src]="img.image" (click)="openImagePreview(...)">` | Tambah `alt="Gambar balasan"` |
| [complaints-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/complaints/form/complaints-form.component.html#L78) | 78 | `<img [src]="img.image" ...>` | Tambah `alt="Lampiran gambar"` |
| [complaints-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/complaints/form/complaints-form.component.html#L100) | 100 | `<img [src]="previewImage()" ...>` | Tambah `alt="Preview gambar"` |
| [items-detail.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/detail/items-detail.component.html#L41) | 41 | `<img [src]="data.coverImage" ...>` | Tambah `[alt]="data.title"` |
| [items-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/form/items-form.component.html#L34) | 34 | `<img [src]="coverImageControl.value" ...>` | Tambah `alt="Cover image preview"` |
| [items-form.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/admin/items/form/items-form.component.html#L77) | 77 | `<img [src]="ctrl.value" ...>` | Tambah `alt="Additional image"` |
| [complaint.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/complaint/complaint.component.html#L98) | 98, 128, 151, 189, 268 | 5x `<img [src]="img.image">` tanpa `alt` | Tambah `alt="Lampiran komplain"` |
| [order-history.component.html](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/order/order-history/order-history.component.html#L187) | 187 | `<img [src]="img.image" ...>` | Tambah `alt="Review image"` |

### ✅ `<img>` yang SUDAH BENAR (memiliki `alt`)

Mayoritas `<img>` sudah memiliki atribut `alt` yang deskriptif:
- `product-card.component.html` → `[alt]="prod.title"` ✅
- `cart.component.html` → `[alt]="item.product.title"` ✅
- `checkout.component.html` → `[alt]="item.product.title"` ✅
- `profile.component.html` → `alt="Avatar"` ✅
- `desktop-header.component.html` → `alt="SS Logo"` ✅
- `product-detail.component.html` → `[alt]="product()!.title"` ✅
- Dan 15+ tag `<img>` lainnya ✅

---

## 5. `<button>` Icon-Only Tanpa `aria-label`

> [!WARNING]
> Button yang hanya berisi ikon (tanpa teks) WAJIB memiliki `aria-label` agar screen reader bisa membacakan fungsinya.

### Perkiraan Button Tanpa Label Aksesibilitas

Beberapa button icon-only di area admin yang menggunakan `appTooltip` sebagai alternatif label visual sudah cukup baik (tooltip memberikan konteks), namun `appTooltip` **TIDAK** setara dengan `aria-label` untuk screen reader.

| Area | File | Contoh | Rekomendasi |
|---|---|---|---|
| Admin CRUD | `authors-list`, `categories-list`, `items-list`, dll. | `<button appTooltip="Hapus Data" (click)="onDelete(...)">` | Tambah `[attr.aria-label]="'Hapus ' + item.name"` |
| Admin Dashboard | `dashboard.component.html` | `<button type="button" (click)="loadData()">` | Tambah `aria-label="Refresh data"` |
| Complaint | `complaint.component.html` | `<button type="button" (click)="removeReplyImage(i)">` | Tambah `aria-label="Hapus gambar"` |
| Admin Login | `admin-login.component.html` | `<button type="button" (click)="clearSessionMessage()">` | Tambah `aria-label="Tutup pesan"` |

### ✅ Komponen yang SUDAH BENAR

Halaman customer-facing sudah memiliki `aria-label` lengkap:
- `home.component.html` → `aria-label="Sebelumnya"`, `aria-label="Berikutnya"` ✅
- `katalog-bottom-nav` → `aria-label="Beranda"`, `"Cari produk"`, `"Keranjang"` ✅
- `customer-layout` → `aria-label="Cari produk"`, `"Keranjang"`, `"Profil"` ✅
- `product-list` → `aria-label="Kembali"`, `"More Filters"` ✅
- `admin-layout` → `aria-label="Toggle navigation menu"` ✅

---

## 6. `DomSanitizer.bypassSecurity*`

### ✅ Tidak Ditemukan

Tidak ada penggunaan `bypassSecurityTrustHtml`, `bypassSecurityTrustUrl`, atau fungsi bypass sanitasi Angular lainnya.

---

## Prioritas Perbaikan

1. 🔴 **[HIGH]** Perbaiki `innerHTML` dengan string concatenation di [shipping-label.service.ts:271](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/shipping-label.service.ts#L271) — gunakan `textContent` atau DOM API.
2. 🔴 **[HIGH]** Pindahkan Google OAuth Client ID dari [google-auth.service.ts:21](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/google-auth.service.ts#L21) ke `environment.ts`.
3. 🔴 **[HIGH]** Hapus fallback hardcoded `client_secret` di [auth-api.service.ts:32](file:///d:/MALAKABOOKS/malakabooks-store/src/app/core/services/auth-api.service.ts#L32).
4. 🟡 **[MEDIUM]** Tambahkan `alt` attribute pada 15 tag `<img>` di 6 file (admin complaints, items, complaint customer, order-history).
5. 🟡 **[MEDIUM]** Evaluasi `[innerHTML]="product().description"` di [product-detail](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/product/product-detail/product-detail.component.html#L184) dan [mardika-kopi-detail](file:///d:/MALAKABOOKS/malakabooks-store/src/app/features/mardika-kopi/mardika-kopi-detail/mardika-kopi-detail.component.html#L145) — pastikan konten API di-sanitasi server-side.
6. 🟡 **[MEDIUM]** Tambahkan `aria-label` pada button icon-only di area admin (~12 button).
7. ⚪ **[LOW]** Konversi `appTooltip` directive agar otomatis menambahkan `aria-label` jika belum ada.

---

## Catatan Positif ✅

- **✅ Tidak ada `bypassSecurityTrust*`** — Tidak ada bypass sanitasi Angular.
- **✅ Customer-facing pages** sudah memiliki `aria-label` lengkap pada navigasi, button, dan link.
- **✅ Semua `<img>` produk** sudah memiliki `[alt]` yang deskriptif.
- **✅ `environment.ts`** sudah digunakan untuk `clientId` dan `clientSecret` di `auth-api.service.ts` (hanya fallback yang bermasalah).
- **✅ No hardcoded tokens** — Tidak ada token JWT atau API key yang di-hardcode di source code.
