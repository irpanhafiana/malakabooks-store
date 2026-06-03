import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { BookService } from '../../../core/services/book.service';
import { AddressService } from '../../../core/services/address.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Address } from '../../../core/models/address.model';
import { OrderItem } from '../../../core/models/order.model';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { ButtonComponent } from '../../../shared/components/button/button';
import { BadgeComponent } from '../../../shared/components/badge/badge';

import { ViewportService } from '../../../core/services/viewport.service';
import { CheckoutDesktopComponent } from './checkout-desktop';
import { CheckoutMobileComponent } from './checkout-mobile';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    CheckoutDesktopComponent,
    CheckoutMobileComponent
  ],
  templateUrl: './checkout.html'
})
export class CheckoutPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly cartService = inject(CartService);
  private readonly bookService = inject(BookService);
  private readonly addressService = inject(AddressService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  addresses = signal<Address[]>([]);
  selectedAddress = signal<Address | null>(null);
  showAddressList = signal(false);
  
  // Note Model
  note = '';
  isSubmitting = signal(false);

  // Cart getters
  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly totalWeight = this.cartService.totalWeight;

  // computed cart items
  readonly cartItems = computed(() => {
    const list = this.items();
    const books = this.bookService.booksSignal();
    
    return list.map((item) => {
      const book = books.find((b) => b.id === item.bookId);
      return {
        id: item.bookId,
        quantity: item.quantity,
        title: book ? book.title : 'Buku Tidak Diketahui',
        price: book ? book.price : 0
      };
    });
  });

  // Calculate Shipping fee based on weight (Rp 10.000 per 1000g, min Rp 15.000)
  readonly shippingFee = computed(() => {
    if (this.cartItems().length === 0) return 0;
    const grams = this.totalWeight();
    const multiplier = Math.ceil(grams / 1000);
    return Math.max(15000, multiplier * 12000); // 12rb/kg, min 15rb
  });

  readonly grandTotal = computed(() => {
    return this.subtotal() + this.shippingFee();
  });

  ngOnInit() {
    // If cart is empty, redirect user back to catalog
    if (this.items().length === 0) {
      this.toastService.showError('Keranjang belanja Anda kosong.');
      setTimeout(() => this.router.navigate(['/catalog']), 1500);
      return;
    }

    this.loadAddresses();
  }

  loadAddresses() {
    const user = this.authService.currentUser();
    if (user) {
      this.addressService.getByUser(user.id).subscribe((list) => {
        this.addresses.set(list);
        
        // Pick default address if available, else pick first address
        const def = list.find((a) => a.isDefault);
        if (def) {
          this.selectedAddress.set(def);
        } else if (list.length > 0) {
          this.selectedAddress.set(list[0]);
        }
      });
    }
  }

  toggleAddressSelector() {
    this.showAddressList.set(!this.showAddressList());
  }

  onSelectAddress(address: Address) {
    this.selectedAddress.set(address);
    this.showAddressList.set(false);
  }

  onPlaceOrder() {
    const user = this.authService.currentUser();
    const addr = this.selectedAddress();
    
    if (!user || !addr) {
      this.toastService.showError('Pengguna atau alamat tidak valid.');
      return;
    }

    const orderItems: OrderItem[] = this.cartItems().map((item) => ({
      bookId: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity
    }));

    this.isSubmitting.set(true);

    this.orderService
      .createOrder(
        user.id,
        orderItems,
        addr.id,
        this.grandTotal(),
        this.note
      )
      .subscribe({
        next: (order) => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(`Pesanan ${order.id} sukses dibuat!`);
          this.router.navigate(['/account/orders']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.showError(err.message || 'Gagal memproses pesanan.');
        }
      });
  }
}
