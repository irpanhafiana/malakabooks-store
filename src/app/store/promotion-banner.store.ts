import { Injectable, inject, signal, computed } from '@angular/core';
import { PromotionBanner, CreatePromotionBannerRequest, UpdatePromotionBannerRequest } from '../core/models';
import { PromotionBannerApiService } from '../core/services/promotion-banner-api.service';
import { ToastService } from '../core/services/toast.service';

interface PromotionBannerState {
  banners: PromotionBanner[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionBannerStore {
  private readonly bannerApi = inject(PromotionBannerApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<PromotionBannerState>({
    banners: [],
    loading: false,
    error: null
  });

  readonly banners = computed(() => this.state().banners);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadAdminBanners() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const banners = await this.bannerApi.getAdminBanners();
      this.state.update(s => ({ ...s, banners, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat daftar banner dari server.' }));
      this.toastService.error('Failed to load banners.');
    }
  }

  async loadActiveBanners() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const banners = await this.bannerApi.getActiveBanners();
      this.state.update(s => ({ ...s, banners, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat banner aktif.' }));
    }
  }

  async createBanner(request: CreatePromotionBannerRequest) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.bannerApi.createBanner(request);
      if (saved) {
        await this.loadAdminBanners();
        this.toastService.success(`Banner "${saved.title}" saved successfully!`);
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to create banner.');
    }
  }

  async updateBanner(id: string, request: UpdatePromotionBannerRequest) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const updated = await this.bannerApi.updateBanner(id, request);
      if (updated) {
        await this.loadAdminBanners();
        this.toastService.success(`Banner "${updated.title}" updated successfully!`);
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to update banner.');
    }
  }

  async deleteBanner(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.bannerApi.deleteBanner(id);
      if (success) {
        await this.loadAdminBanners();
        this.toastService.success('Banner deleted successfully.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Banner not found.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to delete banner.');
    }
  }
}
