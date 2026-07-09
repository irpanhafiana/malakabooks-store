import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Review, ApiResponse, ReviewDto, OrderDto, OrderItemDto } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { getStoredSessionUser } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class ReviewApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) {
      return [];
    }

    try {
      const envelope = await firstValueFrom(
        this.http.get<ApiResponse<ReviewDto[]>>(`${this.BASE_URL}/customer/Reviews/book/${productId}`)
      );
      const reviews = envelope?.data || [];

      return reviews.map((r: ReviewDto) => ({
        id: r.id,
        userId: r.userId,
        bookId: r.bookId,
        orderId: r.orderId,
        rating: r.rating,
        comment: r.comment,
        additionalImages: r.additionalImages,
        createdAt: r.createdAt
      }));
    } catch (e) {
      this.logger.warn('ReviewApiService.getReviewsByProductId', 'Reviews could not be loaded:', e);
      return [];
    }
  }

  async addReview(review: Review, explicitOrderId?: string): Promise<Review> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) throw new Error('User not authenticated');

    let orderId = explicitOrderId || '';
    if (!orderId) {
      try {
        const envelope = await firstValueFrom(
          this.http.get<ApiResponse<OrderDto[]>>(`${this.BASE_URL}/customer/Orders/user/${currentUser.id}`)
        );
        const orders = envelope?.data || [];
        const matchingOrder = orders.find((o: OrderDto) =>
          o.items?.some((item: OrderItemDto) => item.bookId === review.bookId)
        );
        if (matchingOrder) orderId = matchingOrder.id;
      } catch {
        // orderId tetap kosong
      }
    }

    const body = {
      userId: currentUser.id,
      bookId: review.bookId,
      orderId,
      rating: review.rating,
      comment: review.comment,
      additionalImages: review.additionalImages || []
    };

    const res = await firstValueFrom(
      this.http.post<ApiResponse<ReviewDto>>(`${this.BASE_URL}/customer/Reviews`, body)
    );
    const data = res?.data;
    
    if (!data) {
      throw new Error('Gagal menyimpan ulasan, respons kosong dari server.');
    }

    return {
      id: data.id,
      userId: data.userId,
      bookId: data.bookId,
      orderId: data.orderId,
      rating: data.rating,
      comment: data.comment,
      additionalImages: data.additionalImages,
      createdAt: data.createdAt
    };
  }
}
