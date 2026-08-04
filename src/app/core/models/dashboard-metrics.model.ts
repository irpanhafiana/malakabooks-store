import { Order } from './order.model';

export interface AdminDashboardDataDto {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  conversionRate: number;
  salesActivity: {
    label: string;
    amount: number;
  }[];
  topCategories: {
    categoryName: string;
    totalSpent: number;
    quantityPurchased: number;
  }[];
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
  recentOrders: Order[];
}
