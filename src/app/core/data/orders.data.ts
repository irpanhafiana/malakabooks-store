import { Order } from '../models/order.model';

export const ORDERS_DATA: Order[] = [
  {
    id: 'ord-1001',
    userId: 'user-1',
    items: [
      { bookId: 'book-1', title: 'Laskar Pelangi', price: 89000, quantity: 2 },
      { bookId: 'book-5', title: 'Sapiens: Riwayat Singkat Umat Manusia', price: 145000, quantity: 1 }
    ],
    addressId: 'addr-1',
    status: 'delivered',
    totalPrice: 323000,
    note: 'Mohon dibungkus kado ya',
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-05-12T15:00:00Z'
  },
  {
    id: 'ord-1002',
    userId: 'user-1',
    items: [
      { bookId: 'book-17', title: 'Filosofi Teras', price: 98000, quantity: 1 }
    ],
    addressId: 'addr-1',
    status: 'delivered',
    totalPrice: 98000,
    note: '',
    createdAt: '2026-05-15T14:30:00Z',
    updatedAt: '2026-05-17T11:00:00Z'
  },
  {
    id: 'ord-1003',
    userId: 'user-2',
    items: [
      { bookId: 'book-18', title: 'Atomic Habits', price: 108000, quantity: 1 },
      { bookId: 'book-19', title: 'Sebuah Seni untuk Bersikap Bodo Amat', price: 85000, quantity: 1 }
    ],
    addressId: 'addr-3',
    status: 'delivered',
    totalPrice: 193000,
    note: '',
    createdAt: '2026-05-18T09:00:00Z',
    updatedAt: '2026-05-20T16:00:00Z'
  },
  {
    id: 'ord-1004',
    userId: 'user-4',
    items: [
      { bookId: 'book-11', title: 'Cosmos', price: 120000, quantity: 1 },
      { bookId: 'book-12', title: 'Brief Answers to the Big Questions', price: 95000, quantity: 2 }
    ],
    addressId: 'addr-5',
    status: 'shipped',
    totalPrice: 310000,
    note: 'Kirim pakai bubble wrap tebal',
    createdAt: '2026-05-30T13:00:00Z',
    updatedAt: '2026-05-31T10:00:00Z'
  },
  {
    id: 'ord-1005',
    userId: 'user-5',
    items: [
      { bookId: 'book-23', title: 'Gundala Putra Petir: Negeri Tanpa Dewa', price: 85000, quantity: 1 },
      { bookId: 'book-25', title: 'Detective Conan Vol. 100', price: 45000, quantity: 3 }
    ],
    addressId: 'addr-6',
    status: 'processing',
    totalPrice: 220000,
    note: '',
    createdAt: '2026-06-01T08:15:00Z',
    updatedAt: '2026-06-01T14:00:00Z'
  },
  {
    id: 'ord-1006',
    userId: 'user-1',
    items: [
      { bookId: 'book-14', title: 'The Intelligent Investor', price: 165000, quantity: 1 }
    ],
    addressId: 'addr-2',
    status: 'pending',
    totalPrice: 165000,
    note: '',
    createdAt: '2026-06-02T10:00:00Z',
    updatedAt: '2026-06-02T10:00:00Z'
  },
  {
    id: 'ord-1007',
    userId: 'user-2',
    items: [
      { bookId: 'book-2', title: 'Bumi Manusia', price: 135000, quantity: 1 }
    ],
    addressId: 'addr-4',
    status: 'cancelled',
    totalPrice: 135000,
    note: 'Salah alamat kirim',
    createdAt: '2026-05-25T11:00:00Z',
    updatedAt: '2026-05-25T13:00:00Z'
  },
  {
    id: 'ord-1008',
    userId: 'user-4',
    items: [
      { bookId: 'book-20', title: 'Kisah 25 Nabi dan Rasul', price: 65000, quantity: 1 },
      { bookId: 'book-21', title: 'Dongeng Nusantara Terpopuler', price: 55000, quantity: 1 }
    ],
    addressId: 'addr-5',
    status: 'delivered',
    totalPrice: 120000,
    note: '',
    createdAt: '2026-05-02T14:00:00Z',
    updatedAt: '2026-05-04T17:30:00Z'
  },
  {
    id: 'ord-1009',
    userId: 'user-5',
    items: [
      { bookId: 'book-16', title: 'Rich Dad Poor Dad', price: 80000, quantity: 2 }
    ],
    addressId: 'addr-7',
    status: 'delivered',
    totalPrice: 160000,
    note: '',
    createdAt: '2026-05-05T10:00:00Z',
    updatedAt: '2026-05-07T14:00:00Z'
  },
  {
    id: 'ord-1010',
    userId: 'user-2',
    items: [
      { bookId: 'book-8', title: 'Sejarah Kecil "Petite Histoire" Indonesia', price: 78000, quantity: 1 },
      { bookId: 'book-9', title: 'Nusantara: Sejarah Indonesia', price: 125000, quantity: 1 }
    ],
    addressId: 'addr-3',
    status: 'delivered',
    totalPrice: 203000,
    note: '',
    createdAt: '2026-05-08T09:00:00Z',
    updatedAt: '2026-05-10T16:00:00Z'
  }
];
