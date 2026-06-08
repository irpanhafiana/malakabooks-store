import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { OrderStore } from '../../../store/order.store';
import { Order, OrderStatus } from '../../../core/models';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { PriceComponent } from '../../../shared/ui/price/price.component';

@Component({
  selector: 'app-orders-crud',
  standalone: true,
  imports: [TableComponent, BadgeComponent, PriceComponent, DatePipe, UpperCasePipe],
  template: `
    <div class="animate-fade-in flex flex-col gap-6">
      
      <!-- Top Header Action bar -->
      <div class="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
        <h2 class="font-display font-bold text-slate-800 text-sm">Orders Manager</h2>
        <span class="text-xs text-slate-400 font-semibold">Total Orders: {{ orderStore.orders().length }}</span>
      </div>

      <!-- Data Table -->
      @if (orderStore.loading()) {
        <div class="p-8 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100 shadow-xs">Loading orders...</div>
      } @else {
        <app-table>
          <tr table-headers>
            <th class="px-5 py-3">Order ID</th>
            <th class="px-5 py-3">Customer</th>
            <th class="px-5 py-3">Date</th>
            <th class="px-5 py-3">Items</th>
            <th class="px-5 py-3">Total</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3 text-right">Update Status</th>
          </tr>

          <ng-container table-rows>
            @for (order of orderStore.orders(); track order.id) {
              <tr class="hover:bg-slate-50/30 text-xs">
                <td class="px-5 py-4 font-bold text-slate-800">#{{ order.id }}</td>
                <td class="px-5 py-4">
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-800">{{ order.userName }}</span>
                    <span class="text-[10px] text-slate-400">{{ order.userEmail }}</span>
                  </div>
                </td>
                <td class="px-5 py-4">{{ order.orderDate | date: 'mediumDate' }}</td>
                <td class="px-5 py-4 font-semibold text-slate-600">{{ order.items.length }} items</td>
                <td class="px-5 py-4 font-bold text-slate-800">
                  <app-price [value]="order.total" size="sm"></app-price>
                </td>
                <td class="px-5 py-4">
                  <app-badge [variant]="statusVariant(order.status)">
                    {{ order.status | uppercase }}
                  </app-badge>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="relative inline-flex items-center justify-end">
                    <select
                      [value]="order.status"
                      (change)="onStatusChange(order.id, $any($event.target).value)"
                      class="border border-slate-200 bg-white text-slate-700 font-semibold py-1.5 px-3 pr-7 rounded-xl focus:outline-none focus:border-primary-500 appearance-none text-[10px] cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div class="absolute right-2.5 pointer-events-none text-slate-400 flex items-center">
                      <i class="bx bx-chevron-down text-[12px]"></i>
                    </div>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="p-8 text-center text-slate-400">No orders logged yet.</td>
              </tr>
            }
          </ng-container>
        </app-table>
      }

    </div>
  `
})
export class OrdersCrudComponent implements OnInit {
  protected readonly orderStore = inject(OrderStore);

  ngOnInit() {
    this.orderStore.loadAllOrders();
  }

  onStatusChange(orderId: string, status: string) {
    this.orderStore.updateOrderStatus(orderId, status as OrderStatus);
  }

  statusVariant(status: string): any {
    if (status === 'completed') return 'success';
    if (status === 'shipped') return 'accent';
    if (status === 'processing') return 'info';
    if (status === 'pending') return 'warning';
    return 'danger';
  }
}
