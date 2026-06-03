import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { Book } from '../../../core/models/book.model';
import { Category } from '../../../core/models/category.model';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-books-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyRupiahPipe, LoadingSpinnerComponent, PaginationComponent, FormInputComponent],
  templateUrl: './books-management.html'
})
export class BooksManagementPage implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);

  // Lists
  books = signal<Book[]>([]);
  categories = signal<Category[]>([]);
  
  categoryOptions = computed(() => {
    return this.categories().map((cat) => ({
      label: cat.name,
      value: cat.id
    }));
  });
  filteredBooks = signal<Book[]>([]);
  paginatedBooks = signal<Book[]>([]);

  // Filtering / Search
  searchQuery = '';
  selectedCategory = 'all';

  // Pagination & Modals
  isLoading = signal(true);
  showModal = signal(false);
  isEditing = signal(false);
  editingId?: string;

  currentPage = signal(1);
  pageSize = 8;
  totalPages = signal(1);

  // Form Fields
  title = '';
  author = '';
  isbn = '';
  categoryId = '';
  price = 0;
  description = '';
  coverImage = '';
  publisher = '';
  publishedYear = 2026;
  pages = 0;
  weight = 0;
  stock = 0;

  ngOnInit() {
    this.categoryService.getAll().subscribe((cats) => this.categories.set(cats));
    this.loadBooks();
  }

  loadBooks() {
    this.isLoading.set(true);
    this.bookService.getAll().subscribe((list) => {
      this.books.set(list);
      this.applyFilters();
      this.isLoading.set(false);
    });
  }

  applyFilters() {
    let result = [...this.books()];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    if (this.selectedCategory !== 'all') {
      result = result.filter((b) => b.categoryId === this.selectedCategory);
    }

    this.filteredBooks.set(result);
    this.totalPages.set(Math.ceil(result.length / this.pageSize));
    this.currentPage.set(1);
    this.applyPagination();
  }

  applyPagination() {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBooks.set(this.filteredBooks().slice(start, end));
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.applyPagination();
  }

  openAddModal() {
    this.resetForm();
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.resetForm();
  }

  resetForm() {
    this.title = '';
    this.author = '';
    this.isbn = '';
    this.categoryId = '';
    this.price = 0;
    this.description = '';
    this.coverImage = '';
    this.publisher = '';
    this.publishedYear = 2026;
    this.pages = 0;
    this.weight = 0;
    this.stock = 0;
    this.editingId = undefined;
  }

  openEditModal(book: Book) {
    this.isEditing.set(true);
    this.editingId = book.id;
    this.title = book.title;
    this.author = book.author;
    this.isbn = book.isbn;
    this.categoryId = book.categoryId;
    this.price = book.price;
    this.description = book.description;
    this.coverImage = book.coverImage;
    this.publisher = book.publisher;
    this.publishedYear = book.publishedYear;
    this.pages = book.pages;
    this.weight = book.weight;
    this.stock = book.stock;

    this.showModal.set(true);
  }

  onSaveBook() {
    if (
      !this.title ||
      !this.author ||
      !this.isbn ||
      !this.categoryId ||
      !this.coverImage ||
      this.price <= 0 ||
      this.stock < 0
    ) {
      this.toastService.showError('Silakan lengkapi informasi buku dengan benar.');
      return;
    }

    const payload = {
      title: this.title,
      author: this.author,
      isbn: this.isbn,
      categoryId: this.categoryId,
      price: this.price,
      description: this.description,
      coverImage: this.coverImage,
      publisher: this.publisher,
      publishedYear: this.publishedYear,
      pages: this.pages,
      weight: this.weight,
      stock: this.stock
    };

    if (this.isEditing() && this.editingId) {
      this.bookService.update(this.editingId, payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Buku berhasil diperbarui.');
          this.closeModal();
          this.loadBooks();
        },
        error: (err) => this.toastService.showError(err.message || 'Gagal memperbarui buku.')
      });
    } else {
      this.bookService.create(payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Buku baru berhasil ditambahkan.');
          this.closeModal();
          this.loadBooks();
        },
        error: (err) => this.toastService.showError(err.message || 'Gagal menambahkan buku.')
      });
    }
  }

  onDeleteBook(id: string, title: string) {
    if (confirm(`Apakah Anda yakin ingin menghapus buku "${title}" dari katalog?`)) {
      this.bookService.delete(id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Buku "${title}" berhasil dihapus.`);
          this.loadBooks();
        },
        error: (err) => this.toastService.showError(err.message || 'Gagal menghapus buku.')
      });
    }
  }

  getCategoryName(id: string): string {
    const cat = this.categories().find((c) => c.id === id);
    return cat ? cat.name : 'Umum';
  }
}
