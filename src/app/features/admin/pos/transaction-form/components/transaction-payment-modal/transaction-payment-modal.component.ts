import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PosButtonComponent } from '../../../ui/pos-button/pos-button.component';
import { PosInputComponent } from '../../../ui/pos-input/pos-input.component';

@Component({
  selector: 'app-transaction-payment-modal',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, PosButtonComponent, PosInputComponent],
  templateUrl: './transaction-payment-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionPaymentModalComponent {
  isOpen = input<boolean>(false);
  uangDiterima = input<number>(0);
  remarks = input<string>('');
  subtotal = input<number>(0);
  totalBayar = input<number>(0);
  kembalian = input<number>(0);
  customerPoints = input<number>(0);
  canProcess = input<boolean>(false);

  closeModal = output<void>();
  uangDiterimaInput = output<any>();
  remarksChange = output<string>();
  executePembayaran = output<'checkout' | 'simpan'>();

  /** Pemisah ribuan bertitik; 0 ditampilkan kosong agar placeholder terlihat. */
  formatNumber(val: number): string {
    if (val === 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
