import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthStore } from '../../store/auth.store';
import { SKIP_AUTH_HEADER, BFF_CSRF_HEADER } from '../services/auth-api.service';
import { environment } from '../../../environments/environment';

/**
 * Pola BFF: SPA tidak pernah memegang access token.
 *
 * Yang dikirim ke backend hanyalah cookie sesi milik BFF, dan BFF-lah yang
 * menyisipkan bearer token saat meneruskan permintaan ke API. Karena itu
 * interceptor ini hanya memasang `withCredentials` + header antiforgery,
 * bukan header `Authorization`.
 */
function isBffRoutedRequest(req: HttpRequest<unknown>): boolean {
  // Relatif = satu origin dengan SPA, jadi melewati BFF (langsung atau via proxy dev).
  if (req.url.startsWith('/')) return true;
  // Absolut hanya diikutkan bila memang menuju API/BFF yang diproxy.
  // Endpoint pihak ketiga (DOKU, POS) sengaja tidak diberi cookie.
  return req.url.startsWith(environment.apiBaseUrl) || req.url.startsWith(environment.authUrl);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Panggilan /bff/* mengurus header-nya sendiri di AuthApiService.
  if (req.headers.has(SKIP_AUTH_HEADER)) {
    return next(req);
  }

  const authStore = inject(AuthStore);

  const outbound = isBffRoutedRequest(req)
    ? req.clone({ withCredentials: true, setHeaders: { [BFF_CSRF_HEADER]: '1' } })
    : req;

  return next(outbound).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isBffRoutedRequest(req)) {
        // Cookie sesi hilang atau kedaluwarsa. BFF memperbarui token sendiri,
        // jadi 401 di sini berarti sesinya memang sudah tidak ada — konfirmasi
        // sekali ke /bff/user, lalu bersihkan state bila benar sudah keluar.
        void authStore.handleUnauthorized();
      }
      return throwError(() => error);
    })
  );
};
