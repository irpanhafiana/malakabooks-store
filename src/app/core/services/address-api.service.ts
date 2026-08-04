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
        this.http.get<ApiResponse<{ data: string[] }>>(`${this.BASE_URL}/customer/Simasrim/Province`)
      );
      const rawData = envelope?.data?.data || [];
      return rawData.map(name => ({ prov_name: name }));
    } catch (e) {
      this.logger.error('AddressApiService.getProvinces', 'Failed to load provinces from Simasrim:', e);
      return [];
    }
  }

  async getCities(province: string): Promise<CityLocation[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<ApiResponse<{ data: string[] }>>(`${this.BASE_URL}/customer/Simasrim/City`, { prov: province })
      );
      const rawData = envelope?.data?.data || [];
      return rawData.map(name => ({ city_name: name }));
    } catch (e) {
      this.logger.error('AddressApiService.getCities', `Failed to load cities for province ${province} from Simasrim:`, e);
      return [];
    }
  }

  async getDistricts(province: string, city: string, district: string = ''): Promise<DistrictLocation[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<ApiResponse<{ data: DistrictLocation[] }>>(`${this.BASE_URL}/customer/Simasrim/District`, { province, city, district })
      );
      return envelope?.data?.data || [];
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
