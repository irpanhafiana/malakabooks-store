import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { User, Address } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, ButtonComponent, IconComponent],
  template: `
    <div class="animate-fade-in pb-12 flex flex-col gap-6">
      <h1 class="font-display font-extrabold text-slate-800 text-base">User Profile</h1>

      <!-- Profile Settings Card -->
      <div class="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
        <h2 class="font-display font-bold text-slate-800 text-xs mb-3.5">Account Information</h2>
        
        <form [formGroup]="profileForm" (submit)="onSubmitProfile()" class="grid grid-cols-1 gap-3.5">
          <app-input label="Full Name" placeholder="Dewi Lestari" [control]="nameControl"></app-input>
          <app-input label="Email Address" placeholder="dewi@example.com" type="email" [control]="emailControl" class="bg-slate-50 opacity-70 pointer-events-none"></app-input>
          <app-input label="Phone Number" placeholder="+628123456789" [control]="phoneControl"></app-input>
          
          <div class="sm:col-span-2 flex justify-end mt-2">
            <app-button type="submit" [loading]="isLoading()" [disabled]="profileForm.invalid" variant="primary" size="sm">
              Save Account Details
            </app-button>
          </div>
        </form>
      </div>

      <!-- Shipping Addresses Card -->
      <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <h2 class="font-display font-bold text-slate-800 text-sm mb-4">Saved Shipping Addresses</h2>

        <div class="flex flex-col gap-3">
          @for (addr of addresses(); track addr.id) {
            <div class="flex items-start justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50/20 text-xs leading-relaxed">
              <div class="flex flex-col">
                <strong class="font-bold text-slate-800">{{ addr.name }} @if (addr.isDefault) { <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold ml-1">Default</span> }</strong>
                <span class="text-slate-500 mt-1">{{ addr.phone }}</span>
                <span class="text-slate-600 font-semibold">{{ addr.street }}, {{ addr.city }}, {{ addr.province }}, {{ addr.postalCode }}</span>
              </div>
              <button
                type="button"
                (click)="deleteAddress(addr.id)"
                class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <app-icon name="trash" size="14"></app-icon>
              </button>
            </div>
          } @empty {
            <p class="text-xs text-slate-400 text-center py-4">No shipping addresses saved yet.</p>
          }

          @if (showAddressForm()) {
            <form [formGroup]="addressForm" class="grid grid-cols-1 gap-3.5 border border-slate-100 p-4 rounded-2xl bg-slate-50/20 mt-4 animate-fade-in">
              <app-input label="Recipient Name" placeholder="e.g. Dewi Lestari" [control]="recipientControl"></app-input>
              <app-input label="Phone Number" placeholder="e.g. +628123456789" [control]="addrPhoneControl"></app-input>
              <app-input label="Street Address" placeholder="e.g. Jl. Sudirman No. 21" [control]="streetControl"></app-input>
              <app-input label="City" placeholder="e.g. Jakarta Selatan" [control]="cityControl"></app-input>
              <app-input label="Province" placeholder="e.g. DKI Jakarta" [control]="provinceControl"></app-input>
              <app-input label="Postal Code" placeholder="e.g. 12730" [control]="postalCodeControl"></app-input>
              
              <div class="flex justify-end gap-2.5 mt-2">
                <app-button type="button" (click)="cancelAddressForm()" variant="ghost" size="sm">Cancel</app-button>
                <app-button type="button" (click)="saveAddressForm()" [disabled]="addressForm.invalid" variant="primary" size="sm">Save Address</app-button>
              </div>
            </form>
          } @else {
            <button type="button" (click)="addNewAddress()" class="text-xs font-bold text-primary-600 hover:text-primary-700 text-left mt-2 flex items-center gap-1 cursor-pointer">
              + Add New Address
            </button>
          }
        </div>
      </div>
    </div>
  `
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
