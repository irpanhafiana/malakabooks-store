import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpRequest, HttpHandlerFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../../store/auth.store';
import { SKIP_AUTH_HEADER } from '../services/auth-api.service';
import { of, throwError } from 'rxjs';

describe('AuthInterceptor', () => {
  const mockAuthStore = {
    handleUnauthorized: vi.fn().mockResolvedValue(undefined),
    isLoggedIn: vi.fn().mockReturnValue(true)
  };

  const capture = (): { next: HttpHandlerFn; seen: () => HttpRequest<unknown> | undefined } => {
    let seen: HttpRequest<unknown> | undefined;
    return {
      next: req => {
        seen = req;
        return of(new HttpResponse({ status: 200 }));
      },
      seen: () => seen
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStore, useValue: mockAuthStore }]
    });
  });

  it('never attaches an Authorization header — the BFF holds the token', () => {
    const { next, seen } = capture();

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/api/v1/public/Items'), next).subscribe();
    });

    expect(seen()?.headers.has('Authorization')).toBe(false);
  });

  it('sends the BFF session cookie and antiforgery header on API calls', () => {
    const { next, seen } = capture();

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/api/v1/public/Items'), next).subscribe();
    });

    expect(seen()?.withCredentials).toBe(true);
    expect(seen()?.headers.get('X-CSRF')).toBe('1');
  });

  it('leaves third-party absolute URLs untouched', () => {
    const { next, seen } = capture();

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('POST', 'https://jokul.doku.com/checkout', {}), next).subscribe();
    });

    expect(seen()?.withCredentials).toBe(false);
    expect(seen()?.headers.has('X-CSRF')).toBe(false);
  });

  it('passes through requests that opt out via the skip header', () => {
    const { next, seen } = capture();
    const req = new HttpRequest('GET', '/bff/user').clone({
      setHeaders: { [SKIP_AUTH_HEADER]: 'true' }
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe();
    });

    expect(seen()?.headers.has('X-CSRF')).toBe(false);
  });

  it('re-checks the session when an API call returns 401', async () => {
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 401, url: '/api/v1/customer/Orders' }));

    await new Promise<void>(resolve => {
      TestBed.runInInjectionContext(() => {
        authInterceptor(new HttpRequest('GET', '/api/v1/customer/Orders'), next).subscribe({
          error: () => resolve()
        });
      });
    });

    expect(mockAuthStore.handleUnauthorized).toHaveBeenCalledTimes(1);
  });
});
