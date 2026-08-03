import { Component, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { CartStore } from '../../../store/cart.store';
import { ProductStore } from '../../../store/product.store';
import { PricingApiService } from '../../../core/services/pricing-api.service';
import { QuantitySelectorComponent } from '../quantity-selector/quantity-selector.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qty-modal-content',
  standalone: true,
  imports: [QuantitySelectorComponent],
  templateUrl: './qty-modal-content.component.html',
  styleUrl: './qty-modal-content.component.css'
})
export class QtyModalContentComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly productStore = inject(ProductStore);
  protected readonly pricingApi = inject(PricingApiService);
  private readonly router = inject(Router);

  confirmed = output<boolean>();

  async selectUom(code: string) {
    this.productStore.setQtyUomCode(code);
    const prod = this.productStore.activeProduct();
    if (prod) {
      this.productStore.setIsQtyLookupLoading(true);
      try {
        if (this.authStore.isLoggedIn()) {
          const res = await this.pricingApi.lookupCustomerPrice(prod.id, code);
          if (res) this.productStore.setQtyLookedUpPrice(res.price);
        } else {
          const res = await this.pricingApi.lookupPublicPrice(prod.id, code, prod.customerGroupCode);
          if (res) this.productStore.setQtyLookedUpPrice(res.price);
        }
      } finally {
        this.productStore.setIsQtyLookupLoading(false);
      }
    }
  }

  onQtyChange(newQty: number) {
    this.productStore.setQtyQuantity(newQty);
  }

  confirmAddToCart() {
    const prod = this.productStore.activeProduct();
    const qty = this.productStore.qtyQuantity();
    const action = this.productStore.qtyAction();
    const uom = this.productStore.qtyUomCode();
    const price = this.productStore.qtyLookedUpPrice();

    if (prod) {
      this.cartStore.addItem(prod, qty, uom || undefined, price || undefined);
      if (action === 'buy') {
        this.router.navigate(['/checkout']);
      }
    }
    this.confirmed.emit(true);
  }
}
