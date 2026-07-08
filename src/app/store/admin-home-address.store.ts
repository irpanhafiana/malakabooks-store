import { Injectable, inject, signal, computed } from '@angular/core';
import { HomeAddress } from '../core/models';
import { AdminHomeAddressApiService } from '../core/services/admin-home-address-api.service';
import { ToastService } from '../core/services/toast.service';

interface AdminHomeAddressState {
  addresses: HomeAddress[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminHomeAddressStore {
  private readonly api = inject(AdminHomeAddressApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<AdminHomeAddressState>({
    addresses: [],
    loading: false,
    error: null
  });

  // Selectors
  readonly addresses = computed(() => this.state().addresses);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadHomeAddresses() {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const addresses = await this.api.getHomeAddresses();
      this.state.update(s => ({ ...s, addresses, loading: false }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal memuat alamat.');
    }
  }

  async saveAddress(address: HomeAddress) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.api.saveHomeAddress(address);
      await this.loadHomeAddresses(); // Re-seed client list
      this.toastService.success(`Alamat "${saved.label}" berhasil disimpan!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menyimpan alamat.');
    }
  }

  async deleteAddress(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.api.deleteHomeAddress(id);
      if (success) {
        await this.loadHomeAddresses();
        this.toastService.success('Alamat berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Alamat tidak ditemukan.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menghapus alamat.');
    }
  }
}
