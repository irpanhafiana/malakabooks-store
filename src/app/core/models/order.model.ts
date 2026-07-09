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
  paymentMethod: string;
  paymentDetails?: {
    cardLast4?: string;
    bankName?: string;
    walletType?: string;
  };
  paymentFee?: number;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  orderDate: string;
  trackingNumber?: string;
  paymentUrl?: string;
  shippingCourier?: string;
  shippingType?: string;
  shippingEst?: string;
}

export interface OrderItemDto {
  bookId: string;
  title: string;
  price: number;
  coverImage?: string;
  quantity: number;
}

export interface OrderDto {
  id: string;
  userId: string;
  items: OrderItemDto[];
}
