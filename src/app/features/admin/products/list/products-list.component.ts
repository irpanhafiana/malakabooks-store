import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductStore } from '../../../../store/product.store';
import { Product } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { PriceComponent } from '../../../../shared/ui/price/price.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { ProductsFormComponent } from '../form/products-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, TableComponent, ModalComponent, ButtonComponent, BadgeComponent, PriceComponent, IconComponent, PaginationComponent, ProductsFormComponent, SpinnerComponent],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})
export class ProductsListComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');
  isModalOpen = signal<boolean>(false);
  editProduct = signal<Product | null>(null);

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.productStore.products();
    if (!query) return list;
    return list.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query));
  });

  protected readonly pagination = createClientPagination(this.filteredList, 10);

  ngOnInit() {
    this.productStore.loadAll();
  }

  onSearchInput(val: string) {
    this.searchQuery.set(val);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editProduct.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product) {
    this.editProduct.set(product);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Produk?',
      'Produk ini akan dihapus secara permanen dari katalog.'
    );
    if (isConfirmed) {
      await this.productStore.deleteProduct(id);
      this.alertService.success('Berhasil!', 'Produk telah berhasil dihapus.');
    }
  }
}
