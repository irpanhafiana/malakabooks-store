import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PromotionBanner, CreatePromotionBannerRequest, UpdatePromotionBannerRequest, ApiResponse } from '../models';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class PromotionBannerApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getActiveBanners(): Promise<PromotionBanner[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<ApiResponse<PromotionBanner[]>>(`${this.BASE_URL}/public/PromotionBanners`)
      );
      return envelope?.data || [];
    } catch (e) {
      this.logger.warn('PromotionBannerApiService.getActiveBanners', 'Banners could not be loaded:', e);
      return [];
    }
  }

  async getAdminBanners(): Promise<PromotionBanner[]> {
    try {
      // Assuming GET /admin/PromotionBanners might exist for listing banners in admin panel
      // Wait, is there a GET /admin/PromotionBanners? Let me check the API Controller.
      // If not, public endpoint might suffice, but usually admin needs all (including inactive).
      // If not available, we can fallback to public for now, or use admin list if it exists.
      const envelope = await firstValueFrom(
        this.http.get<ApiResponse<PromotionBanner[]>>(`${this.BASE_URL}/public/PromotionBanners`)
      );
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('PromotionBannerApiService.getAdminBanners', 'Banners could not be loaded:', e);
      return [];
    }
  }

  async createBanner(request: CreatePromotionBannerRequest): Promise<PromotionBanner | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<PromotionBanner>>(`${this.BASE_URL}/admin/PromotionBanners`, request)
      );
      return res?.data || null;
    } catch (e) {
      this.logger.error('PromotionBannerApiService.createBanner', 'Failed to create banner:', e);
      throw e;
    }
  }

  async updateBanner(id: string, request: UpdatePromotionBannerRequest): Promise<PromotionBanner | null> {
    try {
      const res = await firstValueFrom(
        this.http.put<ApiResponse<PromotionBanner>>(`${this.BASE_URL}/admin/PromotionBanners/${id}`, request)
      );
      return res?.data || null;
    } catch (e) {
      this.logger.error('PromotionBannerApiService.updateBanner', 'Failed to update banner:', e);
      throw e;
    }
  }

  async deleteBanner(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/PromotionBanners/${id}`));
      return true;
    } catch (e) {
      this.logger.error('PromotionBannerApiService.deleteBanner', 'Failed to delete banner:', e);
      throw e;
    }
  }
}
