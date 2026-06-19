import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AddressApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getProvinces(): Promise<any[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Simasrim/Province`));
      return envelope?.data?.data || [];
    } catch (e) {
      console.error('Failed to load provinces from Simasrim:', e);
      return [];
    }
  }

  async getCities(province: string): Promise<any[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Simasrim/City`, { province })
      );
      return envelope?.data?.data || [];
    } catch (e) {
      console.error(`Failed to load cities for province ${province} from Simasrim:`, e);
      return [];
    }
  }

  async getDistricts(city: string): Promise<any[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Simasrim/District`, { city })
      );
      return envelope?.data?.data || [];
    } catch (e) {
      console.error(`Failed to load districts for city ${city} from Simasrim:`, e);
      return [];
    }
  }

  async getCouriers(): Promise<string[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Simasrim/Courier`)
      );
      return envelope?.data?.data || [];
    } catch (e) {
      console.error('Failed to load couriers from Simasrim:', e);
      return [];
    }
  }

  async calculateTariff(payload: { origin_code: string; desti_code: string; berat_paket: string; volume: string; ekspedisi: string }): Promise<any> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Simasrim/Tarif`, payload)
      );
      return envelope?.data?.data || envelope?.data || null;
    } catch (e) {
      console.error('Failed to calculate tariff from Simasrim:', e);
      return null;
    }
  }
}
