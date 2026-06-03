import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Review } from '../models/review.model';
import { REVIEWS_DATA } from '../data/reviews.data';
import { BookService } from './book.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly REVIEWS_KEY = 'malaka_reviews';
  private readonly bookService = inject(BookService);

  private reviews = signal<Review[]>([]);

  constructor() {
    this.initReviews();
  }

  private initReviews() {
    const stored = localStorage.getItem(this.REVIEWS_KEY);
    if (stored) {
      this.reviews.set(JSON.parse(stored));
    } else {
      this.reviews.set(REVIEWS_DATA);
      localStorage.setItem(this.REVIEWS_KEY, JSON.stringify(REVIEWS_DATA));
    }
  }

  getByBook(bookId: string): Observable<Review[]> {
    const list = this.reviews().filter((r) => r.bookId === bookId);
    // Sort by latest review first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(list).pipe(delay(200));
  }

  getByUser(userId: string): Observable<Review[]> {
    const list = this.reviews().filter((r) => r.userId === userId);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(list).pipe(delay(200));
  }

  createReview(
    userId: string,
    bookId: string,
    orderId: string,
    rating: number,
    comment: string
  ): Observable<Review> {
    const isAlreadyReviewed = this.reviews().some(
      (r) => r.userId === userId && r.bookId === bookId && r.orderId === orderId
    );

    if (isAlreadyReviewed) {
      return throwError(() => new Error('Anda sudah mengulas buku ini untuk pesanan ini.')).pipe(delay(200));
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      userId,
      bookId,
      orderId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    const updated = [newReview, ...this.reviews()];
    this.reviews.set(updated);
    localStorage.setItem(this.REVIEWS_KEY, JSON.stringify(updated));

    // Update Book Rating in book service
    this.bookService.updateRating(bookId, rating);

    return of(newReview).pipe(delay(300));
  }

  hasReviewed(userId: string, bookId: string, orderId: string): boolean {
    return this.reviews().some(
      (r) => r.userId === userId && r.bookId === bookId && r.orderId === orderId
    );
  }
}
