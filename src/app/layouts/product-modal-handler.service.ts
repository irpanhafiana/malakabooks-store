import { Injectable, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../store/auth.store';
import { CartStore } from '../store/cart.store';
import { ProductStore } from '../store/product.store';
import { PricingApiService } from '../core/services/pricing-api.service';

@Injectable({
  providedIn: 'root'
})
export class ProductModalHandler {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly productStore = inject(ProductStore);
  protected readonly pricingApi = inject(PricingApiService);
  private readonly router = inject(Router);

  readonly isDetailOpen = signal<boolean>(false);
  readonly selectedDetailId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.productStore.selectedProductId();
      if (id) {
        this.selectedDetailId.set(id);
        this.isDetailOpen.set(true);
      } else {
        this.isDetailOpen.set(false);
        setTimeout(() => {
          this.selectedDetailId.set(null);
        }, 300);
      }
    });

    effect(() => {
      const isOpen = this.productStore.isQtyModalOpen();
      const prod = this.productStore.activeProduct();
      if (isOpen && prod) {
        const initialUom = prod.baseUomCode || (prod.uomGroup?.details?.[0]?.code) || null;
        this.productStore.setQtyUomCode(initialUom);
        this.productStore.setQtyLookedUpPrice(prod.price);

        if (initialUom) {
          this.lookupPrice(prod.id, initialUom);
        }
      }
    });
  }

  async lookupPrice(itemId: string, uomCode: string) {
    this.productStore.setIsQtyLookupLoading(true);
    try {
      if (this.authStore.isLoggedIn()) {
        const res = await this.pricingApi.lookupCustomerPrice(itemId, uomCode);
        if (res) this.productStore.setQtyLookedUpPrice(res.price);
      } else {
        const prod = this.productStore.activeProduct();
        const res = await this.pricingApi.lookupPublicPrice(itemId, uomCode, prod?.customerGroupCode);
        if (res) this.productStore.setQtyLookedUpPrice(res.price);
      }
    } finally {
      this.productStore.setIsQtyLookupLoading(false);
    }
  }

  selectUom(code: string) {
    this.productStore.setQtyUomCode(code);
    const prod = this.productStore.activeProduct();
    if (prod) {
      this.lookupPrice(prod.id, code);
    }
  }

  closeProductDetails() {
    this.productStore.setSelectedProductId(null);
  }

  closeQty(fromConfirm = false) {
    this.productStore.setQtyModalOpen(false);

    if (!fromConfirm || this.productStore.qtyAction() === 'cart') {
      if (this.productStore.reopenDetailOnQtyClose()) {
        const activeProd = this.productStore.activeProduct();
        if (activeProd) {
          this.productStore.setSelectedProductId(activeProd.id);
        }
      }
    }
    this.productStore.setReopenDetailOnQtyClose(false);
  }

  onQtyChange(newQty: number) {
    this.productStore.setQtyQuantity(newQty);
  }

  confirmAddToCart() {
    if (!this.authStore.isLoggedIn()) {
      this.closeQty(true);
      this.closeProductDetails();
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
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
    this.closeQty(true);
  }
}
