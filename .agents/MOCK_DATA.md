# Mock Data (Referensi Struktur Payload API)

File ini berisi contoh data (*Mock JSON*) yang 100% sesuai dengan model antarmuka (`interface`) TypeScript di aplikasi. Gunakan struktur data ini jika membutuhkan data simulasi untuk UI.

## 1. Product (Buku) - `Product` model
```json
{
  "id": "prod_123456",
  "name": "Atomic Habits: Perubahan Kecil yang Memberikan Hasil Luar Biasa",
  "description": "Buku ini mengungkapkan...",
  "price": 95000,
  "originalPrice": 108000,
  "images": ["/assets/books/atomic-habits.jpg"],
  "categoryId": "cat_selfdev",
  "categoryName": "Pengembangan Diri",
  "stock": 42,
  "rating": 4.8,
  "reviewsCount": 1250,
  "featured": true,
  "brand": "Gramedia",
  "author": "James Clear",
  "specifications": {
    "cover": "Soft Cover",
    "pages": "320",
    "language": "Indonesia"
  },
  "createdAt": "2024-01-15T08:00:00Z"
}
```

## 2. User - `User` model
```json
{
  "id": "usr_9876",
  "name": "Budi Santoso",
  "email": "budi.santoso@example.com",
  "role": "customer",
  "phone": "08123456789",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
  "joinedAt": "2024-02-10T10:30:00Z",
  "addresses": [
    {
      "id": "addr_1",
      "label": "Rumah",
      "recipientName": "Budi Santoso",
      "phone": "08123456789",
      "fullAddress": "Jl. Mawar No. 12, RT 01/RW 02, Jakarta Selatan",
      "city": "Jakarta Selatan",
      "postalCode": "12345",
      "isPrimary": true
    }
  ]
}
```

## 3. Order - `Order` model
```json
{
  "id": "ORD-2024-001",
  "userId": "usr_9876",
  "userName": "Budi Santoso",
  "userEmail": "budi.santoso@example.com",
  "items": [
    {
      "productId": "prod_123456",
      "productName": "Atomic Habits",
      "price": 95000,
      "quantity": 1,
      "image": "/assets/books/atomic-habits.jpg"
    }
  ],
  "shippingAddress": {
      "id": "addr_1",
      "label": "Rumah",
      "recipientName": "Budi Santoso",
      "phone": "08123456789",
      "fullAddress": "Jl. Mawar No. 12",
      "city": "Jakarta Selatan",
      "postalCode": "12345",
      "isPrimary": true
  },
  "paymentMethod": "bank_transfer",
  "status": "pending",
  "subtotal": 95000,
  "shippingCost": 15000,
  "tax": 0,
  "total": 110000,
  "orderDate": "2024-02-20T14:00:00Z",
  "shippingCourier": "JNE",
  "shippingType": "REG"
}
```
