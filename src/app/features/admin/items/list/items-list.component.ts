import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ItemStore } from '../../../../store/item.store';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { CatalogItem } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { ItemsFormComponent } from '../form/items-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-items-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, ItemsFormComponent, SpinnerComponent],
  templateUrl: './items-list.component.html'
})
export class ItemsListComponent implements OnInit {
  protected readonly itemStore = inject(ItemStore);
  protected readonly uomGroupStore = inject(UomGroupStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  uomMap = computed(() => {
    const list = this.uomGroupStore.uomGroups() || [];
    return new Map(list.map(g => [g.id, g.name]));
  });

  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const items = this.itemStore.items() || [];
    if (!query) return items;
    return items.filter(i => 
      i.name.toLowerCase().includes(query) || 
      i.sapCode.toLowerCase().includes(query) ||
      i.itemType.toLowerCase().includes(query) ||
      i.baseUomCode.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredItems, 10);

  isModalOpen = signal<boolean>(false);
  editItem = signal<CatalogItem | null>(null);

  ngOnInit() {
    this.itemStore.loadItems();
    this.uomGroupStore.loadUomGroups();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editItem.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(item: CatalogItem) {
    this.editItem.set(item);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Catalog Item?',
      'Apakah Anda yakin ingin menghapus catalog item ini?'
    );
    if (isConfirmed) {
      await this.itemStore.deleteItem(id);
    }
  }

  onRefresh() {
    this.itemStore.loadItems();
    this.uomGroupStore.loadUomGroups();
  }
}
