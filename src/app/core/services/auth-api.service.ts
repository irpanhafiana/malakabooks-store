import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { SKIP_ERROR_HEADER } from '../interceptors/error.interceptor';
import { BffClaim } from '../auth/bff-claims.util';

export const SKIP_AUTH_HEADER = 'X-Skip-Auth-Interceptor';

/**
 * Header antiforgery wajib Duende.BFF. Tanpa header ini setiap panggilan ke
 * `/bff/user` maupun ke remote API yang diproxy BFF dijawab 401.
 */
export const BFF_CSRF_HEADER = 'X-CSRF';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly AUTH_URL = environment.authUrl;

  /** Bangun URL saudara dari authUrl, mis. `/bff/login` -> `/bff/user`. */
  bffUrl(segment: 'user' | 'login' | 'logout'): string {
    return this.AUTH_URL.includes('/login')
      ? this.AUTH_URL.replace('/login', `/${segment}`)
      : `${this.AUTH_URL}/${segment}`;
  }

  /** 401 = belum login, itu normal. Sisanya menandakan masalah konfigurasi. */
  private logAuthFailure(context: string, url: string, error: unknown): void {
    const status = error instanceof HttpErrorResponse ? error.status : null;
    if (status === 401) return;

    if (status === 0) {
      this.logger.error(context, `Tidak dapat menghubungi ${url} (CORS/jaringan/proxy).`, error);
    } else if (status === 404) {
      this.logger.error(context, `Endpoint ${url} tidak ditemukan. Periksa proxy dan konfigurasi BFF.`, error);
    } else {
      this.logger.error(context, `Gagal memanggil ${url} (status ${status ?? 'unknown'}).`, error);
    }
  }

  /**
   * Ambil klaim sesi dari BFF. Access token sengaja tidak pernah menyeberang ke
   * browser: BFF menyimpannya di sisi server dan menyisipkannya sendiri saat
   * mem-proxy panggilan API. 401 berarti belum/tidak lagi login.
   *
   * BFF juga memperbarui token secara diam-diam, jadi tidak ada endpoint
   * refresh yang perlu dipanggil SPA.
   */
  async getUser(): Promise<BffClaim[] | null> {
    const userUrl = this.bffUrl('user');
    try {
      const rawRes = await firstValueFrom(
        this.http.get<unknown>(userUrl, {
          withCredentials: true,
          headers: {
            [BFF_CSRF_HEADER]: '1',
            [SKIP_AUTH_HEADER]: 'true',
            [SKIP_ERROR_HEADER]: 'true'
          }
        })
      );

      if (!rawRes) return null;

      let claims: BffClaim[] = [];

      if (Array.isArray(rawRes)) {
        claims = rawRes.filter(
          item => typeof item === 'object' && item !== null && 'type' in item && 'value' in item
        ) as BffClaim[];
      } else if (typeof rawRes === 'object' && rawRes !== null) {
        const obj = rawRes as Record<string, unknown>;
        if (Array.isArray(obj['claims'])) {
          claims = obj['claims'].filter(
            item => typeof item === 'object' && item !== null && 'type' in item && 'value' in item
          ) as BffClaim[];
        } else if ('sub' in obj || 'name' in obj || 'role' in obj || 'bff:logout_url' in obj || 'nameidentifier' in obj) {
          for (const [key, val] of Object.entries(obj)) {
            if (Array.isArray(val)) {
              for (const v of val) {
                claims.push({ type: key, value: String(v) });
              }
            } else if (val !== null && val !== undefined) {
              claims.push({ type: key, value: String(val) });
            }
          }
        }
      }

      if (claims.length === 0) {
        this.logger.error('AuthApiService.getUser', 'Respons /bff/user tidak berisi klaim:', rawRes);
        return null;
      }
      return claims;
    } catch (e) {
      this.logAuthFailure('AuthApiService.getUser', userUrl, e);
      return null;
    }
  }

  /**
   * Normalisasi role dari DTO user REST (bukan dari klaim JWT — untuk itu
   * pakai `jwtHasAdminRole` di `jwt.util.ts`). Dipakai `UserApiService`.
   */
  normalizeRole(role: unknown): 'admin' | 'customer' {
    const r = typeof role === 'string' ? role.toLowerCase() : '';
    return r === 'malaka-admin' || r === 'admin' ? 'admin' : 'customer';
  }

  async forgotPassword(email: string, callbackUrl = 'string'): Promise<boolean> {
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

  /**
   * Kirim permintaan logout ke Duende.BFF membawa header `X-CSRF: 1` dan `withCredentials: true`.
   * Ini memastikan cookie sesi `bff-session` dihapus oleh BFF di browser,
   * dan mengembalikan URL endsession jika ada.
   */
  async logout(logoutUrl: string): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<unknown>(logoutUrl, {}, {
          withCredentials: true,
          headers: {
            [BFF_CSRF_HEADER]: '1',
            [SKIP_AUTH_HEADER]: 'true',
            [SKIP_ERROR_HEADER]: 'true'
          }
        })
      );

      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        if (typeof obj['logoutUrl'] === 'string') return obj['logoutUrl'];
        if (typeof obj['redirectUrl'] === 'string') return obj['redirectUrl'];
      }
      return null;
    } catch {
      try {
        const res = await firstValueFrom(
          this.http.get<unknown>(logoutUrl, {
            withCredentials: true,
            headers: {
              [BFF_CSRF_HEADER]: '1',
              [SKIP_AUTH_HEADER]: 'true',
              [SKIP_ERROR_HEADER]: 'true'
            }
          })
        );

        if (typeof res === 'object' && res !== null) {
          const obj = res as Record<string, unknown>;
          if (typeof obj['logoutUrl'] === 'string') return obj['logoutUrl'];
          if (typeof obj['redirectUrl'] === 'string') return obj['redirectUrl'];
        }
      } catch (e) {
        this.logger.error('AuthApiService.logout', e);
      }
      return null;
    }
  }
}

