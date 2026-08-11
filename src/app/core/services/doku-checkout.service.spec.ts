import { TestBed } from '@angular/core/testing';
import { DokuCheckoutService } from './doku-checkout.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DokuCheckoutService', () => {
  let service: DokuCheckoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DokuCheckoutService]
    });
    service = TestBed.inject(DokuCheckoutService);
  });

  it('should call window.loadJokulCheckout when open is invoked', async () => {
    const mockJokulFn = vi.fn();
    (window as any).loadJokulCheckout = mockJokulFn;

    const result = await service.open('https://jokul.doku.com/checkout');
    expect(result).toBe(true);
    expect(mockJokulFn).toHaveBeenCalledWith('https://jokul.doku.com/checkout');

    delete (window as any).loadJokulCheckout;
  });
});
