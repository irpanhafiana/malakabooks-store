import { Injectable, inject, signal, computed } from '@angular/core';
import { Payment } from '../core/models';
import { PaymentApiService } from '../core/services/payment-api.service';
import { AlertService } from '../core/services/alert.service';

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentStore {
  private readonly paymentApi = inject(PaymentApiService);
  private readonly alertService = inject(AlertService);

  private readonly state = signal<PaymentState>({
    payments: [],
    loading: false,
    error: null
  });

  readonly payments = computed(() => this.state().payments);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadPayments() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const payments = await this.paymentApi.getPayments();
      this.state.update(s => ({ ...s, payments, loading: false, error: null }));
    } catch {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat daftar payment dari server.' }));
    }
  }

  async savePayment(payment: Partial<Payment>, options?: { showToast?: boolean }) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.paymentApi.savePayment(payment);
      await this.loadPayments();
      if (options?.showToast !== false) {
        this.alertService.success(`Metode Pembayaran "${saved.name}" berhasil disimpan!`);
      }
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.alertService.error('Gagal menyimpan metode pembayaran.');
      }
    }
  }

  async deletePayment(id: string, options?: { showToast?: boolean }) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.paymentApi.deletePayment(id);
      if (success) {
        await this.loadPayments();
        if (options?.showToast !== false) {
          this.alertService.success('Metode Pembayaran berhasil dihapus.');
        }
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        if (options?.showToast !== false) {
          this.alertService.error('Metode Pembayaran tidak ditemukan.');
        }
      }
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      if (options?.showToast !== false) {
        this.alertService.error('Gagal menghapus metode pembayaran.');
      }
    }
  }
}
