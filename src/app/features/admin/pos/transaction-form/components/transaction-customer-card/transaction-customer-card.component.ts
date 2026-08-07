import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PosCardComponent } from '../../../ui/pos-card/pos-card.component';
import { PosInputComponent } from '../../../ui/pos-input/pos-input.component';
import { PosButtonComponent } from '../../../ui/pos-button/pos-button.component';
import { PosCustomer } from '../../../../../../core/models/pos.model';

@Component({
  selector: 'app-transaction-customer-card',
  standalone: true,
  imports: [FormsModule, PosCardComponent, PosInputComponent, PosButtonComponent],
  templateUrl: './transaction-customer-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'shrink-0 block relative z-40' }
})
export class TransactionCustomerCardComponent {
  customerData = input<PosCustomer | null>(null);
  customerSearchQuery = input<string>('');
  customerSearchResults = input<PosCustomer[]>([]);
  isCustomerInitialLoading = input<boolean>(false);
  customerSelectedIndex = input<number>(0);
  docDate = input<string>('');
  deliveryDate = input<string>('');
  dueDate = input<string>('');
  creditRestrictionReason = input<string>('');

  searchQueryChange = output<string>();
  searchKeyDown = output<KeyboardEvent>();
  customerSelect = output<PosCustomer>();
  bypassClick = output<void>();

  isCustomerSearchFocused = signal<boolean>(false);

  /** Ditunda agar klik pada hasil dropdown sempat terproses sebelum menutup. */
  onSearchBlur() {
    setTimeout(() => this.isCustomerSearchFocused.set(false), 200);
  }
}
