import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, BookDto, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isAdminSession } from '../auth/session.util';
import { CategoryApiService } from './category-api.service';

@Injectable({
  providedIn: 'root'
})
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private mapBookToProduct(book: BookDto): Product {
    const authors = book.authors?.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role || '',
      biography: a.biography || '',
      photoUrl: a.photoUrl || ''
    })) || [];

    return {
      id: book.id,
      title: book.title,
      sapCode: book.sapCode || '',
      authorIds: book.authorIds || [],
      authors,
      authorNames: authors.map(a => a.name).join(', '),
      isbn: book.isbn || '',
      categoryId: book.categoryId,
      price: book.price,
      description: book.description || '',
      coverImage: book.coverImage || '',
      publisher: book.publisher || '',
      publishedYear: book.publishedYear || 0,
      pages: book.pages || 0,
      weight: book.weight || 0,
      stock: book.stock ?? 0,
      averageRating: book.averageRating ?? 0,
      totalReviews: book.totalReviews ?? 0,
      createdAt: book.createdAt || new Date().toISOString(),
      additionalImages: book.additionalImages
        ? [...book.additionalImages].sort((a, b) => a.no - b.no)
        : []
    };
  }

  async getProducts(): Promise<Product[]> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Books` : `${this.BASE_URL}/public/Books`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<BookDto[]>>(endpoint));
      const books = envelope?.data || [];
      const categories = await this.categoryApi.getCategories();
      const catMap = new Map(categories.map(c => [c.id, c.name]));

      return books.map((b: BookDto) => ({
        ...this.mapBookToProduct(b),
        categoryName: catMap.get(b.categoryId) || 'Other'
      }));
    } catch (e) {
      console.error('Gagal mengambil daftar produk:', e);
      throw e;
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Books/${id}` : `${this.BASE_URL}/public/Books/${id}`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<BookDto>>(endpoint));
      const book = envelope?.data;
      if (!book) return undefined;
      return this.mapBookToProduct(book);
    } catch (e) {
      console.error(`Gagal mengambil detail produk ${id}:`, e);
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
      sapCode: product.sapCode
    };

    try {
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<BookDto>>(`${this.BASE_URL}/admin/Books`, body));
        return this.mapBookToProduct(envelope?.data);
      } else {
        const envelope = await firstValueFrom(this.http.put<ApiResponse<BookDto>>(`${this.BASE_URL}/admin/Books/${product.id}`, body));
        return this.mapBookToProduct(envelope?.data);
      }
    } catch (e) {
      console.error('Gagal menyimpan produk:', e);
      throw e;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Books/${id}`));
      return true;
    } catch (e) {
      console.error(`Gagal menghapus produk ${id}:`, e);
      return false;
    }
  }
}
