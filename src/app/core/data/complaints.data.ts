import { Complaint } from '../models/complaint.model';

export const COMPLAINTS_DATA: Complaint[] = [
  {
    id: 'comp-1',
    userId: 'user-1',
    orderId: 'ord-1001',
    subject: 'Buku Laskar Pelangi Lecet di Ujung',
    description: 'Halo admin, pesanan ord-1001 sudah saya terima. Namun untuk buku Laskar Pelangi, ujung covernya agak lecet dan tertekuk. Kemungkinan karena packaging kurang tebal di bagian pojok. Mohon solusinya.',
    status: 'resolved',
    adminResponse: 'Halo Kak Budi, kami mohon maaf atas ketidaknyamanan tersebut. Kami telah mengirimkan voucher diskon 20% untuk pembelian berikutnya sebagai kompensasi, dan kami pastikan pengemasan berikutnya akan lebih tebal menggunakan bubble wrap tambahan. Terima kasih atas masukannya!',
    createdAt: '2026-05-13T12:00:00Z',
    updatedAt: '2026-05-14T09:00:00Z'
  },
  {
    id: 'comp-2',
    userId: 'user-2',
    orderId: 'ord-1003',
    subject: 'Halaman Buku Atomic Habits Ada yang Kosong',
    description: 'Admin, saya sedang membaca buku Atomic Habits yang saya beli kemarin. Ternyata di halaman 120-135 cetakannya kosong/putih semua. Apakah saya bisa retur buku ini dengan cetakan yang benar?',
    status: 'open',
    adminResponse: '',
    createdAt: '2026-05-22T14:00:00Z',
    updatedAt: '2026-05-22T14:00:00Z'
  }
];
