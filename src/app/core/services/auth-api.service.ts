import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

export const SKIP_AUTH_HEADER = 'X-Skip-Auth-Interceptor';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly AUTH_URL = environment.authUrl;

  async loginAndGetToken(username: string, password: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const isBff = this.AUTH_URL.includes('/bff/');
    try {
      let res: OAuthTokenResponse | undefined;
      if (isBff) {
        res = await firstValueFrom(
          this.http.post<OAuthTokenResponse>(this.AUTH_URL, { username, password }, {
            headers: {
              'Content-Type': 'application/json',
              [SKIP_AUTH_HEADER]: 'true'
            }
          })
        );
      } else {
        const body = new URLSearchParams();
        body.set('grant_type', 'password');
        if (environment.clientId) body.set('client_id', environment.clientId);
        body.set('username', username);
        body.set('password', password);
        if (environment.scope) body.set('scope', environment.scope);

        res = await firstValueFrom(
          this.http.post<OAuthTokenResponse>(this.AUTH_URL, body.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              [SKIP_AUTH_HEADER]: 'true'
            }
          })
        );
      }

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
    const isBff = this.AUTH_URL.includes('/bff/');
    try {
      let res: OAuthTokenResponse | undefined;
      if (isBff) {
        res = await firstValueFrom(
          this.http.post<OAuthTokenResponse>(`${this.AUTH_URL}/refresh`, { refreshToken }, {
            headers: {
              'Content-Type': 'application/json',
              [SKIP_AUTH_HEADER]: 'true'
            }
          })
        );
      } else {
        const body = new URLSearchParams();
        body.set('grant_type', 'refresh_token');
        if (environment.clientId) body.set('client_id', environment.clientId);
        body.set('refresh_token', refreshToken);

        res = await firstValueFrom(
          this.http.post<OAuthTokenResponse>(this.AUTH_URL, body.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              [SKIP_AUTH_HEADER]: 'true'
            }
          })
        );
      }

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

  async forgotPassword(email: string, callbackUrl: string = 'string'): Promise<boolean> {
    const userPwdUrl = (environment as unknown as { userPasswordApiUrl?: string }).userPasswordApiUrl;
    const url = userPwdUrl
      ? `${userPwdUrl}/forgot-password`
      : `${environment.apiBaseUrl}/UserPassword/forgot-password`;

    try {
      await firstValueFrom(
        this.http.post(url, {
          email,
          callbackUrl
        }, {
          headers: {
            [SKIP_AUTH_HEADER]: 'true'
          }
        })
      );
      return true;
    } catch (e) {
      this.logger.error('AuthApiService.forgotPassword', e);
      return false;
    }
  }
}
