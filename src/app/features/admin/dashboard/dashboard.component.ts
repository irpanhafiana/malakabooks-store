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

  hoveredPoint = signal<{ x: number; y: number; label: string; amount: number } | null>(null);

  // Computes chart spacing coordinates
  chartPoints = computed(() => {
    const data = this.metrics();
    if (!data || data.salesHistory.length === 0) return [];

    const width = 1000;
    const height = 200;
    const padding = 25;

    const xSpacing = (width - padding * 2) / Math.max(1, data.salesHistory.length - 1);
    const yMax = Math.max(...data.salesHistory.map(s => s.amount)) || 100;
    const graphHeight = height - padding * 2;

    return data.salesHistory.map((s, idx) => ({
      x: padding + idx * xSpacing,
      y: height - padding - (s.amount / yMax) * graphHeight,
      label: s.date,
      amount: s.amount
    }));
  });

  setHoveredPoint(pt: { x: number; y: number; label: string; amount: number }) {
    this.hoveredPoint.set(pt);
  }

  clearHoveredPoint() {
    this.hoveredPoint.set(null);
  }

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
      const data = await this.dashboardApi.getDashboardMetrics();
      this.metrics.set(data);
    } catch {
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
