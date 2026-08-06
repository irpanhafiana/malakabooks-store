import { Injectable, inject, signal, computed } from '@angular/core';
import { HomeAddress } from '../core/models';
import { AdminHomeAddressApiService } from '../core/services/admin-home-address-api.service';
import { AlertService } from '../core/services/alert.service';

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
  private readonly alertService = inject(AlertService);

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
      this.alertService.error('Gagal memuat alamat.');
    }
  }

  async saveAddress(address: HomeAddress) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.api.saveHomeAddress(address);
      await this.loadHomeAddresses(); // Re-seed client list
      this.alertService.success(`Alamat "${saved.label}" berhasil disimpan!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menyimpan alamat.');
    }
  }

  async deleteAddress(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.api.deleteHomeAddress(id);
      if (success) {
        await this.loadHomeAddresses();
        this.alertService.success('Alamat berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.alertService.error('Alamat tidak ditemukan.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menghapus alamat.');
    }
  }
}
