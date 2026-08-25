# API Endpoints and Payloads for Creating a Book (Malaka) Item

Berdasarkan implementasi di `ItemApiService` (`src/app/core/services/item-api.service.ts`), proses pembuatan item berjenis buku ("malaka") oleh admin dilakukan melalui **dua tahap API calls**, karena arsitektur backend memisahkan entitas `Item` dasar dan detail spesifik `Book`.

## 1. Tahap 1: Membuat Base Item
Tahap pertama adalah membuat *base item* yang berisi informasi umum produk beserta gambar-gambarnya.

* **Endpoint:** `POST /admin/Items/with-files`
* **Content-Type:** `multipart/form-data`

### Payload (Form Data):
| Key | Tipe | Keterangan |
| :--- | :--- | :--- |
| `Name` | `string` | Nama atau judul buku. |
| `SAPCode` | `string` | Kode unik SAP (opsional). |
| `ItemType` | `string` | Diisi dengan nilai `"malaka"`. |
| `CategoryId` | `string` | ID kategori (opsional). |
| `UomGroupId` | `string` | ID grup satuan ukur (opsional). |
| `BaseUomCode` | `string` | Kode dasar unit ukur (opsional). |
| `Description` | `string` | Deskripsi produk (opsional). |
| `Weight` | `number` | Berat buku. |
| `Stock` | `number` | Stok awal buku. |
| `IsActive` | `boolean` | Status keaktifan item (`true`/`false`). |
| `CoverImage` | `File` | File gambar utama/cover (opsional). |
| `AdditionalImages` | `File[]` | File gambar tambahan (opsional). |
| `UomGroup.*` | `beragam` | Detail informasi UomGroup jika ingin disematkan secara langsung (opsional). |

---

## 2. Tahap 2: Menambahkan Detail Spesifik Buku
Setelah berhasil membuat item dasar, API akan mengembalikan data item yang telah dibuat beserta ID-nya. Selanjutnya ID ini digunakan untuk menyimpan spesifikasi khusus buku.

* **Endpoint:** `POST /admin/Books`
* **Content-Type:** `application/json`

### Payload (JSON):
```json
{
  "itemId": "string", // ID item yang didapatkan dari response Tahap 1
  "authorIds": [
    "string"          // Kumpulan ID dari tabel Authors
  ],
  "isbn": "string",   // Nomor ISBN buku
  "publisher": "string", // Nama penerbit
  "publishedYear": 2024, // Tahun terbit (number)
  "pages": 350        // Jumlah halaman (number)
}
```

> **Catatan:** Jika pengguna mengubah item buku ("malaka") menjadi merchandise (non-buku), data yang berada di tabel Book terkait `itemId` tersebut akan dihapus oleh sistem secara otomatis melalui `DELETE /admin/Books/{bookId}`.
