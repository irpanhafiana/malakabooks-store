import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EndpointConstants } from '../constants/endpoint-constant.service';

@Injectable({
  providedIn: 'root'
})
export class ExternalMessageService {
  constructor(private http: HttpClient) {}

  getCheckPaymentDoku(docnum: string): Observable<any> {
    return this.http.get<any>(`${EndpointConstants.GET_CHECK_PAYMENT}?docnum=${docnum}`); 
  }
}
