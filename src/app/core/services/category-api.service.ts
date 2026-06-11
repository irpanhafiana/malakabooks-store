import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.apiBaseUrl;

  private categoryCache: { data: Category[]; ts: number } | null = null;
  private readonly CATEGORY_TTL_MS = 5 * 60 * 1000;

  async getCategories(): Promise<Category[]> {
    const now = Date.now();
    const isAdmin = isAdminSession();

    if (!isAdmin && this.categoryCache && now - this.categoryCache.ts < this.CATEGORY_TTL_MS) {
      return this.categoryCache.data;
    }
    try {
      const endpoint = isAdmin ? `${this.BASE_URL}/admin/Categories` : `${this.BASE_URL}/public/Categories`;
      const envelope = await firstValueFrom(this.http.get<any>(endpoint));
      const list = envelope?.data || [];
      const data = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: c.icon || 'book',
        description: c.description || ''
      }));
      if (!isAdmin) {
        this.categoryCache = { data, ts: now };
      }
      return data;
    } catch (e) {
      console.error('Gagal mengambil kategori:', e);
      return [];
    }
  }

  private invalidateCategoryCache() {
    this.categoryCache = null;
  }

  async saveCategory(category: Category): Promise<Category> {
    const isNew = !category.id || category.id.startsWith('cat-');
    const body: any = {
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: category.description || '',
      icon: category.icon || 'book'
    };

    try {
      let result: Category;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/admin/Categories`, body));
        result = envelope?.data;
      } else {
        body.id = category.id;
        const envelope = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/Categories/${category.id}`, body));
        result = envelope?.data;
      }
      this.invalidateCategoryCache();
      return result;
    } catch (e) {
      console.error('Gagal menyimpan kategori:', e);
      throw e;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Categories/${id}`));
      this.invalidateCategoryCache();
      return true;
    } catch (e) {
      console.error(`Gagal menghapus kategori ${id}:`, e);
      return false;
    }
  }
}
