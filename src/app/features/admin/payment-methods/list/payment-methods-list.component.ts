import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PaymentStore } from '../../../../store/payment.store';
import { Payment } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { PaymentMethodsFormComponent } from '../form/payment-methods-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import { AdminSearchInputComponent } from '../../../../shared/ui/admin-search-input/admin-search-input.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-payment-methods-list',
  standalone: true,
  imports: [TableComponent, ModalComponent, AdminButtonComponent, IconComponent, PaginationComponent, PaymentMethodsFormComponent, SpinnerComponent, TooltipDirective, AdminSearchInputComponent],
  templateUrl: './payment-methods-list.component.html'
})
export class PaymentMethodsListComponent implements OnInit {
  protected readonly paymentStore = inject(PaymentStore);
  private readonly alertService = inject(AlertService);

  searchQuery = signal<string>('');

  filteredPayments = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const payments = this.paymentStore.payments() || [];
    if (!query) return payments;
    return payments.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.methodType.toLowerCase().includes(query)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredPayments, 10);

  isModalOpen = signal<boolean>(false);
  editPayment = signal<Payment | null>(null);

  ngOnInit() {
    this.paymentStore.loadPayments();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.pagination.setPage(1);
  }

  openAddModal() {
    this.editPayment.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(payment: Payment) {
    this.editPayment.set(payment);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onDelete(id: string) {
    const isConfirmed = await this.alertService.confirm(
      'Hapus Payment Method?',
      'Apakah Anda yakin ingin menghapus metode pembayaran ini?'
    );
    if (isConfirmed) {
      await this.paymentStore.deletePayment(id, { showToast: false });
      this.alertService.success('Berhasil!', 'Payment Method telah berhasil dihapus.');
    }
  }

  onRefresh() {
    this.paymentStore.loadPayments();
  }
}