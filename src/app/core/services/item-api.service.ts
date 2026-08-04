import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CatalogItem, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession, isCustomerSession, getStoredSessionUser } from '../auth/session.util';
import { resolveImageUrl } from '../../shared/util/image.util';

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
      const items = envelope?.data || [];

      return items.map(item => ({
        ...item,
        coverImage: resolveImageUrl(item.coverImage),
        additionalImages: item.additionalImages?.map(img => ({
          ...img,
          image: resolveImageUrl(img.image)
        })) || []
      }));
    } catch (e) {
      this.logger.error('ItemApiService.getItems', 'Gagal mengambil items:', e);
      return [];
    }
  }

  async getAutofillItems(search: string): Promise<{ id: string; name: string }[]> {
    try {
      const isLoggedIn = !!getStoredSessionUser();
      const endpoint = isLoggedIn
        ? `${this.BASE_URL}/customer/Items/autofill?search=${encodeURIComponent(search)}`
        : `${this.BASE_URL}/public/Items/autofill?search=${encodeURIComponent(search)}`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<{ id: string; name: string }[]>>(endpoint));
      return envelope?.data || [];
    } catch (e) {
      this.logger.error('ItemApiService.getAutofillItems', 'Gagal mengambil autofill items:', e);
      return [];
    }
  }

  async getItemById(id: string): Promise<CatalogItem | null> {
    try {
      let endpoint = `${this.BASE_URL}/public/Items/priced/${id}`;
      if (isAdminSession()) {
        endpoint = `${this.BASE_URL}/admin/Items/${id}`;
      } else if (isCustomerSession()) {
        endpoint = `${this.BASE_URL}/customer/Items/priced/${id}`;
      }
      const envelope = await firstValueFrom(this.http.get<ApiResponse<CatalogItem>>(endpoint));
      const item = envelope?.data;
      if (!item) return null;

      const resolvedItem: CatalogItem = {
        ...item,
        coverImage: resolveImageUrl(item.coverImage),
        additionalImages: item.additionalImages?.map(img => ({
          ...img,
          image: resolveImageUrl(img.image)
        })) || []
      };

      if (resolvedItem.itemType === 'malaka' && isAdminSession()) {
        try {
          const booksEnv = await firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/admin/Books`));
          const book = booksEnv?.data?.find(b => b.itemId === resolvedItem.id);
          if (book) {
            return {
              ...resolvedItem,
              bookId: book.id,
              name: book.title || resolvedItem.name,
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

      return resolvedItem;
    } catch (e) {
      this.logger.error('ItemApiService.getItemById', `Gagal mengambil item ${id}:`, e);
      return null;
    }
  }

  async saveItem(item: Partial<CatalogItem> & {
    coverImageFile?: File;
    additionalImageFiles?: File[];
    title?: string;
    categoryName?: string;
    bookId?: string;
  }): Promise<CatalogItem> {
    const isNew = !item.id;

    const formData = new FormData();
    formData.append('Name', item.name || item.title || '');
    formData.append('SAPCode', item.sapCode || '');
    formData.append('ItemType', item.itemType || 'mardika');
    if (item.categoryId) formData.append('CategoryId', item.categoryId);
    if (item.uomGroupId) formData.append('UomGroupId', item.uomGroupId);
    formData.append('BaseUomCode', item.baseUomCode || '');
    formData.append('Description', item.description || '');
    formData.append('Weight', (item.weight || 0).toString());
    formData.append('Stock', (item.stock || 0).toString());
    formData.append('IsActive', (item.isActive ?? false).toString());

    if (item.coverImageFile instanceof File) {
      formData.append('CoverImage', item.coverImageFile);
    }

    if (Array.isArray(item.additionalImageFiles)) {
      item.additionalImageFiles.forEach((file: File) => {
        if (file instanceof File) {
          formData.append('AdditionalImages', file);
        }
      });
    }

    if (item.uomGroup) {
      if (item.uomGroup.name) formData.append('UomGroup.Name', item.uomGroup.name);
      if (item.uomGroup.baseUomCode) formData.append('UomGroup.BaseUomCode', item.uomGroup.baseUomCode);
      formData.append('UomGroup.IsActive', (item.uomGroup.isActive ?? true).toString());
      if (Array.isArray(item.uomGroup.details)) {
        item.uomGroup.details.forEach((det, idx: number) => {
          if (det.code) formData.append(`UomGroup.Details[${idx}].Code`, det.code);
          if (det.name) formData.append(`UomGroup.Details[${idx}].Name`, det.name);
          if (det.conversionFactor !== undefined) formData.append(`UomGroup.Details[${idx}].ConversionFactor`, det.conversionFactor.toString());
          formData.append(`UomGroup.Details[${idx}].IsBaseUom`, (det.isBaseUom ?? false).toString());
          formData.append(`UomGroup.Details[${idx}].IsDefaultForSales`, (det.isDefaultForSales ?? false).toString());
          formData.append(`UomGroup.Details[${idx}].SortOrder`, (det.sortOrder || 0).toString());
          formData.append(`UomGroup.Details[${idx}].IsActive`, (det.isActive ?? true).toString());
        });
      }
    }

    let savedItem: CatalogItem | null = null;

    try {
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<CatalogItem>>(`${this.BASE_URL}/admin/Items/with-files`, formData));
        savedItem = envelope?.data || null;
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<CatalogItem>>(`${this.BASE_URL}/admin/Items/${item.id}/with-files`, formData));
        savedItem = envelope?.data || null;
      }
    } catch (e) {
      this.logger.error('ItemApiService.saveItem', 'Gagal menyimpan item:', e);
      throw e;
    }

    let extractedItemId = savedItem?.id || item.id || '';

    if (!extractedItemId && item.sapCode) {
      try {
        const items = await this.getItems();
        const foundItem = items.find(i => i.sapCode === item.sapCode);
        if (foundItem) {
          extractedItemId = foundItem.id;
        }
      } catch (err) {
        this.logger.error('ItemApiService.saveItem', 'Gagal mencari ID item baru berdasarkan sapCode:', err);
      }
    }

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
          await firstValueFrom(this.http.post<ApiResponse<{ id: string }>>(`${this.BASE_URL}/admin/Books`, bookPayload));
        } else {
          let bookId = item.bookId;
          if (!bookId) {
            const booksEnv = await firstValueFrom(this.http.get<ApiResponse<{ id: string; itemId: string }[]>>(`${this.BASE_URL}/admin/Books`));
            const book = booksEnv?.data?.find(b => b.itemId === extractedItemId);
            if (book) {
              bookId = book.id;
            }
          }

          if (bookId) {
            await firstValueFrom(this.http.put<ApiResponse<unknown>>(`${this.BASE_URL}/admin/Books/${bookId}`, bookPayload));
          } else {
            await firstValueFrom(this.http.post<ApiResponse<unknown>>(`${this.BASE_URL}/admin/Books`, bookPayload));
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
        const booksEnv = await firstValueFrom(this.http.get<ApiResponse<{ id: string; itemId: string }[]>>(`${this.BASE_URL}/admin/Books`));
        const book = booksEnv?.data?.find(b => b.itemId === extractedItemId);
        if (book) {
          await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Books/${book.id}`));
        }
      } catch (e) {
        this.logger.error('ItemApiService.saveItem', 'Gagal menghapus buku lama untuk produk merchandise:', e);
      }
    }

    return savedItem || (item as CatalogItem);
  }

  async deleteItem(id: string): Promise<boolean> {
    try {
      const itemEnv = await firstValueFrom(this.http.get<ApiResponse<CatalogItem>>(`${this.BASE_URL}/admin/Items/${id}`));
      if (itemEnv?.data?.itemType === 'malaka') {
        const booksEnv = await firstValueFrom(this.http.get<ApiResponse<{ id: string; itemId: string }[]>>(`${this.BASE_URL}/admin/Books`));
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
