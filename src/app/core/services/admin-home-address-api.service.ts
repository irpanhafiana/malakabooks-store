import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HomeAddress } from '../models';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class AdminHomeAddressApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getHomeAddresses(): Promise<HomeAddress[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/admin/HomeAddresses`));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('AdminHomeAddressApiService.getHomeAddresses', 'Failed to load home addresses:', e);
      return [];
    }
  }

  async saveHomeAddress(address: HomeAddress): Promise<HomeAddress> {
    const isNew = !address.id || address.id === '';
    const body = {
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.street,
      province: address.province,
      city: address.city,
      district: address.district,
      subDistrict: address.subDistrict,
      postalCode: address.postalCode,
      addressCode: address.addressCode || '',
      longitude: address.longitude || 0,
      latitude: address.latitude || 0
    };

    try {
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/admin/HomeAddresses`, body));
        return envelope?.data;
      } else {
        const envelope = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/HomeAddresses/${address.id}`, body));
        return envelope?.data;
      }
    } catch (e) {
      this.logger.error('AdminHomeAddressApiService.saveHomeAddress', 'Failed to save home address:', e);
      throw e;
    }
  }

  async deleteHomeAddress(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/HomeAddresses/${id}`));
      return true;
    } catch (e) {
      this.logger.error('AdminHomeAddressApiService.deleteHomeAddress', `Failed to delete home address ${id}:`, e);
      return false;
    }
  }
}
