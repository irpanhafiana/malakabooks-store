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
    return {
      id: book.id,
      name: book.title,
      author: book.author || '',
      description: book.description || '',
      price: book.price,
      categoryId: book.categoryId,
      categoryName: '',
      stock: book.stock ?? 0,
      rating: book.averageRating ?? 0,
      reviewsCount: book.totalReviews ?? 0,
      images: this.buildImagesArray(book),
      brand: book.publisher || '',
      featured: false,
      specifications: {
        'Author': book.author || '',
        'ISBN': book.isbn || '',
        'Published Year': book.publishedYear?.toString() || '',
        'Pages': book.pages?.toString() || '',
        'Weight': book.weight ? `${book.weight} kg` : ''
      },
      createdAt: book.createdAt || new Date().toISOString()
    };
  }

  private buildImagesArray(book: BookDto): string[] {
    const allImages: string[] = [];
    if (book.coverImage) {
      allImages.push(book.coverImage);
    }
    if (book.additionalImages && book.additionalImages.length > 0) {
      const sorted = [...book.additionalImages].sort((a, b) => a.no - b.no);
      allImages.push(...sorted.map(a => a.image));
    }
    return allImages;
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
      const categories = await this.categoryApi.getCategories();
      const category = categories.find(c => c.id === book.categoryId);
      return {
        ...this.mapBookToProduct(book),
        categoryName: category?.name || 'Other'
      };
    } catch (e) {
      console.error(`Gagal mengambil detail produk ${id}:`, e);
      return undefined;
    }
  }

  async saveProduct(product: Product): Promise<Product> {
    const isNew = !product.id || product.id.startsWith('prod-');
    
    const additionalImagesArray = product.images.slice(1).map((img, index) => ({
      no: index + 1,
      image: img
    }));

    const body = {
      title: product.name,
      author: product.specifications['Author'] || '',
      isbn: product.specifications['ISBN'] || '',
      categoryId: product.categoryId,
      price: product.price,
      description: product.description,
      coverImage: product.images[0] || '',
      additionalImages: additionalImagesArray,
      publisher: product.brand || product.specifications['Publisher'] || '',
      publishedYear: parseInt(product.specifications['Published Year']) || new Date().getFullYear(),
      pages: parseInt(product.specifications['Pages']) || 0,
      weight: parseFloat(product.specifications['Weight']) || 0.0,
      stock: product.stock
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
