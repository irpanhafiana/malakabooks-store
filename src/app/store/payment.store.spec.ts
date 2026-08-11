import { TestBed } from '@angular/core/testing';
import { PaymentStore } from './payment.store';
import { PaymentApiService } from '../core/services/payment-api.service';
import { AlertService } from '../core/services/alert.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PaymentStore', () => {
  let store: PaymentStore;
  let paymentApiMock: { getPayments: ReturnType<typeof vi.fn> };
  let alertServiceMock: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    paymentApiMock = {
      getPayments: vi.fn().mockResolvedValue([
        { id: 'p1', name: 'BCA Transfer', methodType: 'BANK', alias: 'BCA', fees: [] }
      ])
    };

    alertServiceMock = {
      error: vi.fn(),
      success: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        PaymentStore,
        { provide: PaymentApiService, useValue: paymentApiMock },
        { provide: AlertService, useValue: alertServiceMock }
      ]
    });

    store = TestBed.inject(PaymentStore);
  });

  it('should load payments into state', async () => {
    await store.loadPayments();
    expect(store.payments().length).toBe(1);
    expect(store.payments()[0].name).toBe('BCA Transfer');
  });
});
