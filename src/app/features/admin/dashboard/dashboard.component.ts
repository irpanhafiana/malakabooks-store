import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { DashboardMetrics } from '../../../core/models';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { AdminButtonComponent } from '../../../shared/ui/admin-button/admin-button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, StatusBadgeComponent, DatePipe, CurrencyPipe, AdminButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  metrics = signal<DashboardMetrics | null>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  // Computes chart spacing coordinates
  chartPoints = computed(() => {
    const data = this.metrics();
    if (!data || data.salesHistory.length === 0) return [];
    
    const width = 1000;
    const height = 200;
    const padding = 15;
    
    const xSpacing = (width - padding * 2) / (data.salesHistory.length - 1);
    const yMax = Math.max(...data.salesHistory.map(s => s.amount)) || 100;
    const graphHeight = height - padding * 2;

    return data.salesHistory.map((s, idx) => ({
      x: padding + idx * xSpacing,
      y: height - padding - (s.amount / yMax) * graphHeight
    }));
  });

  // Polyline coordinates for standard line
  svgLinePath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  });

  // Polyline coordinates closed for gradient fill area
  svgAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `M ${first.x} 185 L ${pts.map(p => `${p.x} ${p.y}`).join(' L ')} L ${last.x} 185 Z`;
  });

  ngOnInit() {
    this.loading.set(false);
    this.metrics.set({
      totalRevenue: 24500.50,
      revenueGrowth: 12.5,
      totalOrders: 154,
      ordersGrowth: 8.2,
      totalCustomers: 89,
      customersGrowth: 5.4,
      conversionRate: 3.2,
      conversionGrowth: 1.1,
      salesHistory: [
        { date: 'Mon', amount: 1200, orders: 15 },
        { date: 'Tue', amount: 2100, orders: 24 },
        { date: 'Wed', amount: 1800, orders: 20 },
        { date: 'Thu', amount: 3200, orders: 35 },
        { date: 'Fri', amount: 2800, orders: 30 },
        { date: 'Sat', amount: 4500, orders: 50 },
        { date: 'Sun', amount: 3900, orders: 42 },
      ],
      categorySales: [
        { category: 'Fiction', amount: 8500 },
        { category: 'Non-Fiction', amount: 6200 },
        { category: 'Science', amount: 4800 },
        { category: 'Children', amount: 3100 },
        { category: 'Biography', amount: 1900 },
      ],
      recentOrders: [
        { id: 'ORD-7291', userName: 'Alex Johnson', userEmail: 'alex.j@example.com', orderDate: new Date('2026-06-28T14:30:00').toISOString(), status: 'completed', total: 145.90 },
        { id: 'ORD-7290', userName: 'Sarah Williams', userEmail: 'sarah.w@example.com', orderDate: new Date('2026-06-28T11:15:00').toISOString(), status: 'processing', total: 89.50 },
        { id: 'ORD-7289', userName: 'Michael Chen', userEmail: 'm.chen@example.com', orderDate: new Date('2026-06-27T09:45:00').toISOString(), status: 'shipped', total: 210.00 },
        { id: 'ORD-7288', userName: 'Emily Davis', userEmail: 'emily.d@example.com', orderDate: new Date('2026-06-26T16:20:00').toISOString(), status: 'pending', total: 45.00 },
        { id: 'ORD-7287', userName: 'James Wilson', userEmail: 'j.wilson@example.com', orderDate: new Date('2026-06-26T10:05:00').toISOString(), status: 'completed', total: 320.75 },
      ] as any[]
    });
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const data = await this.dashboardApi.getDashboardMetrics();
      this.metrics.set(data);
    } catch (e) {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  categoryPercentage(amount: number): number {
    const data = this.metrics();
    if (!data) return 0;
    const total = data.categorySales.reduce((sum, c) => sum + c.amount, 0);
    return total > 0 ? (amount / total) * 100 : 0;
  }

  statusVariant(status: string): any {
    if (status === 'completed') return 'success';
    if (status === 'shipped') return 'accent';
    if (status === 'processing') return 'info';
    if (status === 'pending') return 'warning';
    return 'danger';
  }
}
