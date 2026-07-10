import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { WarehouseStockStore } from '../../../../store/warehouse-stock.store';
import { WarehouseStore } from '../../../../store/warehouse.store';
import { ItemStore } from '../../../../store/item.store';
import { WarehouseStock } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { StocksFormComponent } from '../form/stocks-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stocks-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, StocksFormComponent, SpinnerComponent],
  templateUrl: './stocks-list.component.html'
})
export class StocksListComponent implements OnInit {
  protected readonly stockStore = inject(WarehouseStockStore);
  protected readonly warehouseStore = inject(WarehouseStore);
  protected readonly itemStore = inject(ItemStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  warehouseMap = computed(() => {
    const list = this.warehouseStore.warehouses() || [];
    return new Map(list.map(w => [w.id, w.name]));
  });

  itemMap = computed(() => {
    const list = this.itemStore.items() || [];
    return new Map(list.map(i => [i.id, i.name]));
  });

  filteredStocks = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const stocks = this.stockStore.stocks() || [];
    const whMap = this.warehouseMap();
    const itMap = this.itemMap();

    if (!query) return stocks;

    return stocks.filter(s => {
      const whName = (whMap.get(s.warehouseId) || '').toLowerCase();
      const itemName = (itMap.get(s.itemId) || '').toLowerCase();
      return (
        whName.includes(query) ||
        itemName.includes(query) ||
        s.baseUomCode.toLowerCase().includes(query)
      );
    });
  });

  protected readonly pagination = createClientPagination(this.filteredStocks, 10);

  isModalOpen = signal<boolean>(false);
  editStock = signal<WarehouseStock | null>(null);

  ngOnInit() {
    this.stockStore.loadWarehouseStocks();
    this.warehouseStore.loadWarehouses();
    this.itemStore.loadItems();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editStock.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(stock: WarehouseStock) {
    this.editStock.set(stock);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Catatan Stok?',
      'Apakah Anda yakin ingin menghapus catatan stok ini?'
    );
    if (isConfirmed) {
      await this.stockStore.deleteWarehouseStock(id);
    }
  }

  onRefresh() {
    this.stockStore.loadWarehouseStocks();
    this.warehouseStore.loadWarehouses();
    this.itemStore.loadItems();
  }
}
