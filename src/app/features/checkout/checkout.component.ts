import { Component, inject, signal, computed, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { OrderStore } from '../../store/order.store';
import { Address, Order, Payment } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { SelectComponent } from '../../shared/ui/select/select.component';
import { RadioComponent } from '../../shared/ui/radio/radio.component';
import { RadioIndicatorComponent } from '../../shared/ui/radio-indicator/radio-indicator.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { MapPickerComponent } from '../../shared/ui/map-picker/map-picker.component';
import { ToastService } from '../../core/services/toast.service';
import { AddressApiService } from '../../core/services/address-api.service';
import { ExternalMessageService } from '../../core/services/external-message.service';
import { UserApiService } from '../../core/services/user-api.service';
import { LoggerService } from '../../core/services/logger.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShippingService } from '../../core/services/shipping.service';
import { PaymentApiService } from '../../core/services/payment-api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputComponent, SelectComponent, RadioComponent, RadioIndicatorComponent, ButtonComponent, PriceComponent, DecimalPipe, MapPickerComponent],
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
  private readonly externalMessageService = inject(ExternalMessageService);
  private readonly userApi = inject(UserApiService);
  private readonly logger = inject(LoggerService);
  private readonly shippingService = inject(ShippingService);
  private readonly paymentApi = inject(PaymentApiService);

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

  provinceOptions = computed(() => this.provinces().map(p => ({ value: p, label: p })));
  cityOptions = computed(() => this.cities().map(c => ({ value: c, label: c })));
  districtOptions = computed(() => this.districts().map(d => ({ value: d.region_code, label: d.subdistrict_name ? `${d.district_name} - ${d.subdistrict_name}` : d.district_name })));
  courierOptions = computed(() => this.couriers().map(c => ({ value: c, label: c.toUpperCase() })));

  courierServices = this.shippingService.courierServices;
  courierServiceOptions = computed(() => {
    return this.courierServices().map((s, idx) => {
      let price = 0;
      if (typeof s.price === 'number') { price = s.price; }
      else if (s.price && typeof s.price === 'object') { price = s.price.medium_price || s.price.small_price || s.price.large_price || 0; }
      else if (typeof s.cost === 'number') { price = s.cost; }
      else if (s.cost && Array.isArray(s.cost)) { price = s.cost[0]?.value || 0; }
      else if (s.cost && typeof s.cost === 'object') { price = s.cost.value || 0; }

      return {
        value: idx.toString(),
        label: `${s.service_display || s.service || 'Reg'} - Rp ${price.toLocaleString('id-ID')} (ETA: ${s.etd || s.cost?.[0]?.etd || '-'})`
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

  calculatePaymentFee(paymentId: string | null) {
    if (!paymentId) {
      this.paymentFee.set(0);
      return;
    }
    const payment = this.payments().find(p => p.id === paymentId);
    if (!payment || !payment.fees) {
      this.paymentFee.set(0);
      return;
    }

    let totalFee = 0;
    const subtotal = this.cartStore.subtotal();

    for (const fee of payment.fees) {
      if (fee.type === 'PERCENTAGE') {
        totalFee += subtotal * (fee.value / 100);
      } else {
        totalFee += fee.value;
      }
    }
    this.paymentFee.set(totalFee);
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
      const prov = provs.find(p => p.toLowerCase() === addr.province.toLowerCase());
      if (!prov) return null;

      const cities = await this.addressApi.getCities(prov);
      const city = cities.find(c => c.toLowerCase() === addr.city.toLowerCase());
      if (!city) return null;

      if (addr.district) {
        const targetDistrict = addr.district.toLowerCase();
        const targetSubDistrict = addr.subDistrict?.toLowerCase();

        const districts = await this.addressApi.getDistricts(prov, city);
        const dist = districts.find(d =>
          d.district_name.toLowerCase() === targetDistrict &&
          (targetSubDistrict ? d.subdistrict_name.toLowerCase() === targetSubDistrict : true)
        );
        return dist ? dist.region_code : city;
      }
      return city;
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
      addressCode: distObj?.origin_code || distCode || '',
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
    const note = `Courier: ${selectedCourier.toUpperCase()}`;

    const serviceIdxStr = this.courierServiceControl.value;
    const serviceIdx = serviceIdxStr ? parseInt(serviceIdxStr, 10) : -1;
    const selectedService = serviceIdx >= 0 ? this.courierServices()[serviceIdx] : null;

    const shippingType = selectedService?.service_display || selectedService?.service || 'Reg';
    const shippingEst = selectedService?.etd || selectedService?.cost?.[0]?.etd || '-';

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
          (window as any).loadJokulCheckout(checkoutUrl);
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
