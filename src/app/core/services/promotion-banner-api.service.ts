import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PromotionBanner, CreatePromotionBannerRequest, UpdatePromotionBannerRequest, ApiResponse } from '../models';
import { LoggerService } from './logger.service';
import { resolveImageUrl } from '../../shared/util/image.util';

@Injectable({
  providedIn: 'root'
})
export class PromotionBannerApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private mapBanner(b: any): PromotionBanner {
    const rawImage = b.imageUrl || b.imageBase64 || '';
    const resolvedImage = resolveImageUrl(rawImage);
    return {
      id: b.id,
      title: b.title || '',
      subtitle: b.subtitle || '',
      imageUrl: resolvedImage,
      imageBase64: resolvedImage,
      targetUrl: b.targetUrl || '',
      buttonText: b.buttonText || '',
      targetType: b.targetType || '',
      isActive: b.isActive ?? true,
      displayOrder: b.displayOrder || 0,
      startAt: b.startAt,
      endAt: b.endAt,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      alias: b.alias
    };
  }

  async getActiveBanners(): Promise<PromotionBanner[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<ApiResponse<PromotionBanner[]>>(`${this.BASE_URL}/public/PromotionBanners`)
      );
      const list = envelope?.data || [];
      return list.map((b: any) => this.mapBanner(b));
    } catch (e) {
      this.logger.warn('PromotionBannerApiService.getActiveBanners', 'Banners could not be loaded:', e);
      return [];
    }
  }

  async getAdminBanners(): Promise<PromotionBanner[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<ApiResponse<PromotionBanner[]>>(`${this.BASE_URL}/public/PromotionBanners`)
      );
      const list = envelope?.data || [];
      return list.map((b: any) => this.mapBanner(b));
    } catch (e) {
      this.logger.error('PromotionBannerApiService.getAdminBanners', 'Banners could not be loaded:', e);
      return [];
    }
  }

  async createBanner(request: CreatePromotionBannerRequest, imageFile?: File): Promise<PromotionBanner | null> {
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('Title', request.title || '');
        formData.append('Subtitle', request.subtitle || '');
        formData.append('TargetUrl', request.targetUrl || '');
        formData.append('ButtonText', request.buttonText || '');
        if (request.targetType) formData.append('TargetType', request.targetType);
        formData.append('IsActive', (request.isActive ?? true).toString());
        formData.append('DisplayOrder', (request.displayOrder || 0).toString());
        if (request.startAt) formData.append('StartAt', request.startAt);
        if (request.endAt) formData.append('EndAt', request.endAt);
        formData.append('Image', imageFile);

        const res = await firstValueFrom(
          this.http.post<ApiResponse<PromotionBanner>>(`${this.BASE_URL}/admin/PromotionBanners/with-files`, formData)
        );
        return res?.data ? this.mapBanner(res.data) : null;
      }

      const res = await firstValueFrom(
        this.http.post<ApiResponse<PromotionBanner>>(`${this.BASE_URL}/admin/PromotionBanners`, request)
      );
      return res?.data ? this.mapBanner(res.data) : null;
    } catch (e) {
      this.logger.error('PromotionBannerApiService.createBanner', 'Failed to create banner:', e);
      throw e;
    }
  }

  async updateBanner(id: string, request: UpdatePromotionBannerRequest, imageFile?: File): Promise<PromotionBanner | null> {
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('Title', request.title || '');
        formData.append('Subtitle', request.subtitle || '');
        formData.append('TargetUrl', request.targetUrl || '');
        formData.append('ButtonText', request.buttonText || '');
        if (request.targetType) formData.append('TargetType', request.targetType);
        formData.append('IsActive', (request.isActive ?? true).toString());
        formData.append('DisplayOrder', (request.displayOrder || 0).toString());
        if (request.startAt) formData.append('StartAt', request.startAt);
        if (request.endAt) formData.append('EndAt', request.endAt);
        formData.append('Image', imageFile);

        const res = await firstValueFrom(
          this.http.put<ApiResponse<PromotionBanner>>(`${this.BASE_URL}/admin/PromotionBanners/${id}/with-files`, formData)
        );
        return res?.data ? this.mapBanner(res.data) : null;
      }

      const res = await firstValueFrom(
        this.http.put<ApiResponse<PromotionBanner>>(`${this.BASE_URL}/admin/PromotionBanners/${id}`, request)
      );
      return res?.data ? this.mapBanner(res.data) : null;
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
