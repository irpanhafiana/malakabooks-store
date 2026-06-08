import { Injectable, inject, signal, computed } from '@angular/core';
import { WishlistItem, Product } from '../core/models';
import { ToastService } from '../core/services/toast.service';

interface UserState {
  wishlist: WishlistItem[];
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private readonly toastService = inject(ToastService);

  private readonly state = signal<UserState>({
    wishlist: [],
    loading: false
  });

  // Selectors
  readonly wishlist = computed(() => this.state().wishlist);
  readonly loading = computed(() => this.state().loading);
  readonly wishlistCount = computed(() => this.state().wishlist.length);
  readonly wishlistProductIds = computed(() => this.wishlist().map(w => w.product.id));

  constructor() {
    this.loadWishlist();
  }

  private loadWishlist() {
    const saved = localStorage.getItem('malakabooks_wishlist');
    if (saved) {
      try {
        const wishlist = JSON.parse(saved);
        this.state.update(s => ({ ...s, wishlist }));
      } catch (e) {
        localStorage.removeItem('malakabooks_wishlist');
      }
    }
  }

  private saveWishlist(wishlist: WishlistItem[]) {
    localStorage.setItem('malakabooks_wishlist', JSON.stringify(wishlist));
    this.state.update(s => ({ ...s, wishlist }));
  }

  toggleWishlist(product: Product) {
    const list = [...this.wishlist()];
    const index = list.findIndex(item => item.product.id === product.id);

    if (index >= 0) {
      list.splice(index, 1);
      this.saveWishlist(list);
      this.toastService.info(`Removed "${product.name}" from wishlist.`);
    } else {
      list.push({ product, addedAt: new Date().toISOString() });
      this.saveWishlist(list);
      this.toastService.success(`Added "${product.name}" to wishlist.`);
    }
  }

  isWishlisted(productId: string): boolean {
    return this.wishlistProductIds().includes(productId);
  }
}
