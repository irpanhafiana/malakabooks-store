import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { Book } from '../../../core/models/book.model';
import { Category } from '../../../core/models/category.model';

import { HomeDesktopComponent } from './home-desktop';
import { HomeMobileComponent } from './home-mobile';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    HomeDesktopComponent,
    HomeMobileComponent
  ],
  templateUrl: './home.html'
})
export class HomePage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);
  allCategories = signal<Category[]>([]);
  newReleases = signal<Book[]>([]);
  bestSellers = signal<Book[]>([]);
  allBooks = signal<Book[]>([]);
  selectedCategoryId = signal<string>('all');

  isLoadingCategories = signal(true);
  isLoadingBooks = signal(true);

  filteredBooks = computed(() => {
    const books = this.allBooks();
    const catId = this.selectedCategoryId();
    if (catId === 'all') {
      return books;
    }
    return books.filter((b) => b.categoryId === catId);
  });

  selectCategory(catId: string) {
    this.selectedCategoryId.set(catId);
  }

  ngOnInit() {
    this.categoryService.getAll().subscribe((cats) => {
      this.categories.set(cats.slice(0, 4)); // Show top 4 categories
      this.allCategories.set(cats);
      this.isLoadingCategories.set(false);
    });

    this.bookService.getAll().subscribe((books) => {
      this.allBooks.set(books);
      // Setup New Releases (sorted by createdAt)
      const sortedByDate = [...books].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.newReleases.set(sortedByDate.slice(0, 4));

      // Setup Best Sellers (sorted by averageRating)
      const sortedByRating = [...books].sort((a, b) => b.averageRating - a.averageRating);
      this.bestSellers.set(sortedByRating.slice(0, 7));

      this.isLoadingBooks.set(false);
    });
  }
}
