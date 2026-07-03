import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

export const SKIP_AUTH_HEADER = 'X-Skip-Auth-Interceptor';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly AUTH_URL = environment.authUrl;

  async loginAndGetToken(username: string, password: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'MalakaBooks-FE');
    body.set('username', username);
    body.set('password', password);
    body.set('client_secret', 'MalakaBooks-FE');
    body.set('scope', 'Create Update Delete Read offline_access MalakaBooks_Scope General_Scope');

    try {
      const res = await firstValueFrom(
        this.http.post<any>(this.AUTH_URL, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
      if (!res?.access_token) return null;
      return {
        accessToken: res.access_token,
        refreshToken: res.refresh_token || ''
      };
    } catch (e) {
      this.logger.error('AuthApiService.loginAndGetToken', e);
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', 'MalakaBooks-FE');
    body.set('client_secret', 'MalakaBooks-FE');
    body.set('refresh_token', refreshToken);

    try {
      const res = await firstValueFrom(
        this.http.post<any>(this.AUTH_URL, body.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            [SKIP_AUTH_HEADER]: 'true'
          }
        })
      );
      if (!res?.access_token) return null;
      return {
        accessToken: res.access_token,
        refreshToken: res.refresh_token || refreshToken
      };
    } catch (e) {
      this.logger.error('AuthApiService.refreshToken', e);
      return null;
    }
  }

  normalizeRole(role: unknown): 'admin' | 'customer' {
    const r = typeof role === 'string' ? role.toLowerCase() : '';
    return r === 'malaka-admin' || r === 'admin' ? 'admin' : 'customer';
  }
}
