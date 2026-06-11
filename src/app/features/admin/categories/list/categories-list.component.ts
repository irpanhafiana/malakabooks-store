import { Component, inject, signal, OnInit } from '@angular/core';
import { ProductStore } from '../../../../store/product.store';
import { Category } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { CategoriesFormComponent } from '../form/categories-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, ButtonComponent, IconComponent, PaginationComponent, CategoriesFormComponent, SpinnerComponent],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);

  protected readonly pagination = createClientPagination(this.productStore.categories, 10);

  isModalOpen = signal<boolean>(false);
  editCategory = signal<Category | null>(null);

  ngOnInit() {
    this.productStore.loadCategories();
  }

  openAddModal() {
    this.editCategory.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(category: Category) {
    this.editCategory.set(category);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Kategori?',
      'Apakah Anda yakin ingin menghapus kategori ini? Asosiasi produk dengan kategori ini akan dihapus.'
    );
    if (isConfirmed) {
      await this.productStore.deleteCategory(id);
      this.alertService.success('Berhasil!', 'Kategori telah berhasil dihapus.');
    }
  }
}
