import { Injectable, inject } from '@angular/core';
import { DashboardMetrics, AdminDashboardDataDto, ApiResponse } from '../models';
import { OrderApiService } from './order-api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private readonly orderApi = inject(OrderApiService);
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [response, orders] = await Promise.all([
      firstValueFrom(this.http.get<ApiResponse<AdminDashboardDataDto>>(`${this.BASE_URL}/admin/Dashboard`)).catch(err => {
        this.logger.error('Failed to fetch dashboard metrics:', err);
        return null;
      }),
      this.orderApi.getOrders().catch(() => [])
    ]);

    if (response?.isSuccess && response.data) {
      const data = response.data;
      return {
        totalRevenue: data.totalRevenue || 0,
        revenueGrowth: 0,
        totalOrders: data.totalOrders || 0,
        ordersGrowth: 0,
        totalCustomers: data.activeCustomers || 0,
        customersGrowth: 0,
        conversionRate: data.conversionRate || 0,
        conversionGrowth: 0,
        salesHistory: (data.salesActivity || []).map(s => ({
          date: s.label,
          amount: s.amount,
          orders: 0
        })),
        categorySales: (data.topCategories || []).map(c => ({
          category: c.categoryName,
          amount: c.totalSpent
        })),
        recentOrders: orders.slice(0, 5)
      };
    }

    return {
      totalRevenue: 0,
      revenueGrowth: 0,
      totalOrders: 0,
      ordersGrowth: 0,
      totalCustomers: 0,
      customersGrowth: 0,
      conversionRate: 0,
      conversionGrowth: 0,
      salesHistory: [],
      categorySales: [],
      recentOrders: orders.slice(0, 5)
    };
  }
}
