import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../../environments/environment';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  const userUrl = environment.authUrl.includes('/login')
    ? environment.authUrl.replace('/login', '/user')
    : `${environment.authUrl}/user`;

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

  it('should fetch claims from the BFF user endpoint', async () => {
    const userPromise = service.getUser();

    const req = httpMock.expectOne(req => req.url === userUrl);
    expect(req.request.method).toBe('GET');
    req.flush([{ type: 'sub', value: 'user-1' }]);

    expect(await userPromise).toEqual([{ type: 'sub', value: 'user-1' }]);
  });

  it('should send credentials and the antiforgery header', async () => {
    const userPromise = service.getUser();

    const req = httpMock.expectOne(req => req.url === userUrl);
    // Tanpa keduanya Duende.BFF selalu menjawab 401.
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('X-CSRF')).toBe('1');
    req.flush([{ type: 'sub', value: 'user-1' }]);

    await userPromise;
  });

  it('should treat 401 as "not logged in" rather than an error', async () => {
    const userPromise = service.getUser();

    const req = httpMock.expectOne(req => req.url === userUrl);
    req.flush({ error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(await userPromise).toBeNull();
  });

  it('should return null when the response is not a claims array', async () => {
    const userPromise = service.getUser();

    const req = httpMock.expectOne(req => req.url === userUrl);
    req.flush({ access_token: 'unexpected-shape' });

    expect(await userPromise).toBeNull();
  });

  it('should return null for an empty claims array', async () => {
    const userPromise = service.getUser();

    const req = httpMock.expectOne(req => req.url === userUrl);
    req.flush([]);

    expect(await userPromise).toBeNull();
  });

  it('should derive sibling BFF urls from authUrl', () => {
    expect(service.bffUrl('user')).toBe(userUrl);
    expect(service.bffUrl('logout')).toBe(userUrl.replace('/user', '/logout'));
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

    expect(await forgotPromise).toBe(true);
  });
});
