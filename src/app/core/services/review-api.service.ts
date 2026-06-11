import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Review } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getStoredSessionUser } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class ReviewApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.apiBaseUrl;

  async getReviewsByProductId(productId: string): Promise<Review[]> {
    try {
      const currentUser = getStoredSessionUser();

      const envelope = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Reviews/book/${productId}`)
      );
      const reviews = envelope?.data || [];

      return reviews.map((r: any) => ({
        id: r.id,
        productId: r.bookId,
        userName: currentUser?.id === r.userId ? (currentUser?.name || 'Customer') : 'Customer',
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt
      }));
    } catch (e) {
      console.warn(`Reviews could not be loaded (likely unauthorized for guest):`, e);
      return [];
    }
  }

  async addReview(review: Review): Promise<Review> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) throw new Error('User not authenticated');

    let orderId = '';
    try {
      const envelope = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Orders/user/${currentUser.id}`)
      );
      const orders = envelope?.data || [];
      const matchingOrder = orders.find((o: any) =>
        o.items?.some((item: any) => item.bookId === review.productId)
      );
      if (matchingOrder) orderId = matchingOrder.id;
    } catch {
      // orderId tetap kosong
    }

    const body = {
      userId: currentUser.id,
      bookId: review.productId,
      orderId,
      rating: review.rating,
      comment: review.comment
    };

    const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Reviews`, body));
    const data = res?.data;
    return {
      id: data.id,
      productId: data.bookId,
      userName: currentUser.name || 'Customer',
      rating: data.rating,
      comment: data.comment,
      date: data.createdAt
    };
  }
}
