import { CartItem } from './cart-item.model';
import { Address } from './address.model';
import { OrderStatus } from './order-status.model';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: CartItem[];
  shippingAddress: Address;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'e_wallet' | 'cod';
  paymentDetails?: {
    cardLast4?: string;
    bankName?: string;
    walletType?: string;
  };
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  orderDate: string;
  trackingNumber?: string;
}
