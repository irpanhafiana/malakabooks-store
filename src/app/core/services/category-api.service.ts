import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private categoryCache: { data: Category[]; ts: number } | null = null;
  private readonly CATEGORY_TTL_MS = 5 * 60 * 1000;

  private activeRequest: Promise<Category[]> | null = null;

  async getCategories(): Promise<Category[]> {
    const now = Date.now();
    const isAdmin = isAdminSession();

    if (!isAdmin && this.categoryCache && now - this.categoryCache.ts < this.CATEGORY_TTL_MS) {
      return this.categoryCache.data;
    }

    if (this.activeRequest) {
      return this.activeRequest;
    }

    this.activeRequest = (async () => {
      try {
        const endpoint = isAdmin ? `${this.BASE_URL}/admin/Categories` : `${this.BASE_URL}/public/Categories`;
        const envelope = await firstValueFrom(this.http.get<ApiResponse<Category[]>>(endpoint));
        const list = envelope?.data || [];
        const data = list.map((c: Category) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          icon: c.icon || 'book',
          description: c.description || ''
        }));
        if (!isAdmin) {
          this.categoryCache = { data, ts: Date.now() };
        }
        return data;
      } catch (e) {
        this.logger.error('CategoryApiService.getCategories', 'Gagal mengambil kategori:', e);
        return [];
      } finally {
        this.activeRequest = null;
      }
    })();

    return this.activeRequest;
  }

  private invalidateCategoryCache() {
    this.categoryCache = null;
  }

  async saveCategory(category: Category): Promise<Category> {
    const isNew = !category.id || category.id.startsWith('cat-');
    const body: Partial<Category> & { id?: string } = {
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: category.description || '',
      icon: category.icon || 'book'
    };

    try {
      let result: Category;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<Category>>(`${this.BASE_URL}/admin/Categories`, body));
        result = envelope?.data;
      } else {
        body.id = category.id;
        const envelope = await firstValueFrom(this.http.put<ApiResponse<Category>>(`${this.BASE_URL}/admin/Categories/${category.id}`, body));
        result = envelope?.data;
      }
      this.invalidateCategoryCache();
      return result;
    } catch (e) {
      this.logger.error('CategoryApiService.saveCategory', 'Gagal menyimpan kategori:', e);
      throw e;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Categories/${id}`));
      this.invalidateCategoryCache();
      return true;
    } catch (e) {
      this.logger.error('CategoryApiService.deleteCategory', `Gagal menghapus kategori ${id}:`, e);
      return false;
    }
  }
}
