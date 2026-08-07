import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { clearPosSession, getPosToken, isPosApiUrl } from '../auth/pos-session.util';

/**
 * Interceptor khusus gateway POS (SAP).
 *
 * Request non-POS dilewatkan apa adanya — `authInterceptor` yang menanganinya.
 * Request POS mendapat `sj_pos_token`, dan pada 401 diarahkan ke login POS,
 * BUKAN ke /admin/login (sesi admin MalakaBooks tetap utuh).
 *
 * Tidak ada alur refresh token: gateway POS memakai grant_type=password tanpa
 * refresh token, jadi 401 berarti kasir harus login ulang.
 */
export const posAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPosApiUrl(req.url)) {
    return next(req);
  }

  // Endpoint token itu sendiri tidak boleh membawa Authorization.
  if (req.url.startsWith(environment.posAuthUrl)) {
    return next(req);
  }

  const router = inject(Router);
  const token = getPosToken();

  const posReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(posReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        clearPosSession();
        router.navigate(['/admin/pos/login'], { queryParams: { reason: 'unauthorized' } });
      }
      return throwError(() => error);
    })
  );
};
