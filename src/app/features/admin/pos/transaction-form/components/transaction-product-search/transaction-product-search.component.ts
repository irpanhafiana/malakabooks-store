import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PosCardComponent } from '../../../ui/pos-card/pos-card.component';
import { PosInputComponent } from '../../../ui/pos-input/pos-input.component';
import { PosButtonComponent } from '../../../ui/pos-button/pos-button.component';
import { PosProduct } from '../../../../../../core/models/pos.model';

/**
 * Dua kolom pencarian produk:
 *  - SIAP (emerald)    : barang yang sudah ada di kasir
 *  - TAMBAHAN (amber)  : barang yang masih harus diambil gudang (picking)
 * Warna keduanya adalah kode semantik operasional, bukan branding — sengaja
 * tidak diubah ke palet malakabooks.
 */
@Component({
  selector: 'app-transaction-product-search',
  standalone: true,
  imports: [FormsModule, PosCardComponent, PosInputComponent, PosButtonComponent],
  templateUrl: './transaction-product-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'flex-1 overflow-hidden flex flex-col min-h-0 block gap-4' }
})
export class TransactionProductSearchComponent {
  showPickingPanel = input<boolean>(false);
  searchQueryReady = input<string>('');
  searchReadyResults = input<PosProduct[]>([]);
  productReadySelectedIndex = input<number>(0);
  searchQueryPicking = input<string>('');
  searchPickingResults = input<PosProduct[]>([]);
  productPickingSelectedIndex = input<number>(0);
  isInitialLoading = input<boolean>(false);

  togglePickingPanel = output<void>();
  importB2C = output<void>();
  searchReadyChange = output<string>();
  searchReadyKeyDown = output<KeyboardEvent>();
  selectReadyItem = output<{ product: PosProduct; query: string }>();
  searchPickingChange = output<string>();
  searchPickingKeyDown = output<KeyboardEvent>();
  selectPickingItem = output<{ product: PosProduct; query: string }>();

  isSearchReadyFocused = signal<boolean>(false);
  isSearchPickingFocused = signal<boolean>(false);

  onSearchReadyBlur() {
    setTimeout(() => this.isSearchReadyFocused.set(false), 200);
  }

  onSearchPickingBlur() {
    setTimeout(() => this.isSearchPickingFocused.set(false), 200);
  }
}
