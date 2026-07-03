import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExternalMessageService {
  constructor(private http: HttpClient) { }

  postCheckPaymentDoku(orderId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseUrl}/customer/IncomingPayments/DOKU/CheckStatus`, { orderId });
  }
}
