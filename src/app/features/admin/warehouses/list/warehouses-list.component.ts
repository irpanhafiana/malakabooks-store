import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { WarehouseStore } from '../../../../store/warehouse.store';
import { Warehouse } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { WarehousesFormComponent } from '../form/warehouses-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import { AdminSearchInputComponent } from '../../../../shared/ui/admin-search-input/admin-search-input.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-warehouses-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, WarehousesFormComponent, SpinnerComponent, TooltipDirective, AdminSearchInputComponent],
  templateUrl: './warehouses-list.component.html'
})
export class WarehousesListComponent implements OnInit {
  protected readonly warehouseStore = inject(WarehouseStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredWarehouses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const warehouses = this.warehouseStore.warehouses() || [];
    if (!query) return warehouses;
    return warehouses.filter(w => 
      w.name.toLowerCase().includes(query) || 
      w.code.toLowerCase().includes(query) ||
      w.description.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredWarehouses, 10);

  isModalOpen = signal<boolean>(false);
  editWarehouse = signal<Warehouse | null>(null);

  ngOnInit() {
    this.warehouseStore.loadWarehouses();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editWarehouse.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(warehouse: Warehouse) {
    this.editWarehouse.set(warehouse);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Gudang?',
      'Apakah Anda yakin ingin menghapus gudang ini?'
    );
    if (isConfirmed) {
      await this.warehouseStore.deleteWarehouse(id);
    }
  }

  onRefresh() {
    this.warehouseStore.loadWarehouses();
  }
}
