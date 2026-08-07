import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { TransactionService } from '../../../../core/services/transaction.service';
import { PosAuthService } from '../../../../core/services/pos-auth.service';
import { PosButtonComponent } from '../ui/pos-button/pos-button.component';
import { PosInputComponent } from '../ui/pos-input/pos-input.component';
import { PosCardComponent } from '../ui/pos-card/pos-card.component';

export interface SalesOrderItem {
  docNum: string;
  docDate: string;
  customerName: string;
  customerCode?: string;
  docTotal: number;
  isLocked: boolean;
  lastUpdatedBy: string;
  remarks: string;
  rawOrder?: any;
  [key: string]: any;
}

/**
 * Daftar transaksi tertunda (Sales Order) yang bisa dilanjutkan atau dibatalkan.
 *
 * Port dari `sj-pos-katalog/src/app/pages/held-transaction`. Melanjutkan sebuah
 * tundaan akan MENGUNCI dokumennya atas nama kasir saat ini, supaya dua kasir
 * tidak menggarap keranjang yang sama.
 */
@Component({
  selector: 'app-held-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, PosButtonComponent, PosInputComponent, PosCardComponent],
  templateUrl: './held-transaction.component.html'
})
export class HeldTransactionComponent implements OnInit {
  private transactionService = inject(TransactionService);
  public authService = inject(PosAuthService);
  private router = inject(Router);

  salesOrders = signal<SalesOrderItem[]>([]);
  isLoading = signal(false);
  searchQuery = signal<string>('');

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    this.transactionService.getSalesOrdersList().subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        let rawList: any[] = [];
        if (Array.isArray(res)) {
          rawList = res;
        } else if (res?.results && Array.isArray(res.results)) {
          rawList = res.results;
        } else if (res?.data && Array.isArray(res.data)) {
          rawList = res.data;
        }

        const normalizedList: SalesOrderItem[] = rawList.map(item => ({
          ...item,
          docNum: item.docNum || item.DocNum || '',
          docDate: item.docDate || item.DocDate || '',
          customerName: item.CustomerModel?.Name || item.CustomerModel?.CustomerName || item.customerName || item.CustomerCode || item.customerCode || '-',
          customerCode: item.CustomerCode || item.customerCode || '',
          docTotal: Number(item.docTotal ?? item.DocTotal ?? 0),
          isLocked: !!item.isLocked,
          lastUpdatedBy: item.lastUpdatedBy || item.LastUpdatedBy || '',
          remarks: item.remarks || item.Remarks || '',
          rawOrder: item
        }));

        this.salesOrders.set(normalizedList);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Error fetching Sales Orders list:', err);
        this.salesOrders.set([]);
      }
    });
  }

  filteredOrders() {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.salesOrders();
    return this.salesOrders().filter(item => {
      return item.docNum.toLowerCase().includes(q)
        || item.customerName.toLowerCase().includes(q)
        || item.remarks.toLowerCase().includes(q);
    });
  }

  async processLanjutkanTransaksi(docNum: string, item?: SalesOrderItem) {
    if (!docNum) return;

    const currentUser = this.authService.userName() || 'KASIR';
    const lockedBy = item?.lastUpdatedBy;

    if (item?.isLocked && lockedBy && lockedBy !== currentUser) {
      Swal.fire({
        title: 'Transaksi Dikunci',
        text: `Transaksi #${docNum} sedang dikunci oleh "${lockedBy}". Pengguna lain tidak dapat mengaksesnya.`,
        icon: 'warning'
      });
      return;
    }

    Swal.fire({
      title: 'Memuat & Mengunci Tundaan...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.transactionService.getSalesOrder(docNum).subscribe({
      next: (order: any) => {
        if (!order) {
          Swal.fire('Gagal', 'Detail transaksi tundaan tidak ditemukan.', 'error');
          return;
        }

        // Cek ulang di server: status lock bisa berubah sejak daftar dimuat.
        const orderLockedBy = order.lastUpdatedBy || order.LastUpdatedBy;
        if (order.isLocked && orderLockedBy && orderLockedBy !== currentUser) {
          Swal.close();
          Swal.fire({
            title: 'Transaksi Dikunci',
            text: `Transaksi #${docNum} sedang dikunci oleh "${orderLockedBy}". Pengguna lain tidak dapat mengaksesnya.`,
            icon: 'warning'
          });
          return;
        }

        const updatePayload = {
          ...order,
          isLocked: true,
          LastUpdatedBy: currentUser,
          lastUpdatedBy: currentUser
        };

        this.transactionService.updateSalesOrderLockedUnlocked(updatePayload).subscribe({
          next: () => {
            Swal.close();
            this.router.navigate(['/admin/pos/transaction'], { queryParams: { docNum } });
          },
          error: (err: any) => {
            // Gagal mengunci bukan alasan menahan kasir — tetap lanjut.
            Swal.close();
            console.error('Error updating LockedUnlocked:', err);
            this.router.navigate(['/admin/pos/transaction'], { queryParams: { docNum } });
          }
        });
      },
      error: (err: any) => {
        Swal.close();
        Swal.fire('Gagal', err?.error?.message || err?.message || 'Gagal mengambil detail tundaan.', 'error');
      }
    });
  }

  async processBatalkanTransaksi(item: SalesOrderItem) {
    const docNum = item?.docNum || '';
    if (!docNum) return;

    const currentUser = this.authService.userName() || 'KASIR';
    const lockedBy = item?.lastUpdatedBy;

    if (item?.isLocked && lockedBy && lockedBy !== currentUser) {
      Swal.fire({
        title: 'Transaksi Dikunci',
        text: `Transaksi #${docNum} sedang dikunci oleh "${lockedBy}". Pengguna lain tidak dapat mengaksesnya.`,
        icon: 'warning'
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Batalkan Transaksi Tundaan?',
      text: `Apakah Anda yakin ingin membatalkan transaksi tundaan #${docNum}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#B61919'
    });

    if (!isConfirmed) return;

    Swal.fire({
      title: 'Membatalkan Transaksi...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.transactionService.getSalesOrder(docNum).subscribe({
      next: (order: any) => {
        const cancelPayload = order || item.rawOrder || item;
        this.transactionService.cancelSalesOrder(cancelPayload).subscribe({
          next: () => {
            Swal.close();
            Swal.fire('Berhasil', `Transaksi #${docNum} berhasil dibatalkan.`, 'success');
            this.fetchData();
          },
          error: (err: any) => {
            Swal.close();
            Swal.fire('Gagal', err?.error?.message || err?.message || 'Gagal membatalkan transaksi.', 'error');
          }
        });
      },
      error: (err: any) => {
        Swal.close();
        Swal.fire('Gagal', err?.error?.message || err?.message || 'Gagal mengambil detail tundaan.', 'error');
      }
    });
  }
}
