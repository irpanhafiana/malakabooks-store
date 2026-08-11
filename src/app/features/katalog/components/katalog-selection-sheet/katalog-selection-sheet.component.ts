import { Component, input, output, signal, OnInit, OnDestroy, inject, effect, untracked, computed, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Product } from '../../../../core/models/product.model';
import { PricingApiService } from '../../../../core/services/pricing-api.service';
import { KatalogQuantitySelectorComponent } from '../katalog-quantity-selector/katalog-quantity-selector.component';

@Component({
  selector: 'app-katalog-selection-sheet',
  standalone: true,
  imports: [CurrencyPipe, NgOptimizedImage, KatalogQuantitySelectorComponent],
  templateUrl: './katalog-selection-sheet.component.html',
  host: {
    'class': 'contents'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogSelectionSheetComponent implements OnInit, OnDestroy {
  product = input<Product | null>(null);
  sheetClose = output<void>();
  confirm = output<{ uom: string, quantity: number, price: number }>();

  private pricingApi = inject(PricingApiService);

  isVisible = signal<boolean>(false);
  selectedUom = signal<string>('');
  quantity = signal<number>(1);
  currentPrice = signal<number>(0);
  isPriceLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const p = this.product();
      const uom = this.selectedUom();

      if (p && uom) {
        untracked(() => {
          this.fetchPrice(p.id, uom);
        });
      }
    });

    effect(() => {
      const p = this.product();
      if (p) {
        untracked(() => {
          const opts = this.uomOptions();
          if (opts.length > 0) {
            this.selectedUom.set(opts[0]);
          } else {
            this.selectedUom.set(p.salesUomCode || p.baseUomCode || 'PCS');
          }

          this.currentPrice.set(p.price || 0);
          this.quantity.set(1);
        });
      }
    });
  }

  uomOptions = computed(() => {
    const p = this.product();
    if (!p) return [];
    if (p.uomGroup && p.uomGroup.details && p.uomGroup.details.length > 0) {
      return p.uomGroup.details.map(d => d.code);
    }
    return [p.salesUomCode || p.baseUomCode || 'PCS'];
  });

  private fetchPrice(productId: string, uom: string) {
    this.isPriceLoading.set(true);
    this.pricingApi.lookupPublicPrice(productId, uom).then(res => {
      if (res && res.price) {
        this.currentPrice.set(res.price);
      } else {
        const p = this.product();
        if (p) this.currentPrice.set(p.price || 0);
      }
      this.isPriceLoading.set(false);
    }).catch(() => {
      const p = this.product();
      if (p) this.currentPrice.set(p.price || 0);
      this.isPriceLoading.set(false);
    });
  }

  ngOnInit() {
    setTimeout(() => this.isVisible.set(true), 10);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  initiateClose() {
    this.isVisible.set(false);
    setTimeout(() => this.sheetClose.emit(), 200);
  }

  onConfirm() {
    this.confirm.emit({
      uom: this.selectedUom(),
      quantity: this.quantity(),
      price: this.currentPrice()
    });
    this.initiateClose();
  }
}
