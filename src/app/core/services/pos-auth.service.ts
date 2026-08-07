import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, forkJoin, map, switchMap, of, catchError } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { PosLoginResponse, PosUserData } from '../models/pos-auth.model';
import {
  POS_BIZ_DATES_KEY,
  POS_BRANCH_KEY,
  POS_NON_ROKOK_PERCENT_KEY,
  POS_SAP_USERNAME_KEY,
  POS_TOKEN_KEY,
  POS_USER_DATA_KEY,
  POS_USERNAME_KEY,
  clearPosSession
} from '../auth/pos-session.util';

/**
 * Sesi kasir pada gateway POS (SAP), terpisah dari sesi admin MalakaBooks.
 *
 * Port dari `sj-pos-katalog/src/app/core/services/auth.service.ts`. Endpoint,
 * bentuk body, dan kunci localStorage dipertahankan sama persis.
 */
@Injectable({ providedIn: 'root' })
export class PosAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  isAuthenticated = signal<boolean>(this.hasToken());
  userName = signal<string | null>(
    typeof localStorage === 'undefined' ? null : localStorage.getItem(POS_USERNAME_KEY)
  );

  login(username: string, password: string): Observable<PosLoginResponse> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    body.set('grant_type', 'password');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<PosLoginResponse>(environment.posAuthUrl, body.toString(), { headers }).pipe(
      tap((res: PosLoginResponse) => {
        if (res && res.access_token) {
          this.setToken(res.access_token);
          this.setUserName(username);
          // Ambil metadata di latar agar tidak menahan navigasi.
          this.fetchMetadata(username).subscribe();
        }
      })
    );
  }

  private fetchMetadata(
    username: string
  ): Observable<{ dates: any; branch: any; user: PosUserData | null; nonRokok: number }> {
    return forkJoin({
      dates: this.getBusinessDates().pipe(catchError(() => of(null))),
      branch: this.getDefaultBranch().pipe(catchError(() => of(null))),
      user: this.getUserData(username).pipe(catchError(() => of(null))),
      nonRokok: this.getNonRokokPercentage().pipe(catchError(() => of(0)))
    }).pipe(
      tap(({ dates, branch, user, nonRokok }) => {
        if (dates) {
          localStorage.setItem(
            POS_BIZ_DATES_KEY,
            typeof dates === 'string' ? dates : JSON.stringify(dates)
          );
        }
        if (branch) {
          localStorage.setItem(
            POS_BRANCH_KEY,
            typeof branch === 'string' ? branch : JSON.stringify(branch)
          );
        }
        if (nonRokok !== undefined) {
          localStorage.setItem(POS_NON_ROKOK_PERCENT_KEY, nonRokok.toString());
        }
        if (user) {
          localStorage.setItem(POS_USER_DATA_KEY, JSON.stringify(user));
          if (user.Username) {
            localStorage.setItem(POS_SAP_USERNAME_KEY, user.Username);
          }
        }
      })
    );
  }

  getBusinessDates(): Observable<any> {
    return this.safeGet(`${environment.posApiUrl}/pos-api/api/v1/BusinessDates`);
  }

  getDefaultBranch(): Observable<any> {
    return this.safeGet(`${environment.posApiUrl}/pos-api/api/v1/Branches/Default`).pipe(
      switchMap((res: any) => {
        const branchCode = typeof res === 'object' && res !== null ? res.Code || res.code : res;
        if (!branchCode) return of(null);
        return this.safeGet(`${environment.posApiUrl}/pos-api/api/v1/Branches/${branchCode}`);
      }),
      catchError(() => of(null))
    );
  }

  getUserData(username: string): Observable<PosUserData> {
    return this.safeGet(`${environment.posApiUrl}/pos-api/api/v1/Users/${username}`).pipe(
      map(res => (typeof res === 'string' ? JSON.parse(res) : res))
    );
  }

  getNonRokokPercentage(): Observable<number> {
    return this.safeGet(
      `${environment.posApiUrl}/pos-api/api/v1/Branches/PercentageNonRokokPerInvoice`
    ).pipe(
      map(res => {
        const num = parseFloat(res);
        return isNaN(num) ? 0 : num;
      })
    );
  }

  /**
   * Gateway POS kadang mengembalikan JSON, kadang string mentah berkutip.
   * Ambil sebagai text lalu coba parse, dengan fallback strip-quote.
   */
  private safeGet(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(res => {
        try {
          return JSON.parse(res);
        } catch {
          return (res || '').trim().replace(/^"|"$/g, '');
        }
      })
    );
  }

  logout() {
    clearPosSession();
    localStorage.removeItem('sj_pending_order');
    this.isAuthenticated.set(false);
    this.userName.set(null);
    this.router.navigate(['/admin/pos/login']);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(POS_TOKEN_KEY);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string) {
    localStorage.setItem(POS_TOKEN_KEY, token);
    this.isAuthenticated.set(true);
  }

  hasName(): boolean {
    return !!this.userName();
  }

  setUserName(name: string) {
    const trimmedName = name.trim();
    if (trimmedName) {
      localStorage.setItem(POS_USERNAME_KEY, trimmedName);
      this.userName.set(trimmedName);
    }
  }
}
