import { Component, inject, OnInit, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { Address } from '../../../core/models';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { AddressApiService } from '../../../core/services/address-api.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { BottomSheetComponent } from '../../../shared/ui/bottom-sheet/bottom-sheet.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { MapPickerComponent } from '../../../shared/ui/map-picker/map-picker.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-my-addresses',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    IconComponent,
    BottomSheetComponent,
    SkeletonComponent,
    MapPickerComponent
  ],
  templateUrl: './my-addresses.component.html',
  styleUrl: './my-addresses.component.css'
})
export class MyAddressesComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly addressApi = inject(AddressApiService);
  private readonly userApi = inject(UserApiService);

  isAddressesLoading = signal<boolean>(false);
  isAddressSaving = signal<boolean>(false);
  isDropdownLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  addresses = signal<Address[]>([]);
  editingAddressId = signal<string | null>(null);

  selectedLat = signal<number | undefined>(undefined);
  selectedLng = signal<number | undefined>(undefined);

  provinces = signal<any[]>([]);
  cities = signal<any[]>([]);
  districts = signal<any[]>([]);

  provinceOptions = computed(() => this.provinces().map(p => ({ value: p, label: p })));
  cityOptions = computed(() => this.cities().map(c => ({ value: c, label: c })));
  districtOptions = computed(() => this.districts().map(d => ({ value: d.region_code, label: d.subdistrict_name ? `${d.district_name} - ${d.subdistrict_name}` : d.district_name })));

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

    this.isAddressesLoading.set(true);
    const freshAddresses = await this.userApi.getAddressesByUserId(user.id);
    this.addresses.set(freshAddresses);
    this.isAddressesLoading.set(false);

    await this.loadProvinces();

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

    this.cityControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (city) => {
      if (city) {
        const dsts = await this.addressApi.getDistricts(this.provinceControl.value || '', city);
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

  async setDefaultAddress(addr: Address) {
    if (addr.isDefault) return;

    this.isAddressesLoading.set(true);

    // Silently unset the old default (bypass authStore toast)
    const user = this.authStore.currentUser();
    const currentDefault = this.addresses().find(a => a.isDefault);
    if (currentDefault && user) {
      await this.userApi.updateAddress(user.id, user.name, { ...currentDefault, isDefault: false });
    }

    // Set the new default (with toast via authStore)
    const success = await this.authStore.updateAddress({ ...addr, isDefault: true });

    if (success) {
      const latestUser = this.authStore.currentUser();
      if (latestUser) {
        this.addresses.set(latestUser.addresses);
      }
    }
    this.isAddressesLoading.set(false);
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
        const dsts = await this.addressApi.getDistricts(addr.province, city);
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
      this.editingAddressId.set(null);
      this.showAddressForm.set(false);

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
}
