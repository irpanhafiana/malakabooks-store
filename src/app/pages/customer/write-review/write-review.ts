import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookService } from '../../../core/services/book.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Book } from '../../../core/models/book.model';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

import { ViewportService } from '../../../core/services/viewport.service';
import { WriteReviewDesktopComponent } from './write-review-desktop';
import { WriteReviewMobileComponent } from './write-review-mobile';

@Component({
  selector: 'app-write-review-page',
  standalone: true,
  imports: [
    CommonModule,
    WriteReviewDesktopComponent,
    WriteReviewMobileComponent
  ],
  templateUrl: './write-review.html'
})
export class WriteReviewPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly reviewService = inject(ReviewService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  orderId = '';
  bookId = '';
  
  book = signal<Book | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);

  // Form Fields
  rating = signal(0);
  comment = '';

  ngOnInit() {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.orderId = params['orderId'];
        this.bookId = params['bookId'];
        
        if (this.orderId && this.bookId) {
          this.loadBookDetails(this.bookId);
        }
      });
  }

  loadBookDetails(id: string) {
    this.isLoading.set(true);
    this.bookService.getById(id).subscribe((b) => {
      this.book.set(b || null);
      this.isLoading.set(false);
    });
  }

  onRatingChange(stars: number) {
    this.rating.set(stars);
  }

  getRatingText(stars: number): string {
    const texts = ['Pilih Rating', 'Sangat Buruk', 'Buruk', 'Cukup Baik', 'Sangat Baik', 'Sempurna'];
    return texts[stars] || '';
  }

  onSubmitReview() {
    if (this.rating() === 0) {
      this.toastService.showError('Silakan pilih rating bintang terlebih dahulu.');
      return;
    }

    if (!this.comment.trim()) {
      this.toastService.showError('Silakan berikan ulasan tertulis.');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    this.isSubmitting.set(true);

    this.reviewService
      .createReview(user.id, this.bookId, this.orderId, this.rating(), this.comment.trim())
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess('Ulasan Anda berhasil dikirimkan. Terima kasih!');
          this.router.navigate(['/account/orders', this.orderId]);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.showError(err.message || 'Gagal mengirimkan ulasan.');
        }
      });
  }
}
