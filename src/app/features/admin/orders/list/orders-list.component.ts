import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { OrderStore } from '../../../../store/order.store';
import { Order, OrderStatus } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { PriceComponent } from '../../../../shared/ui/price/price.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [TableComponent, BadgeComponent, PriceComponent, DatePipe, UpperCasePipe, PaginationComponent, SpinnerComponent],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.css'
})
export class OrdersListComponent implements OnInit {
  protected readonly orderStore = inject(OrderStore);
  private readonly alertService = inject(AlertService);

  protected readonly pagination = createClientPagination(this.orderStore.orders, 10);

  ngOnInit() {
    this.orderStore.loadAllOrders();
  }

  async onStatusChange(orderId: string, status: string, selectElement: HTMLSelectElement, currentStatus: string) {
    const isConfirmed = await this.alertService.confirm(
      'Ubah Status Pesanan?',
      `Apakah Anda yakin ingin mengubah status pesanan ke ${status.toUpperCase()}?`
    );
    if (isConfirmed) {
      await this.orderStore.updateOrderStatus(orderId, status as OrderStatus);
      this.alertService.success('Berhasil!', 'Status pesanan berhasil diperbarui.');
    } else {
      selectElement.value = currentStatus;
    }
  }

  statusVariant(status: string): any {
    if (status === 'completed') return 'success';
    if (status === 'shipped') return 'accent';
    if (status === 'processing') return 'info';
    if (status === 'pending') return 'warning';
    return 'danger';
  }
}
