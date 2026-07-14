import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pricing, ApiResponse, PriceLookupResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class PricingApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getPricings(): Promise<Pricing[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<ApiResponse<Pricing[]>>(`${this.BASE_URL}/admin/Pricings`));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('PricingApiService.getPricings', 'Gagal mengambil pricings:', e);
      return [];
    }
  }

  async savePricing(pricing: Partial<Pricing>): Promise<Pricing> {
    const isNew = !pricing.id;
    const body: Partial<Pricing> = {
      name: pricing.name,
      itemId: pricing.itemId,
      startDate: pricing.startDate,
      endDate: pricing.endDate,
      isActive: pricing.isActive ?? true,
      details: pricing.details || []
    };

    try {
      let result: Pricing;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<Pricing>>(`${this.BASE_URL}/admin/Pricings`, body));
        result = envelope?.data;
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<Pricing>>(`${this.BASE_URL}/admin/Pricings/${pricing.id}`, body));
        result = envelope?.data;
      }
      return result;
    } catch (e) {
      this.logger.error('PricingApiService.savePricing', 'Gagal menyimpan pricing:', e);
      throw e;
    }
  }

  async deletePricing(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Pricings/${id}`));
      return true;
    } catch (e) {
      this.logger.error('PricingApiService.deletePricing', `Gagal menghapus pricing ${id}:`, e);
      return false;
    }
  }

  async lookupCustomerPrice(itemId: string, uomCode: string): Promise<PriceLookupResponse | null> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<ApiResponse<PriceLookupResponse>>(`${this.BASE_URL}/customer/Pricings/lookup`, { itemId, uomCode })
      );
      return envelope?.data || null;
    } catch (e) {
      this.logger.error('PricingApiService.lookupCustomerPrice', `Gagal lookup customer price for item ${itemId}:`, e);
      return null;
    }
  }

  async lookupPublicPrice(itemId: string, uomCode: string, customerGroupCode?: string): Promise<PriceLookupResponse | null> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<ApiResponse<PriceLookupResponse>>(`${this.BASE_URL}/public/Pricings/lookup`, { itemId, uomCode, customerGroupCode })
      );
      return envelope?.data || null;
    } catch (e) {
      this.logger.error('PricingApiService.lookupPublicPrice', `Gagal lookup public price for item ${itemId}:`, e);
      return null;
    }
  }
}
