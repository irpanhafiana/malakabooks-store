import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectivePreloadingStrategy } from './selective-preloading-strategy';
import { Route } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';

describe('SelectivePreloadingStrategy', () => {
  let strategy: SelectivePreloadingStrategy;

  beforeEach(() => {
    strategy = new SelectivePreloadingStrategy();
    vi.useFakeTimers();
  });

  it('should preload route when route.data.preload is true and path is not admin', async () => {
    const route: Route = { path: 'product', data: { preload: true } };
    const loadFn = vi.fn().mockReturnValue(of({ loaded: true }));

    const observable = strategy.preload(route, loadFn);
    
    // Fast forward time by 1000ms
    const promise = firstValueFrom(observable);
    vi.advanceTimersByTime(1000);

    const result = await promise;
    expect(loadFn).toHaveBeenCalledOnce();
    expect(result).toEqual({ loaded: true });
  });

  it('should return of(null) when route.data.preload is false or undefined', async () => {
    const route: Route = { path: 'product' };
    const loadFn = vi.fn().mockReturnValue(of({ loaded: true }));

    const result = await firstValueFrom(strategy.preload(route, loadFn));
    expect(loadFn).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should return of(null) when route path is admin', async () => {
    const route: Route = { path: 'admin', data: { preload: true } };
    const loadFn = vi.fn().mockReturnValue(of({ loaded: true }));

    const result = await firstValueFrom(strategy.preload(route, loadFn));
    expect(loadFn).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
