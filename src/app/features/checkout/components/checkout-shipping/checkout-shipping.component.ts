import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from '../../../../shared/ui/select/select.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [ReactiveFormsModule, SelectComponent],
  template: `
    <div class="bg-white border border-slate-100 p-4 rounded-lg">
      <h2 class="font-display font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
        <span class="h-6 w-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">2</span>
        Kurir & Layanan Pengiriman
      </h2>
      <div class="flex flex-col gap-4">
        <app-select label="Pilih Kurir" placeholder="Pilih Kurir" [control]="courierControl()" [options]="courierOptions()"></app-select>

        @if (courierOptions().length > 0 && courierControl().value && courierServicesLength() > 0) {
          <app-select label="Pilih Layanan" placeholder="Pilih Layanan" [control]="courierServiceControl()" [options]="courierServiceOptions()"></app-select>
        } @else if (courierControl().value && shippingLoading()) {
          <div class="text-xs text-slate-500 animate-pulse">Memuat layanan yang tersedia...</div>
        }
      </div>
    </div>
  `
})
export class CheckoutShippingComponent {
  courierControl = input.required<FormControl>();
  courierServiceControl = input.required<FormControl>();
  courierOptions = input<{ value: string; label: string }[]>([]);
  courierServiceOptions = input<{ value: string; label: string }[]>([]);
  courierServicesLength = input<number>(0);
  shippingLoading = input<boolean>(false);
}
