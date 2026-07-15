import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ProductStore } from '../../../../store/product.store';
import { Category } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { CategoriesFormComponent } from '../form/categories-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-categories-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, CategoriesFormComponent, SpinnerComponent, TooltipDirective],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const categories = this.productStore.categories() || [];
    if (!query) return categories;
    return categories.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.slug.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredCategories, 10);

  isModalOpen = signal<boolean>(false);
  editCategory = signal<Category | null>(null);

  ngOnInit() {
    this.productStore.loadCategories();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
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

  onRefresh() {
    this.productStore.loadCategories();
  }
}