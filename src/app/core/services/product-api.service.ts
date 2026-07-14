import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, BookDto, ApiResponse, CatalogItem } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession, getStoredSessionUser } from '../auth/session.util';
import { CategoryApiService } from './category-api.service';
import { ItemApiService } from './item-api.service';
import { PricingApiService } from './pricing-api.service';

@Injectable({
  providedIn: 'root'
})
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly itemApi = inject(ItemApiService);
  private readonly pricingApi = inject(PricingApiService);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private mapToProduct(item: CatalogItem, price: number, book?: BookDto): Product {
    const authors = book?.authors?.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role || '',
      biography: a.biography || '',
      photoUrl: a.photoUrl || ''
    })) || [];

    return {
      id: item.id,
      itemId: item.id,
      title: book?.title || item.name,
      sapCode: item.sapCode || '',
      authorIds: book?.authorIds || [],
      authors,
      authorNames: authors.length > 0 ? authors.map(a => a.name).join(', ') : (item.itemType === 'mardika' ? 'Mardika Kopi' : ''),
      isbn: book?.isbn || '',
      categoryId: book?.categoryId || '',
      categoryName: item.itemType,
      price: price,
      description: book?.description || item.description || '',
      coverImage: book?.coverImage || (item as any).coverImage || '',
      publisher: book?.publisher || '',
      publishedYear: book?.publishedYear || 0,
      pages: book?.pages || 0,
      weight: book?.weight || (item as any).weight || 0,
      stock: book?.stock ?? (item as any).stock ?? 0,
      averageRating: book?.averageRating ?? 0,
      totalReviews: book?.totalReviews ?? 0,
      createdAt: item.createdAt || new Date().toISOString(),
      additionalImages: book?.additionalImages
        ? [...book.additionalImages].sort((a, b) => a.no - b.no)
        : ((item as any).additionalImages || [])
    };
  }

  async getProducts(): Promise<Product[]> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Items` : `${this.BASE_URL}/public/Items`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<CatalogItem[]>>(endpoint));
      const allItems = envelope?.data || [];
      const itemsToProcess = allItems;

      const booksEndpoint = isAdminSession() ? `${this.BASE_URL}/admin/Books` : `${this.BASE_URL}/public/Books`;
      let books: BookDto[] = [];
      try {
        const booksEnv = await firstValueFrom(this.http.get<ApiResponse<BookDto[]>>(booksEndpoint));
        books = booksEnv?.data || [];
      } catch (e) {
        this.logger.error('ProductApiService.getProducts', 'Gagal mengambil books:', e);
      }

      const categories = await this.categoryApi.getCategories();
      const catMap = new Map(categories.map(c => [c.id, c.name]));

      const currentUser = getStoredSessionUser();
      const isCustomerLoggedIn = currentUser !== null && currentUser.role !== 'admin';

      const products: Product[] = [];
      for (const item of itemsToProcess) {
        let price = 0;
        try {
          if (isCustomerLoggedIn) {
            const res = await this.pricingApi.lookupCustomerPrice(item.id, item.baseUomCode);
            if (res && res.price > 0) price = res.price;
          } else {
            const res = await this.pricingApi.lookupPublicPrice(item.id, item.baseUomCode);
            if (res && res.price > 0) price = res.price;
          }
        } catch(e) {}

        const book = books.find(b => b.itemId === item.id);
        const product = this.mapToProduct(item, price, book);
        if (book && book.categoryId) {
          product.categoryName = catMap.get(book.categoryId) || 'Lainnya';
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

      let book: BookDto | undefined = undefined;
      if (item.itemType === 'malaka') {
        const booksEndpoint = isAdminSession() ? `${this.BASE_URL}/admin/Books` : `${this.BASE_URL}/public/Books`;
        const booksEnv = await firstValueFrom(this.http.get<ApiResponse<BookDto[]>>(booksEndpoint));
        book = booksEnv?.data?.find(b => b.itemId === item.id);
      }

      let price = 0;
      const currentUser = getStoredSessionUser();
      const isCustomerLoggedIn = currentUser !== null && currentUser.role !== 'admin';
      try {
        if (isCustomerLoggedIn) {
          const res = await this.pricingApi.lookupCustomerPrice(item.id, item.baseUomCode);
          if (res && res.price > 0) price = res.price;
        } else {
          const res = await this.pricingApi.lookupPublicPrice(item.id, item.baseUomCode);
          if (res && res.price > 0) price = res.price;
        }
      } catch(e) {}

      return this.mapToProduct(item, price, book);
    } catch (e) {
      this.logger.error('ProductApiService.getProductById', `Gagal mengambil detail produk ${id}:`, e);
      return undefined;
    }
  }

  async saveProduct(product: Product): Promise<Product> {
    const isNew = !product.id || product.id.startsWith('prod-');

    const body = {
      title: product.title,
      authorIds: product.authorIds || [],
      isbn: product.isbn || '',
      categoryId: product.categoryId,
      price: product.price,
      description: product.description,
      coverImage: product.coverImage || '',
      additionalImages: product.additionalImages.map((img, index) => ({
        no: img.no || index + 1,
        image: img.image
      })),
      publisher: product.publisher,
      publishedYear: product.publishedYear,
      pages: product.pages,
      weight: product.weight,
      stock: product.stock,
      sapCode: product.sapCode,
      itemId: product.itemId
    };

    try {
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<BookDto>>(`${this.BASE_URL}/admin/Books`, body));
        return this.mapToProduct(envelope?.data as any, 0, envelope?.data);
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<BookDto>>(`${this.BASE_URL}/admin/Books/${product.id}`, body));
        return this.mapToProduct(envelope?.data as any, 0, envelope?.data);
      }
    } catch (e) {
      this.logger.error('ProductApiService.saveProduct', 'Gagal menyimpan produk:', e);
      throw e;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Books/${id}`));
      return true;
    } catch (e) {
      this.logger.error('ProductApiService.deleteProduct', `Gagal menghapus produk ${id}:`, e);
      return false;
    }
  }
}
