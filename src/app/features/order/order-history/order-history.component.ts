import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { AuthStore } from '../../../store/auth.store';
import { OrderStore } from '../../../store/order.store';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [RouterLink, BadgeComponent, PriceComponent, IconComponent, EmptyStateComponent, SkeletonComponent, DatePipe, UpperCasePipe],
  template: `
    <div class="animate-fade-in pb-12">
      <h1 class="font-display font-extrabold text-slate-800 text-xl md:text-2xl mb-6">Order History</h1>

      @if (orderStore.loading()) {
        <div class="flex flex-col gap-4">
          <app-skeleton type="table-row" [count]="3"></app-skeleton>
        </div>
      } @else if (orderStore.orders().length === 0) {
        <app-empty-state
          icon="shopping-bag"
          title="No Orders Found"
          description="You haven't placed any orders yet. Once you complete a purchase, your order information will appear here."
          actionText="Start Shopping"
          routerLink="/product"
        ></app-empty-state>
      } @else {
        <div class="flex flex-col gap-6">
          @for (order of orderStore.orders(); track order.id) {
            <div class="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
              <!-- Order Header -->
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col text-xs leading-tight">
                    <span class="font-semibold text-slate-400">Order ID</span>
                    <strong class="font-bold text-slate-800">#{{ order.id }}</strong>
                  </div>
                  <div class="h-6 w-px bg-slate-200"></div>
                  <div class="flex flex-col text-xs leading-tight">
                    <span class="font-semibold text-slate-400">Date Placed</span>
                    <span class="text-slate-600 font-bold">{{ order.orderDate | date: 'mediumDate' }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <app-badge [variant]="statusVariant(order.status)">
                    {{ order.status | uppercase }}
                  </app-badge>
                </div>
              </div>

              <!-- Order Items List -->
              <div class="flex flex-col gap-3">
                @for (item of order.items; track item.product.id) {
                  <div class="flex items-center gap-4 text-xs">
                    <div class="h-12 w-10 bg-slate-50 border border-slate-100 rounded overflow-hidden flex-shrink-0">
                      <img [src]="item.product.images[0]" class="h-full w-full object-cover" />
                    </div>
                    <div class="flex-grow min-w-0">
                      <h4 class="font-bold text-slate-800 truncate">{{ item.product.name }}</h4>
                      <span class="text-slate-400">Quantity: {{ item.quantity }} × $ {{ item.product.price }}</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Order Footer details (Tracking, Summary) -->
              <div class="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-slate-100/50 text-xs">
                @if (order.trackingNumber && order.status !== 'pending' && order.status !== 'cancelled') {
                  <div class="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <app-icon name="truck" size="16" class="text-slate-400"></app-icon>
                    <span>Courier Tracking: <strong class="text-slate-700 font-bold select-all">{{ order.trackingNumber }}</strong></span>
                  </div>
                } @else {
                  <div></div>
                }

                <div class="flex items-center gap-1.5 font-bold text-slate-800">
                  <span>Total Paid:</span>
                  <app-price [value]="order.total" size="md" class="text-primary-600"></app-price>
                </div>
              </div>

            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrderHistoryComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly router = inject(Router);

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.orderStore.loadUserOrders(user.id);
  }

  statusVariant(status: string): any {
    if (status === 'completed') return 'success';
    if (status === 'shipped') return 'accent';
    if (status === 'processing') return 'info';
    if (status === 'pending') return 'warning';
    return 'danger';
  }
}
