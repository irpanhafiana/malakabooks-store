import { Injectable, inject, signal, computed } from '@angular/core';
import { Pricing } from '../core/models';
import { PricingApiService } from '../core/services/pricing-api.service';
import { ToastService } from '../core/services/toast.service';

interface PricingState {
  pricings: Pricing[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PricingStore {
  private readonly pricingApi = inject(PricingApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<PricingState>({
    pricings: [],
    loading: false,
    error: null
  });

  readonly pricings = computed(() => this.state().pricings);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadPricings() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const pricings = await this.pricingApi.getPricings();
      this.state.update(s => ({ ...s, pricings, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat pricings.' }));
      this.toastService.error('Gagal memuat daftar harga.');
    }
  }

  async savePricing(pricing: Partial<Pricing>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.pricingApi.savePricing(pricing);
      await this.loadPricings();
      this.toastService.success(`Pricing "${saved.name}" berhasil disimpan!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menyimpan pricing.');
    }
  }

  async deletePricing(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.pricingApi.deletePricing(id);
      if (success) {
        await this.loadPricings();
        this.toastService.success('Pricing berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Pricing gagal dihapus.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menghapus pricing.');
    }
  }
}
