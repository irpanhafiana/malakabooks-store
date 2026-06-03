import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { BookService } from '../../../core/services/book.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { ButtonComponent } from '../../../shared/components/button/button';

import { ViewportService } from '../../../core/services/viewport.service';
import { CartDesktopComponent } from './cart-desktop';
import { CartMobileComponent } from './cart-mobile';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    CartDesktopComponent,
    CartMobileComponent
  ],
  templateUrl: './cart.html'
})
export class CartPage {
  protected readonly viewport = inject(ViewportService);
  private readonly cartService = inject(CartService);
  private readonly bookService = inject(BookService);
  private readonly toastService = inject(ToastService);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly totalWeight = this.cartService.totalWeight;
  readonly totalCount = this.cartService.totalItemsCount;

  // computed signal to resolve cart item book details dynamically
  readonly cartItems = computed(() => {
    const list = this.items();
    const books = this.bookService.booksSignal();
    
    return list.map((item) => {
      const book = books.find((b) => b.id === item.bookId);
      return {
        id: item.bookId,
        quantity: item.quantity,
        title: book ? book.title : 'Buku Tidak Diketahui',
        author: book ? book.author : '',
        coverImage: book ? book.coverImage : '',
        price: book ? book.price : 0,
        stock: book ? book.stock : 0
      };
    });
  });

  incrementQty(bookId: string, currentQty: number, stock: number) {
    if (currentQty < stock) {
      this.cartService.updateQuantity(bookId, currentQty + 1);
    } else {
      this.toastService.showError('Maksimum stok tercapai.');
    }
  }

  decrementQty(bookId: string, currentQty: number) {
    if (currentQty > 1) {
      this.cartService.updateQuantity(bookId, currentQty - 1);
    }
  }

  onRemoveItem(bookId: string, title: string) {
    this.cartService.removeItem(bookId);
    this.toastService.showSuccess(`"${title}" telah dihapus dari keranjang.`);
  }
}
