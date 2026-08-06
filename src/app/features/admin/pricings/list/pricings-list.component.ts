import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PricingStore } from '../../../../store/pricing.store';
import { ItemStore } from '../../../../store/item.store';
import { Pricing } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import { AdminSearchInputComponent } from '../../../../shared/ui/admin-search-input/admin-search-input.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pricings-list',
  standalone: true,
  imports: [CommonModule, TableComponent, AdminButtonComponent, IconComponent, PaginationComponent, SpinnerComponent, TooltipDirective, AdminSearchInputComponent],
  templateUrl: './pricings-list.component.html'
})
export class PricingsListComponent implements OnInit {
  protected readonly pricingStore = inject(PricingStore);
  protected readonly itemStore = inject(ItemStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredPricings = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const pricings = this.pricingStore.pricings() || [];
    if (!query) return pricings;
    return pricings.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.itemId || '').toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredPricings, 10);

  private readonly router = inject(Router);

  itemMap = computed(() => {
    const list = this.itemStore.items() || [];
    return new Map(list.map(i => [i.id, i]));
  });

  ngOnInit() {
    this.pricingStore.loadPricings();
    this.itemStore.loadItems();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.router.navigate(['/admin/pricings/new']);
  }

  openEditModal(pricing: Pricing) {
    this.router.navigate(['/admin/pricings/edit', pricing.id]);
  }

  async onToggleActive(pricing: Pricing, active: boolean) {
    const actionText = active ? 'mengaktifkan' : 'menonaktifkan';
    const isConfirmed = await this.alertService.confirm(
      active ? 'Publish Pricing?' : 'Nonaktifkan Pricing?',
      `Apakah Anda yakin ingin ${actionText} pricing "${pricing.name}"?`
    );
    if (isConfirmed) {
      await this.pricingStore.savePricing({ ...pricing, isActive: active });
    }
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Pricing Master?',
      'Apakah Anda yakin ingin menghapus pricing master ini?'
    );
    if (isConfirmed) {
      await this.pricingStore.deletePricing(id);
    }
  }

  onRefresh() {
    this.pricingStore.loadPricings();
  }
}
