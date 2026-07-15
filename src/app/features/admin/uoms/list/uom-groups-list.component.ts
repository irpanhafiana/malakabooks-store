import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { UomGroup } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { UomGroupsFormComponent } from '../form/uom-groups-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-uom-groups-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, UomGroupsFormComponent, SpinnerComponent, TooltipDirective],
  templateUrl: './uom-groups-list.component.html'
})
export class UomGroupsListComponent implements OnInit {
  protected readonly uomGroupStore = inject(UomGroupStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredUoms = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const groups = this.uomGroupStore.uomGroups() || [];
    if (!query) return groups;
    return groups.filter(g => 
      g.name.toLowerCase().includes(query) || 
      g.baseUomCode.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredUoms, 10);

  isModalOpen = signal<boolean>(false);
  editUomGroup = signal<UomGroup | null>(null);

  ngOnInit() {
    this.uomGroupStore.loadUomGroups();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editUomGroup.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(group: UomGroup) {
    this.editUomGroup.set(group);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Satuan Ukuran?',
      'Apakah Anda yakin ingin menghapus group satuan ukuran ini?'
    );
    if (isConfirmed) {
      await this.uomGroupStore.deleteUomGroup(id);
    }
  }

  onRefresh() {
    this.uomGroupStore.loadUomGroups();
  }
}
