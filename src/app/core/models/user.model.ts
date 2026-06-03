export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // plain text (fake, bukan production)
  phone: string;
  avatar: string;
  role: 'customer' | 'admin';
  createdAt: string;
}
