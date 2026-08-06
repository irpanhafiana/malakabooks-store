import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Customer {
  code?: string;
  Code?: string;
  name?: string;
  Name?: string;
  CustomerName?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);

  getAutoFillCustomers(pageNumber: number = 1, pageSize: number = 500): Observable<Customer[]> {
    const url = `${environment.apiUrl}/retail-api/api/Customers/AutoFill/${pageNumber}/${pageSize}`;
    return this.http.get<any>(url).pipe(
      map(res => res.results || [])
    );
  }

  getCustomer(customerCode: string): Observable<Customer> {
    const url = `${environment.apiUrl}/pos-api/api/v1/Customers/${customerCode}`;
    return this.http.get<Customer>(url);
  }

  getCustomerCreditMemoBalance(customerCode: string): Observable<number> {
    const url = `${environment.apiUrl}/pos-api/api/v1/Customers/${customerCode}/CreditMemoBalance`;
    return this.http.get<any>(url).pipe(
      map(res => typeof res === 'number' ? res : (res.Balance || 0))
    );
  }

  getOutstandingInvoices(customerCode: string): Observable<any[]> {
    const outstandingUrl = (environment as any).outstandingUrl || environment.apiUrl;
    const url = `${outstandingUrl}/pos-api/api/v1/Customers/${customerCode}/OutstandingInvoices`;
    return this.http.get<any[]>(url);
  }
}
