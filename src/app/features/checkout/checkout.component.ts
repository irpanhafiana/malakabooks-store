import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { OrderStore } from '../../store/order.store';
import { Address, Order } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { RadioComponent } from '../../shared/ui/radio/radio.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputComponent, RadioComponent, ButtonComponent, PriceComponent, DecimalPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  private readonly orderStore = inject(OrderStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);

  // Address inputs
  recipientControl = new FormControl('', [Validators.required]);
  phoneControl = new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]);
  streetControl = new FormControl('', [Validators.required]);
  cityControl = new FormControl('', [Validators.required]);
  provinceControl = new FormControl('', [Validators.required]);
  postalCodeControl = new FormControl('', [Validators.required]);

  addressForm = new FormGroup({
    recipient: this.recipientControl,
    phone: this.phoneControl,
    street: this.streetControl,
    city: this.cityControl,
    province: this.provinceControl,
    postalCode: this.postalCodeControl
  });

  // Payment inputs
  paymentOptions = [
    { value: 'credit_card', label: 'Credit or Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer (BCA, Mandiri, BNI)' },
    { value: 'e_wallet', label: 'GoPay / OVO E-Wallet' },
    { value: 'cod', label: 'Cash on Delivery (COD)' }
  ];
  paymentControl = new FormControl('credit_card', [Validators.required]);

  // Card details
  cardNumControl = new FormControl('', [Validators.required]);
  cardExpiryControl = new FormControl('', [Validators.required]);
  cardCvcControl = new FormControl('', [Validators.required]);

  ngOnInit() {
    // Check auth, redirect if not logged in
    if (!this.authStore.isLoggedIn()) {
      this.toastService.info('Please sign in to complete your checkout.');
      this.router.navigate(['/auth/login']);
      return;
    }

    const addresses = this.authStore.currentUser()?.addresses || [];
    this.savedAddresses.set(addresses);
    
    const def = addresses.find(a => a.isDefault);
    if (def) {
      this.selectedAddressId.set(def.id);
    } else if (addresses.length > 0) {
      this.selectedAddressId.set(addresses[0].id);
    } else {
      this.showAddressForm.set(true);
    }
  }

  selectAddress(id: string) {
    this.selectedAddressId.set(id);
  }

  addNewAddress() {
    this.addressForm.reset();
    this.showAddressForm.set(true);
  }

  cancelAddressForm() {
    this.showAddressForm.set(false);
  }

  saveAddressForm() {
    if (this.addressForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      name: this.recipientControl.value || '',
      phone: this.phoneControl.value || '',
      street: this.streetControl.value || '',
      city: this.cityControl.value || '',
      province: this.provinceControl.value || '',
      postalCode: this.postalCodeControl.value || '',
      isDefault: user.addresses.length === 0
    };

    const updatedUser = {
      ...user,
      addresses: [...user.addresses, newAddr]
    };

    this.authStore.updateProfile(updatedUser);
    this.savedAddresses.set(updatedUser.addresses);
    this.selectedAddressId.set(newAddr.id);
    this.showAddressForm.set(false);
  }

  isOrderInvalid(): boolean {
    if (!this.selectedAddressId() && this.showAddressForm()) {
      return true;
    }
    if (this.paymentControl.value === 'credit_card') {
      return this.cardNumControl.invalid || this.cardExpiryControl.invalid || this.cardCvcControl.invalid;
    }
    return this.paymentControl.invalid;
  }

  async onPlaceOrder() {
    if (this.isOrderInvalid()) return;

    const user = this.authStore.currentUser();
    const addr = this.savedAddresses().find(a => a.id === this.selectedAddressId());

    if (!user || !addr) {
      this.toastService.error('Please verify your shipping address details.');
      return;
    }

    this.isLoading.set(true);

    const paymentDetails: Record<string, string> = {};
    const method = this.paymentControl.value as any;

    if (method === 'credit_card') {
      const card = this.cardNumControl.value || '';
      paymentDetails['cardLast4'] = card.slice(-4) || '4321';
    } else if (method === 'bank_transfer') {
      paymentDetails['bankName'] = 'Bank BCA (Virtual Account)';
    } else if (method === 'e_wallet') {
      paymentDetails['walletType'] = 'GoPay E-Wallet';
    }

    const orderData: Omit<Order, 'id' | 'orderDate' | 'status' | 'trackingNumber'> = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: this.cartStore.items(),
      shippingAddress: addr,
      paymentMethod: method,
      paymentDetails,
      subtotal: this.cartStore.subtotal(),
      shippingCost: this.cartStore.shipping(),
      tax: this.cartStore.tax(),
      total: this.cartStore.total()
    };

    const placed = await this.orderStore.placeOrder(orderData);
    this.isLoading.set(false);

    if (placed) {
      this.router.navigate(['/order-success']);
    }
  }
}
