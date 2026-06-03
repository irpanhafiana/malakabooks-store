import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Book } from '../models/book.model';
import { BOOKS_DATA } from '../data/books.data';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly BOOKS_KEY = 'malaka_books';
  private books = signal<Book[]>([]);
  readonly booksSignal = this.books.asReadonly();

  constructor() {
    this.initBooks();
  }

  private initBooks() {
    const storedBooks = localStorage.getItem(this.BOOKS_KEY);
    if (storedBooks) {
      this.books.set(JSON.parse(storedBooks));
    } else {
      this.books.set(BOOKS_DATA);
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(BOOKS_DATA));
    }
  }

  getAll(): Observable<Book[]> {
    return of(this.books()).pipe(delay(300));
  }

  getById(id: string): Observable<Book | undefined> {
    const book = this.books().find((b) => b.id === id);
    return of(book).pipe(delay(200));
  }

  getByCategory(categoryId: string): Observable<Book[]> {
    const filtered = this.books().filter((b) => b.categoryId === categoryId);
    return of(filtered).pipe(delay(200));
  }

  search(
    query: string,
    categoryId?: string,
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
    sortBy?: 'latest' | 'price-asc' | 'price-desc' | 'rating-desc'
  ): Observable<Book[]> {
    let result = [...this.books()];

    // Filter by search query (title or author)
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    // Filter by Category
    if (categoryId && categoryId !== 'all') {
      result = result.filter((b) => b.categoryId === categoryId);
    }

    // Filter by price
    if (minPrice !== undefined) {
      result = result.filter((b) => b.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      result = result.filter((b) => b.price <= maxPrice);
    }

    // Filter by rating
    if (minRating !== undefined) {
      result = result.filter((b) => b.averageRating >= minRating);
    }

    // Sorting
    if (sortBy) {
      if (sortBy === 'latest') {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === 'price-asc') {
        result.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        result.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating-desc') {
        result.sort((a, b) => b.averageRating - a.averageRating);
      }
    }

    return of(result).pipe(delay(300));
  }

  create(bookData: Omit<Book, 'id' | 'averageRating' | 'totalReviews' | 'createdAt'>): Observable<Book> {
    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}`,
      averageRating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString()
    };

    const updated = [newBook, ...this.books()];
    this.books.set(updated);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updated));

    return of(newBook).pipe(delay(350));
  }

  update(id: string, bookData: Partial<Book>): Observable<Book> {
    const bookIndex = this.books().findIndex((b) => b.id === id);
    if (bookIndex === -1) {
      return throwError(() => new Error('Buku tidak ditemukan.')).pipe(delay(200));
    }

    const currentBook = this.books()[bookIndex];
    const updatedBook: Book = {
      ...currentBook,
      ...bookData
    };

    const updatedList = this.books().map((b) => (b.id === id ? updatedBook : b));
    this.books.set(updatedList);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(updatedList));

    return of(updatedBook).pipe(delay(300));
  }

  delete(id: string): Observable<boolean> {
    const exists = this.books().some((b) => b.id === id);
    if (!exists) {
      return throwError(() => new Error('Buku tidak ditemukan.')).pipe(delay(200));
    }

    const filtered = this.books().filter((b) => b.id !== id);
    this.books.set(filtered);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(filtered));

    return of(true).pipe(delay(250));
  }

  // Update book rating when a new review is submitted
  updateRating(id: string, newRating: number): void {
    const book = this.books().find((b) => b.id === id);
    if (book) {
      const totalRev = book.totalReviews + 1;
      const avgRating = parseFloat(((book.averageRating * book.totalReviews + newRating) / totalRev).toFixed(1));
      
      this.update(id, { averageRating: avgRating, totalReviews: totalRev }).subscribe();
    }
  }
}
