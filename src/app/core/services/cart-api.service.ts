import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

import { ApiResponse } from '../models/api-response.model';

interface CartItemResponse {
  bookId: string;
  quantity: number;
}
interface CartData {
  items: CartItemResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getCart(userId: string): Promise<{ bookId: string; quantity: number }[]> {
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<CartData>>(`${this.BASE_URL}/customer/Cart/${userId}`));
      return (res?.data?.items || []).map((item: CartItemResponse) => ({ bookId: item.bookId, quantity: item.quantity }));
    } catch (e) {
      this.logger.error('CartApiService.getCart', 'Gagal mengambil cart:', e);
      return [];
    }
  }

  async addCartItem(userId: string, bookId: string, quantity: number): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BASE_URL}/customer/Cart`, { userId, bookId, quantity }));
      return true;
    } catch (e) {
      this.logger.error('CartApiService.addCartItem', 'Gagal menambah item cart:', e);
      return false;
    }
  }

  async removeCartItem(userId: string, bookId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/customer/Cart/${userId}/items/${bookId}`));
      return true;
    } catch (e) {
      this.logger.error('CartApiService.removeCartItem', 'Gagal menghapus item cart:', e);
      return false;
    }
  }
}
