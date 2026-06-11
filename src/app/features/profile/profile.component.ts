import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { User, Address } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent, IconComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  addresses = signal<Address[]>([]);

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

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.nameControl.setValue(user.name);
    this.emailControl.setValue(user.email);
    this.phoneControl.setValue(user.phone || '');
    this.addresses.set(user.addresses || []);
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
    this.addressForm.reset();
    this.showAddressForm.set(true);
  }

  cancelAddressForm() {
    this.showAddressForm.set(false);
  }

  async saveAddressForm() {
    if (this.addressForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      name: this.recipientControl.value || '',
      phone: this.addrPhoneControl.value || '',
      street: this.streetControl.value || '',
      city: this.cityControl.value || '',
      province: this.provinceControl.value || '',
      postalCode: this.postalCodeControl.value || '',
      isDefault: this.addresses().length === 0
    };

    const updatedAddresses = [...this.addresses(), newAddr];
    this.addresses.set(updatedAddresses);

    const updatedUser = {
      ...user,
      addresses: updatedAddresses
    };

    await this.authStore.updateProfile(updatedUser);
    this.showAddressForm.set(false);
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
