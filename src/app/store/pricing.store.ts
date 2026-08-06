import { Injectable, inject, signal, computed } from '@angular/core';
import { Pricing } from '../core/models';
import { PricingApiService } from '../core/services/pricing-api.service';
import { AlertService } from '../core/services/alert.service';

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
  private readonly alertService = inject(AlertService);

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
      this.alertService.error('Gagal memuat daftar harga.');
    }
  }

  async savePricing(pricing: Partial<Pricing>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.pricingApi.savePricing(pricing);
      await this.loadPricings();
      this.alertService.success(`Pricing "${saved.name}" berhasil disimpan!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menyimpan pricing.');
    }
  }

  async deletePricing(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.pricingApi.deletePricing(id);
      if (success) {
        await this.loadPricings();
        this.alertService.success('Pricing berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.alertService.error('Pricing gagal dihapus.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.alertService.error('Gagal menghapus pricing.');
    }
  }
}
