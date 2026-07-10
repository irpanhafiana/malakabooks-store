import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UomGroup, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class UomGroupApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getUomGroups(): Promise<UomGroup[]> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/UomGroups` : `${this.BASE_URL}/public/UomGroups`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<UomGroup[]>>(endpoint));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('UomGroupApiService.getUomGroups', 'Gagal mengambil UoM groups:', e);
      return [];
    }
  }

  async saveUomGroup(uomGroup: Partial<UomGroup>): Promise<UomGroup> {
    const isNew = !uomGroup.id;
    const body: Partial<UomGroup> = {
      name: uomGroup.name,
      baseUomCode: uomGroup.baseUomCode,
      details: uomGroup.details || [],
      isActive: uomGroup.isActive ?? true
    };

    try {
      let result: UomGroup;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<UomGroup>>(`${this.BASE_URL}/admin/UomGroups`, body));
        result = envelope?.data;
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<UomGroup>>(`${this.BASE_URL}/admin/UomGroups/${uomGroup.id}`, body));
        result = envelope?.data;
      }
      return result;
    } catch (e) {
      this.logger.error('UomGroupApiService.saveUomGroup', 'Gagal menyimpan UoM group:', e);
      throw e;
    }
  }

  async deleteUomGroup(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/UomGroups/${id}`));
      return true;
    } catch (e) {
      this.logger.error('UomGroupApiService.deleteUomGroup', `Gagal menghapus UoM group ${id}:`, e);
      return false;
    }
  }
}
