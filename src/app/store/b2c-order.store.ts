import { Injectable, inject, signal } from '@angular/core';
import { B2cOrderApiService } from '../core/services/b2c-order-api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class B2cOrderStore {
  private b2cApi = inject(B2cOrderApiService);

  branchCode = signal<string | null>(null);
  lastOrderId = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('mk_pending_b2c_order') : null
  );

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('sj_default_branch');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed === 'object' && parsed !== null) {
            this.branchCode.set(parsed.Code || parsed.code || null);
          } else {
            this.branchCode.set(parsed.toString());
          }
        } catch {
          this.branchCode.set(data);
        }
      }
    }
  }

  setLastOrderId(id: string | null) {
    if (typeof localStorage !== 'undefined') {
      if (id) {
        localStorage.setItem('mk_pending_b2c_order', id);
      } else {
        localStorage.removeItem('mk_pending_b2c_order');
      }
    }
    this.lastOrderId.set(id);
  }

  postB2COrder(payload: any[]): Observable<any> {
    return this.b2cApi.postB2COrder(payload);
  }
}
