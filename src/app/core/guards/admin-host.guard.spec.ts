import { TestBed } from '@angular/core/testing';
import { adminHostGuard } from './admin-host.guard';
import { describe, it, expect } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('adminHostGuard', () => {
  it('should allow execution on localhost', () => {
    TestBed.runInInjectionContext(() => {
      const result = adminHostGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      expect(result).toBe(true);
    });
  });
});
