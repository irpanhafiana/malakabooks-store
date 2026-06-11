import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { DashboardMetrics } from '../../../core/models';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, BadgeComponent, DatePipe, CurrencyPipe, UpperCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  metrics = signal<DashboardMetrics | null>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  // Computes chart spacing coordinates
  chartPoints = computed(() => {
    const data = this.metrics();
    if (!data || data.salesHistory.length === 0) return [];
    
    const width = 500;
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
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(false);
    try {
      // recentOrders now arrives inside the metrics payload, so the previous
      // second getOrders() round-trip has been removed.
      const data = await this.apiService.getDashboardMetrics();
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
