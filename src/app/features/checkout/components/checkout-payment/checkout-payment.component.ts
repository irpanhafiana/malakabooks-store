import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RadioComponent } from '../../../../shared/ui/radio/radio.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [ReactiveFormsModule, RadioComponent, InputComponent],
  template: `
    <div class="bg-white border border-slate-100 p-4 rounded-lg">
      <h2 class="font-display font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
        <span class="h-6 w-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">3</span>
        Metode Pembayaran
      </h2>

      <app-radio [options]="paymentOptions()" [control]="paymentControl()" direction="col"></app-radio>

      @if (isCreditCardSelected()) {
        <div class="mt-4 p-4 border border-slate-100 bg-slate-50/50 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-3">
            <app-input label="Nomor Kartu" placeholder="xxxx xxxx xxxx 4321" [control]="cardNumControl()"></app-input>
          </div>
          <app-input label="Masa Berlaku" placeholder="MM/YY" [control]="cardExpiryControl()"></app-input>
          <app-input label="CVC" placeholder="xxx" type="password" [control]="cardCvcControl()"></app-input>
        </div>
      }
    </div>
  `
})
export class CheckoutPaymentComponent {
  paymentControl = input.required<FormControl>();
  paymentOptions = input<{ value: string; label: string }[]>([]);
  isCreditCardSelected = input<boolean>(false);
  cardNumControl = input.required<FormControl>();
  cardExpiryControl = input.required<FormControl>();
  cardCvcControl = input.required<FormControl>();
}
