export interface RegisterPayload {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  email: string;
  password: string;
}

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

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  featured: boolean;
  brand: string;
  specifications: Record<string, string>;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

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

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Complaint {
  id: string;
  userId: string;
  orderId: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintPayload {
  userId: string;
  orderId: string;
  subject: string;
  description: string;
}

export interface RespondComplaintPayload {
  status: ComplaintStatus;
  adminResponse: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  salesHistory: { date: string; amount: number; orders: number }[];
  categorySales: { category: string; amount: number }[];
}
