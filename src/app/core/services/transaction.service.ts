import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);

  // --- Sales Invoice APIs ---
  postSalesInvoice(payload: any): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesInvoices/Retail`;
    return this.http.post<any>(url, payload);
  }

  getSalesInvoicePrint(docNum: string): Observable<any[]> {
    const url = `${environment.posApiUrl}/retail-api/api/SalesInvoices/print/${docNum}`;
    return this.http.get<any[]>(url);
  }

  getSalesInvoicesList(start: string, end: string, page: number, pageSize: number, search: string = '-'): Observable<any> {
    const url = `${environment.posApiUrl}/retail-api/api/SalesInvoices/list/${start}/${end}/${page}/${pageSize}/${search}`;
    return this.http.get<any>(url);
  }

  // --- Sales Order (Held Transaction) APIs ---
  postSalesOrder(payload: any): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesOrders`;
    return this.http.post<any>(url, payload);
  }

  getSalesOrdersList(): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesOrders/list`;
    return this.http.get<any>(url);
  }

  getSalesOrder(docNum: string): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesOrders/${docNum}`;
    return this.http.get<any>(url);
  }

  updateSalesOrderLockedUnlocked(payload: any): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesOrders/LockedUnlocked`;
    return this.http.put<any>(url, payload);
  }

  cancelSalesOrder(payload: any): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesOrders/Cancel`;
    return this.http.put<any>(url, payload);
  }

  // --- Picking Queue APIs ---
  finishPicking(docNum: string, hasTambahan: boolean = false): Observable<any> {
    const url = hasTambahan 
      ? `${environment.posApiUrl}/pos-api/api/v1/SalesInvoices/Picking/Finish/${docNum}`
      : `${environment.posApiUrl}/pos-api/api/v1/SalesInvoices/Retail/Picking/Finish/${docNum}`;
    return this.http.post<any>(url, {});
  }

  getPickingQueue(docNum: string): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesInvoices/Tab/Picking/Queue/DocNum/${docNum}`;
    return this.http.get<any>(url);
  }

  putPickingQueue(payload: any): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/SalesInvoices/Tab/Picking/Queue`;
    return this.http.put<any>(url, payload);
  }

  // --- B2C Service, Approval & Journal Accounts ---
  postB2CServiceGetItems(payload: string[]): Observable<any[]> {
    const url = `${environment.posApiUrl}/pos-api/api/v2/DraftObjects/B2CService/GetItems`;
    return this.http.post<any[]>(url, payload);
  }

  postB2COrder(payload: any[]): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v2/DraftObjects/B2CService`;
    return this.http.post<any>(url, payload);
  }

  getApprovalScheme(scheme: string): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/ApprovalSchemes/${scheme}`;
    return this.http.get<any>(url);
  }

  getJournalAccountPaymentCash(): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/JournalAccounts/PaymentCash`;
    return this.http.get<any>(url);
  }
}
