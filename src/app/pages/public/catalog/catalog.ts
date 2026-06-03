import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { Book } from '../../../core/models/book.model';
import { Category } from '../../../core/models/category.model';

import { CatalogDesktopComponent } from './catalog-desktop';
import { CatalogMobileComponent } from './catalog-mobile';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule,
    CatalogDesktopComponent,
    CatalogMobileComponent
  ],
  templateUrl: './catalog.html'
})
export class CatalogPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  isMobileFilterOpen = signal(false);

  // Lists
  categories = signal<Category[]>([]);
  books = signal<Book[]>([]);

  // Filter signals
  searchQuery = signal('');
  selectedCategory = signal('all');
  minPrice?: number;
  maxPrice?: number;
  minRating = signal(0);
  sortBy: 'latest' | 'price-asc' | 'price-desc' | 'rating-desc' = 'latest';

  // Pagination & Loading
  isLoading = signal(true);
  currentPage = signal(1);
  pageSize = 6;
  totalPages = signal(1);
  totalItems = signal(0);

  // Derived computed signal
  paginatedBooks = signal<Book[]>([]);

  ngOnInit() {
    // Load categories
    this.categoryService.getAll().subscribe((cats) => this.categories.set(cats));

    // Listen to query parameters to drive filters
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['category']) this.selectedCategory.set(params['category']);
        if (params['q']) this.searchQuery.set(params['q']);
        if (params['sort']) this.sortBy = params['sort'];
        
        this.fetchFilteredBooks();
      });
  }

  fetchFilteredBooks() {
    this.isLoading.set(true);
    this.bookService
      .search(
        this.searchQuery(),
        this.selectedCategory(),
        this.minPrice,
        this.maxPrice,
        this.minRating() > 0 ? this.minRating() : undefined,
        this.sortBy
      )
      .subscribe((result) => {
        this.books.set(result);
        this.totalItems.set(result.length);
        this.totalPages.set(Math.ceil(result.length / this.pageSize));
        
        // Recalculate paginated page chunk
        this.applyPagination();
        this.isLoading.set(false);
      });
  }

  applyPagination() {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBooks.set(this.books().slice(start, end));
  }

  // Action handlers
  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.fetchFilteredBooks();
  }

  onCategorySelect(catId: string) {
    this.selectedCategory.set(catId);
    this.currentPage.set(1);
    
    // Sync with router query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: catId === 'all' ? null : catId },
      queryParamsHandling: 'merge'
    });
  }

  onRatingSelect(stars: number) {
    if (this.minRating() === stars) {
      this.minRating.set(0); // Toggle reset
    } else {
      this.minRating.set(stars);
    }
    this.currentPage.set(1);
    this.fetchFilteredBooks();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.fetchFilteredBooks();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.applyPagination();
    // Scroll window smoothly to the top of catalog
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.minRating.set(0);
    this.sortBy = 'latest';
    this.currentPage.set(1);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, q: null, sort: null }
    });
  }
}
