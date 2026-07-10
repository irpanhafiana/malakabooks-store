import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PricingStore } from '../../../../store/pricing.store';
import { Pricing } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { PricingsFormComponent } from '../form/pricings-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pricings-list',
  standalone: true,
  imports: [CommonModule, TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, PricingsFormComponent, SpinnerComponent],
  templateUrl: './pricings-list.component.html'
})
export class PricingsListComponent implements OnInit {
  protected readonly pricingStore = inject(PricingStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredPricings = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const pricings = this.pricingStore.pricings() || [];
    if (!query) return pricings;
    return pricings.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.code.toLowerCase().includes(query) ||
      p.customerGroupCode.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredPricings, 10);

  isModalOpen = signal<boolean>(false);
  editPricing = signal<Pricing | null>(null);

  ngOnInit() {
    this.pricingStore.loadPricings();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editPricing.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(pricing: Pricing) {
    this.editPricing.set(pricing);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
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
