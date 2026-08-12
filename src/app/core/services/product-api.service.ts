import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, BookDto, ApiResponse, CatalogItem } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession, isCustomerSession } from '../auth/session.util';
import { CategoryApiService } from './category-api.service';
import { ItemApiService } from './item-api.service';
import { resolveImageUrl } from '../../shared/util/image.util';


@Injectable({
  providedIn: 'root'
})
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly itemApi = inject(ItemApiService);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private mapToProduct(item: CatalogItem, price: number, book?: BookDto): Product {
    const authors = book?.authors?.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role || '',
      biography: a.biography || '',
      photoUrl: resolveImageUrl(a.photoUrl || '')
    })) || [];

    const rawCover = book?.coverImage || item.coverImage || '';
    const rawAddImages = book?.additionalImages
      ? [...book.additionalImages].sort((a, b) => a.no - b.no)
      : (item.additionalImages || []);

    const resolvedAddImages = rawAddImages.map((imgObj, idx) => {
      if (typeof imgObj === 'string') {
        return { no: idx + 1, image: resolveImageUrl(imgObj) };
      }
      const rawUrl = imgObj.image || '';
      return { no: imgObj.no || idx + 1, image: resolveImageUrl(rawUrl) };
    });

    return {
      id: item.id,
      itemId: item.id,
      title: book?.title || item.name,
      sapCode: item.sapCode || '',
      authorIds: book?.authorIds || item.authorIds || [],
      authors,
      authorNames: authors.length > 0 ? authors.map(a => a.name).join(', ') : '',
      isbn: book?.isbn || item.isbn || '',
      categoryId: book?.categoryId || item.categoryId || '',
      categoryName: item.itemType,
      price: price || item.price || 0,
      description: book?.description || item.description || '',
      coverImage: resolveImageUrl(rawCover),
      publisher: book?.publisher || item.publisher || '',
      publishedYear: book?.publishedYear || item.publishedYear || 0,
      pages: book?.pages || item.pages || 0,
      weight: book?.weight || (item as any).weight || 0,
      stock: book?.stock ?? (item as any).stock ?? 0,
      averageRating: book?.averageRating ?? item.averageRating ?? 0,
      totalReviews: book?.totalReviews ?? item.totalReviews ?? 0,
      quantitySold: item.quantitySold ?? 0,
      rating: item.rating ?? 0,
      salesUomCode: item.salesUomCode,
      customerGroupCode: item.customerGroupCode,
      priceStartDate: item.priceStartDate,
      priceEndDate: item.priceEndDate,
      compareAtPrice: item.compareAtPrice,
      compareAtPriceStartDate: item.compareAtPriceStartDate,
      compareAtPriceEndDate: item.compareAtPriceEndDate,
      createdAt: item.createdAt || new Date().toISOString(),
      uomGroup: item.uomGroup,
      baseUomCode: item.baseUomCode,
      additionalImages: resolvedAddImages
    };
  }

  async getProducts(): Promise<Product[]> {
    try {
      let endpoint = `${this.BASE_URL}/public/Items/priced`;
      if (isAdminSession()) {
        endpoint = `${this.BASE_URL}/admin/Items`;
      } else if (isCustomerSession()) {
        endpoint = `${this.BASE_URL}/customer/Items/priced`;
      }
      let envelope: ApiResponse<CatalogItem[]> | undefined;
      try {
        envelope = await firstValueFrom(this.http.get<ApiResponse<CatalogItem[]>>(endpoint));
      } catch (e) {
        if (endpoint.includes('/customer/Items/priced')) {
          this.logger.warn('ProductApiService.getProducts', 'Endpoint customer mengembalikan error/401, fallback ke public/Items/priced');
          endpoint = `${this.BASE_URL}/public/Items/priced`;
          envelope = await firstValueFrom(this.http.get<ApiResponse<CatalogItem[]>>(endpoint));
        } else {
          throw e;
        }
      }

      const allItems = envelope?.data || [];
      const itemsToProcess = allItems.filter(i => (isAdminSession() || i.isActive !== false));

      const categories = await this.categoryApi.getCategories();
      const catMap = new Map(categories.map(c => [c.id, c.name]));

      const products: Product[] = [];
      for (const item of itemsToProcess) {
        const product = this.mapToProduct(item, item.price || 0, undefined);
        if (item.categoryId) {
          product.categoryName = catMap.get(item.categoryId) || 'Lainnya';
        }
        products.push(product);
      }

      return products;
    } catch (e) {
      this.logger.error('ProductApiService.getProducts', 'Gagal mengambil daftar produk:', e);
      throw e;
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const item = await this.itemApi.getItemById(id);
      if (!item) return undefined;

      return this.mapToProduct(item, item.price || 0, undefined);
    } catch (e) {
      this.logger.error('ProductApiService.getProductById', `Gagal mengambil detail produk ${id}:`, e);
      return undefined;
    }
  }

  // Catatan: penulisan buku/produk admin (create/update/delete) dilakukan lewat ItemApiService
  // yang sesuai kontrak backend (Item + Book terpisah). Jalur lama saveProduct/deleteProduct
  // yang mengirim body penuh ke /admin/Books telah dihapus karena tidak sesuai CreateBookRequest
  // (backend hanya mengikat ItemId/AuthorIds/Isbn/Publisher/PublishedYear/Pages).
}
