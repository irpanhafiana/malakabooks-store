import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AdminHomeAddressStore } from '../../../../store/admin-home-address.store';
import { HomeAddress } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { HomeAddressesFormComponent } from '../form/home-addresses-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-addresses-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, HomeAddressesFormComponent, SpinnerComponent],
  templateUrl: './home-addresses-list.component.html'
})
export class HomeAddressesListComponent implements OnInit {
  protected readonly store = inject(AdminHomeAddressStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredAddresses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const addresses = this.store.addresses() || [];
    if (!query) return addresses;
    return addresses.filter(a => 
      a.label.toLowerCase().includes(query) || 
      a.recipientName.toLowerCase().includes(query) ||
      a.street.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredAddresses, 10);

  isModalOpen = signal<boolean>(false);
  editAddress = signal<HomeAddress | null>(null);

  ngOnInit() {
    this.store.loadAddresses();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editAddress.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(address: HomeAddress) {
    this.editAddress.set(address);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Alamat?',
      'Apakah Anda yakin ingin menghapus alamat pengiriman ini?'
    );
    if (isConfirmed) {
      await this.store.deleteAddress(id);
    }
  }
}
