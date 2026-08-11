import { TestBed } from '@angular/core/testing';
import { PaymentApiService } from './payment-api.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Payment } from '../models';

describe('PaymentApiService', () => {
  let service: PaymentApiService;
  let httpClientMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

  const mockPayments: Payment[] = [
    { id: 'pay-1', name: 'Transfer Bank', methodType: 'BANK', alias: 'BCA', fees: [] }
  ];

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn().mockReturnValue(of({ status: true, data: mockPayments })),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        PaymentApiService,
        { provide: HttpClient, useValue: httpClientMock }
      ]
    });

    service = TestBed.inject(PaymentApiService);
  });

  it('should fetch payments list', async () => {
    const payments = await service.getPayments();
    expect(payments.length).toBe(1);
    expect(payments[0].id).toBe('pay-1');
  });
});
