import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { UomGroup } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-uom-groups-list',
  standalone: true,
  imports: [TableComponent, AdminButtonComponent, IconComponent, PaginationComponent, SpinnerComponent, TooltipDirective],
  templateUrl: './uom-groups-list.component.html'
})
export class UomGroupsListComponent implements OnInit {
  protected readonly uomGroupStore = inject(UomGroupStore);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);

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

  ngOnInit() {
    this.uomGroupStore.loadUomGroups();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.router.navigate(['/admin/uoms/new']);
  }

  openEditModal(group: UomGroup) {
    this.router.navigate(['/admin/uoms/edit', group.id]);
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
