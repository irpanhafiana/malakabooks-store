import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // exp adalah Unix timestamp dalam detik
    return payload.exp ? payload.exp * 1000 < Date.now() : false;
  } catch {
    return true;
  }
}

function clearSession() {
  localStorage.removeItem('malakabooks_session_user');
  localStorage.removeItem('malakabooks_session_token');
  localStorage.removeItem('malakabooks_cart');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('malakabooks_session_token');

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
