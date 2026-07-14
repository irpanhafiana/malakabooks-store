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
      const item = envelope?.data;

      if (item && item.itemType === 'malaka' && isAdminSession()) {
        try {
          const booksEnv = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/admin/Books`));
          const book = booksEnv?.data?.find(b => b.itemId === item.id);
          if (book) {
            return {
              ...item,
              bookId: book.id,
              name: book.title || item.name,
              isbn: book.isbn,
              authorIds: book.authorIds,
              categoryId: book.categoryId,
              publisher: book.publisher,
              publishedYear: book.publishedYear,
              pages: book.pages,
              weight: book.weight,
              price: book.price
            } as CatalogItem;
          }
        } catch (e) {
          this.logger.error('ItemApiService.getItemById', 'Gagal mengambil data tambahan buku:', e);
        }
      }

      return item || null;
    } catch (e) {
      this.logger.error('ItemApiService.getItemById', `Gagal mengambil item ${id}:`, e);
      return null;
    }
  }

  async saveItem(item: Partial<CatalogItem> & any): Promise<CatalogItem> {
    const isNew = !item.id;

    if (item.itemType === 'malaka') {
      const bookPayload = {
        itemId: item.id || undefined,
        title: item.name || '',
        sapCode: item.sapCode || '',
        authorIds: item.authorIds || [],
        isbn: item.isbn || '',
        categoryId: item.categoryId || null,
        price: item.price || 0,
        description: item.description || '',
        coverImage: item.coverImage || '',
        additionalImages: item.additionalImages || [],
        publisher: item.publisher || '',
        publishedYear: item.publishedYear || 0,
        pages: item.pages || 0,
        weight: item.weight || 0,
        stock: item.stock || 0
      };

      try {
        if (isNew) {
          const envelope = await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.BASE_URL}/admin/Books`, bookPayload));
          return envelope?.data;
        } else {
          let bookId = item.bookId;
          if (!bookId) {
            const booksEnv = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/admin/Books`));
            const book = booksEnv?.data?.find(b => b.itemId === item.id);
            if (book) {
              bookId = book.id;
            }
          }

          if (bookId) {
            await firstValueFrom(this.http.put<ApiResponse<any>>(`${this.BASE_URL}/admin/Books/${bookId}`, bookPayload));
          } else {
            bookPayload.itemId = item.id;
            await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.BASE_URL}/admin/Books`, bookPayload));
          }
          return item as CatalogItem;
        }
      } catch (e) {
        this.logger.error('ItemApiService.saveItem', 'Gagal menyimpan buku:', e);
        throw e;
      }
    }

    const body: any = {
      ...item,
      name: item.name || item.title,
      sapCode: item.sapCode,
      itemType: item.itemType || 'mardika',
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
      const itemEnv = await firstValueFrom(this.http.get<ApiResponse<CatalogItem>>(`${this.BASE_URL}/admin/Items/${id}`));
      if (itemEnv?.data?.itemType === 'malaka') {
        const booksEnv = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/admin/Books`));
        const book = booksEnv?.data?.find(b => b.itemId === id);
        if (book) {
          await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Books/${book.id}`));
        }
      }

      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Items/${id}`));
      return true;
    } catch (e) {
      this.logger.error('ItemApiService.deleteItem', `Gagal menghapus item ${id}:`, e);
      return false;
    }
  }
}
