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

  async saveBanner(request: CreatePromotionBannerRequest | UpdatePromotionBannerRequest, id?: string, imageFile?: File, options?: { showToast?: boolean }) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = id 
        ? await this.bannerApi.updateBanner(id, request as UpdatePromotionBannerRequest, imageFile)
        : await this.bannerApi.createBanner(request as CreatePromotionBannerRequest, imageFile);
      
      if (saved) {
        await this.loadAdminBanners();
        if (options?.showToast !== false) {
          this.toastService.success(`Banner "${saved.title}" saved successfully!`);
        }
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.toastService.error('Failed to save banner.');
      }
    }
  }

  async deleteBanner(id: string, options?: { showToast?: boolean }) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.bannerApi.deleteBanner(id);
      if (success) {
        await this.loadAdminBanners();
        if (options?.showToast !== false) {
          this.toastService.success('Banner deleted successfully.');
        }
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        if (options?.showToast !== false) {
          this.toastService.error('Banner not found.');
        }
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.toastService.error('Failed to delete banner.');
      }
    }
  }
}
