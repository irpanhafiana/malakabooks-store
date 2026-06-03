import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { ReviewService } from '../../../core/services/review.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { Book } from '../../../core/models/book.model';
import { Category } from '../../../core/models/category.model';
import { Review } from '../../../core/models/review.model';

import { BookDetailDesktopComponent } from './book-detail-desktop';
import { BookDetailMobileComponent } from './book-detail-mobile';

@Component({
  selector: 'app-book-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    BookDetailDesktopComponent,
    BookDetailMobileComponent
  ],
  templateUrl: './book-detail.html'
})
export class BookDetailPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly reviewService = inject(ReviewService);
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  book = signal<Book | null>(null);
  categoryName = signal('');
  reviews = signal<Review[]>([]);
  relatedBooks = signal<Book[]>([]);

  // States
  isLoading = signal(true);
  qty = signal(1);
  activeTab = signal<'sinopsis' | 'spesifikasi' | 'ulasan'>('sinopsis');

  ngOnInit() {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params['id'];
        if (id) {
          this.loadBookDetails(id);
        }
      });
  }

  loadBookDetails(id: string) {
    this.isLoading.set(true);
    this.qty.set(1); // Reset quantiy selection

    this.bookService.getById(id).subscribe((b) => {
      if (b) {
        this.book.set(b);

        // Load Category Name
        this.categoryService.getById(b.categoryId).subscribe((cat) => {
          this.categoryName.set(cat ? cat.name : 'Umum');
        });

        // Load Reviews
        this.reviewService.getByBook(b.id).subscribe((revs) => {
          this.reviews.set(revs);
        });

        // Load Related Books
        this.bookService.getByCategory(b.categoryId).subscribe((list) => {
          // Filter current book out and slice top 4 related books
          const filtered = list.filter((item) => item.id !== b.id);
          this.relatedBooks.set(filtered.slice(0, 4));
        });

        this.isLoading.set(false);
      } else {
        this.book.set(null);
        this.isLoading.set(false);
      }
    });
  }

  incrementQty() {
    const max = this.book()?.stock || 1;
    if (this.qty() < max) {
      this.qty.update((current) => current + 1);
    }
  }

  decrementQty() {
    if (this.qty() > 1) {
      this.qty.update((current) => current - 1);
    }
  }

  onAddToCart() {
    const activeBook = this.book();
    if (activeBook && this.qty() > 0) {
      this.cartService.addItem(activeBook.id, this.qty());
      this.toastService.showSuccess(
        `Berhasil menambahkan ${this.qty()} eksemplar "${activeBook.title}" ke keranjang.`
      );
    }
  }
}
