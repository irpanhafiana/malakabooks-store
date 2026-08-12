import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../../environments/environment';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send login request to authUrl endpoint', async () => {
    const loginPromise = service.loginAndGetToken('testuser', 'password123');

    const req = httpMock.expectOne(req => req.url === environment.authUrl);
    expect(req.request.method).toBe('POST');
    req.flush({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token'
    });

    const res = await loginPromise;
    expect(res).toEqual({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token'
    });
  });

  it('should handle login error gracefully', async () => {
    const loginPromise = service.loginAndGetToken('testuser', 'wrongpass');

    const req = httpMock.expectOne(req => req.url === environment.authUrl);
    req.flush({ error: 'invalid_credentials' }, { status: 400, statusText: 'Bad Request' });

    const res = await loginPromise;
    expect(res).toBeNull();
  });

  it('should normalize user roles correctly', () => {
    expect(service.normalizeRole('admin')).toBe('admin');
    expect(service.normalizeRole('malaka-admin')).toBe('admin');
    expect(service.normalizeRole('ADMIN')).toBe('admin');
    expect(service.normalizeRole('customer')).toBe('customer');
    expect(service.normalizeRole(null)).toBe('customer');
  });

  it('should send forgotPassword request using configured URL', async () => {
    const forgotPromise = service.forgotPassword('test@example.com');

    const req = httpMock.expectOne(req => req.url.includes('/forgot-password'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', callbackUrl: 'string' });
    req.flush({});

    const res = await forgotPromise;
    expect(res).toBe(true);
  });
});
