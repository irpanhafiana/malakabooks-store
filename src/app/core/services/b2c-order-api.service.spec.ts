import { TestBed } from '@angular/core/testing';
import { B2cOrderApiService } from './b2c-order-api.service';
import { HttpClient } from '@angular/common/http';
import { of, firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('B2cOrderApiService', () => {
  let service: B2cOrderApiService;
  let httpClientMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpClientMock = {
      post: vi.fn().mockReturnValue(of(['order-id-123']))
    };

    TestBed.configureTestingModule({
      providers: [
        B2cOrderApiService,
        { provide: HttpClient, useValue: httpClientMock }
      ]
    });

    service = TestBed.inject(B2cOrderApiService);
  });

  it('should post B2C order payload', async () => {
    const payload = [{ Content: 'test' }];
    const res = await firstValueFrom(service.postB2COrder(payload));
    expect(httpClientMock.post).toHaveBeenCalled();
    expect(res).toEqual(['order-id-123']);
  });
});
