import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export class AuthConstants {
  static readonly API_URL: string = environment.apiUrl || (environment.apiBaseUrl + '/');
}

export class EndpointConstants {
  static readonly GET_CHECK_PAYMENT = `${AuthConstants.API_URL}ExternalMessage/Doku/Payment`;
}

@Injectable({
  providedIn: 'root'
})
export class DokuApiService {
  private readonly http = inject(HttpClient);

  getOne(url: string): Observable<any> {
    return this.http.get<any>(url);
  }

  getCheckPaymentDoku(docnum: string): Observable<any> {
    return this.getOne(`${EndpointConstants.GET_CHECK_PAYMENT}/${docnum}`);
  }
}
