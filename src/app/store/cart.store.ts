import { Injectable, inject, signal, computed } from '@angular/core';
import { CartItem, Product } from '../core/models';
import { CartApiService } from '../core/services/cart-api.service';
import { ToastService } from '../core/services/toast.service';
import { SESSION_CART_KEY } from '../core/auth/session.util';

interface CartState {
  items: CartItem[];
  discountCode: string | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartStore {
  private readonly cartApi = inject(CartApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<CartState>({
    items: [],
    discountCode: null,
    loading: false,
    error: null
  });

  // Selectors
  readonly items = computed(() => this.state().items);
  readonly discountCode = computed(() => this.state().discountCode);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

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
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem('malakabooks_session_user');
    return saved ? JSON.parse(saved)?.id ?? null : null;
  }

  private loadCart() {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem(SESSION_CART_KEY);
    if (saved) {
      try {
        const items: CartItem[] = JSON.parse(saved);
        // Fallback backward compatibility: if any old format is found, clear it
        if (items.some(i => (i as any).bookId || ((i as any).product && !(i.product as any).itemId))) {
          localStorage.removeItem(SESSION_CART_KEY);
          return;
        }
        this.state.update(s => ({ ...s, items }));
      } catch {
        localStorage.removeItem(SESSION_CART_KEY);
      }
    }
  }

  private persistLocal(items: CartItem[]) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_CART_KEY, JSON.stringify(items));
    }
    this.state.update(s => ({ ...s, items }));
  }

  /** Dipanggil setelah login: merge guest cart ke backend lalu sync. */
  async syncOnLogin(userId: string, products: Product[]) {
    const guestItems = [...this.items()];

    // Kirim item guest ke backend
    for (const item of guestItems) {
      await this.cartApi.addCartItem(userId, item.product.id, item.quantity);
    }

    // Ambil cart dari backend sebagai sumber kebenaran
    const backendItems = await this.cartApi.getCart(userId);
    const productMap = new Map(products.map(p => [p.id, p]));

    const merged: CartItem[] = backendItems
      .map(bi => {
        const product = productMap.get(bi.itemId);
        return product ? { product, quantity: bi.quantity } : null;
      })
      .filter((i): i is CartItem => i !== null);

    this.persistLocal(merged);
  }

  /** Dipanggil saat logout: bersihkan cart local. */
  clearOnLogout() {
    this.clearCart();
  }

  async addItem(product: Product, quantity = 1) {
    if (product.stock <= 0) {
      this.toastService.error('Maaf, produk ini kehabisan stok!');
      return;
    }

    const currentItems = [...this.items()];
    const index = currentItems.findIndex(item => item.product.id === product.id);
    let newQty = quantity;

    if (index >= 0) {
      newQty = currentItems[index].quantity + quantity;
      if (newQty > product.stock) {
        this.toastService.error(`Hanya tersisa ${product.stock} barang.`);
        return;
      }
      currentItems[index] = { ...currentItems[index], quantity: newQty };
    } else {
      currentItems.push({ product, quantity });
    }

    this.persistLocal(currentItems);
    this.toastService.success(`"${product.title}" berhasil ditambahkan ke keranjang.`);

    // Sync ke backend
    const userId = this.getCurrentUserId();
    if (userId) {
      this.state.update(s => ({ ...s, loading: true }));
      try {
        await this.cartApi.addCartItem(userId, product.id, index >= 0 ? newQty : quantity);
      } finally {
        this.state.update(s => ({ ...s, loading: false }));
      }
    }
  }

  async removeItem(productId: string) {
    const filtered = this.items().filter(item => item.product.id !== productId);
    this.persistLocal(filtered);
    this.toastService.info('Barang berhasil dihapus dari keranjang.');

    const userId = this.getCurrentUserId();
    if (userId) {
      this.state.update(s => ({ ...s, loading: true }));
      try {
        await this.cartApi.removeCartItem(userId, productId);
      } finally {
        this.state.update(s => ({ ...s, loading: false }));
      }
    }
  }

  async updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      await this.removeItem(productId);
      return;
    }

    const currentItems = [...this.items()];
    const index = currentItems.findIndex(item => item.product.id === productId);
    if (index < 0) return;

    const stock = currentItems[index].product.stock;
    if (quantity > stock) {
      this.toastService.error(`Hanya tersedia ${stock} barang.`);
      return;
    }

    currentItems[index] = { ...currentItems[index], quantity };
    this.persistLocal(currentItems);

    // Re-add dengan quantity baru (backend replace)
    const userId = this.getCurrentUserId();
    if (userId) {
      this.state.update(s => ({ ...s, loading: true }));
      try {
        await this.cartApi.addCartItem(userId, productId, quantity);
      } finally {
        this.state.update(s => ({ ...s, loading: false }));
      }
    }
  }

  applyPromo(code: string): boolean {
    const formattedCode = code.trim().toUpperCase();
    if (formattedCode === 'PROMO10') {
      this.state.update(s => ({ ...s, discountCode: 'PROMO10' }));
      this.toastService.success('Kode Promo 10% berhasil digunakan!');
      return true;
    } else {
      this.toastService.error('Kode promo tidak valid. Coba gunakan "PROMO10".');
      return false;
    }
  }

  clearCart() {
    this.persistLocal([]);
    this.state.update(s => ({ ...s, discountCode: null }));
  }
}
