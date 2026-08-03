import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { isTokenExpired } from '../auth/jwt.util';
import { SESSION_TOKEN_KEY, SESSION_USER_KEY, SESSION_CART_KEY } from '../auth/session.util';
import { AuthStore } from '../../store/auth.store';
import { SKIP_AUTH_HEADER } from '../services/auth-api.service';

function clearSession() {
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_CART_KEY);
}

function handleTokenRefresh(
  authStore: InstanceType<typeof AuthStore>,
  router: Router,
  req: Parameters<HttpInterceptorFn>[0],
  next: Parameters<HttpInterceptorFn>[1],
  reason: 'session_expired' | 'unauthorized',
  fallbackError: unknown
) {
  const isBrowser = typeof localStorage !== 'undefined';
  return from(authStore.refreshToken()).pipe(
    switchMap(refreshed => {
      if (refreshed) {
        const newToken = isBrowser ? localStorage.getItem(SESSION_TOKEN_KEY) : null;
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        });
        return next(authReq);
      }
      if (isBrowser) {
        clearSession();
      }
      const loginUrl = router.url.startsWith('/admin') ? '/admin/login' : '/auth/login';
      router.navigate([loginUrl], { queryParams: { reason } });
      return throwError(() => fallbackError);
    })
  );
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
    return handleTokenRefresh(authStore, router, req, next, 'session_expired', new Error('Session expired'));
  }

  // Attach auth header if token exists
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handleTokenRefresh(authStore, router, req, next, 'unauthorized', error);
      }
      return throwError(() => error);
    })
  );
};
