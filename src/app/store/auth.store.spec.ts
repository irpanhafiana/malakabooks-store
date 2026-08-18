import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthStore } from './auth.store';
import { AuthApiService } from '../core/services/auth-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { ProductApiService } from '../core/services/product-api.service';
import { AlertService } from '../core/services/alert.service';
import { LoggerService } from '../core/services/logger.service';
import { CartStore } from './cart.store';
import { getStoredSessionUser, isCustomerSession, clearSessionUser } from '../core/auth/session.util';

describe('AuthStore', () => {
  let store: AuthStore;
  const mockAuthApi = {
    getUser: vi.fn(),
    bffUrl: vi.fn((segment: string) => `/bff/${segment}`)
  };
  const mockUserApi = { register: vi.fn() };
  const mockProductApi = { getProducts: vi.fn().mockResolvedValue([]) };
  const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
  const mockLogger = { error: vi.fn() };
  const mockCartStore = { syncOnLogin: vi.fn(), clearOnLogout: vi.fn() };

  const customerClaims = [
    { type: 'sub', value: 'user-42' },
    { type: 'given_name', value: 'Budi' },
    { type: 'role', value: 'Malaka-Customer' },
    { type: 'bff:logout_url', value: '/bff/logout?sid=abc' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    clearSessionUser();
    localStorage.clear();
    mockProductApi.getProducts.mockResolvedValue([]);
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

  it('builds the session from BFF claims', async () => {
    mockAuthApi.getUser.mockResolvedValue(customerClaims);

    await expect(store.initializeSession()).resolves.toBe(true);

    expect(store.isLoggedIn()).toBe(true);
    expect(store.isAdmin()).toBe(false);
    expect(store.currentUser()?.id).toBe('user-42');
  });

  it('publishes the session to session.util so API services pick the right endpoint', async () => {
    mockAuthApi.getUser.mockResolvedValue(customerClaims);

    await store.initializeSession();

    expect(isCustomerSession()).toBe(true);
    expect(getStoredSessionUser()?.id).toBe('user-42');
  });

  it('populates session.util before loading products', async () => {
    mockAuthApi.getUser.mockResolvedValue(customerClaims);
    let sessionVisibleToProductApi = false;
    mockProductApi.getProducts.mockImplementation(async () => {
      sessionVisibleToProductApi = isCustomerSession();
      return [];
    });

    await store.initializeSession();

    expect(sessionVisibleToProductApi).toBe(true);
  });

  it('reports a logged-out session when the BFF returns no claims', async () => {
    mockAuthApi.getUser.mockResolvedValue(null);

    await expect(store.initializeSession()).resolves.toBe(false);

    expect(store.isLoggedIn()).toBe(false);
    expect(getStoredSessionUser()).toBeNull();
  });

  it('shares one in-flight request across concurrent callers', async () => {
    mockAuthApi.getUser.mockResolvedValue(customerClaims);

    await Promise.all([
      store.initializeSession(),
      store.initializeSession(),
      store.initializeSession()
    ]);

    expect(mockAuthApi.getUser).toHaveBeenCalledTimes(1);
  });

  it('should logout and clear session', () => {
    store.logout();
    expect(store.isLoggedIn()).toBe(false);
    expect(mockCartStore.clearOnLogout).toHaveBeenCalled();
  });

  it('keeps the user signed in when a 401 was only an authorization failure', async () => {
    mockAuthApi.getUser.mockResolvedValue(customerClaims);
    await store.initializeSession();

    mockProductApi.getProducts.mockClear();
    await store.handleUnauthorized();

    expect(store.isLoggedIn()).toBe(true);
    expect(mockCartStore.clearOnLogout).not.toHaveBeenCalled();
    // Revalidasi harus murah: jangan memuat ulang katalog tiap kali ada 401.
    expect(mockProductApi.getProducts).not.toHaveBeenCalled();
  });

  it('collapses concurrent 401 revalidations into one /bff/user call', async () => {
    mockAuthApi.getUser.mockResolvedValue(customerClaims);
    await store.initializeSession();

    mockAuthApi.getUser.mockClear();
    await Promise.all([
      store.handleUnauthorized(),
      store.handleUnauthorized(),
      store.handleUnauthorized()
    ]);

    expect(mockAuthApi.getUser).toHaveBeenCalledTimes(1);
  });

  it('clears the session when a 401 means the BFF session is gone', async () => {
    mockAuthApi.getUser.mockResolvedValue(customerClaims);
    await store.initializeSession();

    mockAuthApi.getUser.mockResolvedValue(null);
    await store.handleUnauthorized();

    expect(store.isLoggedIn()).toBe(false);
    expect(mockCartStore.clearOnLogout).toHaveBeenCalled();
  });
});
