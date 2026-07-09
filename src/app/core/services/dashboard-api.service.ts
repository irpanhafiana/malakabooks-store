import { Injectable, inject } from '@angular/core';
import { DashboardMetrics } from '../models';
import { ProductApiService } from './product-api.service';
import { CategoryApiService } from './category-api.service';
import { OrderApiService } from './order-api.service';
import { UserApiService } from './user-api.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private readonly productApi = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly orderApi = inject(OrderApiService);
  private readonly userApi = inject(UserApiService);

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [products, _categories, orders, users] = await Promise.all([
      this.productApi.getProducts(),
      this.categoryApi.getCategories(),
      this.orderApi.getOrders(),
      this.userApi.getUsers()
    ]);

    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.length;

    const now = new Date();
    const msDay = 86_400_000;
    const last7 = activeOrders.filter(o => now.getTime() - new Date(o.orderDate).getTime() <= 7 * msDay);
    const prev7 = activeOrders.filter(o => {
      const diff = now.getTime() - new Date(o.orderDate).getTime();
      return diff > 7 * msDay && diff <= 14 * msDay;
    });

    const calcGrowth = (curr: number, prev: number) =>
      prev === 0 ? 0 : parseFloat(((curr - prev) / prev * 100).toFixed(1));

    const revenueGrowth = calcGrowth(
      last7.reduce((s, o) => s + o.total, 0),
      prev7.reduce((s, o) => s + o.total, 0)
    );
    const ordersGrowth = calcGrowth(last7.length, prev7.length);

    const salesHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOrders = activeOrders.filter(o =>
        new Date(o.orderDate).toDateString() === d.toDateString()
      );
      salesHistory.push({
        date: dateStr,
        amount: parseFloat(dayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
        orders: dayOrders.length
      });
    }

    const catSalesMap: Record<string, number> = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.product.categoryName || 'Other';
        catSalesMap[cat] = (catSalesMap[cat] || 0) + (item.product.price * item.quantity);
      });
    });
    const categorySales = Object.entries(catSalesMap).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      revenueGrowth,
      totalOrders,
      ordersGrowth,
      totalCustomers,
      customersGrowth: 0,
      conversionRate: totalOrders > 0 && products.length > 0
        ? parseFloat((totalOrders / products.length).toFixed(2))
        : 0,
      conversionGrowth: 0,
      salesHistory,
      categorySales,
      recentOrders: orders.slice(0, 4)
    };
  }
}
