import { TestBed } from '@angular/core/testing';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { of, firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('loadingInterceptor', () => {
  let loadingServiceMock: { show: ReturnType<typeof vi.fn>; hide: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    loadingServiceMock = {
      show: vi.fn(),
      hide: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LoadingService, useValue: loadingServiceMock }
      ]
    });
  });

  it('should call show on start and hide on completion', async () => {
    const req = new HttpRequest('GET', '/test');
    const next: HttpHandlerFn = () => of({} as any);

    await TestBed.runInInjectionContext(async () => {
      await firstValueFrom(loadingInterceptor(req, next));
      expect(loadingServiceMock.show).toHaveBeenCalled();
      expect(loadingServiceMock.hide).toHaveBeenCalled();
    });
  });
});
