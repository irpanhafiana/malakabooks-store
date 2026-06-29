import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { DatePipe } from '@angular/common';
import { OrderStore } from '../../../../store/order.store';
import { Order, OrderStatus } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { PriceComponent } from '../../../../shared/ui/price/price.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-orders-list',
  standalone: true,
  imports: [TableComponent, PriceComponent, DatePipe, PaginationComponent, SpinnerComponent, StatusBadgeComponent, IconComponent],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.css'
})
export class OrdersListComponent implements OnInit {
  protected readonly orderStore = inject(OrderStore);
  private readonly alertService = inject(AlertService);

  protected readonly searchQuery = signal('');
  protected readonly filteredOrders = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const all = this.orderStore.orders();
    if (!q) return all;
    return all.filter(o => 
      o.id.toLowerCase().includes(q) ||
      o.userName?.toLowerCase().includes(q) ||
      o.userEmail?.toLowerCase().includes(q)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredOrders, 10);
  protected readonly selectedOrderIds = signal<string[]>([]);

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  ngOnInit() {
    this.orderStore.loadAllOrders();
  }

  isAllSelected() {
    const paged = this.pagination.paged();
    if (paged.length === 0) return false;
    return paged.every(o => this.selectedOrderIds().includes(o.id));
  }

  toggleSelectAll() {
    const paged = this.pagination.paged();
    const currentSelected = this.selectedOrderIds();
    const allPagedSelected = paged.every(o => currentSelected.includes(o.id));

    if (allPagedSelected) {
      const pagedIds = paged.map(o => o.id);
      this.selectedOrderIds.set(currentSelected.filter(id => !pagedIds.includes(id)));
    } else {
      const newSelected = [...currentSelected];
      paged.forEach(o => {
        if (!newSelected.includes(o.id)) {
          newSelected.push(o.id);
        }
      });
      this.selectedOrderIds.set(newSelected);
    }
  }

  toggleSelectOrder(orderId: string) {
    const currentSelected = this.selectedOrderIds();
    if (currentSelected.includes(orderId)) {
      this.selectedOrderIds.set(currentSelected.filter(id => id !== orderId));
    } else {
      this.selectedOrderIds.set([...currentSelected, orderId]);
    }
  }

  async onStatusChange(orderId: string, status: string, selectElement: HTMLSelectElement, currentStatus: string) {
    const isConfirmed = await this.alertService.confirm(
      'Ubah Status Pesanan?',
      `Apakah Anda yakin ingin mengubah status pesanan ke ${status.toUpperCase()}?`
    );
    if (isConfirmed) {
      await this.orderStore.updateOrderStatus(orderId, status as OrderStatus);
      this.alertService.success('Berhasil!', 'Status pesanan berhasil diperbarui.');
    } else {
      selectElement.value = currentStatus;
    }
  }

  async onCreateShipment(orderId: string) {
    const isConfirmed = await this.alertService.confirm(
      'Buat Pengiriman?',
      `Apakah Anda yakin ingin memproses pengiriman untuk pesanan #${orderId}?`
    );
    if (!isConfirmed) return;

    try {
      const res = await this.orderStore.createShipment(orderId);
      if (res?.isSuccess || res?.shipmentCreated) {
        this.alertService.success(
          'Berhasil!',
          `Pengiriman berhasil dibuat. AWB: ${res.awbNo || '-'}`
        );
        this.orderStore.loadAllOrders(); // Refresh status order
      } else {
        this.alertService.error('Gagal!', res?.message || 'Gagal memproses pengiriman.');
      }
    } catch (e: any) {
      const errorMsg = e?.error?.message || 'Terjadi kesalahan sistem saat membuat pengiriman.';
      this.alertService.error('Error!', errorMsg);
    }
  }

  async onBulkCreateShipment() {
    const selectedIds = this.selectedOrderIds();
    if (selectedIds.length === 0) {
      this.alertService.error('Peringatan!', 'Silakan pilih minimal satu pesanan.');
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Buat Pengiriman Massal?',
      `Apakah Anda yakin ingin memproses pengiriman untuk ${selectedIds.length} pesanan yang dipilih?`
    );
    if (!isConfirmed) return;

    try {
      const results = await this.orderStore.createBulkShipments(selectedIds);
      const responses = Array.isArray(results) ? results : (results?.results || []);
      const successCount = responses.filter((r: any) => r.isSuccess || r.shipmentCreated).length;
      const failCount = selectedIds.length - successCount;

      if (successCount > 0) {
        this.alertService.success(
          'Selesai!',
          `${successCount} pengiriman berhasil diproses.` + (failCount > 0 ? ` ${failCount} gagal.` : '')
        );
      } else if (failCount > 0) {
        this.alertService.error(
          'Gagal!',
          `Semua (${failCount}) pengiriman gagal diproses.`
        );
      } else {
        this.alertService.error('Gagal!', 'Gagal memproses pengiriman massal.');
      }

      this.selectedOrderIds.set([]); // Clear selection
      this.orderStore.loadAllOrders(); // Refresh order status
    } catch (e: any) {
      const errorMsg = e?.error?.message || 'Terjadi kesalahan sistem saat membuat pengiriman massal.';
      this.alertService.error('Error!', errorMsg);
    }
  }
}
