import { Injectable, signal, computed, inject } from '@angular/core';
import { CartItem } from '../models/cart.model';
import { BookService } from './book.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'malaka_cart';
  private readonly bookService = inject(BookService);

  private cartItems = signal<CartItem[]>([]);

  constructor() {
    this.initCart();
  }

  private initCart() {
    const stored = localStorage.getItem(this.CART_KEY);
    if (stored) {
      this.cartItems.set(JSON.parse(stored));
    }
  }

  private saveCart(items: CartItem[]) {
    this.cartItems.set(items);
    localStorage.setItem(this.CART_KEY, JSON.stringify(items));
  }

  // Reactive Signals
  readonly items = this.cartItems.asReadonly();

  readonly totalItemsCount = computed(() => {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  });

  readonly subtotal = computed(() => {
    const books = this.bookService.booksSignal();
    return this.cartItems().reduce((total, item) => {
      const book = books.find((b) => b.id === item.bookId);
      return total + (book ? book.price * item.quantity : 0);
    }, 0);
  });

  readonly totalWeight = computed(() => {
    const books = this.bookService.booksSignal();
    return this.cartItems().reduce((total, item) => {
      const book = books.find((b) => b.id === item.bookId);
      return total + (book ? book.weight * item.quantity : 0);
    }, 0);
  });

  // Actions
  addItem(bookId: string, quantity = 1) {
    const items = [...this.cartItems()];
    const index = items.findIndex((item) => item.bookId === bookId);

    // Verify stock
    const book = this.bookService.booksSignal().find((b) => b.id === bookId);
    if (!book) return;

    if (index > -1) {
      const newQty = items[index].quantity + quantity;
      if (newQty <= book.stock) {
        items[index].quantity = newQty;
      } else {
        items[index].quantity = book.stock; // Cap at max stock
      }
    } else {
      if (book.stock > 0) {
        items.push({ bookId, quantity: Math.min(quantity, book.stock) });
      }
    }

    this.saveCart(items);
  }

  updateQuantity(bookId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(bookId);
      return;
    }

    const book = this.bookService.booksSignal().find((b) => b.id === bookId);
    if (!book) return;

    const items = this.cartItems().map((item) => {
      if (item.bookId === bookId) {
        return { ...item, quantity: Math.min(quantity, book.stock) };
      }
      return item;
    });

    this.saveCart(items);
  }

  removeItem(bookId: string) {
    const filtered = this.cartItems().filter((item) => item.bookId !== bookId);
    this.saveCart(filtered);
  }

  clear() {
    this.saveCart([]);
  }
}
