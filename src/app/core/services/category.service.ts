import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Category } from '../models/category.model';
import { CATEGORIES_DATA } from '../data/categories.data';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly CATEGORIES_KEY = 'malaka_categories';
  private categories = signal<Category[]>([]);

  constructor() {
    this.initCategories();
  }

  private initCategories() {
    const stored = localStorage.getItem(this.CATEGORIES_KEY);
    if (stored) {
      this.categories.set(JSON.parse(stored));
    } else {
      this.categories.set(CATEGORIES_DATA);
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(CATEGORIES_DATA));
    }
  }

  getAll(): Observable<Category[]> {
    return of(this.categories()).pipe(delay(200));
  }

  getById(id: string): Observable<Category | undefined> {
    const cat = this.categories().find((c) => c.id === id);
    return of(cat).pipe(delay(150));
  }

  create(catData: Omit<Category, 'id' | 'slug'>): Observable<Category> {
    const slug = catData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const isSlugExists = this.categories().some((c) => c.slug === slug);
    if (isSlugExists) {
      return throwError(() => new Error('Kategori dengan nama serupa sudah ada.')).pipe(delay(200));
    }

    const newCategory: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      slug
    };

    const updated = [...this.categories(), newCategory];
    this.categories.set(updated);
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(updated));

    return of(newCategory).pipe(delay(250));
  }

  update(id: string, catData: Partial<Category>): Observable<Category> {
    const catIndex = this.categories().findIndex((c) => c.id === id);
    if (catIndex === -1) {
      return throwError(() => new Error('Kategori tidak ditemukan.')).pipe(delay(150));
    }

    const currentCat = this.categories()[catIndex];
    let slug = currentCat.slug;
    if (catData.name) {
      slug = catData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    const updatedCategory: Category = {
      ...currentCat,
      ...catData,
      slug
    };

    const updatedList = this.categories().map((c) => (c.id === id ? updatedCategory : c));
    this.categories.set(updatedList);
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(updatedList));

    return of(updatedCategory).pipe(delay(200));
  }

  delete(id: string): Observable<boolean> {
    const exists = this.categories().some((c) => c.id === id);
    if (!exists) {
      return throwError(() => new Error('Kategori tidak ditemukan.')).pipe(delay(150));
    }

    const filtered = this.categories().filter((c) => c.id !== id);
    this.categories.set(filtered);
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(filtered));

    return of(true).pipe(delay(200));
  }
}
