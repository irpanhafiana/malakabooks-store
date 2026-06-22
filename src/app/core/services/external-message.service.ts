import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EndpointConstants } from '../constants/endpoint-constant.service';

@Injectable({
  providedIn: 'root'
})
export class ExternalMessageService {
  constructor(private http: HttpClient) {}

  postCheckPaymentDoku(orderId: string): Observable<any> {
    const url = 'http://192.168.1.15:25168/api/v1/customer/IncomingPayments/DOKU/CheckStatus';
    return this.http.post<any>(url, { orderId }); 
  }
}
