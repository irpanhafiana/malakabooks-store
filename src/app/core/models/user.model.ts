import { Address } from './address.model';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  token?: string;
  phone?: string;
  avatar?: string;
  joinedAt: string;
  addresses: Address[];
}

export interface RegisterPayload {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  email: string;
  password: string;
}
