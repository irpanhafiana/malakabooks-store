import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Warehouse, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class WarehouseApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Warehouses` : `${this.BASE_URL}/public/Warehouses`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<Warehouse[]>>(endpoint));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('WarehouseApiService.getWarehouses', 'Gagal mengambil warehouses:', e);
      return [];
    }
  }

  async saveWarehouse(warehouse: Partial<Warehouse>): Promise<Warehouse> {
    const isNew = !warehouse.id;
    const body: Partial<Warehouse> = {
      code: warehouse.code,
      name: warehouse.name,
      description: warehouse.description,
      isActive: warehouse.isActive ?? true
    };

    try {
      let result: Warehouse;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<Warehouse>>(`${this.BASE_URL}/admin/Warehouses`, body));
        result = envelope?.data;
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<Warehouse>>(`${this.BASE_URL}/admin/Warehouses/${warehouse.id}`, body));
        result = envelope?.data;
      }
      return result;
    } catch (e) {
      this.logger.error('WarehouseApiService.saveWarehouse', 'Gagal menyimpan warehouse:', e);
      throw e;
    }
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Warehouses/${id}`));
      return true;
    } catch (e) {
      this.logger.error('WarehouseApiService.deleteWarehouse', `Gagal menghapus warehouse ${id}:`, e);
      return false;
    }
  }
}
