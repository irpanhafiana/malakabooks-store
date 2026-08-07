import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PosCustomer } from '../models/pos.model';

/**
 * Business partner dari gateway POS (SAP) — bukan user MalakaBooks.
 * Dipakai eksklusif oleh halaman /admin/pos/*.
 */
export type Customer = PosCustomer;

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);

  getAutoFillCustomers(pageNumber: number = 1, pageSize: number = 500): Observable<Customer[]> {
    const url = `${environment.posApiUrl}/retail-api/api/Customers/AutoFill/${pageNumber}/${pageSize}`;
    return this.http.get<any>(url).pipe(
      map(res => res.results || [])
    );
  }

  getCustomer(customerCode: string): Observable<Customer> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/Customers/${customerCode}`;
    return this.http.get<Customer>(url);
  }

  getCustomerCreditMemoBalance(customerCode: string): Observable<number> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/Customers/${customerCode}/CreditMemoBalance`;
    return this.http.get<any>(url).pipe(
      map(res => typeof res === 'number' ? res : (res.Balance || 0))
    );
  }

  /**
   * Base URL-nya sengaja berbeda: di produksi daftar tagihan terbuka dilayani
   * host lain (lihat `posOutstandingUrl` di environment), sama seperti sj-pos.
   */
  getOutstandingInvoices(customerCode: string): Observable<any[]> {
    const url = `${environment.posOutstandingUrl}/pos-api/api/v1/Customers/${customerCode}/OutstandingInvoices`;
    return this.http.get<any[]>(url);
  }
}
