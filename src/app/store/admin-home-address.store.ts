import { Injectable, inject, signal, computed } from '@angular/core';
import { HomeAddress } from '../core/models';
import { AdminHomeAddressApiService } from '../core/services/admin-home-address-api.service';
import { ToastService } from '../core/services/toast.service';

interface AdminHomeAddressState {
  addresses: HomeAddress[];
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminHomeAddressStore {
  private readonly api = inject(AdminHomeAddressApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<AdminHomeAddressState>({
    addresses: [],
    loading: false
  });

  // Selectors
  readonly addresses = computed(() => this.state().addresses);
  readonly loading = computed(() => this.state().loading);

  constructor() {}

  async loadAddresses() {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const addresses = await this.api.getHomeAddresses();
      this.state.update(s => ({ ...s, addresses, loading: false }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to load home addresses.');
    }
  }

  async saveAddress(address: HomeAddress) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.api.saveHomeAddress(address);
      await this.loadAddresses(); // Re-seed client list
      this.toastService.success(`Home address "${saved.label}" saved successfully!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to save home address.');
    }
  }

  async deleteAddress(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.api.deleteHomeAddress(id);
      if (success) {
        await this.loadAddresses();
        this.toastService.success('Home address deleted successfully.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Home address not found.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to delete home address.');
    }
  }
}
