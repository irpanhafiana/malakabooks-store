import { TestBed } from '@angular/core/testing';
import { katalogCheckoutAbandonGuard } from './katalog-checkout-abandon.guard';
import { B2cOrderStore } from '../../store/b2c-order.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('katalogCheckoutAbandonGuard', () => {
  let b2cOrderStoreMock: { lastOrderId: () => string | null };

  beforeEach(() => {
    b2cOrderStoreMock = {
      lastOrderId: () => null
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: B2cOrderStore, useValue: b2cOrderStoreMock }
      ]
    });
  });

  it('should allow navigation if there is no lastOrderId', () => {
    const result = TestBed.runInInjectionContext(() =>
      katalogCheckoutAbandonGuard({} as any, {} as any, {} as any, {} as any)
    );
    expect(result).toBe(true);
  });

  it('should prompt confirmation if lastOrderId exists', () => {
    b2cOrderStoreMock.lastOrderId = () => 'order-123';
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      katalogCheckoutAbandonGuard({} as any, {} as any, {} as any, {} as any)
    );

    expect(confirmSpy).toHaveBeenCalled();
    expect(result).toBe(true);
    confirmSpy.mockRestore();
  });
});
