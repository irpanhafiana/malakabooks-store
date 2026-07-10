import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { of } from 'rxjs';
import { SESSION_TOKEN_KEY } from '../auth/session.util';

describe('AuthInterceptor', () => {
  const mockRouter = { navigate: vi.fn(), url: '/' };
  const mockAuthStore = { refreshToken: vi.fn() };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    });
  });

  it('should attach Authorization header if token exists', () => {
    localStorage.setItem(SESSION_TOKEN_KEY, 'fake-token');
    
    let resultReq: HttpRequest<any> | undefined;
    const next: HttpHandlerFn = (req) => {
      resultReq = req;
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest('GET', '/api/test');
      authInterceptor(req, next).subscribe();
      expect(resultReq?.headers.get('Authorization')).toBe('Bearer fake-token');
    });
  });

  it('should skip attaching header if no token exists', () => {
    let resultReq: HttpRequest<any> | undefined;
    const next: HttpHandlerFn = (req) => {
      resultReq = req;
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest('GET', '/api/test');
      authInterceptor(req, next).subscribe();
      expect(resultReq?.headers.has('Authorization')).toBe(false);
    });
  });
});
