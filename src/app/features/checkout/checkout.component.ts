import { Component, inject, signal, computed, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { OrderStore } from '../../store/order.store';
import { Address, Order, Payment } from '../../core/models';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { ToastService } from '../../core/services/toast.service';
import { AddressApiService } from '../../core/services/address-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { LoggerService } from '../../core/services/logger.service';
import { ShippingService } from '../../core/services/shipping.service';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { DokuCheckoutService } from '../../core/services/doku-checkout.service';

import { CheckoutAddressComponent } from './components/checkout-address/checkout-address.component';
import { CheckoutShippingComponent } from './components/checkout-shipping/checkout-shipping.component';
import { CheckoutPaymentComponent } from './components/checkout-payment/checkout-payment.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DecimalPipe,
    ButtonComponent,
    PriceComponent,
    CheckoutAddressComponent,
    CheckoutShippingComponent,
    CheckoutPaymentComponent
  ],
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
  private readonly userApi = inject(UserApiService);
  private readonly logger = inject(LoggerService);
  private readonly shippingService = inject(ShippingService);
  private readonly paymentApi = inject(PaymentApiService);
  private readonly dokuCheckout = inject(DokuCheckoutService);

  isLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);

  selectedLat = signal<number | undefined>(undefined);
  selectedLng = signal<number | undefined>(undefined);

  // Simasrim states (delegated to ShippingService)
  provinces = this.shippingService.provinces;
  cities = this.shippingService.cities;
  districts = this.shippingService.districts;
  shippingCost = this.shippingService.shippingCost;
  shippingLoading = this.shippingService.shippingLoading;

  couriers = signal<string[]>([]);

  provinceOptions = computed(() => this.provinces().map(p => {
    const name = p.prov_name || '';
    return { value: name, label: name };
  }));
  cityOptions = computed(() => this.cities().map(c => {
    const name = c.city_name || '';
    return { value: name, label: name };
  }));
  districtOptions = computed(() => this.districts().map(d => {
    const code = d.region_code || d.address_code || d.district_id || '';
    const dName = d.district_name || '';
    const subName = d.subdistrict_name || d.sub_district_name || '';
    return {
      value: code,
      label: subName ? `${dName} - ${subName}` : dName
    };
  }));
  courierOptions = computed(() => this.couriers().map(c => ({ value: c, label: c.toUpperCase() })));

  courierServices = this.shippingService.courierServices;
  courierServiceOptions = computed(() => {
    return this.courierServices().map((s, idx) => {
      const price = this.shippingService.extractServicePrice(s);
      const firstCost = Array.isArray(s.cost) ? s.cost[0] : null;
      const etd = s.etd || firstCost?.etd || '-';
      return {
        value: idx.toString(),
        label: `${s.service_display || s.service || 'Reg'} - Rp ${price.toLocaleString('id-ID')} (ETA: ${etd})`
      };
    });
  });

  checkoutTax = computed(() => 0);

  payments = signal<Payment[]>([]);
  paymentFee = signal<number>(0);

  checkoutTotal = computed(() => {
    return Math.max(0, this.cartStore.subtotal() + this.checkoutTax() + this.shippingCost() + this.paymentFee() - this.cartStore.discount());
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
  courierServiceControl = new FormControl('', [Validators.required]);

  // Payment inputs
  paymentOptions = computed(() => this.payments().map(p => ({ value: p.id, label: p.name })));
  paymentControl = new FormControl('', [Validators.required]);
  paymentControlValue = toSignal(this.paymentControl.valueChanges, { initialValue: this.paymentControl.value });

  isCreditCardSelected = computed(() => {
    const val = this.paymentControlValue();
    const p = this.payments().find(x => x.id === val);
    return p?.methodType === 'credit_card';
  });

  // Card details
  cardNumControl = new FormControl('', [Validators.required]);
  cardExpiryControl = new FormControl('', [Validators.required]);
  cardCvcControl = new FormControl('', [Validators.required]);

  ngOnInit() {
    void this.initialize().catch(err => {
      this.logger.error('Checkout initialization error:', err);
    });
  }

  private async initialize() {
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
        this.logger.error('Failed to load user addresses via API:', err);
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

    // Load provinces, couriers, and payments
    await Promise.all([
      this.shippingService.loadProvinces(),
      this.loadCouriers(),
      this.loadPayments()
    ]);

    // Listen to province changes
    this.provinceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (province) => {
      if (province) {
        this.cityControl.disable({ emitEvent: false });
        try {
          await this.shippingService.loadCities(province);
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
    this.cityControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (city) => {
      if (city) {
        this.districtControl.disable({ emitEvent: false });
        try {
          await this.shippingService.loadDistricts(this.provinceControl.value || '', city);
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
    this.districtControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((distCode) => {
      const dist = this.districts().find(d => d.region_code === distCode);
      if (dist && dist.latitude && dist.longitude) {
        this.selectedLat.set(Number(dist.latitude));
        this.selectedLng.set(Number(dist.longitude));
      }
      this.updateShippingCost();
    });

    // Listen to courier changes
    this.courierControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateShippingCost();
    });

    // Listen to courier service changes
    this.courierServiceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((idxStr) => {
      if (idxStr !== null && idxStr !== '') {
        const idx = parseInt(idxStr, 10);
        const service = this.courierServices()[idx];
        this.shippingService.setShippingCostFromService(service);
      } else {
        this.shippingService.shippingCost.set(0);
      }
    });

    // Listen to payment changes
    this.paymentControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paymentId) => {
      this.calculatePaymentFee(paymentId);
    });
  }

  async loadPayments() {
    try {
      const res = await this.paymentApi.getPayments();
      if (res && res.length > 0) {
        this.payments.set(res);
        this.paymentControl.setValue(res[0].id, { emitEvent: true });
      }
    } catch (err) {
      this.logger.error('Failed to load payments:', err);
    }
  }

  async calculatePaymentFee(paymentId: string | null) {
    if (!paymentId) {
      this.paymentFee.set(0);
      return;
    }
    const subtotal = this.cartStore.subtotal();
    const fee = await this.paymentApi.calculatePaymentFee(paymentId, subtotal);
    this.paymentFee.set(fee);
  }

  async loadCouriers() {
    const list = await this.addressApi.getCouriers();
    this.couriers.set(list);
  }

  selectAddress(id: string) {
    this.selectedAddressId.set(id);
    this.updateShippingCost();
  }

  onMapLocationSelected(loc: { latitude: number; longitude: number }) {
    this.selectedLat.set(loc.latitude);
    this.selectedLng.set(loc.longitude);
  }

  addNewAddress() {
    this.addressForm.reset();
    this.selectedLat.set(undefined);
    this.selectedLng.set(undefined);
    this.shippingService.clearCities();
    this.shippingService.clearDistricts();
    this.showAddressForm.set(true);
  }

  cancelAddressForm() {
    this.showAddressForm.set(false);
  }

  async resolvedistrictForAddress(addr: Address): Promise<string | null> {
    try {
      const provs = await this.addressApi.getProvinces();
      const provObj = provs.find(p => (p.prov_name || '').toLowerCase() === addr.province.toLowerCase());
      const provName = provObj ? (provObj.prov_name || '') : '';
      if (!provName) return null;

      const cities = await this.addressApi.getCities(provName);
      const cityObj = cities.find(c => (c.city_name || '').toLowerCase() === addr.city.toLowerCase());
      const cityName = cityObj ? (cityObj.city_name || '') : '';
      if (!cityName) return null;

      if (addr.district) {
        const targetDistrict = addr.district.toLowerCase();
        const targetSubDistrict = addr.subDistrict?.toLowerCase();

        const districts = await this.addressApi.getDistricts(provName, cityName);
        const dist = districts.find(d => {
          const dName = (d.district_name || '').toLowerCase();
          const subName = (d.subdistrict_name || d.sub_district_name || '').toLowerCase();
          return dName === targetDistrict && (targetSubDistrict ? subName === targetSubDistrict : true);
        });
        if (dist) {
          return dist.region_code || dist.address_code || dist.district_id || cityName;
        }
      }
      return cityName;
    } catch (e) {
      this.logger.error('Error resolving district ID for saved address:', e);
      return null;
    }
  }

  async updateShippingCost() {
    const courier = this.courierControl.value;
    if (!courier) return;

    let destinationdistrict: string | null = null;

    if (this.showAddressForm()) {
      destinationdistrict = this.districtControl.value;
    } else {
      const selectedAddr = this.savedAddresses().find(a => a.id === this.selectedAddressId());
      if (selectedAddr) {
        destinationdistrict = await this.resolvedistrictForAddress(selectedAddr);
      }
    }

    if (!destinationdistrict) return;

    this.isLoading.set(true);
    this.courierServiceControl.setValue('', { emitEvent: false });
    await this.shippingService.fetchCourierServices(destinationdistrict, courier);
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
      addressCode: (distObj?.origin_code || distCode || '') as string,
      latitude: this.selectedLat() ?? (distObj?.latitude ? Number(distObj.latitude) : 0),
      longitude: this.selectedLng() ?? (distObj?.longitude ? Number(distObj.longitude) : 0),
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
      this.toastService.error('Please complete your shipping address');
      return true;
    }
    if (this.courierControl.invalid) {
      this.toastService.error('Please select a shipping courier');
      return true;
    }
    if (this.courierServiceControl.invalid) {
      this.toastService.error('Please select a shipping service');
      return true;
    }
    const selectedPayment = this.payments().find(p => p.id === this.paymentControl.value);

    if (selectedPayment?.methodType === 'credit_card') {
      if (this.cardNumControl.invalid || this.cardExpiryControl.invalid || this.cardCvcControl.invalid) {
        this.toastService.error('Please complete your credit card details');
        return true;
      }
    } else if (this.paymentControl.invalid) {
      this.toastService.error('Please select a payment method');
      return true;
    }
    return false;
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
    const method = this.paymentControl.value || '';
    const selectedPayment = this.payments().find(p => p.id === method);

    if (selectedPayment?.methodType === 'credit_card') {
      const card = this.cardNumControl.value || '';
      paymentDetails['cardLast4'] = card.slice(-4) || '4321';
    } else if (selectedPayment?.methodType === 'bank_transfer') {
      paymentDetails['bankName'] = selectedPayment.name || 'Bank Transfer';
    } else if (selectedPayment?.methodType === 'e_wallet') {
      paymentDetails['walletType'] = selectedPayment.name || 'E-Wallet';
    }

    const selectedCourier = this.courierControl.value || 'jne';
    const serviceIdxStr = this.courierServiceControl.value;
    const serviceIdx = serviceIdxStr ? parseInt(serviceIdxStr, 10) : -1;
    const selectedService = serviceIdx >= 0 ? this.courierServices()[serviceIdx] : null;

    const shippingType = (selectedService?.service_display || selectedService?.service || 'Reg') as string;
    const firstCost = Array.isArray(selectedService?.cost) ? selectedService?.cost[0] : null;
    const shippingEst = (selectedService?.etd || firstCost?.etd || '-') as string;

    const orderData: Omit<Order, 'id' | 'orderDate' | 'status' | 'trackingNumber'> = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: this.cartStore.items(),
      shippingAddress: addr,
      paymentMethod: method,
      paymentDetails,
      paymentFee: this.paymentFee(),
      subtotal: this.cartStore.subtotal(),
      shippingCost: this.shippingCost(),
      tax: this.checkoutTax(),
      total: this.checkoutTotal(),
      shippingCourier: selectedCourier,
      shippingType,
      shippingEst
    };

    const placed = await this.orderStore.placeOrder(orderData);
    this.isLoading.set(false);

    if (placed) {
      if (selectedPayment?.methodType === 'jokul_checkout' || selectedPayment?.methodType === 'doku') {
        const checkoutUrl = placed.paymentUrl;

        if (checkoutUrl) {
          const opened = await this.dokuCheckout.open(checkoutUrl);
          if (!opened) {
            // Order sudah tercatat di backend — jangan tinggalkan pengguna diam
            // di halaman checkout tanpa umpan balik.
            this.toastService.error('Order placed, but failed to load payment gateway. Please check your order history.');
            this.router.navigate(['/order-success'], { queryParams: { id: placed.id } });
          }
        } else {
          this.logger.error('Failed to resolve checkout URL from order response:', placed);
          this.toastService.error('Order placed, but failed to load payment gateway. Please check your order history.');
          this.router.navigate(['/order-success'], { queryParams: { id: placed.id } });
        }
      } else {
        this.router.navigate(['/order-success'], { queryParams: { id: placed.id } });
      }
    }
  }
}
