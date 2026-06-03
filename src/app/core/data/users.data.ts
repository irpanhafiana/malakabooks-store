import { User } from '../models/user.model';

export const USERS_DATA: User[] = [
  {
    id: 'user-1',
    name: 'Budi Santoso',
    email: 'budi@gmail.com',
    password: 'password123',
    phone: '081234567890',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    role: 'customer',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'user-2',
    name: 'Siti Rahma',
    email: 'siti@gmail.com',
    password: 'password123',
    phone: '082134567890',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    role: 'customer',
    createdAt: '2026-02-10T14:30:00Z'
  },
  {
    id: 'user-3',
    name: 'Admin Malaka',
    email: 'admin@malakabooks.com',
    password: 'admin123',
    phone: '089999999999',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-4',
    name: 'Ahmad Faisal',
    email: 'ahmad@gmail.com',
    password: 'password123',
    phone: '087712345678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    role: 'customer',
    createdAt: '2026-03-05T09:15:00Z'
  },
  {
    id: 'user-5',
    name: 'Dewi Lestari',
    email: 'dewi@gmail.com',
    password: 'password123',
    phone: '081398765432',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: 'customer',
    createdAt: '2026-04-20T11:45:00Z'
  }
];
