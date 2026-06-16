import { Component, inject, signal, computed, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { OrderStore } from '../../store/order.store';
import { Address, Order } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { SelectComponent } from '../../shared/ui/select/select.component';
import { RadioComponent } from '../../shared/ui/radio/radio.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { ToastService } from '../../core/services/toast.service';
import { AddressApiService } from '../../core/services/address-api.service';
import { DokuApiService } from '../../core/services/doku-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShippingService } from '../../core/services/shipping.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputComponent, SelectComponent, RadioComponent, ButtonComponent, PriceComponent, DecimalPipe, NgOptimizedImage],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  private readonly orderStore = inject(OrderStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly addressApi = inject(AddressApiService);
  private readonly dokuApi = inject(DokuApiService);
  private readonly userApi = inject(UserApiService);
  private readonly shippingService = inject(ShippingService);

  isLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);

  // Simasrim states (delegated to ShippingService)
  provinces = this.shippingService.provinces;
  cities = this.shippingService.cities;
  districts = this.shippingService.districts;
  shippingCost = this.shippingService.shippingCost;
  shippingLoading = this.shippingService.shippingLoading;

  couriers = signal<string[]>([]);

  provinceOptions = computed(() => this.provinces().map(p => ({ value: p, label: p })));
  cityOptions = computed(() => this.cities().map(c => ({ value: c, label: c })));
  districtOptions = computed(() => this.districts().map(d => ({ value: d.region_code, label: d.subdistrict_name ? `${d.district_name} - ${d.subdistrict_name}` : d.district_name })));
  courierOptions = computed(() => this.couriers().map(c => ({ value: c, label: c.toUpperCase() })));

  checkoutTax = computed(() => this.cartStore.subtotal() * 0.10);
  checkoutTotal = computed(() => {
    return Math.max(0, this.cartStore.subtotal() + this.checkoutTax() + this.shippingCost() - this.cartStore.discount());
  });

  // Address inputs
  recipientControl = new FormControl('', [Validators.required]);
  phoneControl = new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]);
  streetControl = new FormControl('', [Validators.required]);
  cityControl = new FormControl('', [Validators.required]);
  provinceControl = new FormControl('', [Validators.required]);
  districtControl = new FormControl('', [Validators.required]);
  postalCodeControl = new FormControl('', [Validators.required]);

  addressForm = new FormGroup({
    recipient: this.recipientControl,
    phone: this.phoneControl,
    street: this.streetControl,
    city: this.cityControl,
    province: this.provinceControl,
    district: this.districtControl,
    postalCode: this.postalCodeControl
  });

  courierControl = new FormControl('', [Validators.required]);

  // Payment inputs
  paymentOptions = [
    { value: 'doku', label: 'Jokul Checkout (Doku)' },
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

  async ngOnInit() {
    // Check auth, redirect if not logged in
    if (!this.authStore.isLoggedIn()) {
      this.toastService.info('Please sign in to complete your checkout.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isLoading.set(true);
    const userId = this.authStore.currentUser()?.id || '';
    let addresses: Address[] = [];
    if (userId) {
      try {
        addresses = await this.userApi.getAddressesByUserId(userId);
      } catch (err) {
        console.error('Failed to load user addresses via API:', err);
      }
    }
    this.savedAddresses.set(addresses);

    const def = addresses.find(a => a.isDefault);
    if (def) {
      this.selectedAddressId.set(def.id);
    } else if (addresses.length > 0) {
      this.selectedAddressId.set(addresses[0].id);
    } else {
      this.showAddressForm.set(false);
    }
    this.isLoading.set(false);

    // Load provinces & couriers
    await Promise.all([
      this.shippingService.loadProvinces(),
      this.loadCouriers()
    ]);

    // Listen to province changes
    this.provinceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (provinceId) => {
      if (provinceId) {
        this.cityControl.disable({ emitEvent: false });
        try {
          await this.shippingService.loadCities(provinceId);
        } finally {
          this.cityControl.enable({ emitEvent: false });
        }

        const currentCityVal = this.cityControl.value;
        const exists = this.cities().some(c => c === currentCityVal);
        if (!exists) {
          this.cityControl.setValue('', { emitEvent: false });
        }
      } else {
        this.shippingService.clearCities();
        this.cityControl.setValue('', { emitEvent: false });
      }
    });

    // Listen to city changes
    this.cityControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (cityId) => {
      if (cityId) {
        this.districtControl.disable({ emitEvent: false });
        try {
          await this.shippingService.loadDistricts(cityId);
        } finally {
          this.districtControl.enable({ emitEvent: false });
        }

        const currentDstVal = this.districtControl.value;
        const exists = this.districts().some(d => d.region_code === currentDstVal);
        if (!exists) {
          this.districtControl.setValue('', { emitEvent: false });
        }
      } else {
        this.shippingService.clearDistricts();
        this.districtControl.setValue('', { emitEvent: false });
      }
    });

    // Listen to district changes
    this.districtControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateShippingCost();
    });

    // Listen to courier changes
    this.courierControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateShippingCost();
    });
  }

  async loadCouriers() {
    const list = await this.addressApi.getCouriers();
    this.couriers.set(list);
  }

  selectAddress(id: string) {
    this.selectedAddressId.set(id);
    this.updateShippingCost();
  }

  addNewAddress() {
    this.addressForm.reset();
    this.shippingService.clearCities();
    this.shippingService.clearDistricts();
    this.showAddressForm.set(true);
  }

  cancelAddressForm() {
    this.showAddressForm.set(false);
  }

  async resolveDistrictIdForAddress(addr: Address): Promise<string | null> {
    try {
      const provs = await this.addressApi.getProvinces();
      const prov = provs.find(p => p.toLowerCase() === addr.province.toLowerCase());
      if (!prov) return null;

      const cities = await this.addressApi.getCities(prov);
      const city = cities.find(c => c.toLowerCase() === addr.city.toLowerCase());
      if (!city) return null;

      if (addr.district) {
        const targetDistrict = addr.district.toLowerCase();
        const targetSubDistrict = addr.subDistrict?.toLowerCase();
        
        const districts = await this.addressApi.getDistricts(city);
        const dist = districts.find(d => 
            d.district_name.toLowerCase() === targetDistrict && 
            (targetSubDistrict ? d.subdistrict_name.toLowerCase() === targetSubDistrict : true)
        );
        return dist ? dist.region_code : city;
      }
      return city;
    } catch (e) {
      console.error('Error resolving district ID for saved address:', e);
      return null;
    }
  }

  async updateShippingCost() {
    const courier = this.courierControl.value;
    if (!courier) return;

    let destinationDistrictId: string | null = null;

    if (this.showAddressForm()) {
      destinationDistrictId = this.districtControl.value;
    } else {
      const selectedAddr = this.savedAddresses().find(a => a.id === this.selectedAddressId());
      if (selectedAddr) {
        destinationDistrictId = await this.resolveDistrictIdForAddress(selectedAddr);
      }
    }

    if (!destinationDistrictId) return;

    this.isLoading.set(true);
    await this.shippingService.calculateCost(destinationDistrictId, courier);
    this.isLoading.set(false);

  }

  async saveAddressForm() {
    if (this.addressForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    const provName = this.provinceControl.value || '';
    const cityName = this.cityControl.value || '';
    const distCode = this.districtControl.value;
    
    const distObj = this.districts().find(d => d.region_code === distCode);
    const districtName = distObj ? distObj.district_name : '';
    const subDistrictName = distObj ? distObj.subdistrict_name : '';

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      name: this.recipientControl.value || '',
      phone: this.phoneControl.value || '',
      street: this.streetControl.value || '',
      city: cityName,
      province: provName,
      district: districtName,
      subDistrict: subDistrictName,
      postalCode: this.postalCodeControl.value || '',
      isDefault: user.addresses.length === 0
    };

    this.isLoading.set(true);
    const success = await this.authStore.addAddress(newAddr);
    this.isLoading.set(false);

    if (success) {
      const latestUser = this.authStore.currentUser();
      if (latestUser) {
        this.savedAddresses.set(latestUser.addresses);
        // Find the new address (the one added last)
        const added = latestUser.addresses[latestUser.addresses.length - 1];
        if (added) {
          this.selectedAddressId.set(added.id);
        }
      }
      this.showAddressForm.set(false);
      this.updateShippingCost();
    }
  }

  isOrderInvalid(): boolean {
    if (this.showAddressForm() || !this.selectedAddressId()) {
      return true;
    }
    if (this.courierControl.invalid) {
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

    const selectedCourier = this.courierControl.value || 'jne';
    const note = `Courier: ${selectedCourier.toUpperCase()}`;

    const orderData: Omit<Order, 'id' | 'orderDate' | 'status' | 'trackingNumber'> = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: this.cartStore.items(),
      shippingAddress: addr,
      paymentMethod: method,
      paymentDetails,
      subtotal: this.cartStore.subtotal(),
      shippingCost: this.shippingCost(),
      tax: this.checkoutTax(),
      total: this.checkoutTotal()
    };

    const placed = await this.orderStore.placeOrder(orderData);
    this.isLoading.set(false);

    if (placed) {
      if (method === 'doku') {
        try {
          this.isLoading.set(true);
          const paymentRes = await firstValueFrom(this.dokuApi.getCheckPaymentDoku(placed.id));
          this.isLoading.set(false);
          
          const checkoutUrl = paymentRes?.checkoutUrl || 
                              paymentRes?.paymentUrl || 
                              paymentRes?.data?.checkout_url || 
                              paymentRes?.url || 
                              paymentRes?.data?.url;

          if (checkoutUrl) {
            (window as any).loadJokulCheckout(checkoutUrl);
          } else {
            console.error('Failed to resolve checkout URL from Doku response:', paymentRes);
            this.toastService.error('Order placed, but failed to load payment gateway. Please check your order history.');
            this.router.navigate(['/order-success'], { queryParams: { id: placed.id } });
          }
        } catch (e) {
          this.isLoading.set(false);
          console.error('Failed to initiate Doku Jokul checkout overlay:', e);
          this.toastService.error('Order placed, but failed to load payment gateway. Please check your order history.');
          this.router.navigate(['/order-success'], { queryParams: { id: placed.id } });
        }
      } else {
        this.router.navigate(['/order-success'], { queryParams: { id: placed.id } });
      }
    }
  }
}
