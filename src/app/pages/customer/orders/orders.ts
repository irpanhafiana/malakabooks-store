import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.model';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

import { ViewportService } from '../../../core/services/viewport.service';
import { OrdersDesktopComponent } from './orders-desktop';
import { OrdersMobileComponent } from './orders-mobile';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    OrdersDesktopComponent,
    OrdersMobileComponent
  ],
  templateUrl: './orders.html'
})
export class OrdersPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);

  orders = signal<Order[]>([]);
  filteredOrders = signal<Order[]>([]);
  isLoading = signal(true);
  activeStatus = signal<string>('all');

  readonly statusTabs = [
    { label: 'Semua Pesanan', status: 'all' },
    { label: 'Menunggu', status: 'pending' },
    { label: 'Diproses', status: 'processing' },
    { label: 'Dikirim', status: 'shipped' },
    { label: 'Selesai', status: 'delivered' },
    { label: 'Batal', status: 'cancelled' }
  ];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    const user = this.authService.currentUser();
    if (user) {
      this.orderService.getByUser(user.id).subscribe((list) => {
        this.orders.set(list);
        this.applyFilter();
        this.isLoading.set(false);
      });
    }
  }

  onFilterSelect(status: string) {
    this.activeStatus.set(status);
    this.applyFilter();
  }

  applyFilter() {
    const status = this.activeStatus();
    if (status === 'all') {
      this.filteredOrders.set(this.orders());
    } else {
      const filtered = this.orders().filter((o) => o.status === status);
      this.filteredOrders.set(filtered);
    }
  }

  getStatusText(status: Order['status']): string {
    const mappings: Record<Order['status'], string> = {
      pending: 'Menunggu',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Selesai',
      cancelled: 'Batal'
    };
    return mappings[status] || status;
  }
}
