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
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Addresses/Simasrim/Province`));
      return envelope?.data || [];
    } catch (e) {
      console.error('Failed to load provinces from Simasrim:', e);
      return [];
    }
  }

  async getCities(provinceId: string): Promise<any[]> {
    try {
      const envelope = await firstValueFrom(
        this.http.post<any>(`${this.BASE_URL}/customer/Addresses/Simasrim/City`, { provinceId })
      );
      return envelope?.data || [];
    } catch (e) {
      console.error(`Failed to load cities for province ${provinceId} from Simasrim:`, e);
      return [];
    }
  }
}
