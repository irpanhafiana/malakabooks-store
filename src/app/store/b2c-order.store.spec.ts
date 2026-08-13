import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { B2cOrderStore } from './b2c-order.store';
import { B2cOrderApiService } from '../core/services/b2c-order-api.service';
import { of } from 'rxjs';

describe('B2cOrderStore', () => {
  let store: B2cOrderStore;
  const mockB2cApi = {
    postB2COrder: vi.fn()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('should initialize with default branch and no order ID if localStorage is empty', () => {
    TestBed.configureTestingModule({
      providers: [
        B2cOrderStore,
        { provide: B2cOrderApiService, useValue: mockB2cApi }
      ]
    });
    store = TestBed.inject(B2cOrderStore);

    expect(store).toBeTruthy();
    expect(store.branchCode()).toBeNull();
    expect(store.lastOrderId()).toBeNull();
  });

  it('should parse JSON branch object in constructor', () => {
    localStorage.setItem('sj_default_branch', JSON.stringify({ Code: 'BR001' }));
    TestBed.configureTestingModule({
      providers: [
        B2cOrderStore,
        { provide: B2cOrderApiService, useValue: mockB2cApi }
      ]
    });
    store = TestBed.inject(B2cOrderStore);

    expect(store.branchCode()).toBe('BR001');
  });

  it('should handle raw string branch in constructor', () => {
    localStorage.setItem('sj_default_branch', 'BR002');
    TestBed.configureTestingModule({
      providers: [
        B2cOrderStore,
        { provide: B2cOrderApiService, useValue: mockB2cApi }
      ]
    });
    store = TestBed.inject(B2cOrderStore);

    expect(store.branchCode()).toBe('BR002');
  });

  it('should set and remove last order ID', () => {
    TestBed.configureTestingModule({
      providers: [
        B2cOrderStore,
        { provide: B2cOrderApiService, useValue: mockB2cApi }
      ]
    });
    store = TestBed.inject(B2cOrderStore);

    store.setLastOrderId('ORDER123');
    expect(store.lastOrderId()).toBe('ORDER123');
    expect(localStorage.getItem('mk_pending_b2c_order')).toBe('ORDER123');

    store.setLastOrderId(null);
    expect(store.lastOrderId()).toBeNull();
    expect(localStorage.getItem('mk_pending_b2c_order')).toBeNull();
  });

  it('should post order via api service', () => {
    TestBed.configureTestingModule({
      providers: [
        B2cOrderStore,
        { provide: B2cOrderApiService, useValue: mockB2cApi }
      ]
    });
    store = TestBed.inject(B2cOrderStore);

    const payload = [{ itemId: '1', qty: 2 }];
    const expectedResponse = { success: true };
    mockB2cApi.postB2COrder.mockReturnValue(of(expectedResponse));

    store.postB2COrder(payload).subscribe(res => {
      expect(res).toEqual(expectedResponse);
    });

    expect(mockB2cApi.postB2COrder).toHaveBeenCalledWith(payload);
  });
});
