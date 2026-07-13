import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CatalogItem, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class ItemApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getItems(): Promise<CatalogItem[]> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Items` : `${this.BASE_URL}/public/Items`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<CatalogItem[]>>(endpoint));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('ItemApiService.getItems', 'Gagal mengambil items:', e);
      return [];
    }
  }

  async getItemById(id: string): Promise<CatalogItem | null> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Items/${id}` : `${this.BASE_URL}/public/Items/${id}`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<CatalogItem>>(endpoint));
      return envelope?.data || null;
    } catch (e) {
      this.logger.error('ItemApiService.getItemById', `Gagal mengambil item ${id}:`, e);
      return null;
    }
  }

  async saveItem(item: Partial<CatalogItem>): Promise<CatalogItem> {
    const isNew = !item.id;
    const body: Partial<CatalogItem> = {
      name: item.name,
      sapCode: item.sapCode,
      itemType: item.itemType || 'Book',
      uomGroupId: item.uomGroupId || undefined,
      baseUomCode: item.baseUomCode,
      description: item.description || '',
      isActive: item.isActive ?? true
    };

    try {
      let result: CatalogItem;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<CatalogItem>>(`${this.BASE_URL}/admin/Items`, body));
        result = envelope?.data;
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<CatalogItem>>(`${this.BASE_URL}/admin/Items/${item.id}`, body));
        result = envelope?.data;
      }
      return result;
    } catch (e) {
      this.logger.error('ItemApiService.saveItem', 'Gagal menyimpan item:', e);
      throw e;
    }
  }

  async deleteItem(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Items/${id}`));
      return true;
    } catch (e) {
      this.logger.error('ItemApiService.deleteItem', `Gagal menghapus item ${id}:`, e);
      return false;
    }
  }
}
