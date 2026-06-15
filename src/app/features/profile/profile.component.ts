import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, SelectComponent, ButtonComponent, IconComponent, BottomSheetComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly addressApi = inject(AddressApiService);
  private readonly userApi = inject(UserApiService);

  isLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  addresses = signal<Address[]>([]);

  // Simasrim states
  provinces = signal<any[]>([]);
  cities = signal<any[]>([]);
  districts = signal<any[]>([]);
  editingAddressId = signal<string | null>(null);

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

    // Fetch addresses dynamically from database since authStore.currentUser() only has basic session info from token
    this.isLoading.set(true);
    const freshAddresses = await this.userApi.getAddressesByUserId(user.id);
    this.addresses.set(freshAddresses);
    this.isLoading.set(false);

    // Load Simasrim Provinces
    await this.loadProvinces();

    // Listen to province changes
    this.provinceControl.valueChanges.subscribe(async (provinceId) => {
      if (provinceId) {
        const cts = await this.addressApi.getCities(provinceId);
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
    this.cityControl.valueChanges.subscribe(async (cityId) => {
      if (cityId) {
        const dsts = await this.addressApi.getDistricts(cityId);
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
  }

  async loadProvinces() {
    const provs = await this.addressApi.getProvinces();
    this.provinces.set(provs);
  }

  async onSubmitProfile() {
    if (this.profileForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    this.isLoading.set(true);

    const updatedUser: User = {
      ...user,
      name: this.nameControl.value || '',
      phone: this.phoneControl.value || '',
      addresses: this.addresses()
    };

    const success = await this.authStore.updateProfile(updatedUser);
    this.isLoading.set(false);
  }

  addNewAddress() {
    this.editingAddressId.set(null);
    this.addressForm.reset();
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

    this.recipientControl.setValue(addr.name);
    this.addrPhoneControl.setValue(addr.phone);
    this.streetControl.setValue(addr.street);
    this.postalCodeControl.setValue(addr.postalCode);

    // Map province string
    const prov = this.provinces().find(p => p.toLowerCase() === addr.province.toLowerCase());
    if (prov) {
      this.provinceControl.setValue(prov);

      this.isLoading.set(true);
      const cts = await this.addressApi.getCities(prov);
      this.cities.set(cts);
      this.isLoading.set(false);

      const city = cts.find(c => c.toLowerCase() === addr.city.toLowerCase());

      if (city) {
        this.cityControl.setValue(city);

        this.isLoading.set(true);
        const dsts = await this.addressApi.getDistricts(city);
        this.districts.set(dsts);
        this.isLoading.set(false);

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

    this.isLoading.set(true);

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

    this.isLoading.set(false);

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
}
