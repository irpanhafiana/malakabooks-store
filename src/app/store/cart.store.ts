import { Injectable, inject, signal, computed } from '@angular/core';
import { CartItem, Product } from '../core/models';
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
  
  readonly subtotal = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  });

  readonly discount = computed(() => {
    if (this.discountCode() === 'PROMO10') {
      return this.subtotal() * 0.10;
    }
    return 0;
  });

  readonly tax = computed(() => {
    return this.subtotal() * 0.10; // 10% tax
  });

  readonly shipping = computed(() => {
    const sub = this.subtotal();
    if (sub === 0 || sub >= 50) return 0;
    return 5.00; // $5 shipping for orders under $50
  });

  readonly total = computed(() => {
    return Math.max(0, this.subtotal() + this.tax() + this.shipping() - this.discount());
  });

  readonly itemsCount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.quantity, 0);
  });

  constructor() {
    this.loadCart();
  }

  private loadCart() {
    const saved = localStorage.getItem('malakabooks_cart');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        this.state.update(s => ({ ...s, items }));
      } catch (e) {
        localStorage.removeItem('malakabooks_cart');
      }
    }
  }

  private saveCart(items: CartItem[]) {
    localStorage.setItem('malakabooks_cart', JSON.stringify(items));
    this.state.update(s => ({ ...s, items }));
  }

  addItem(product: Product, quantity = 1) {
    if (product.stock <= 0) {
      this.toastService.error('Sorry, this product is out of stock!');
      return;
    }

    const currentItems = [...this.items()];
    const index = currentItems.findIndex(item => item.product.id === product.id);

    if (index >= 0) {
      const newQty = currentItems[index].quantity + quantity;
      if (newQty > product.stock) {
        this.toastService.error(`Only ${product.stock} items left in stock.`);
        return;
      }
      currentItems[index] = {
        ...currentItems[index],
        quantity: newQty
      };
    } else {
      currentItems.push({ product, quantity });
    }

    this.saveCart(currentItems);
    this.toastService.success(`Added "${product.name}" to cart.`);
  }

  removeItem(productId: string) {
    const filtered = this.items().filter(item => item.product.id !== productId);
    this.saveCart(filtered);
    this.toastService.info('Item removed from cart.');
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const currentItems = [...this.items()];
    const index = currentItems.findIndex(item => item.product.id === productId);

    if (index >= 0) {
      const stock = currentItems[index].product.stock;
      if (quantity > stock) {
        this.toastService.error(`Only ${stock} items available in stock.`);
        return;
      }
      currentItems[index] = {
        ...currentItems[index],
        quantity
      };
      this.saveCart(currentItems);
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
    this.saveCart([]);
    this.state.update(s => ({ ...s, discountCode: null }));
  }
}
