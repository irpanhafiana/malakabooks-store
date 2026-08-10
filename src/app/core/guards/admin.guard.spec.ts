import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminGuard } from './admin.guard';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

describe('AdminGuard', () => {
  const mockRouter = { navigate: vi.fn() };
  const mockAuthStore = { isLoggedIn: vi.fn(), isAdmin: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    });
    vi.clearAllMocks();
  });

  it('should allow activation if user is logged in and is admin', () => {
    mockAuthStore.isLoggedIn.mockReturnValue(true);
    mockAuthStore.isAdmin.mockReturnValue(true);
    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  it('should redirect to home if user is logged in but not admin', () => {
    mockAuthStore.isLoggedIn.mockReturnValue(true);
    mockAuthStore.isAdmin.mockReturnValue(false);
    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  it('should redirect to admin login if user is not logged in', () => {
    mockAuthStore.isLoggedIn.mockReturnValue(false);
    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/login']);
    });
  });
});
