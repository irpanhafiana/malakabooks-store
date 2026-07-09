import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Payment, ApiResponse, UpdatePaymentPayload } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private paymentCache: { data: Payment[]; ts: number } | null = null;
  private readonly PAYMENT_TTL_MS = 5 * 60 * 1000;

  async getPayments(): Promise<Payment[]> {
    const now = Date.now();
    const isAdmin = isAdminSession();

    if (!isAdmin && this.paymentCache && now - this.paymentCache.ts < this.PAYMENT_TTL_MS) {
      return this.paymentCache.data;
    }
    try {
      const endpoint = isAdmin ? `${this.BASE_URL}/admin/Payments` : `${this.BASE_URL}/public/Payments`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<Payment[]>>(endpoint));
      const list = envelope?.data || [];
      const data = list.map((p: Payment) => ({
        id: p.id,
        name: p.name,
        methodType: p.methodType,
        alias: p.alias || '',
        fees: p.fees || []
      }));
      if (!isAdmin) {
        this.paymentCache = { data, ts: now };
      }
      return data;
    } catch (e) {
      this.logger.error('PaymentApiService.getPayments', 'Gagal mengambil payment:', e);
      return [];
    }
  }

  private invalidatePaymentCache() {
    this.paymentCache = null;
  }

  async savePayment(payment: Partial<Payment>): Promise<Payment> {
    const isNew = !payment.id;
    const body: Partial<Payment> = {
      name: payment.name,
      methodType: payment.methodType,
      fees: payment.fees || []
    };

    try {
      let result: Payment;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<Payment>>(`${this.BASE_URL}/admin/Payments`, body));
        result = envelope?.data;
      } else {
        const payload: UpdatePaymentPayload = {
          name: payment.name!,
          methodType: payment.methodType!,
          fees: payment.fees || []
        };
        const envelope = await firstValueFrom(this.http.put<ApiResponse<Payment>>(`${this.BASE_URL}/admin/Payments/${payment.id}`, payload));
        result = envelope?.data;
      }
      this.invalidatePaymentCache();
      return result;
    } catch (e) {
      this.logger.error('PaymentApiService.savePayment', 'Gagal menyimpan payment:', e);
      throw e;
    }
  }

  async deletePayment(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Payments/${id}`));
      this.invalidatePaymentCache();
      return true;
    } catch (e) {
      this.logger.error('PaymentApiService.deletePayment', `Gagal menghapus payment ${id}:`, e);
      return false;
    }
  }
}
