import { Review } from '../models/review.model';

export const REVIEWS_DATA: Review[] = [
  {
    id: 'rev-1',
    userId: 'user-1',
    bookId: 'book-1',
    orderId: 'ord-1001',
    rating: 5,
    comment: 'Buku yang sangat menginspirasi! Kisah perjuangan Lintang dan kawan-kawan membuat saya meneteskan air mata. Sangat direkomendasikan bagi semua kalangan.',
    createdAt: '2026-05-13T10:00:00Z'
  },
  {
    id: 'rev-2',
    userId: 'user-1',
    bookId: 'book-5',
    orderId: 'ord-1001',
    rating: 5,
    comment: 'Luar biasa! Harari berhasil menceritakan sejarah umat manusia dengan cara yang sangat menarik dan mudah dicerna.',
    createdAt: '2026-05-13T10:30:00Z'
  },
  {
    id: 'rev-3',
    userId: 'user-1',
    bookId: 'book-17',
    orderId: 'ord-1002',
    rating: 5,
    comment: 'Buku stoisisme terbaik versi lokal. Penjelasannya sangat membumi dan aplikatif untuk kehidupan sehari-hari.',
    createdAt: '2026-05-18T09:00:00Z'
  },
  {
    id: 'rev-4',
    userId: 'user-2',
    bookId: 'book-18',
    orderId: 'ord-1003',
    rating: 5,
    comment: 'Atomic Habits benar-benar mengubah cara saya memandang kebiasaan kecil. Buku yang wajib dibaca setahun sekali!',
    createdAt: '2026-05-21T10:00:00Z'
  },
  {
    id: 'rev-5',
    userId: 'user-2',
    bookId: 'book-19',
    orderId: 'ord-1003',
    rating: 4,
    comment: 'Buku pengembangan diri dengan gaya bahasa yang blak-blakan. Cukup membuka mata, meskipun ada beberapa bagian yang agak repetitif.',
    createdAt: '2026-05-21T10:15:00Z'
  },
  {
    id: 'rev-6',
    userId: 'user-4',
    bookId: 'book-20',
    orderId: 'ord-1008',
    rating: 5,
    comment: 'Ilustrasinya sangat bagus, anak saya sangat suka membaca kisah nabi di buku ini sebelum tidur.',
    createdAt: '2026-05-05T09:00:00Z'
  },
  {
    id: 'rev-7',
    userId: 'user-5',
    bookId: 'book-16',
    orderId: 'ord-1009',
    rating: 4,
    comment: 'Mengubah pola pikir saya tentang keuangan. Sangat cocok bagi pemula yang ingin belajar kebebasan finansial.',
    createdAt: '2026-05-08T11:00:00Z'
  }
];
