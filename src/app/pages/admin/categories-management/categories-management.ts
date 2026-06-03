import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { BookService } from '../../../core/services/book.service';
import { Category } from '../../../core/models/category.model';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-categories-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, FormInputComponent],
  templateUrl: './categories-management.html'
})
export class CategoriesManagementPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly bookService = inject(BookService);
  private readonly toastService = inject(ToastService);

  categories = signal<Category[]>([]);
  
  // Loading & Modals
  isLoading = signal(true);
  showModal = signal(false);
  isEditing = signal(false);
  editingId?: string;

  // Form Fields
  name = '';
  description = '';
  icon = 'book-open';

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.categoryService.getAll().subscribe((list) => {
      this.categories.set(list);
      this.isLoading.set(false);
    });
  }

  getBookCount(catId: string): number {
    return this.bookService.booksSignal().filter((b) => b.categoryId === catId).length;
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
    this.name = '';
    this.description = '';
    this.icon = 'book-open';
    this.editingId = undefined;
  }

  openEditModal(cat: Category) {
    this.isEditing.set(true);
    this.editingId = cat.id;
    this.name = cat.name;
    this.description = cat.description;
    this.icon = cat.icon;

    this.showModal.set(true);
  }

  onSaveCategory() {
    if (!this.name || !this.description || !this.icon) {
      this.toastService.showError('Silakan lengkapi semua kolom kategori.');
      return;
    }

    const payload = {
      name: this.name,
      description: this.description,
      icon: this.icon
    };

    if (this.isEditing() && this.editingId) {
      this.categoryService.update(this.editingId, payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Kategori berhasil diperbarui.');
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => this.toastService.showError(err.message || 'Gagal memperbarui kategori.')
      });
    } else {
      this.categoryService.create(payload).subscribe({
        next: () => {
          this.toastService.showSuccess('Kategori baru berhasil ditambahkan.');
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => this.toastService.showError(err.message || 'Gagal menambahkan kategori.')
      });
    }
  }

  onDeleteCategory(id: string, name: string) {
    // Check if books are still categorized in this category
    const bookCount = this.getBookCount(id);
    if (bookCount > 0) {
      this.toastService.showError(`Kategori "${name}" tidak dapat dihapus karena masih menampung ${bookCount} buku.`);
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) {
      this.categoryService.delete(id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Kategori "${name}" berhasil dihapus.`);
          this.loadCategories();
        },
        error: (err) => this.toastService.showError(err.message || 'Gagal menghapus kategori.')
      });
    }
  }
}
