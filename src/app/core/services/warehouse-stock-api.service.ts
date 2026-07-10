import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WarehouseStock, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class WarehouseStockApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getWarehouseStocks(): Promise<WarehouseStock[]> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/WarehouseStocks` : `${this.BASE_URL}/public/WarehouseStocks`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<WarehouseStock[]>>(endpoint));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('WarehouseStockApiService.getWarehouseStocks', 'Gagal mengambil warehouse stocks:', e);
      return [];
    }
  }

  async saveWarehouseStock(stock: Partial<WarehouseStock>): Promise<WarehouseStock> {
    const isNew = !stock.id;
    const body: Partial<WarehouseStock> = {
      baseUomCode: stock.baseUomCode,
      warehouseId: stock.warehouseId,
      itemId: stock.itemId,
      quantityOnHand: stock.quantityOnHand ?? 0,
      reservedQuantity: stock.reservedQuantity ?? 0
    };

    try {
      let result: WarehouseStock;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<WarehouseStock>>(`${this.BASE_URL}/admin/WarehouseStocks`, body));
        result = envelope?.data;
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<WarehouseStock>>(`${this.BASE_URL}/admin/WarehouseStocks/${stock.id}`, body));
        result = envelope?.data;
      }
      return result;
    } catch (e) {
      this.logger.error('WarehouseStockApiService.saveWarehouseStock', 'Gagal menyimpan warehouse stock:', e);
      throw e;
    }
  }

  async deleteWarehouseStock(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/WarehouseStocks/${id}`));
      return true;
    } catch (e) {
      this.logger.error('WarehouseStockApiService.deleteWarehouseStock', `Gagal menghapus warehouse stock ${id}:`, e);
      return false;
    }
  }
}
