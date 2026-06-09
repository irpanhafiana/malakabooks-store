import { Injectable, inject, signal, computed } from '@angular/core';
import { CartItem, Product } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

interface CartState {
  items: CartItem[];
  discountCode: string | null;
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CartStore {
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<CartState>({
    items: [],
    discountCode: null,
    loading: false
  });

  // Selectors
  readonly items = computed(() => this.state().items);
  readonly discountCode = computed(() => this.state().discountCode);
  readonly loading = computed(() => this.state().loading);

  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  );

  readonly discount = computed(() =>
    this.discountCode() === 'PROMO10' ? this.subtotal() * 0.10 : 0
  );

  readonly tax = computed(() => this.subtotal() * 0.10);

  readonly shipping = computed(() => {
    const sub = this.subtotal();
    if (sub === 0 || sub >= 50) return 0;
    return 5.00;
  });

  readonly total = computed(() =>
    Math.max(0, this.subtotal() + this.tax() + this.shipping() - this.discount())
  );

  readonly itemsCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  constructor() {
    this.loadCart();
  }

  private getCurrentUserId(): string | null {
    const saved = localStorage.getItem('malakabooks_session_user');
    return saved ? JSON.parse(saved)?.id ?? null : null;
  }

  private loadCart() {
    const saved = localStorage.getItem('malakabooks_cart');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        this.state.update(s => ({ ...s, items }));
      } catch {
        localStorage.removeItem('malakabooks_cart');
      }
    }
  }

  private persistLocal(items: CartItem[]) {
    localStorage.setItem('malakabooks_cart', JSON.stringify(items));
    this.state.update(s => ({ ...s, items }));
  }

  /** Dipanggil setelah login: merge guest cart ke backend lalu sync. */
  async syncOnLogin(userId: string, products: Product[]) {
    const guestItems = [...this.items()];

    // Kirim item guest ke backend
    for (const item of guestItems) {
      await this.apiService.addCartItem(userId, item.product.id, item.quantity);
    }

    // Ambil cart dari backend sebagai sumber kebenaran
    const backendItems = await this.apiService.getCart(userId);
    const productMap = new Map(products.map(p => [p.id, p]));

    const merged: CartItem[] = backendItems
      .map(bi => {
        const product = productMap.get(bi.bookId);
        return product ? { product, quantity: bi.quantity } : null;
      })
      .filter((i): i is CartItem => i !== null);

    this.persistLocal(merged);
  }

  /** Dipanggil saat logout: bersihkan cart local. */
  clearOnLogout() {
    this.clearCart();
  }

  addItem(product: Product, quantity = 1) {
    if (product.stock <= 0) {
      this.toastService.error('Sorry, this product is out of stock!');
      return;
    }

    const currentItems = [...this.items()];
    const index = currentItems.findIndex(item => item.product.id === product.id);
    let newQty = quantity;

    if (index >= 0) {
      newQty = currentItems[index].quantity + quantity;
      if (newQty > product.stock) {
        this.toastService.error(`Only ${product.stock} items left in stock.`);
        return;
      }
      currentItems[index] = { ...currentItems[index], quantity: newQty };
    } else {
      currentItems.push({ product, quantity });
    }

    this.persistLocal(currentItems);
    this.toastService.success(`Added "${product.name}" to cart.`);

    // Sync ke backend (fire-and-forget)
    const userId = this.getCurrentUserId();
    if (userId) {
      this.apiService.addCartItem(userId, product.id, index >= 0 ? newQty : quantity);
    }
  }

  removeItem(productId: string) {
    const filtered = this.items().filter(item => item.product.id !== productId);
    this.persistLocal(filtered);
    this.toastService.info('Item removed from cart.');

    const userId = this.getCurrentUserId();
    if (userId) {
      this.apiService.removeCartItem(userId, productId);
    }
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const currentItems = [...this.items()];
    const index = currentItems.findIndex(item => item.product.id === productId);
    if (index < 0) return;

    const stock = currentItems[index].product.stock;
    if (quantity > stock) {
      this.toastService.error(`Only ${stock} items available in stock.`);
      return;
    }

    currentItems[index] = { ...currentItems[index], quantity };
    this.persistLocal(currentItems);

    // Re-add dengan quantity baru (backend replace)
    const userId = this.getCurrentUserId();
    if (userId) {
      this.apiService.addCartItem(userId, productId, quantity);
    }
  }

  applyPromo(code: string): boolean {
    const formattedCode = code.trim().toUpperCase();
    if (formattedCode === 'PROMO10') {
      this.state.update(s => ({ ...s, discountCode: 'PROMO10' }));
      this.toastService.success('10% Promo Code applied successfully!');
      return true;
    } else {
      this.toastService.error('Invalid promo code. Try using "PROMO10".');
      return false;
    }
  }

  clearCart() {
    this.persistLocal([]);
    this.state.update(s => ({ ...s, discountCode: null }));
  }
}
