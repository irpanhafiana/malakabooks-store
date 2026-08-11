import { TestBed } from '@angular/core/testing';
import { errorInterceptor, SKIP_ERROR_HEADER } from './error.interceptor';
import { AlertService } from '../services/alert.service';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('errorInterceptor', () => {
  let alertServiceMock: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    alertServiceMock = {
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AlertService, useValue: alertServiceMock }
      ]
    });
  });

  it('should skip error interceptor if SKIP_ERROR_HEADER is present', async () => {
    const req = new HttpRequest('GET', '/test', {
      headers: new HttpHeaders({ [SKIP_ERROR_HEADER]: 'true' })
    });
    const next: HttpHandlerFn = () => of({} as any);

    await TestBed.runInInjectionContext(async () => {
      await firstValueFrom(errorInterceptor(req, next));
      expect(alertServiceMock.error).not.toHaveBeenCalled();
    });
  });

  it('should handle status 0 network error', async () => {
    const req = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    await TestBed.runInInjectionContext(async () => {
      try {
        await firstValueFrom(errorInterceptor(req, next));
      } catch (err) {
        expect(alertServiceMock.error).toHaveBeenCalledWith('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        expect(err).toBe(errorResponse);
      }
    });
  });

  it('should handle status 400 error', async () => {
    const req = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({
      status: 400,
      error: { statusMessage: 'Bad Request' }
    });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    await TestBed.runInInjectionContext(async () => {
      try {
        await firstValueFrom(errorInterceptor(req, next));
      } catch {
        expect(alertServiceMock.error).toHaveBeenCalledWith('Bad Request');
      }
    });
  });

  it('should handle status 404 error', async () => {
    const req = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({ status: 404 });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    await TestBed.runInInjectionContext(async () => {
      try {
        await firstValueFrom(errorInterceptor(req, next));
      } catch {
        expect(alertServiceMock.error).toHaveBeenCalledWith('Sumber daya tidak ditemukan (404).');
      }
    });
  });
});
