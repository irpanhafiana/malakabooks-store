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

  async getCities(provinceId: string): Promise<any[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Simasrim/City`, { provinceId })
      );
      return envelope?.data?.data || [];
    } catch (e) {
      console.error(`Failed to load cities for province ${provinceId} from Simasrim:`, e);
      return [];
    }
  }

  async getDistricts(cityId: string): Promise<any[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Simasrim/District`, { cityId })
      );
      return envelope?.data?.data || [];
    } catch (e) {
      console.error(`Failed to load districts for city ${cityId} from Simasrim:`, e);
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

  async calculateTariff(payload: { Origin: string; Destination: string; WeightInKg: number; Volume: string; Ekspedisi: string }): Promise<any> {
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
