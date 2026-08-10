import { Injectable, computed, signal, effect, inject } from '@angular/core';
import { Product } from '../core/models/product.model';
import { KatalogToastService } from '../core/services/katalog-toast.service';

export interface KatalogCartItem {
  id: string;
  name: string;
  price: number;
  uom: string;
  category: string;
  image: string;
  description?: string;
  quantity: number;
  uomOptions?: string[];
  itemGroupCode?: string;
  isRokok?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class KatalogCartStore {
  private _cartItems = signal<KatalogCartItem[]>([]);
  private toastService = inject(KatalogToastService);

  cartItems = computed(() => this._cartItems());
  totalItemsCount = computed(() => this._cartItems().reduce((acc, item) => acc + item.quantity, 0));
  totalAmount = computed(() => this._cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0));

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedItems = localStorage.getItem('mk_katalog_cart');
      if (savedItems) {
        try {
          this._cartItems.set(JSON.parse(savedItems));
        } catch {
          this._cartItems.set([]);
        }
      }
    }

    effect(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mk_katalog_cart', JSON.stringify(this._cartItems()));
      }
    });
  }

  addToCart(product: Product, quantity = 1, selectedUom?: string, overridePrice?: number) {
    const currentItems = this._cartItems();
    const targetUom = selectedUom || product.salesUomCode || product.baseUomCode || 'PCS';
    const finalPrice = overridePrice !== undefined ? overridePrice : product.price;
    const existingItemIndex = currentItems.findIndex(item => item.id === product.id && item.uom === targetUom);

    const productName = product.title || (product as unknown as Record<string, unknown>)['name'] as string || product.id;
    const productImage = product.coverImage || (product as unknown as Record<string, unknown>)['image'] as string || 'https://placehold.co/400x400';
    const categoryName = product.categoryName || (product as unknown as Record<string, unknown>)['category'] as string || 'Umum';

    if (existingItemIndex > -1) {
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        price: finalPrice,
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      this._cartItems.set(updatedItems);
    } else {
      const newItem: KatalogCartItem = {
        id: product.id,
        name: productName,
        price: finalPrice,
        uom: targetUom,
        category: categoryName,
        image: productImage,
        description: product.description,
        quantity
      };
      this._cartItems.set([...currentItems, newItem]);
    }

    this.toastService.success(
      'Berhasil ditambahkan',
      `${productName} (${targetUom}) masuk ke keranjang`
    );
  }

  updateQuantity(productId: string, uom: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId, uom);
      return;
    }

    const updatedItems = this._cartItems().map(item =>
      (item.id === productId && item.uom === uom) ? { ...item, quantity } : item
    );
    this._cartItems.set(updatedItems);
  }

  updatePrice(productId: string, uom: string, price: number) {
    const updatedItems = this._cartItems().map(item =>
      (item.id === productId && item.uom === uom) ? { ...item, price } : item
    );
    this._cartItems.set(updatedItems);
  }

  removeFromCart(productId: string, uom: string) {
    this._cartItems.update(items => items.filter(item => !(item.id === productId && item.uom === uom)));
  }

  clearCart() {
    this._cartItems.set([]);
  }
}
