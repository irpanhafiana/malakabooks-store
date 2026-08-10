import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class B2cOrderApiService {
  private http = inject(HttpClient);

  postB2COrder(payload: Record<string, unknown>[]): Observable<unknown> {
    const baseUrl = (environment as { posApiUrl?: string }).posApiUrl || 'http://192.168.1.15:10100/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const url = `${cleanBase}pos-api/api/v2/DraftObjects/B2CService`;
    return this.http.post<unknown>(url, payload);
  }
}
