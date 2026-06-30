import { Injectable, inject, signal, computed } from '@angular/core';
import { Payment } from '../core/models';
import { PaymentApiService } from '../core/services/payment-api.service';
import { ToastService } from '../core/services/toast.service';

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
  private readonly toastService = inject(ToastService);

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
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat daftar payment dari server.' }));
      this.toastService.error('Failed to load payment methods.');
    }
  }

  async savePayment(payment: Partial<Payment>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.paymentApi.savePayment(payment);
      await this.loadPayments();
      this.toastService.success(`Payment Method "${saved.name}" saved successfully!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to save payment method.');
    }
  }

  async deletePayment(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.paymentApi.deletePayment(id);
      if (success) {
        await this.loadPayments();
        this.toastService.success('Payment Method deleted successfully.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Payment Method not found.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to delete payment method.');
    }
  }
}
