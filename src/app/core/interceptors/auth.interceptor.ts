import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { isTokenExpired } from '../auth/jwt.util';
import { SESSION_TOKEN_KEY, SESSION_USER_KEY } from '../auth/session.util';
import { AuthStore } from '../../store/auth.store';
import { SKIP_AUTH_HEADER } from '../services/auth-api.service';

function clearSession() {
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem('malakabooks_cart');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip auth intercept for refresh token calls (prevents infinite loop)
  if (req.headers.has(SKIP_AUTH_HEADER)) {
    return next(req);
  }

  const router = inject(Router);
  const authStore = inject(AuthStore);
  const isBrowser = typeof localStorage !== 'undefined';
  const token = isBrowser ? localStorage.getItem(SESSION_TOKEN_KEY) : null;

  // If token exists but is expired, try to refresh first
  if (token && isTokenExpired(token)) {
    return from(authStore.refreshToken()).pipe(
      switchMap(refreshed => {
        if (refreshed) {
          // Refresh succeeded — retry request with new token
          const newToken = localStorage.getItem(SESSION_TOKEN_KEY);
          const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next(authReq);
        }
        // Refresh failed — clear session and redirect
        if (isBrowser) {
          clearSession();
        }
        const loginUrl = router.url.startsWith('/admin') ? '/admin/login' : '/auth/login';
        router.navigate([loginUrl], { queryParams: { reason: 'session_expired' } });
        return throwError(() => new Error('Session expired'));
      })
    );
  }

  // Attach auth header if token exists
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Try to refresh on 401 response
        return from(authStore.refreshToken()).pipe(
          switchMap(refreshed => {
            if (refreshed) {
              // Refresh succeeded — retry original request with new token
              const newToken = localStorage.getItem(SESSION_TOKEN_KEY);
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(retryReq);
            }
            // Refresh failed — clear session and redirect
            if (isBrowser) {
              clearSession();
            }
            const loginUrl = router.url.startsWith('/admin') ? '/admin/login' : '/auth/login';
            router.navigate([loginUrl], { queryParams: { reason: 'unauthorized' } });
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
