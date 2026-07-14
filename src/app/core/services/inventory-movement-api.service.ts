import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InventoryMovement, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getInventoryMovements(itemId?: string): Promise<InventoryMovement[]> {
    try {
      let url = `${this.BASE_URL}/admin/InventoryMovements`;
      if (itemId) {
        url += `?itemId=${itemId}`;
      }
      const envelope = await firstValueFrom(this.http.get<ApiResponse<InventoryMovement[]>>(url));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('InventoryMovementApiService.getInventoryMovements', 'Gagal mengambil inventory movements:', e);
      return [];
    }
  }
}
