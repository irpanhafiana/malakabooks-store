import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AddressService } from '../../../core/services/address.service';
import { Order } from '../../../core/models/order.model';
import { Address } from '../../../core/models/address.model';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-orders-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyRupiahPipe, LoadingSpinnerComponent],
  templateUrl: './orders-management.html'
})
export class OrdersManagementPage implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly addressService = inject(AddressService);
  private readonly toastService = inject(ToastService);

  orders = signal<Order[]>([]);
  filteredOrders = signal<Order[]>([]);
  
  // Loading & Modal state
  isLoading = signal(true);
  showModal = signal(false);
  activeOrder = signal<Order | null>(null);
  activeAddress = signal<Address | null>(null);

  statusFilter = 'all';

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.orderService.getAll().subscribe((list) => {
      // Sort by latest order first
      const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.orders.set(sorted);
      this.applyFilter();
      this.isLoading.set(false);
    });
  }

  applyFilter() {
    if (this.statusFilter === 'all') {
      this.filteredOrders.set(this.orders());
    } else {
      const filtered = this.orders().filter((o) => o.status === this.statusFilter);
      this.filteredOrders.set(filtered);
    }
  }

  onStatusChange(orderId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as Order['status'];

    if (confirm(`Apakah Anda yakin ingin memperbarui status pesanan ${orderId} ke "${this.getStatusText(newStatus)}"?`)) {
      this.isLoading.set(true);
      
      // If updating to shipped, let's ask for an optional tracking resi number simulation
      if (newStatus === 'shipped') {
        const resi = prompt('Masukkan Nomor Resi Pengiriman (Simulasi):', `MS-${Date.now().toString().substr(6, 6)}`);
        if (resi) {
          this.toastService.showInfo(`Resi ${resi} dimasukkan ke pesanan.`);
        }
      }

      this.orderService.updateStatus(orderId, newStatus).subscribe({
        next: () => {
          this.toastService.showSuccess(`Status pesanan ${orderId} berhasil diperbarui.`);
          this.loadOrders();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastService.showError(err.message || 'Gagal mengubah status pesanan.');
        }
      });
    } else {
      // Refresh list to rollback visual select state
      this.loadOrders();
    }
  }

  openDetailModal(order: Order) {
    this.activeOrder.set(order);
    this.activeAddress.set(null);
    this.showModal.set(true);

    // Fetch Address details
    this.addressService.getById(order.addressId).subscribe((addr) => {
      this.activeAddress.set(addr || null);
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.activeOrder.set(null);
    this.activeAddress.set(null);
  }

  getSubtotal(ord: Order): number {
    return ord.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  getStatusText(status: Order['status']): string {
    const mappings: Record<Order['status'], string> = {
      pending: 'Menunggu',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Selesai',
      cancelled: 'Batal'
    };
    return mappings[status] || status;
  }
}
