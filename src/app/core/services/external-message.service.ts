import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DokuCheckStatusResponse {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ExternalMessageService {
  private readonly http = inject(HttpClient);

  async postCheckPaymentDoku(orderId: string): Promise<DokuCheckStatusResponse> {
    return firstValueFrom(
      this.http.post<DokuCheckStatusResponse>(
        `${environment.apiBaseUrl}/customer/IncomingPayments/DOKU/CheckStatus`,
        { orderId }
      )
    );
  }
}
