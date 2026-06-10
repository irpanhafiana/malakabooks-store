import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isTokenExpired } from '../auth/jwt.util';
import { SESSION_TOKEN_KEY, SESSION_USER_KEY } from '../auth/session.util';

function clearSession() {
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem('malakabooks_cart');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(SESSION_TOKEN_KEY);

  // Jika token ada tapi sudah expired, langsung logout dan redirect
  if (token && isTokenExpired(token)) {
    clearSession();
    router.navigate(['/auth/login'], { queryParams: { reason: 'session_expired' } });
    return throwError(() => new Error('Session expired'));
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        clearSession();
        router.navigate(['/auth/login'], { queryParams: { reason: 'unauthorized' } });
      }
      return throwError(() => error);
    })
  );
};
