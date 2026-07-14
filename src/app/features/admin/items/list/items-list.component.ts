import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ItemStore } from '../../../../store/item.store';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { CatalogItem } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-items-list',
  standalone: true,
  imports: [TableComponent, AdminButtonComponent, IconComponent, PaginationComponent, SpinnerComponent, RouterLink],
  templateUrl: './items-list.component.html'
})
export class ItemsListComponent implements OnInit {
  protected readonly itemStore = inject(ItemStore);
  protected readonly uomGroupStore = inject(UomGroupStore);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);

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
      i.itemType?.toLowerCase().includes(query) ||
      i.baseUomCode.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredItems, 10);

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
    this.router.navigate(['/admin/items/new']);
  }

  openEditModal(item: CatalogItem) {
    this.router.navigate(['/admin/items/edit', item.id]);
  }

  async onToggleActive(item: CatalogItem, active: boolean) {
    const actionText = active ? 'mengaktifkan' : 'menonaktifkan';
    const isConfirmed = await this.alertService.confirm(
      active ? 'Publish Item?' : 'Nonaktifkan Item?',
      `Apakah Anda yakin ingin ${actionText} item "${item.name}"?`
    );
    if (isConfirmed) {
      await this.itemStore.saveItem({ ...item, isActive: active });
    }
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
