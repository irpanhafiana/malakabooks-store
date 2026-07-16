import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CatalogItem, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession, isCustomerSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class ItemApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getItems(): Promise<CatalogItem[]> {
    try {
      let endpoint = `${this.BASE_URL}/public/Items/priced`;
      if (isAdminSession()) {
        endpoint = `${this.BASE_URL}/admin/Items`;
      } else if (isCustomerSession()) {
        endpoint = `${this.BASE_URL}/customer/Items/priced`;
      }
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

    const itemBody: any = {
      ...item,
      name: item.name || item.title,
      sapCode: item.sapCode || '',
      itemType: item.itemType || 'mardika',
      categoryId: item.categoryId || undefined,
      uomGroupId: item.uomGroupId || undefined,
      uomGroup: item.uomGroup || undefined,
      baseUomCode: item.baseUomCode || '',
      description: item.description || '',
      coverImage: item.coverImage || '',
      additionalImages: item.additionalImages || [],
      weight: item.weight || 0,
      stock: item.stock || 0,
      isActive: item.isActive ?? false
    };

    let savedItem: any;

    try {
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.BASE_URL}/admin/Items`, itemBody));
        savedItem = envelope?.data;
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<any>>(`${this.BASE_URL}/admin/Items/${item.id}`, itemBody));
        savedItem = envelope?.data;
      }
    } catch (e) {
      this.logger.error('ItemApiService.saveItem', 'Gagal menyimpan item:', e);
      throw e;
    }

    // Determine the itemId correctly whether the API returns an object or a string ID
    const extractedItemId = savedItem?.id || (typeof savedItem === 'string' ? savedItem : item.id);

    const isMerchandise = item.categoryName && item.categoryName.toLowerCase() === 'merchandise';

    if (item.itemType === 'malaka' && !isMerchandise) {
      const bookPayload = {
        itemId: extractedItemId,
        authorIds: item.authorIds || [],
        isbn: item.isbn || '',
        publisher: item.publisher || '',
        publishedYear: item.publishedYear || 0,
        pages: item.pages || 0
      };

      try {
        if (isNew) {
          await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.BASE_URL}/admin/Books`, bookPayload));
        } else {
          let bookId = item.bookId;
          if (!bookId) {
            const booksEnv = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/admin/Books`));
            const book = booksEnv?.data?.find(b => b.itemId === extractedItemId);
            if (book) {
              bookId = book.id;
            }
          }

          if (bookId) {
            await firstValueFrom(this.http.put<ApiResponse<any>>(`${this.BASE_URL}/admin/Books/${bookId}`, bookPayload));
          } else {
            await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.BASE_URL}/admin/Books`, bookPayload));
          }
        }
      } catch (e) {
        this.logger.error('ItemApiService.saveItem', 'Gagal menyimpan buku:', e);
        throw e;
      }
    }

    // If it's a book but converted to merchandise, clean up the old book data
    if (item.itemType === 'malaka' && isMerchandise && !isNew) {
      try {
        const booksEnv = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/admin/Books`));
        const book = booksEnv?.data?.find(b => b.itemId === extractedItemId);
        if (book) {
          await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Books/${book.id}`));
        }
      } catch (e) {
        this.logger.error('ItemApiService.saveItem', 'Gagal menghapus buku lama untuk produk merchandise:', e);
      }
    }

    return savedItem;
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
