import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ProductStore } from '../../../../store/product.store';
import { Product } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { PriceComponent } from '../../../../shared/ui/price/price.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-products-list',
  standalone: true,
  imports: [TableComponent, AdminButtonComponent, BadgeComponent, PriceComponent, IconComponent, PaginationComponent, SpinnerComponent],
  templateUrl: './products-list.component.html'
})
export class ProductsListComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);

  searchQuery = signal<string>('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.productStore.products();
    if (!query) return list;
    return list.filter(p => p.title.toLowerCase().includes(query) || p.publisher.toLowerCase().includes(query));
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
    this.router.navigate(['/admin/products/new']);
  }

  openEditModal(product: Product) {
    this.router.navigate(['/admin/products/edit', product.id]);
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
