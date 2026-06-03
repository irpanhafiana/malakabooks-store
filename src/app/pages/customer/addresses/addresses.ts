import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddressService } from '../../../core/services/address.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Address } from '../../../core/models/address.model';
import { ButtonComponent } from '../../../shared/components/button/button';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

import { ViewportService } from '../../../core/services/viewport.service';
import { AddressesDesktopComponent } from './addresses-desktop';
import { AddressesMobileComponent } from './addresses-mobile';

@Component({
  selector: 'app-addresses-page',
  standalone: true,
  imports: [
    CommonModule,
    AddressesDesktopComponent,
    AddressesMobileComponent
  ],
  templateUrl: './addresses.html'
})
export class AddressesPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly addressService = inject(AddressService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  addresses = signal<Address[]>([]);
  showForm = signal(false);
  isEditing = signal(false);
  editingId?: string;

  // Form Fields
  label = '';
  recipientName = '';
  phone = '';
  street = '';
  city = '';
  province = '';
  postalCode = '';
  isDefault = false;

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    const user = this.authService.currentUser();
    if (user) {
      this.addressService.getByUser(user.id).subscribe((list) => {
        this.addresses.set(list);
      });
    }
  }

  openAddForm() {
    this.resetForm();
    this.isEditing.set(false);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  resetForm() {
    this.label = '';
    this.recipientName = '';
    this.phone = '';
    this.street = '';
    this.city = '';
    this.province = '';
    this.postalCode = '';
    this.isDefault = false;
    this.editingId = undefined;
  }

  onSaveAddress() {
    if (
      !this.label ||
      !this.recipientName ||
      !this.phone ||
      !this.street ||
      !this.city ||
      !this.province ||
      !this.postalCode
    ) {
      this.toastService.showError('Silakan lengkapi semua kolom.');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    const payload = {
      label: this.label,
      recipientName: this.recipientName,
      phone: this.phone,
      street: this.street,
      city: this.city,
      province: this.province,
      postalCode: this.postalCode,
      isDefault: this.isDefault
    };

    if (this.isEditing() && this.editingId) {
      this.addressService.update(this.editingId, payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Alamat berhasil diperbarui.');
          this.closeForm();
          this.loadAddresses();
        },
        error: () => this.toastService.showError('Gagal memperbarui alamat.')
      });
    } else {
      this.addressService.create(user.id, payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Alamat baru berhasil ditambahkan.');
          this.closeForm();
          this.loadAddresses();
        },
        error: () => this.toastService.showError('Gagal menambahkan alamat baru.')
      });
    }
  }

  onEditClick(address: Address) {
    this.isEditing.set(true);
    this.editingId = address.id;
    this.label = address.label;
    this.recipientName = address.recipientName;
    this.phone = address.phone;
    this.street = address.street;
    this.city = address.city;
    this.province = address.province;
    this.postalCode = address.postalCode;
    this.isDefault = address.isDefault;
    
    this.showForm.set(true);
    
    // Scroll smoothly to form CWD
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteAddress(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
      this.addressService.delete(id).subscribe({
        next: () => {
          this.toastService.showSuccess('Alamat berhasil dihapus.');
          this.loadAddresses();
        },
        error: (err) => this.toastService.showError(err.message || 'Gagal menghapus alamat.')
      });
    }
  }

  onSetDefault(id: string) {
    const user = this.authService.currentUser();
    if (user) {
      this.addressService.setDefault(id, user.id).subscribe({
        next: () => {
          this.toastService.showSuccess('Alamat utama berhasil diubah.');
          this.loadAddresses();
        },
        error: () => this.toastService.showError('Gagal mengubah alamat utama.')
      });
    }
  }
}
