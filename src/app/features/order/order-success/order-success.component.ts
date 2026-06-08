import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderStore } from '../../../store/order.store';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, ButtonComponent],
  template: `
    <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs text-center animate-fade-in my-2">
      <div class="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
        <app-icon name="check" size="32"></app-icon>
      </div>

      <h1 class="font-display font-extrabold text-slate-800 text-xl md:text-2xl mb-2">Order Confirmed!</h1>
      <p class="text-xs text-slate-500 mb-6 leading-relaxed">Thank you for your purchase. We have received your order and are preparing it for shipment.</p>

      @if (orderStore.currentOrder(); as order) {
        <div class="bg-slate-50 rounded-2xl p-4 text-left text-xs text-slate-600 flex flex-col gap-3.5 mb-8">
          <div class="flex justify-between">
            <span class="font-semibold text-slate-400">Order ID</span>
            <strong class="font-bold text-slate-800">#{{ order.id }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold text-slate-400">Tracking Number</span>
            <strong class="font-bold text-slate-800">{{ order.trackingNumber }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold text-slate-400">Payment Method</span>
            <span class="font-bold text-slate-700 capitalize">{{ order.paymentMethod.replace('_', ' ') }}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-slate-100 font-bold">
            <span class="text-slate-800">Total Paid</span>
            <app-price [value]="order.total" size="md" class="text-primary-600"></app-price>
          </div>
        </div>
      }

      <div class="flex flex-col gap-3">
        <app-button routerLink="/order-history" variant="primary" size="md" [fullWidth]="true">
          View Order History
        </app-button>
        <app-button routerLink="/" variant="outline" size="md" [fullWidth]="true">
          Back to Shop
        </app-button>
      </div>
    </div>
  `
})
export class OrderSuccessComponent {
  protected readonly orderStore = inject(OrderStore);
}
