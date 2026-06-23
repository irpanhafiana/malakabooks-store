import { Component, inject, OnInit, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { User, Address } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { SelectComponent } from '../../shared/ui/select/select.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { AddressApiService } from '../../core/services/address-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { MapPickerComponent } from '../../shared/ui/map-picker/map-picker.component';

import { OrderStore } from '../../store/order.store';

interface MenuItem {
  icon: string;
  label: string;
  action?: () => void;
  route?: string;
  isDanger?: boolean;
}

interface MenuSection {
  items: MenuItem[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterLink, 
    InputComponent, 
    SelectComponent, 
    ButtonComponent, 
    IconComponent, 
    BottomSheetComponent, 
    SkeletonComponent,
    MapPickerComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly addressApi = inject(AddressApiService);
  private readonly userApi = inject(UserApiService);
  private readonly http = inject(HttpClient);

  isAddressesLoading = signal<boolean>(false);
  isProfileSaving = signal<boolean>(false);
  isAddressSaving = signal<boolean>(false);
  isDropdownLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  addresses = signal<Address[]>([]);

  showEditProfile = signal<boolean>(false);
  showSavedAddresses = signal<boolean>(false);
  showMockModal = signal<string | null>(null);

  // Menu configuration for clean looping in template
  menuSections: MenuSection[] = [
    {
      items: [
        { icon: 'bx-globe', label: 'Language', action: () => this.showMockModal.set('Language') },
        { icon: 'bx-wallet', label: 'Currencies', action: () => this.showMockModal.set('Currencies') },
        { icon: 'bx-palette', label: 'Appearance', action: () => this.showMockModal.set('Appearance') }
      ]
    },
    {
      items: [
        { icon: 'bx-map', label: 'Daftar Alamat Saya', action: () => this.showSavedAddresses.set(true) },
        { icon: 'bx-shield-quarter', label: 'Application Security', action: () => this.showMockModal.set('Application Security') },
        { icon: 'bx-devices', label: 'Manage Devices', action: () => this.showMockModal.set('Manage Devices') },
        { icon: 'bx-key', label: 'Change Password', action: () => this.showMockModal.set('Change Password') }
      ]
    },
    {
      items: [
        { icon: 'bx-car', label: 'Tracking Pesanan', route: '/tracking' },
        { icon: 'bx-message-square-error', label: 'Komplain Saya', route: '/complaints' },
        { icon: 'bx-package', label: 'Lacak Pesanan / Riwayat', route: '/order-history' },
        { icon: 'bx-log-out', label: 'Keluar (Logout)', action: () => this.logout(), isDanger: true }
      ]
    }
  ];

  // Order status counts
  pendingCount = computed(() => this.orderStore.orders().filter(o => o.status === 'pending').length);
  processingCount = computed(() => this.orderStore.orders().filter(o => o.status === 'processing').length);
  shippedCount = computed(() => this.orderStore.orders().filter(o => o.status === 'shipped').length);
  completedCount = computed(() => this.orderStore.orders().filter(o => o.status === 'completed').length);

  // Latest order
  latestOrder = computed(() => {
    const orders = this.orderStore.orders();
    if (!orders || orders.length === 0) return null;
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0];
  });

  // Simasrim states
  provinces = signal<any[]>([]);
  cities = signal<any[]>([]);
  districts = signal<any[]>([]);
  editingAddressId = signal<string | null>(null);

  selectedLat = signal<number | undefined>(undefined);
  selectedLng = signal<number | undefined>(undefined);

  provinceOptions = computed(() => this.provinces().map(p => ({ value: p, label: p })));
  cityOptions = computed(() => this.cities().map(c => ({ value: c, label: c })));
  districtOptions = computed(() => this.districts().map(d => ({ value: d.region_code, label: d.subdistrict_name ? `${d.district_name} - ${d.subdistrict_name}` : d.district_name })));

  // Profile fields
  nameControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl({ value: '', disabled: true });
  phoneControl = new FormControl('');

  profileForm = new FormGroup({
    name: this.nameControl,
    email: this.emailControl,
    phone: this.phoneControl
  });

  // Address fields
  recipientControl = new FormControl('', [Validators.required]);
  addrPhoneControl = new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]);
  streetControl = new FormControl('', [Validators.required]);
  cityControl = new FormControl('', [Validators.required]);
  provinceControl = new FormControl('', [Validators.required]);
  districtControl = new FormControl('', [Validators.required]);
  postalCodeControl = new FormControl('', [Validators.required]);

  addressForm = new FormGroup({
    recipient: this.recipientControl,
    phone: this.addrPhoneControl,
    street: this.streetControl,
    city: this.cityControl,
    province: this.provinceControl,
    district: this.districtControl,
    postalCode: this.postalCodeControl
  });

  async ngOnInit() {
    const user = this.authStore.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.nameControl.setValue(user.name);
    this.emailControl.setValue(user.email);
    this.phoneControl.setValue(user.phone || '');

    this.http.get(`http://192.168.1.15:25168/api/v1/customer/Users/${user.phone}/profile`).subscribe({
      next: (res: any) => {
        if (res && res.id) {
          localStorage.setItem('externalProfileId', res.id);
        } else if (res && res.data && res.data.id) {
          localStorage.setItem('externalProfileId', res.data.id);
        }
      },
      error: (err) => console.error('Failed to get external profile id:', err)
    });

    // Fetch addresses dynamically from database since authStore.currentUser() only has basic session info from token
    this.isAddressesLoading.set(true);
    const freshAddresses = await this.userApi.getAddressesByUserId(user.id);
    this.addresses.set(freshAddresses);
    this.isAddressesLoading.set(false);

    // Load Simasrim Provinces
    await this.loadProvinces();

    // Load user orders
    this.orderStore.loadUserOrders(user.id);

    // Listen to province changes
    this.provinceControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (province) => {
      if (province) {
        const cts = await this.addressApi.getCities(province);
        this.cities.set(cts);

        const currentCityVal = this.cityControl.value;
        const exists = cts.some(c => c === currentCityVal);
        if (!exists) {
          this.cityControl.setValue('');
        }
      } else {
        this.cities.set([]);
        this.cityControl.setValue('');
      }
    });

    // Listen to city changes
    this.cityControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (city) => {
      if (city) {
        const dsts = await this.addressApi.getDistricts(city);
        this.districts.set(dsts);

        const currentDstVal = this.districtControl.value;
        const exists = dsts.some(d => d.region_code === currentDstVal);
        if (!exists) {
          this.districtControl.setValue('');
        }
      } else {
        this.districts.set([]);
        this.districtControl.setValue('');
      }
    });

    // Listen to district changes
    this.districtControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(distCode => {
      const dist = this.districts().find(d => d.region_code === distCode);
      if (dist && dist.latitude && dist.longitude) {
        this.selectedLat.set(Number(dist.latitude));
        this.selectedLng.set(Number(dist.longitude));
      }
    });
  }

  async loadProvinces() {
    const provs = await this.addressApi.getProvinces();
    this.provinces.set(provs);
  }

  async onSubmitProfile() {
    if (this.profileForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    this.isProfileSaving.set(true);

    const updatedUser: User = {
      ...user,
      name: this.nameControl.value || '',
      phone: this.phoneControl.value || '',
      addresses: this.addresses()
    };

    const success = await this.authStore.updateProfile(updatedUser);
    this.isProfileSaving.set(false);
    if (success) {
      this.showEditProfile.set(false);
    }
  }

  onMapLocationSelected(loc: { latitude: number; longitude: number }) {
    this.selectedLat.set(loc.latitude);
    this.selectedLng.set(loc.longitude);
  }

  addNewAddress() {
    this.editingAddressId.set(null);
    this.addressForm.reset();
    this.selectedLat.set(undefined);
    this.selectedLng.set(undefined);
    this.cities.set([]);
    this.districts.set([]);
    this.showAddressForm.set(true);
  }

  cancelAddressForm() {
    this.editingAddressId.set(null);
    this.showAddressForm.set(false);
  }

  async editAddress(addr: Address) {
    this.addressForm.reset();
    this.editingAddressId.set(addr.id);
    this.selectedLat.set(addr.latitude);
    this.selectedLng.set(addr.longitude);

    this.recipientControl.setValue(addr.name);
    this.addrPhoneControl.setValue(addr.phone);
    this.streetControl.setValue(addr.street);
    this.postalCodeControl.setValue(addr.postalCode);

    // Map province string
    const prov = this.provinces().find(p => p.toLowerCase() === addr.province.toLowerCase());
    if (prov) {
      this.provinceControl.setValue(prov);

      this.isDropdownLoading.set(true);
      const cts = await this.addressApi.getCities(prov);
      this.cities.set(cts);
      this.isDropdownLoading.set(false);

      const city = cts.find(c => c.toLowerCase() === addr.city.toLowerCase());

      if (city) {
        this.cityControl.setValue(city);

        this.isDropdownLoading.set(true);
        const dsts = await this.addressApi.getDistricts(city);
        this.districts.set(dsts);
        this.isDropdownLoading.set(false);

        const targetDistrict = addr.district?.toLowerCase();
        const targetSubDistrict = addr.subDistrict?.toLowerCase();
        
        let dist = undefined;
        if (targetDistrict) {
          dist = dsts.find(d => 
            d.district_name.toLowerCase() === targetDistrict && 
            (targetSubDistrict ? d.subdistrict_name.toLowerCase() === targetSubDistrict : true)
          );
        }

        if (dist) {
          this.districtControl.setValue(dist.region_code);
        } else {
          this.districtControl.setValue('');
        }
      } else {
        this.cityControl.setValue('');
        this.districtControl.setValue('');
      }
    } else {
      this.provinceControl.setValue('');
      this.cityControl.setValue('');
      this.districtControl.setValue('');
    }

    this.showAddressForm.set(true);
  }

  async saveAddressForm() {
    if (this.addressForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    // Resolve IDs to names
    const provName = this.provinceControl.value || '';
    const cityName = this.cityControl.value || '';
    const distCode = this.districtControl.value;
    
    const distObj = this.districts().find(d => d.region_code === distCode);
    const districtName = distObj ? distObj.district_name : '';
    const subDistrictName = distObj ? distObj.subdistrict_name : '';

    this.isAddressSaving.set(true);

    const isEdit = this.editingAddressId() !== null;
    const addrId = isEdit ? this.editingAddressId()! : `addr-${Date.now()}`;

    const newAddr: Address = {
      id: addrId,
      name: this.recipientControl.value || '',
      phone: this.addrPhoneControl.value || '',
      street: this.streetControl.value || '',
      city: cityName,
      province: provName,
      district: districtName,
      subDistrict: subDistrictName,
      postalCode: this.postalCodeControl.value || '',
      addressCode: distObj?.origin_code || distCode || '',
      latitude: this.selectedLat() ?? (distObj?.latitude ? Number(distObj.latitude) : (isEdit ? this.addresses().find(a => a.id === addrId)?.latitude : 0) || 0),
      longitude: this.selectedLng() ?? (distObj?.longitude ? Number(distObj.longitude) : (isEdit ? this.addresses().find(a => a.id === addrId)?.longitude : 0) || 0),
      isDefault: isEdit
        ? (this.addresses().find(a => a.id === addrId)?.isDefault || false)
        : (this.addresses().length === 0)
    };

    let success = false;
    if (isEdit) {
      success = await this.authStore.updateAddress(newAddr);
    } else {
      success = await this.authStore.addAddress(newAddr);
    }

    this.isAddressSaving.set(false);

    if (success) {
      // The store already updates the address list, so we just reset the form
      this.editingAddressId.set(null);
      this.showAddressForm.set(false);
      
      // Update local copy
      const latestUser = this.authStore.currentUser();
      if (latestUser) {
        this.addresses.set(latestUser.addresses);
      }
    }
  }

  async deleteAddress(id: string) {
    const user = this.authStore.currentUser();
    if (!user) return;

    const success = await this.authStore.deleteAddress(id);
    if (success) {
      const latestUser = this.authStore.currentUser();
      if (latestUser) {
        this.addresses.set(latestUser.addresses);
      }
    }
  }

  logout() {
    this.authStore.logout();
    this.toastService.success('Logged out successfully.');
    this.router.navigate(['/auth/login']);
  }

  navigateBack() {
    this.router.navigate(['/']);
  }
}
