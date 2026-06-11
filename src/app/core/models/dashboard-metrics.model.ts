import { Order } from './order.model';

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
