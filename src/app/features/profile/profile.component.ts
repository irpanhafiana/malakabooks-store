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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, SelectComponent, ButtonComponent, IconComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly addressApi = inject(AddressApiService);

  isLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  addresses = signal<Address[]>([]);

  // Simasrim states
  provinces = signal<any[]>([]);
  cities = signal<any[]>([]);
  editingAddressId = signal<string | null>(null);

  provinceOptions = computed(() => this.provinces().map(p => ({ value: p.provinceId, label: p.province })));
  cityOptions = computed(() => this.cities().map(c => ({ value: c.cityId, label: `${c.type} ${c.city}` })));

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
  postalCodeControl = new FormControl('', [Validators.required]);

  addressForm = new FormGroup({
    recipient: this.recipientControl,
    phone: this.addrPhoneControl,
    street: this.streetControl,
    city: this.cityControl,
    province: this.provinceControl,
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
    this.addresses.set(user.addresses || []);

    // Load Simasrim Provinces
    await this.loadProvinces();

    // Listen to province changes
    this.provinceControl.valueChanges.subscribe(async (provinceId) => {
      if (provinceId) {
        const cts = await this.addressApi.getCities(provinceId);
        this.cities.set(cts);

        const currentCityVal = this.cityControl.value;
        const exists = cts.some(c => c.cityId === currentCityVal);
        if (!exists) {
          this.cityControl.setValue('');
        }
      } else {
        this.cities.set([]);
        this.cityControl.setValue('');
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

    // Map province string to ID
    const prov = this.provinces().find(p => p.province.toLowerCase() === addr.province.toLowerCase());
    if (prov) {
      this.provinceControl.setValue(prov.provinceId);

      this.isLoading.set(true);
      const cts = await this.addressApi.getCities(prov.provinceId);
      this.cities.set(cts);
      this.isLoading.set(false);

      const city = cts.find(c => {
        const fullCityName = `${c.type} ${c.city}`.toLowerCase();
        return c.city.toLowerCase() === addr.city.toLowerCase() || fullCityName === addr.city.toLowerCase();
      });

      if (city) {
        this.cityControl.setValue(city.cityId);
      } else {
        this.cityControl.setValue('');
      }
    } else {
      this.provinceControl.setValue('');
      this.cityControl.setValue('');
    }

    this.showAddressForm.set(true);
  }

  async saveAddressForm() {
    if (this.addressForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    // Resolve IDs to names
    const provId = this.provinceControl.value;
    const cityId = this.cityControl.value;

    const provName = this.provinces().find(p => p.provinceId === provId)?.province || '';
    const cityObj = this.cities().find(c => c.cityId === cityId);
    const cityName = cityObj ? `${cityObj.type} ${cityObj.city}` : '';

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
      postalCode: this.postalCodeControl.value || '',
      isDefault: isEdit
        ? (this.addresses().find(a => a.id === addrId)?.isDefault || false)
        : (this.addresses().length === 0)
    };

    let updatedAddresses: Address[];
    if (isEdit) {
      updatedAddresses = this.addresses().map(a => a.id === addrId ? newAddr : a);
    } else {
      updatedAddresses = [...this.addresses(), newAddr];
    }

    const updatedUser = {
      ...user,
      addresses: updatedAddresses
    };

    const success = await this.authStore.updateProfile(updatedUser);
    this.isLoading.set(false);

    if (success) {
      this.addresses.set(updatedAddresses);
      this.editingAddressId.set(null);
      this.showAddressForm.set(false);
    }
  }

  async deleteAddress(id: string) {
    const user = this.authStore.currentUser();
    if (!user) return;

    const updatedAddresses = this.addresses().filter(a => a.id !== id);
    this.addresses.set(updatedAddresses);

    const updatedUser = {
      ...user,
      addresses: updatedAddresses
    };

    await this.authStore.updateProfile(updatedUser);
  }
}
