# Endpoint dan Payload Pembuatan Item Buku (Malaka) oleh Admin

Berdasarkan implementasi pada `ItemApiService`, ketika admin membuat item berjenis buku (`itemType: 'malaka'`), sistem akan melakukan dua tahap HTTP *request* berurutan:

## 1. Request Pembuatan Item Utama (Items)
Request ini menyimpan data dasar produk ke dalam tabel/koleksi `Items`.

- **Endpoint:** `POST {BASE_URL}/admin/Items`
- **Payload:**
```json
{
  "name": "Nama Item / Judul Buku",
  "sapCode": "",
  "itemType": "malaka",
  "categoryId": "string (ID Kategori)",
  "uomGroupId": "string (ID UOM Group, opsional)",
  "uomGroup": "object (opsional)",
  "baseUomCode": "",
  "description": "Deskripsi lengkap produk",
  "coverImage": "string (URL/Path gambar cover)",
  "additionalImages": [],
  "weight": 0,
  "stock": 0,
  "isActive": false 
}
```

## 2. Request Pembuatan Data Spesifik Buku (Books)
Setelah request pertama berhasil dan mengembalikan ID dari item yang baru saja dibuat, sistem akan otomatis melakukan request kedua untuk menyimpan metadata spesifik buku ke tabel/koleksi `Books`.

- **Endpoint:** `POST {BASE_URL}/admin/Books`
- **Payload:**
```json
{
  "itemId": "string (ID yang didapat dari response pembuatan Items)",
  "authorIds": ["string"],
  "isbn": "string",
  "publisher": "string",
  "publishedYear": 0,
  "pages": 0
}
```

**Pengecualian:**
Jika kategori dari item tersebut memiliki nama `"merchandise"`, request kedua (pembuatan entitas `Books`) **tidak akan dijalankan**, meskipun `itemType`-nya bernilai `'malaka'`.
