import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PosCardComponent } from '../../../ui/pos-card/pos-card.component';
import { PosButtonComponent } from '../../../ui/pos-button/pos-button.component';
import { PosProduct, PosCustomer } from '../../../../../../core/models/pos.model';
import { NonRokokStats } from '../../../../../../core/services/transaction-validation.service';

@Component({
  selector: 'app-transaction-cart-table',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, PosCardComponent, PosButtonComponent],
  templateUrl: './transaction-cart-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'flex-1 overflow-hidden flex flex-col min-h-0 block h-full' }
})
export class TransactionCartTableComponent {
  activeRows = input<any[]>([]);
  activeProducts = input<(PosProduct & { rowId: string })[]>([]);
  uomColumns = input<{ label: string; level: number }[]>([]);
  inputState = input<Record<string, Record<string, number>>>({});
  unitPrices = input<Record<string, Record<string, number>>>({});
  itemReadyState = input<Record<string, boolean>>({});
  loadedSalesOrder = input<any>(null);
  canTunda = input<boolean>(false);
  nonRokokStats = input<NonRokokStats>({ total: 0, nonRokokTotal: 0, current: 100, required: 0, isViolated: false });
  isNonRokokBypassed = input<boolean>(false);
  totalBayar = input<number>(0);
  customerData = input<PosCustomer | null>(null);
  customerPoints = input<number>(0);

  tundaLagi = output<void>();
  executeTunda = output<void>();
  resetTransaksi = output<void>();
  toggleItemReady = output<string>();
  updateInputState = output<{ rowId: string; uom: string; value: any }>();
  removeProduct = output<string>();
  requestNonRokokBypass = output<void>();
  openPaymentModal = output<void>();
  focusSearch = output<Event>();

  /** Mencocokkan kolom EXTRA/BESAR/SEDANG/KECIL ke UoM produk lewat `package`. */
  getUomByLevel(product: PosProduct, level: number) {
    return product.uomDetails?.find(d => d.package === level);
  }
}
