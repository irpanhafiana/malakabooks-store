import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import {
  ProvinceLocation,
  CityLocation,
  DistrictLocation,
  ShippingTariffPayload,
  ShippingTariffItem
} from '../models/address.model';
import { HomeAddress } from '../models/home-address.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AddressApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getProvinces(): Promise<ProvinceLocation[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Simasrim/Province`)
      );
      const raw = envelope?.data?.data ?? envelope?.data ?? envelope ?? [];
      if (!Array.isArray(raw)) return [];
      return raw.map((item: any) => {
        if (typeof item === 'string') return { prov_name: item };
        return { prov_name: item?.prov_name || item?.name || item?.province || '' };
      }).filter(p => Boolean(p.prov_name));
    } catch (e) {
      this.logger.error('AddressApiService.getProvinces', 'Failed to load provinces from Simasrim:', e);
      return [];
    }
  }

  async getCities(province: string): Promise<CityLocation[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Simasrim/City`, { prov: province })
      );
      const raw = envelope?.data?.data ?? envelope?.data ?? envelope ?? [];
      if (!Array.isArray(raw)) return [];
      return raw.map((item: any) => {
        if (typeof item === 'string') return { city_name: item };
        return { city_name: item?.city_name || item?.name || item?.city || '' };
      }).filter(c => Boolean(c.city_name));
    } catch (e) {
      this.logger.error('AddressApiService.getCities', `Failed to load cities for province ${province} from Simasrim:`, e);
      return [];
    }
  }

  async getDistricts(province: string, city: string, district = ''): Promise<DistrictLocation[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Simasrim/District`, { province, city, district })
      );
      const raw = envelope?.data?.data ?? envelope?.data ?? envelope ?? [];
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      this.logger.error('AddressApiService.getDistricts', `Failed to load districts for city ${city} from Simasrim:`, e);
      return [];
    }
  }

  async getCouriers(): Promise<string[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<ApiResponse<{ data: string[] }>>(`${this.BASE_URL}/customer/Simasrim/Courier`)
      );
      return envelope?.data?.data || [];
    } catch (e) {
      this.logger.error('AddressApiService.getCouriers', 'Failed to load couriers from Simasrim:', e);
      return [];
    }
  }

  async calculateTariff(payload: ShippingTariffPayload): Promise<ShippingTariffItem[] | ShippingTariffItem | null> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<ApiResponse<ShippingTariffItem[] | ShippingTariffItem>>(`${this.BASE_URL}/customer/Simasrim/Tarif`, payload)
      );
      return envelope?.data || null;
    } catch (e) {
      this.logger.error('AddressApiService.calculateTariff', 'Failed to calculate tariff from Simasrim:', e);
      return null;
    }
  }

  async getStoreHomeAddresses(): Promise<HomeAddress[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<ApiResponse<HomeAddress[]>>(`${this.BASE_URL}/public/HomeAddresses`)
      );
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('AddressApiService.getStoreHomeAddresses', 'Failed to load store home addresses:', e);
      return [];
    }
  }
}
