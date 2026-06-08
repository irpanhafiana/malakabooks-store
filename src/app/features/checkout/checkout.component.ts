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
  template: `
    <div class="animate-fade-in pb-12">
      <h1 class="font-display font-extrabold text-slate-800 text-base mb-4">Checkout</h1>

      @if (cartStore.itemsCount() === 0) {
        <div class="text-center py-10 bg-white border border-slate-100 rounded-3xl p-5">
          <h2 class="font-display font-extrabold text-slate-800 text-sm mb-1.5">No Items to Checkout</h2>
          <p class="text-slate-500 text-xs mb-5">Your shopping cart is empty. Please add items to your cart before proceeding.</p>
          <app-button routerLink="/product" variant="primary" size="sm">Start Shopping</app-button>
        </div>
      } @else {
        <div class="flex flex-col gap-5">
          
          <!-- Checkout Steps Column (Vertical stack) -->
          <div class="flex flex-col gap-5">
            
            <!-- Step 1: Shipping Address -->
            <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs">
              <h2 class="font-display font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
                <span class="h-6 w-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">1</span>
                Shipping Address
              </h2>

              @if (savedAddresses().length > 0 && !showAddressForm()) {
                <div class="flex flex-col gap-3">
                  @for (addr of savedAddresses(); track addr.id) {
                    <label class="flex items-start gap-3.5 p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50"
                           [class.border-primary-500]="selectedAddressId() === addr.id"
                           [class.border-slate-200]="selectedAddressId() !== addr.id">
                      <input type="radio" name="address" [value]="addr.id" [checked]="selectedAddressId() === addr.id" (change)="selectAddress(addr.id)" class="mt-1 accent-primary-600 cursor-pointer" />
                      <div class="flex flex-col text-xs leading-relaxed">
                        <strong class="font-bold text-slate-800">{{ addr.name }} @if (addr.isDefault) { <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold ml-1">Default</span> }</strong>
                        <span class="text-slate-500 mt-1">{{ addr.phone }}</span>
                        <span class="text-slate-600 font-semibold">{{ addr.street }}, {{ addr.city }}, {{ addr.province }}, {{ addr.postalCode }}</span>
                      </div>
                    </label>
                  }
                  <button type="button" (click)="addNewAddress()" class="text-xs font-bold text-primary-600 hover:text-primary-700 text-left mt-1 flex items-center gap-1 cursor-pointer">
                    + Add New Shipping Address
                  </button>
                </div>
              } @else {
                <form [formGroup]="addressForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <app-input label="Recipient Name" placeholder="e.g. Dewi Lestari" [control]="recipientControl"></app-input>
                  <app-input label="Phone Number" placeholder="e.g. +628123456789" [control]="phoneControl"></app-input>
                  <div class="sm:col-span-2">
                    <app-input label="Street Address" placeholder="e.g. Jl. Sudirman No. 21" [control]="streetControl"></app-input>
                  </div>
                  <app-input label="City" placeholder="e.g. Jakarta Selatan" [control]="cityControl"></app-input>
                  <app-input label="Province" placeholder="e.g. DKI Jakarta" [control]="provinceControl"></app-input>
                  <app-input label="Postal Code" placeholder="e.g. 12730" [control]="postalCodeControl"></app-input>
                  
                  <div class="sm:col-span-2 flex justify-end gap-2.5 mt-2">
                    @if (savedAddresses().length > 0) {
                      <app-button type="button" (click)="cancelAddressForm()" variant="ghost" size="sm">Cancel</app-button>
                    }
                    <app-button type="button" (click)="saveAddressForm()" [disabled]="addressForm.invalid" variant="outline" size="sm">Save Address</app-button>
                  </div>
                </form>
              }
            </div>

            <!-- Step 2: Payment Method -->
            <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs">
              <h2 class="font-display font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
                <span class="h-6 w-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">2</span>
                Payment Method
              </h2>
              
              <app-radio
                [options]="paymentOptions"
                [control]="paymentControl"
                direction="col"
              ></app-radio>

              @if (paymentControl.value === 'credit_card') {
                <div class="mt-4 p-4 border border-slate-100 bg-slate-50/50 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                  <div class="sm:col-span-3">
                    <app-input label="Card Number" placeholder="xxxx xxxx xxxx 4321" [control]="cardNumControl"></app-input>
                  </div>
                  <app-input label="Expiry Date" placeholder="MM/YY" [control]="cardExpiryControl"></app-input>
                  <app-input label="CVC" placeholder="xxx" type="password" [control]="cardCvcControl"></app-input>
                </div>
              }
            </div>

          </div>

          <!-- Checkout Review Box (Right, 1/3 width) -->
          <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs flex flex-col gap-5">
            <h3 class="font-display font-extrabold text-slate-800 text-sm uppercase tracking-wider">Review Items</h3>
            
            <!-- Items Scroll -->
            <div class="flex flex-col gap-3.5 max-h-48 overflow-y-auto pr-1">
              @for (item of cartStore.items(); track item.product.id) {
                <div class="flex items-center gap-3 text-xs leading-tight">
                  <div class="h-10 w-8 bg-slate-50 rounded overflow-hidden flex-shrink-0 border border-slate-100">
                    <img [src]="item.product.images[0]" class="h-full w-full object-cover" />
                  </div>
                  <div class="flex-grow min-w-0">
                    <h4 class="font-bold text-slate-800 truncate">{{ item.product.name }}</h4>
                    <span class="text-slate-400">Qty: {{ item.quantity }} × $ {{ item.product.price }}</span>
                  </div>
                </div>
              }
            </div>

            <hr class="border-slate-100" />

            <!-- Price Breakdown -->
            <div class="flex flex-col gap-3 text-xs text-slate-500">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <app-price [value]="cartStore.subtotal()" [bold]="false" size="sm"></app-price>
              </div>
              @if (cartStore.discount() > 0) {
                <div class="flex justify-between text-rose-600 font-semibold">
                  <span>Discount</span>
                  <span>- $ {{ cartStore.discount() | number: '1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between">
                <span>Tax</span>
                <app-price [value]="cartStore.tax()" [bold]="false" size="sm"></app-price>
              </div>
              <div class="flex justify-between">
                <span>Shipping Cost</span>
                @if (cartStore.shipping() === 0) {
                  <span class="text-emerald-600 font-bold">Free</span>
                } @else {
                  <app-price [value]="cartStore.shipping()" [bold]="false" size="sm"></app-price>
                }
              </div>
              <hr class="border-slate-100" />
              <div class="flex justify-between text-slate-800 text-sm font-bold">
                <span>Total Payment</span>
                <app-price [value]="cartStore.total()" size="md" class="text-primary-600"></app-price>
              </div>
            </div>

            <hr class="border-slate-100" />

            <app-button
              (click)="onPlaceOrder()"
              [loading]="isLoading()"
              [disabled]="isOrderInvalid()"
              variant="primary"
              size="md"
              [fullWidth]="true"
              class="shadow-md"
            >
              Confirm and Pay
            </app-button>
          </div>

        </div>
      }
    </div>
  `
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
