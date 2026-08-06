import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthStore } from './auth.store';
import { AuthApiService } from '../core/services/auth-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { ProductApiService } from '../core/services/product-api.service';
import { AlertService } from '../core/services/alert.service';
import { LoggerService } from '../core/services/logger.service';
import { CartStore } from './cart.store';

describe('AuthStore', () => {
  let store: AuthStore;
  const mockAuthApi = { loginAndGetToken: vi.fn(), refreshToken: vi.fn() };
  const mockUserApi = { register: vi.fn() };
  const mockProductApi = { getProducts: vi.fn().mockResolvedValue([]) };
  const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
  const mockLogger = { error: vi.fn() };
  const mockCartStore = { syncOnLogin: vi.fn(), clearOnLogout: vi.fn() };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthApiService, useValue: mockAuthApi },
        { provide: UserApiService, useValue: mockUserApi },
        { provide: ProductApiService, useValue: mockProductApi },
        { provide: AlertService, useValue: mockToast },
        { provide: LoggerService, useValue: mockLogger },
        { provide: CartStore, useValue: mockCartStore }
      ]
    });
    store = TestBed.inject(AuthStore);
  });

  it('should create', () => {
    expect(store).toBeTruthy();
    expect(store.isLoggedIn()).toBe(false);
  });

  it('should logout and clear session', () => {
    store.logout();
    expect(store.isLoggedIn()).toBe(false);
    expect(mockCartStore.clearOnLogout).toHaveBeenCalled();
    expect(mockToast.info).toHaveBeenCalledWith('Anda telah keluar.');
  });
});
