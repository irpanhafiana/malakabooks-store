import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { DatePipe, NgClass } from '@angular/common';
import { OrderStore } from '../../../../store/order.store';
import { Order } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { PriceComponent } from '../../../../shared/ui/price/price.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../../core/services/alert.service';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';
import { DrawerComponent } from '../../../../shared/ui/drawer/drawer.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';
import { AdminSearchInputComponent } from '../../../../shared/ui/admin-search-input/admin-search-input.component';
import { ShippingLabelService } from '../../../../core/services/shipping-label.service';
import {
  extractDetailResiData,
  getWaybillField,
  getWaybillHistory,
  getWaybillLogDate,
  getWaybillLogDesc,
  getWaybillLogLoc,
  getWaybillSummaryEntries
} from '../../../../core/services/waybill-normalizer';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-orders-list',
  standalone: true,
  imports: [DatePipe, NgClass, TableComponent, PriceComponent, PaginationComponent, SpinnerComponent, StatusBadgeComponent, IconComponent, DrawerComponent, AdminButtonComponent, TooltipDirective, AdminSearchInputComponent],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.css'
})
export class OrdersListComponent implements OnInit {
  protected readonly orderStore = inject(OrderStore);
  private readonly alertService = inject(AlertService);
  private readonly shippingLabelService = inject(ShippingLabelService);

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

  // Detail Resi state
  protected readonly detailResiOpen = signal(false);
  protected readonly detailResiLoading = signal(false);
  protected readonly detailResiError = signal<string | null>(null);
  protected readonly detailResiData = signal<unknown>(null);
  protected readonly selectedOrder = signal<Order | null>(null);


  onSearch(query: string) {
    this.searchQuery.set(query);
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

  async onCreateShipment(orderId: string) {
    const isConfirmed = await this.alertService.confirm(
      'Buat Pengiriman?',
      `Apakah Anda yakin ingin memproses pengiriman untuk pesanan #${orderId}?`
    );
    if (!isConfirmed) return;

    try {
      const res = await this.orderStore.createShipment(orderId);
      if ((res as any)?.isSuccess || (res as any)?.shipmentCreated) {
        this.alertService.success(
          'Berhasil!',
          `Pengiriman berhasil dibuat. AWB: ${(res as any).awbNo || '-'}`
        );
        this.orderStore.loadAllOrders(); // Refresh status order
      } else {
        this.alertService.error('Gagal!', (res as any)?.statusMessage || (res as any)?.message || 'Gagal memproses pengiriman.');
      }
    } catch (e: unknown) {
      const err = e as { error?: { statusMessage?: string; message?: string } };
      const errorMsg = err?.error?.statusMessage || err?.error?.message || 'Terjadi kesalahan sistem saat membuat pengiriman.';
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
      const responses = Array.isArray(results) ? results : ((results as any)?.results || []);
      const successCount = responses.filter((r: { isSuccess?: boolean; shipmentCreated?: boolean }) => r.isSuccess || r.shipmentCreated).length;
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
    } catch (e: unknown) {
      const err = e as { error?: { statusMessage?: string; message?: string } };
      const errorMsg = err?.error?.statusMessage || err?.error?.message || 'Terjadi kesalahan sistem saat membuat pengiriman massal.';
      this.alertService.error('Error!', errorMsg);
    }
  }

  async onCancelShipment(order: any) {
    const isConfirmed = await this.alertService.confirm(
      'Batalkan Resi?',
      `Apakah Anda yakin ingin membatalkan resi pengiriman untuk pesanan #${order.id}? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!isConfirmed) return;

    try {
      const res = await this.orderStore.cancelShipment(order.id);
      if ((res as any)?.isSuccess || (res as any)?.shipmentCancelled) {
        this.alertService.success('Berhasil!', 'Resi pengiriman berhasil dibatalkan.');
        this.orderStore.loadAllOrders();
      } else {
        this.alertService.error('Gagal!', (res as any)?.statusMessage || (res as any)?.message || 'Gagal membatalkan resi.');
      }
    } catch (e: unknown) {
      const err = e as { error?: { statusMessage?: string; message?: string } };
      const errorMsg = err?.error?.statusMessage || err?.error?.message || 'Terjadi kesalahan sistem saat membatalkan resi.';
      this.alertService.error('Error!', errorMsg);
    }
  }

  async onDetailResi(order: any) {
    this.selectedOrder.set(order);
    this.detailResiOpen.set(true);
    this.detailResiLoading.set(true);
    this.detailResiError.set(null);
    this.detailResiData.set(null);

    const courier = order.shippingCourier?.trim() || '';
    const awb = order.trackingNumber?.trim() || '';

    if (!courier || !awb) {
      this.detailResiError.set('Data kurir atau nomor resi tidak tersedia untuk pesanan ini.');
      this.detailResiLoading.set(false);
      return;
    }

    try {
      const res = await this.orderStore.getDetailResi(courier, awb);
      this.detailResiData.set(res);
    } catch (e: unknown) {
      const err = e as { error?: { statusMessage?: string; message?: string }; message?: string };
      this.detailResiError.set(err?.error?.statusMessage || err?.error?.message || err?.message || 'Gagal memuat detail resi pengiriman.');
    } finally {
      this.detailResiLoading.set(false);
    }
  }

  protected closeDetailResi() {
    this.detailResiOpen.set(false);
    this.detailResiData.set(null);
    this.detailResiError.set(null);
    this.selectedOrder.set(null);
  }

  protected printLabel() {
    const order = this.selectedOrder();
    if (!order) return;
    const ok = this.shippingLabelService.printLabel(order, this.detailResiDetails());
    if (!ok) {
      this.alertService.error('Gagal!', 'Popup terblokir. Izinkan popup untuk mencetak label.');
    }
  }

  // --- Detail Resi display helpers ---
  protected readonly detailResiDetails = computed(() => {
    return extractDetailResiData(this.detailResiData());
  });

  protected drField(...keys: string[]): string {
    return getWaybillField(this.detailResiDetails(), ...keys);
  }

  protected readonly drHistory = computed(() => {
    return getWaybillHistory(this.detailResiDetails());
  });

  protected drLogDate(log: unknown): string {
    return getWaybillLogDate(log);
  }

  protected drLogDesc(log: unknown): string {
    return getWaybillLogDesc(log);
  }

  protected drLogLoc(log: unknown): string {
    return getWaybillLogLoc(log);
  }

  protected drStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('terima') || s.includes('sukses')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s.includes('transit') || s.includes('kirim') || s.includes('jalan')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (s.includes('pickup') || s.includes('kurir') || s.includes('proses')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (s.includes('fail') || s.includes('gagal') || s.includes('cancel')) return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  }

  protected drEntries(obj: unknown): { key: string; val: string }[] {
    return getWaybillSummaryEntries(obj);
  }

  onRefresh() {
    this.orderStore.loadAllOrders();
  }
}