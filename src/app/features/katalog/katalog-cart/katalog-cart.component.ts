import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { KatalogCartStore, KatalogCartItem } from '../../../store/katalog-cart.store';
import { B2cOrderStore } from '../../../store/b2c-order.store';
import { PricingApiService } from '../../../core/services/pricing-api.service';
import { KatalogToastService } from '../../../core/services/katalog-toast.service';

import { KatalogSelectionSheetComponent } from '../components/katalog-selection-sheet/katalog-selection-sheet.component';
import { KatalogConfirmDialogComponent } from '../components/katalog-confirm-dialog/katalog-confirm-dialog.component';
import { KatalogQuantitySelectorComponent } from '../components/katalog-quantity-selector/katalog-quantity-selector.component';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-katalog-cart',
  standalone: true,
  imports: [
    CurrencyPipe,
    KatalogSelectionSheetComponent,
    NgOptimizedImage,
    KatalogConfirmDialogComponent,
    KatalogQuantitySelectorComponent,
    RouterLink
  ],
  templateUrl: './katalog-cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogCartComponent {
  cartStore = inject(KatalogCartStore);
  b2cOrderStore = inject(B2cOrderStore);
  private pricingApi = inject(PricingApiService);
  private toastService = inject(KatalogToastService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  isProcessing = signal(false);

  // Delete confirmation state
  pendingDelete = signal<{ id: string; uom: string; name: string } | null>(null);
  isDeleteVisible = signal<boolean>(false);

  getDeleteMessageHtml(): string {
    const item = this.pendingDelete();
    return item ? `Yakin ingin menghapus <span class="font-bold text-gray-600">${item.name}</span> dari keranjang?` : '';
  }

  // Bottom Sheet State
  selectedProductForSheet = signal<Product | null>(null);

  // Checkout Validation State
  isCheckoutConfirming = signal(false);
  isCheckoutVisible = signal(false);
  priceChangeItems = signal<{ id: string; name: string; oldPrice: number; newPrice: number; uom: string }[]>([]);
  showPriceChangeModal = signal(false);
  isPriceModalVisible = signal(false);

  requestCheckout() {
    if (this.cartStore.cartItems().length === 0) return;
    
    if (this.b2cOrderStore.lastOrderId()) {
      this.router.navigate(['/katalog/checkout']);
      return;
    }

    this.isCheckoutConfirming.set(true);
    setTimeout(() => this.isCheckoutVisible.set(true), 10);
  }

  cancelCheckout() {
    this.isCheckoutVisible.set(false);
    setTimeout(() => this.isCheckoutConfirming.set(false), 300);
  }

  async startValidation() {
    this.isCheckoutVisible.set(false);
    setTimeout(() => this.isCheckoutConfirming.set(false), 300);
    
    this.isProcessing.set(true);
    const cartItems = this.cartStore.cartItems();
    
    const changes: { id: string; name: string; oldPrice: number; newPrice: number; uom: string }[] = [];

    for (const item of cartItems) {
      try {
        const lookup = await this.pricingApi.lookupPublicPrice(item.id, item.uom);
        const newPrice = (lookup && lookup.price) ? lookup.price : item.price;
        if (newPrice !== item.price) {
          changes.push({
            id: item.id,
            uom: item.uom,
            name: item.name,
            oldPrice: item.price,
            newPrice: newPrice
          });
        }
      } catch {
        // Keep price as is on error
      }
    }

    if (changes.length > 0) {
      this.isProcessing.set(false);
      this.priceChangeItems.set(changes);
      this.showPriceChangeModal.set(true);
      setTimeout(() => this.isPriceModalVisible.set(true), 10);
    } else {
      this.executeCheckout();
    }
  }

  updatePricesAndProceed() {
    const changes = this.priceChangeItems();
    changes.forEach(change => {
      this.cartStore.updatePrice(change.id, change.uom, change.newPrice);
    });
    
    this.isPriceModalVisible.set(false);
    setTimeout(() => {
      this.showPriceChangeModal.set(false);
      this.executeCheckout();
    }, 300);
  }

  dismissPriceModal() {
    this.isPriceModalVisible.set(false);
    setTimeout(() => {
      this.showPriceChangeModal.set(false);
    }, 300);
  }

  private async executeCheckout() {
    this.isProcessing.set(true);

    const items = this.cartStore.cartItems().map(item => ({
      code: item.id,
      name: item.name,
      uom: item.uom,
      quantity: item.quantity,
      price: item.price
    }));

    const userName = (typeof localStorage !== 'undefined' ? localStorage.getItem('mk_katalog_user_name') : '') || 'Pelanggan';

    const payload = [
      {
        "Content": JSON.stringify(items),
        "BranchCode": this.b2cOrderStore.branchCode() || 'HO',
        "MessageType": "B2C_ORDER_CART",
        "MessageStatus": "Initialize",
        "TransactionType": "CREATE",
        "BaseMessageId": 0,
        "isLocked": false,
        "LastUpdatedBy": userName,
        "Id": 0,
        "Remarks": userName,
        "Alias": ""
      }
    ];

    this.b2cOrderStore.postB2COrder(payload).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        if (Array.isArray(res) && res.length > 0) {
          this.b2cOrderStore.setLastOrderId(res[0]);
        } else if (res && typeof res === 'string') {
          this.b2cOrderStore.setLastOrderId(res);
        }
        this.router.navigate(['/katalog/checkout']);
      },
      error: (err) => {
        this.isProcessing.set(false);
        console.error('Checkout error:', err);
        this.toastService.error('Gagal Checkout', 'Terjadi kesalahan. Silakan coba lagi.');
      }
    });
  }

  requestDelete(productId: string, uom: string, name: string) {
    this.pendingDelete.set({ id: productId, uom, name });
    setTimeout(() => this.isDeleteVisible.set(true), 10);
  }

  confirmDelete() {
    const item = this.pendingDelete();
    if (item) {
      this.isDeleteVisible.set(false);
      setTimeout(() => {
        this.cartStore.removeFromCart(item.id, item.uom);
        this.toastService.success('Terhapus', `${item.name} dihapus dari keranjang`);
        this.pendingDelete.set(null);
      }, 300);
    }
  }

  cancelDelete() {
    this.isDeleteVisible.set(false);
    setTimeout(() => {
      this.pendingDelete.set(null);
    }, 300);
  }

  openItemSheet(item: KatalogCartItem) {
    const p: Product = {
      id: item.id,
      title: item.name,
      price: item.price,
      sapCode: '',
      authorIds: [],
      authors: [],
      authorNames: '',
      isbn: '',
      categoryId: '',
      categoryName: item.category,
      description: item.description || '',
      coverImage: item.image,
      publisher: '',
      publishedYear: 0,
      pages: 0,
      weight: 0,
      stock: 999,
      averageRating: 5,
      totalReviews: 0,
      createdAt: '',
      additionalImages: []
    };
    this.selectedProductForSheet.set(p);
  }
}
