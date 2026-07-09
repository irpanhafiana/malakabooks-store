import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

describe('AuthGuard', () => {
  const mockRouter = { navigate: vi.fn() };
  let mockAuthStore = { isLoggedIn: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    });
    vi.clearAllMocks();
  });

  it('should allow activation if user is logged in', () => {
    mockAuthStore.isLoggedIn.mockReturnValue(true);
    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  it('should redirect to login if user is not logged in', () => {
    mockAuthStore.isLoggedIn.mockReturnValue(false);
    TestBed.runInInjectionContext(() => {
      const result = authGuard({} as any, {} as any);
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});
